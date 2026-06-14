"""MediaPipe Pose Detection Service — extracts 33 body landmarks per frame.

Migrated from the legacy mp.solutions.pose API to the modern MediaPipe Tasks API
(PoseLandmarker), which is required for Python 3.13+ compatibility.
"""

import os
import ctypes
import platform

# ── Monkey-patch: mediapipe 0.10.x on Windows ships a DLL that does not
#    export the C-runtime ``free()`` symbol.  We patch the loader *before*
#    importing mediapipe so the fix survives ``pip install --upgrade``.
if platform.system() == "Windows":
    import importlib
    _mc_bindings = importlib.import_module(
        "mediapipe.tasks.python.core.mediapipe_c_bindings"
    )

    _orig_load_raw = _mc_bindings.load_raw_library

    def _patched_load_raw(signatures=()):
        try:
            return _orig_load_raw(signatures)
        except AttributeError as exc:
            if "free" not in str(exc):
                raise
            # Load the lib without the free() call
            if _mc_bindings._shared_lib is None:
                from importlib import resources as _res
                _lib_path = str(_res.files("mediapipe.tasks.c") / "libmediapipe.dll")
                _mc_bindings._shared_lib = ctypes.CDLL(_lib_path)

            for sig in signatures:
                c_func = getattr(_mc_bindings._shared_lib, sig.func_name)
                c_func.argtypes = sig.argtypes
                c_func.restype = sig.restype

            # Attach free() from the universal C runtime (ucrtbase / msvcrt)
            for crt_name in ("ucrtbase", "msvcrt"):
                try:
                    crt = ctypes.CDLL(crt_name)
                    _mc_bindings._shared_lib.free = crt.free
                    _mc_bindings._shared_lib.free.argtypes = [ctypes.c_void_p]
                    _mc_bindings._shared_lib.free.restype = None
                    break
                except OSError:
                    continue

            return _mc_bindings._shared_lib

    _mc_bindings.load_raw_library = _patched_load_raw

import numpy as np
from scipy.signal import savgol_filter
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

# Prefer the faster 'full' model; fall back to 'heavy' if only that is present
_MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
_MODELS_DIR = os.path.normpath(_MODELS_DIR)

def _find_model() -> str:
    for name in ("pose_landmarker_full.task", "pose_landmarker_heavy.task", "pose_landmarker_lite.task"):
        path = os.path.join(_MODELS_DIR, name)
        if os.path.isfile(path):
            return path
    raise FileNotFoundError(
        f"No MediaPipe pose model found in {_MODELS_DIR}. "
        "Run: python backend/download_models.py"
    )

_MODEL_PATH = _find_model()


