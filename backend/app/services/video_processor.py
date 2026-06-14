"""Video processing service: validation, frame extraction, normalization."""

import cv2
import numpy as np
from typing import Optional


class VideoProcessor:
    """Handles video validation, frame extraction, and preprocessing."""

    SUPPORTED_FORMATS = {".mp4", ".mov", ".avi", ".webm", ".mkv"}

    def validate_video(self, video_path: str) -> dict:
        """Validate video file and extract metadata."""
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video file: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps > 0 else 0
        cap.release()

        # if width < 640 or height < 480:
        #     raise ValueError(f"Video resolution too low: {width}x{height}. Minimum 640x480 required.")
        if duration > 30:
            raise ValueError(f"Video too long: {duration:.1f}s. Maximum 30 seconds.")
        if duration < 2:
            raise ValueError(f"Video too short: {duration:.1f}s. Minimum 2 seconds.")

        return {
            "fps": fps,
            "width": width,
            "height": height,
            "frame_count": frame_count,
            "duration": duration,
        }

    def extract_frames(
        self, video_path: str, target_fps: int = 30, max_dimension: int = 1280
    ) -> list[np.ndarray]:
        """Extract frames from video at target FPS, resized for consistency."""
        cap = cv2.VideoCapture(video_path)
        source_fps = cap.get(cv2.CAP_PROP_FPS)
        frame_interval = max(1, int(source_fps / target_fps))

        frames = []
        frame_idx = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % frame_interval == 0:
                # Resize if needed
                h, w = frame.shape[:2]
                if max(h, w) > max_dimension:
                    scale = max_dimension / max(h, w)
                    frame = cv2.resize(frame, None, fx=scale, fy=scale)

                # Convert BGR to RGB for MediaPipe
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames.append(frame_rgb)

            frame_idx += 1

        cap.release()
        return frames
