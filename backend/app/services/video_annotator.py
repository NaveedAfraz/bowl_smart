"""
Video Annotator — renders MediaPipe 33-point skeleton overlay on bowling video frames,
highlights phase key-frames with angle measurements, and encodes to MP4.
"""

import os
import shutil
import subprocess
import cv2
import numpy as np
import math


# MediaPipe Pose skeleton connections (33-landmark topology)
POSE_CONNECTIONS = [
    # Torso
    (11, 12), (11, 23), (12, 24), (23, 24),
    # Left arm
    (11, 13), (13, 15),
    # Right arm
    (12, 14), (14, 16),
    # Left leg
    (23, 25), (25, 27), (27, 29), (27, 31), (29, 31),
    # Right leg
    (24, 26), (26, 28), (28, 30), (28, 32), (30, 32),
    # Face (minimal)
    (0, 1), (1, 2), (2, 3), (3, 7),
    (0, 4), (4, 5), (5, 6), (6, 8),
    # Shoulder-ear
    (9, 10), (11, 12),
]

# Bright colour palette for skeleton
SKELETON_COLOR = (0, 255, 170)       # green-cyan
JOINT_COLOR = (0, 200, 255)          # amber
PHASE_HIGHLIGHT_COLOR = (0, 140, 255)  # orange
ANGLE_COLOR = (255, 255, 100)        # light cyan-yellow
PHASE_TEXT_BG = (20, 20, 40)
PHASE_TEXT_COLOR = (255, 255, 255)


def _angle_between(p1, vertex, p2):
    """Angle at vertex in degrees."""
    v1 = np.array([p1[0] - vertex[0], p1[1] - vertex[1]], dtype=float)
    v2 = np.array([p2[0] - vertex[0], p2[1] - vertex[1]], dtype=float)
    cos_a = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-8)
    cos_a = np.clip(cos_a, -1, 1)
    return float(np.degrees(np.arccos(cos_a)))


def _draw_angle_arc(img, vertex, p1, p2, angle_deg, label, color=ANGLE_COLOR):
    """Draw an angle arc and label at a joint."""
    h, w = img.shape[:2]
    vx, vy = int(vertex[0] * w), int(vertex[1] * h)

    # Compute start angle for the arc
    a1 = math.atan2((p1[1] - vertex[1]) * h, (p1[0] - vertex[0]) * w)
    a2 = math.atan2((p2[1] - vertex[1]) * h, (p2[0] - vertex[0]) * w)

    start_deg = math.degrees(a1)
    end_deg = math.degrees(a2)

    # Ensure we draw the smaller arc
    if abs(end_deg - start_deg) > 180:
        if end_deg > start_deg:
            start_deg += 360
        else:
            end_deg += 360

    radius = max(20, min(40, int(min(h, w) * 0.04)))
    cv2.ellipse(img, (vx, vy), (radius, radius),
                0, start_deg, end_deg, color, 2, cv2.LINE_AA)

    # Label
    label_text = f"{label}: {angle_deg:.0f} deg"
    tx, ty = vx + radius + 5, vy - 5
    (tw, th), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
    cv2.rectangle(img, (tx - 2, ty - th - 4), (tx + tw + 4, ty + 4), (0, 0, 0), -1)
    cv2.putText(img, label_text, (tx, ty),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1, cv2.LINE_AA)


def _draw_skeleton(img, raw_landmarks, color=SKELETON_COLOR, joint_color=JOINT_COLOR, thickness=2):
    """Draw the 33-point skeleton on an image."""
    h, w = img.shape[:2]
    pts = []
    for lm in raw_landmarks:
        x, y = int(lm["x"] * w), int(lm["y"] * h)
        vis = lm.get("visibility", 1.0)
        pts.append((x, y, vis))

    # Draw connections
    for (i, j) in POSE_CONNECTIONS:
        if i < len(pts) and j < len(pts):
            if pts[i][2] > 0.3 and pts[j][2] > 0.3:
                cv2.line(img, (pts[i][0], pts[i][1]), (pts[j][0], pts[j][1]),
                         color, thickness, cv2.LINE_AA)

    # Draw joints
    for idx, (x, y, vis) in enumerate(pts):
        if vis > 0.3:
            radius = 4 if idx > 10 else 3  # bigger for body joints
            cv2.circle(img, (x, y), radius, joint_color, -1, cv2.LINE_AA)
            cv2.circle(img, (x, y), radius + 1, color, 1, cv2.LINE_AA)

    return pts


# Removed _draw_phase_banner


def _get_phase_at_frame(frame_idx, phases):
    """Return phase_name for a given frame index based on the largest start_frame <= frame_idx."""
    current_phase = None
    max_sf = -1
    for phase_name, info in phases.items():
        sf = info.get("start_frame", -1)
        if sf != -1 and sf <= frame_idx and sf >= max_sf:
            max_sf = sf
            current_phase = phase_name
    return current_phase