class PoseDetector:
    """Detects body pose landmarks using MediaPipe PoseLandmarker (Tasks API)."""

    # Key landmark indices (MediaPipe Pose — 33-point skeleton)
    LANDMARKS = {
        "nose": 0,
        "left_shoulder": 11, "right_shoulder": 12,
        "left_elbow": 13, "right_elbow": 14,
        "left_wrist": 15, "right_wrist": 16,
        "left_hip": 23, "right_hip": 24,
        "left_knee": 25, "right_knee": 26,
        "left_ankle": 27, "right_ankle": 28,
        "left_heel": 29, "right_heel": 30,
        "left_foot_index": 31, "right_foot_index": 32,
    }

    # Map model_complexity int → Tasks API model asset path preference
    # (we use one model file for all; complexity is kept for API compat)
    def __init__(self, model_complexity: int = 2, min_confidence: float = 0.5):
        self.model_complexity = model_complexity
        self.min_confidence = min_confidence
        self._validate_model()

    def _validate_model(self) -> None:
        if not os.path.isfile(_MODEL_PATH):
            raise FileNotFoundError(
                f"MediaPipe model not found at: {_MODEL_PATH}\n"
                "Run the following command to download it:\n"
                "  python backend/download_models.py"
            )

    def _build_landmarker(self) -> mp_vision.PoseLandmarker:
        """Create a PoseLandmarker instance configured for video-mode inference."""
        base_options = mp_python.BaseOptions(
            model_asset_path=_MODEL_PATH,
            delegate=mp_python.BaseOptions.Delegate.CPU,
        )
        options = mp_vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=mp_vision.RunningMode.IMAGE,  # per-frame (stateless)
            num_poses=1,
            min_pose_detection_confidence=self.min_confidence,
            min_pose_presence_confidence=self.min_confidence,
            min_tracking_confidence=self.min_confidence,
        )
        return mp_vision.PoseLandmarker.create_from_options(options)

    def detect_poses(self, frames: list[np.ndarray]) -> list[dict | None]:
        """
        Process frames through MediaPipe PoseLandmarker and return landmark sequences.

        Each frame in `frames` must be an RGB uint8 numpy array (H, W, 3).

        Returns list of dicts, each containing:
        - landmarks: dict of {name: {x, y, z, visibility}} for each body part
        - raw_landmarks: full 33-point array
        - confidence: average visibility score
        Or None if no pose was detected in that frame.
        """
        results_sequence = []

        with self._build_landmarker() as landmarker:
            for frame in frames:
                # Wrap numpy array in MediaPipe Image (RGB expected)
                mp_image = mp.Image(
                    image_format=mp.ImageFormat.SRGB,
                    data=np.ascontiguousarray(frame, dtype=np.uint8),
                )
                detection = landmarker.detect(mp_image)

                if detection.pose_landmarks and len(detection.pose_landmarks) > 0:
                    pose_lms = detection.pose_landmarks[0]  # first (only) person

                    landmarks: dict = {}
                    raw: list = []
                    total_visibility = 0.0

                    for idx, lm in enumerate(pose_lms):
                        visibility = getattr(lm, "visibility", 1.0) or 1.0
                        raw.append({
                            "x": lm.x,
                            "y": lm.y,
                            "z": lm.z,
                            "visibility": visibility,
                        })
                        total_visibility += visibility

                        # Map named landmarks by index
                        for name, landmark_idx in self.LANDMARKS.items():
                            if idx == landmark_idx:
                                landmarks[name] = {
                                    "x": lm.x,
                                    "y": lm.y,
                                    "z": lm.z,
                                    "visibility": visibility,
                                }

                    avg_confidence = total_visibility / max(len(pose_lms), 1)
                    results_sequence.append({
                        "landmarks": landmarks,
                        "raw_landmarks": raw,
                        "confidence": avg_confidence,
                    })
                else:
                    results_sequence.append(None)

        return results_sequence

    def smooth_landmarks(
        self, landmarks_sequence: list[dict | None], window_length: int = 7, polyorder: int = 2
    ) -> list[dict | None]:
        """
        Apply Savitzky-Golay smoothing filter to landmark positions.
        This reduces jitter in MediaPipe tracking without losing important movements.
        Smooths both named landmarks and raw_landmarks for video annotation.
        """
        valid_indices = [i for i, lm in enumerate(landmarks_sequence) if lm is not None]
        if len(valid_indices) < window_length:
            return landmarks_sequence  # Not enough data to smooth

        # ── Smooth named landmarks ──
        landmark_names = list(self.LANDMARKS.keys())

        for name in landmark_names:
            xs = []
            ys = []
            for idx in valid_indices:
                lm = landmarks_sequence[idx]
                if lm and name in lm["landmarks"]:
                    xs.append(lm["landmarks"][name]["x"])
                    ys.append(lm["landmarks"][name]["y"])
                else:
                    xs.append(0.0)
                    ys.append(0.0)

            if len(xs) >= window_length:
                smooth_x = savgol_filter(xs, window_length, polyorder)
                smooth_y = savgol_filter(ys, window_length, polyorder)

                for i, idx in enumerate(valid_indices):
                    if landmarks_sequence[idx] and name in landmarks_sequence[idx]["landmarks"]:
                        landmarks_sequence[idx]["landmarks"][name]["x"] = float(smooth_x[i])
                        landmarks_sequence[idx]["landmarks"][name]["y"] = float(smooth_y[i])

        # ── Smooth raw_landmarks (all 33 points) for video annotation ──
        num_landmarks = 33
        for lm_idx in range(num_landmarks):
            xs, ys = [], []
            for idx in valid_indices:
                raw = landmarks_sequence[idx].get("raw_landmarks", [])
                if lm_idx < len(raw):
                    xs.append(raw[lm_idx]["x"])
                    ys.append(raw[lm_idx]["y"])
                else:
                    xs.append(0.0)
                    ys.append(0.0)

            if len(xs) >= window_length:
                smooth_x = savgol_filter(xs, window_length, polyorder)
                smooth_y = savgol_filter(ys, window_length, polyorder)

                for i, idx in enumerate(valid_indices):
                    raw = landmarks_sequence[idx].get("raw_landmarks", [])
                    if lm_idx < len(raw):
                        raw[lm_idx]["x"] = float(smooth_x[i])
                        raw[lm_idx]["y"] = float(smooth_y[i])

        return landmarks_sequence