PHASE_DISPLAY_NAMES = {
    "run_up": "Run-Up",
    "bound": "Bound / Gather",
    "back_foot_contact": "Back-Foot Contact",
    "front_foot_contact": "Front-Foot Contact",
    "delivery": "Delivery Stride",
    "follow_through": "Follow-Through",
}


def _reencode_to_h264(src_path: str, dst_path: str):
    """Re-encode an mp4v video to H.264 for browser playback.

    Tries ffmpeg first (system or imageio-ffmpeg bundle); falls back to OpenCV codec.
    """
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        try:
            from imageio_ffmpeg import get_ffmpeg_exe
            ffmpeg = get_ffmpeg_exe()
        except Exception:
            ffmpeg = None
    if ffmpeg:
        try:
            subprocess.run(
                [
                    ffmpeg, "-y",
                    "-i", src_path,
                    "-c:v", "libx264",
                    "-preset", "fast",
                    "-crf", "23",
                    "-pix_fmt", "yuv420p",
                    "-movflags", "+faststart",
                    dst_path,
                ],
                check=True,
                capture_output=True,
                timeout=120,
            )
            os.remove(src_path)
            return
        except Exception as e:
            print(f"ffmpeg re-encode failed: {e}, falling back to raw copy")

    # Fallback: read frames from temp and re-write with avc1
    cap = cv2.VideoCapture(src_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # Try H264 codecs available on the platform
    writer = None
    for codec in ["avc1", "H264", "X264", "mp4v"]:
        try:
            fourcc = cv2.VideoWriter_fourcc(*codec)
            writer = cv2.VideoWriter(dst_path, fourcc, fps, (w, h))
            if writer.isOpened():
                break
            writer.release()
            writer = None
        except Exception:
            writer = None

    if writer is None or not writer.isOpened():
        # Last resort: just rename the file
        os.rename(src_path, dst_path)
        return

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        writer.write(frame)

    cap.release()
    writer.release()
    os.remove(src_path)


class VideoAnnotator:
    """Generates an annotated MP4 video with skeleton overlay and phase markers."""

    def __init__(self, dominant_arm: str = "right"):
        self.dominant_arm = dominant_arm
        if dominant_arm == "right":
            self.bowl_shoulder_idx = 12
            self.bowl_elbow_idx = 14
            self.bowl_wrist_idx = 16
            self.front_hip_idx = 23
            self.front_knee_idx = 25
            self.front_ankle_idx = 27
            self.back_hip_idx = 24
            self.back_knee_idx = 26
            self.back_ankle_idx = 28
            self.front_shoulder_idx = 11
        else:
            self.bowl_shoulder_idx = 11
            self.bowl_elbow_idx = 13
            self.bowl_wrist_idx = 15
            self.front_hip_idx = 24
            self.front_knee_idx = 26
            self.front_ankle_idx = 28
            self.back_hip_idx = 23
            self.back_knee_idx = 25
            self.back_ankle_idx = 27
            self.front_shoulder_idx = 12

    def _compute_angles_at_frame(self, raw_landmarks):
        """Compute key angles from raw_landmarks list at a single frame."""
        def pt(idx):
            lm = raw_landmarks[idx]
            return (lm["x"], lm["y"])

        angles = {}
        try:
            angles["Elbow"] = round(_angle_between(
                pt(self.bowl_shoulder_idx), pt(self.bowl_elbow_idx), pt(self.bowl_wrist_idx)), 1)
        except Exception:
            pass
        try:
            angles["Front Knee"] = round(_angle_between(
                pt(self.front_hip_idx), pt(self.front_knee_idx), pt(self.front_ankle_idx)), 1)
        except Exception:
            pass
        try:
            angles["Back Knee"] = round(_angle_between(
                pt(self.back_hip_idx), pt(self.back_knee_idx), pt(self.back_ankle_idx)), 1)
        except Exception:
            pass
        try:
            # Trunk lateral flexion
            mid_hip = (
                (raw_landmarks[self.front_hip_idx]["x"] + raw_landmarks[self.back_hip_idx]["x"]) / 2,
                (raw_landmarks[self.front_hip_idx]["y"] + raw_landmarks[self.back_hip_idx]["y"]) / 2,
            )
            mid_shoulder = (
                (raw_landmarks[self.front_shoulder_idx]["x"] + raw_landmarks[self.bowl_shoulder_idx]["x"]) / 2,
                (raw_landmarks[self.front_shoulder_idx]["y"] + raw_landmarks[self.bowl_shoulder_idx]["y"]) / 2,
            )
            dx = mid_shoulder[0] - mid_hip[0]
            dy = mid_shoulder[1] - mid_hip[1]
            trunk_angle = abs(math.degrees(math.atan2(dy, dx)) + 90)
            angles["Trunk Flexion"] = round(trunk_angle, 1)
        except Exception:
            pass

        return angles

    def _draw_angle_overlays(self, img, raw_landmarks):
        """Draw angle arcs on key joints."""
        def pt(idx):
            return (raw_landmarks[idx]["x"], raw_landmarks[idx]["y"])

        try:
            angle = _angle_between(pt(self.bowl_shoulder_idx), pt(self.bowl_elbow_idx), pt(self.bowl_wrist_idx))
            _draw_angle_arc(img, pt(self.bowl_elbow_idx),
                            pt(self.bowl_shoulder_idx), pt(self.bowl_wrist_idx),
                            angle, "Elbow")
        except Exception:
            pass

        try:
            angle = _angle_between(pt(self.front_hip_idx), pt(self.front_knee_idx), pt(self.front_ankle_idx))
            _draw_angle_arc(img, pt(self.front_knee_idx),
                            pt(self.front_hip_idx), pt(self.front_ankle_idx),
                            angle, "F.Knee")
        except Exception:
            pass

        try:
            angle = _angle_between(pt(self.back_hip_idx), pt(self.back_knee_idx), pt(self.back_ankle_idx))
            _draw_angle_arc(img, pt(self.back_knee_idx),
                            pt(self.back_hip_idx), pt(self.back_ankle_idx),
                            angle, "B.Knee")
        except Exception:
            pass

    def generate_annotated_video(
        self,
        frames: list[np.ndarray],
        landmarks_sequence: list[dict | None],
        phases: dict,
        output_path: str,
        fps: float = 10.0,
    ) -> dict:
        """
        Generate an annotated video and return phase timestamps.

        Returns:
            dict with:
              - video_path: str
              - phase_timestamps: dict of phase_name -> {time_sec, frame_idx, display_name, angles}
              - duration_sec: float
        """
        if not frames:
            raise ValueError("No frames to annotate")

        h, w = frames[0].shape[:2]

        # Write with mp4v first, then re-encode to H.264 for browser playback
        # Force 30.0 FPS output for smooth playback, we will duplicate frames to slow it down
        temp_path = output_path + ".tmp.mp4"
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(temp_path, fourcc, 30.0, (w, h))

        phase_timestamps = {}

        # Collect key frame indices for each phase
        phase_key_frames = {}
        for phase_name, info in phases.items():
            sf = info.get("start_frame", 0)
            phase_key_frames[sf] = phase_name

        frames_written = 0
        frame_data = []
        recorded_phases = set()

        for i, frame in enumerate(frames):
            annotated = frame.copy()

            # Convert RGB → BGR for OpenCV drawing
            annotated = cv2.cvtColor(annotated, cv2.COLOR_RGB2BGR)

            landmark_data = landmarks_sequence[i] if i < len(landmarks_sequence) else None

            if landmark_data is not None:
                raw_lms = landmark_data.get("raw_landmarks", [])

                # Determine current phase
                current_phase = _get_phase_at_frame(i, phases)
                display_name = PHASE_DISPLAY_NAMES.get(current_phase, current_phase or "")
                
                # We consider it a "key frame" if it's the very first time we see this phase
                is_key_frame = current_phase and current_phase not in recorded_phases

                # Draw skeleton
                _draw_skeleton(annotated, raw_lms,
                               color=PHASE_HIGHLIGHT_COLOR if is_key_frame else SKELETON_COLOR,
                               thickness=3 if is_key_frame else 2)

                # ALWAYS extract angles for frontend dynamic updates
                angles = self._compute_angles_at_frame(raw_lms)
                if current_phase:
                    frame_data.append({
                        "time_sec": round(frames_written / 30.0, 2),
                        "phase": current_phase,
                        "display_name": display_name,
                        "angles": angles
                    })

                # Record the first time we see this phase
                if is_key_frame:
                    recorded_phases.add(current_phase)
                    phase_timestamps[current_phase] = {
                        "time_sec": round(frames_written / 30.0, 2),
                        "frame_idx": i,
                        "display_name": display_name,
                        "angles": angles,
                    }
                    
                    # At phase key frames, draw overlays on the video
                    self._draw_angle_overlays(annotated, raw_lms)

            # Frame counter at bottom
            cv2.putText(annotated, f"Frame {i+1}/{len(frames)}", (10, h - 12),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.35, (150, 150, 150), 1, cv2.LINE_AA)

            # Write every frame 3 times to create a smooth 1/3rd slow-motion effect at 30fps
            for _ in range(3):
                writer.write(annotated)
                frames_written += 1

        writer.release()

        # Re-encode to H.264 for browser compatibility
        _reencode_to_h264(temp_path, output_path)

        # Calculate total duration including pauses
        duration_sec = frames_written / fps

        return {
            "video_path": output_path,
            "phase_timestamps": phase_timestamps,
            "frame_data": frame_data,
            "duration_sec": round(duration_sec, 2),
        }
