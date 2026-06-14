"""
Bowling Phase Detection — automatically identifies the 6 phases of a fast bowling action
from MediaPipe landmark sequences.

Phases:
1. Run-Up: Forward horizontal movement, alternating leg positions
2. Bound/Gather: Both feet elevated, body rises
3. Back-Foot Contact (BFC): Back foot plants on ground
4. Front-Foot Contact (FFC): Front foot strikes, arm at highest point
5. Delivery Stride: Arm rotation through release point
6. Follow-Through: Post-release deceleration
"""

import numpy as np


class PhaseDetector:
    """Detects bowling phases from landmark time-series data."""

    def detect_phases(
        self, landmarks_seq: list[dict | None], fps: float, dominant_arm: str = "right"
    ) -> dict:
        """
        Analyze landmarks to detect bowling phase boundaries.
        
        Returns dict with phase name → {start_frame, end_frame, start_time, end_time}
        """
        valid_frames = [(i, lm) for i, lm in enumerate(landmarks_seq) if lm is not None]
        if len(valid_frames) < 10:
            raise ValueError("Not enough valid frames for phase detection (need at least 10)")

        total_frames = len(landmarks_seq)
        
        # Determine which side is bowling arm vs front
        if dominant_arm == "right":
            bowl_shoulder = "right_shoulder"
            bowl_wrist = "right_wrist"
            bowl_elbow = "right_elbow"
            front_hip = "left_hip"
            back_hip = "right_hip"
            front_knee = "left_knee"
            back_knee = "right_knee"
            front_ankle = "left_ankle"
            back_ankle = "right_ankle"
        else:
            bowl_shoulder = "left_shoulder"
            bowl_wrist = "left_wrist"
            bowl_elbow = "left_elbow"
            front_hip = "right_hip"
            back_hip = "left_hip"
            front_knee = "right_knee"
            back_knee = "left_knee"
            front_ankle = "right_ankle"
            back_ankle = "left_ankle"

        # Extract key signals
        hip_x = []  # Horizontal position of hips (for run-up detection)
        hip_y = []  # Vertical position of hips
        wrist_y = []  # Bowling wrist height (for delivery detection)
        front_ankle_y = []
        back_ankle_y = []
        front_ankle_x = []
        back_ankle_x = []

        for i, lm in valid_frames:
            landmarks = lm["landmarks"]
            hip_center_x = (landmarks.get(front_hip, {}).get("x", 0) + landmarks.get(back_hip, {}).get("x", 0)) / 2
            hip_center_y = (landmarks.get(front_hip, {}).get("y", 0) + landmarks.get(back_hip, {}).get("y", 0)) / 2
            
            hip_x.append(hip_center_x)
            hip_y.append(hip_center_y)
            wrist_y.append(landmarks.get(bowl_wrist, {}).get("y", 1))
            front_ankle_y.append(landmarks.get(front_ankle, {}).get("y", 1))
            back_ankle_y.append(landmarks.get(back_ankle, {}).get("y", 1))
            front_ankle_x.append(landmarks.get(front_ankle, {}).get("x", 0))
            back_ankle_x.append(landmarks.get(back_ankle, {}).get("x", 0))

        hip_x = np.array(hip_x)
        hip_y = np.array(hip_y)
        wrist_y = np.array(wrist_y)
        front_ankle_y = np.array(front_ankle_y)
        back_ankle_y = np.array(back_ankle_y)
        front_ankle_x = np.array(front_ankle_x)
        back_ankle_x = np.array(back_ankle_x)
        
        # Calculate 2D stride length to anchor the delivery stride
        stride_length = np.sqrt((front_ankle_x - back_ankle_x)**2 + (front_ankle_y - back_ankle_y)**2)

        n = len(valid_frames)

        # --- Phase boundary detection ---
        
        # The "Split" is the anchor: when stride length is at its absolute MAXIMUM (legs wide apart in the air)
        # To avoid catching weird artifacts, search in the last 70% of the video
        search_start = int(n * 0.3)
        if search_start < n:
            split_offset = int(np.argmax(stride_length[search_start:]))
            split_idx = search_start + split_offset
        else:
            split_idx = int(np.argmax(stride_length))

        # True FFC happens when the front foot actually touches the ground (max front_ankle_y)
        # This occurs shortly AFTER or exactly AT the split.
        ffc_search_start = split_idx
        ffc_search_end = min(n, split_idx + int(n * 0.15))
        if ffc_search_start < ffc_search_end:
            ffc_offset = int(np.argmax(front_ankle_y[ffc_search_start:ffc_search_end]))
            ffc_idx = ffc_search_start + ffc_offset
        else:
            ffc_idx = min(n - 1, split_idx + 1)

        # Delivery is the peak wrist height (lowest y) shortly AFTER or exactly AT FFC
        deliv_search_start = ffc_idx
        deliv_search_end = min(n, ffc_idx + int(n * 0.2))
        if deliv_search_start < deliv_search_end:
            delivery_offset = int(np.argmin(wrist_y[deliv_search_start:deliv_search_end]))
            delivery_idx = deliv_search_start + delivery_offset
        else:
            delivery_idx = min(n - 1, ffc_idx + 2)

        # BFC is before the split. Widen the search to 60% of the video to catch slow-motion gaps.
        # We search backwards from the split_idx because BFC happens before the legs fully split.
        bfc_search_start = max(0, split_idx - int(n * 0.6))
        bfc_search_end = split_idx
        if bfc_search_start < bfc_search_end:
            bfc_region = back_ankle_y[bfc_search_start:bfc_search_end]
            # Since the bowler gets closer to the camera, the last steps have higher y values.
            # Finding the max y in this large region perfectly finds the BFC stride.
            bfc_offset = int(np.argmax(bfc_region))
            bfc_idx = bfc_search_start + bfc_offset
        else:
            bfc_idx = max(0, split_idx - 3)

        # Bound is between run-up and BFC
        # Detected by hip vertical position being at minimum (body at highest elevation)
        # Widen search to 40% to catch early jumps
        bound_search_start = max(0, bfc_idx - int(n * 0.4))
        bound_search_end = bfc_idx
        if bound_search_start < bound_search_end:
            bound_region = hip_y[bound_search_start:bound_search_end]
            bound_offset = int(np.argmin(bound_region))  # Lowest y = highest body position
            bound_idx = bound_search_start + bound_offset
        else:
            bound_idx = max(0, bfc_idx - 3)

        # Follow-through starts after delivery
        follow_through_idx = min(delivery_idx + 2, n - 1)

        # Enforce strict monotonicity so no phase has 0 duration or overlaps incorrectly
        # Order: run_up -> bound -> bfc -> ffc -> delivery -> follow_through
        # (Assuming the action actually happens in this order, we force the indices to be at least 1 frame apart)
        bound_idx = max(1, bound_idx)
        bfc_idx = max(bound_idx + 1, bfc_idx)
        ffc_idx = max(bfc_idx + 1, ffc_idx)
        delivery_idx = max(ffc_idx + 1, delivery_idx)
        follow_through_idx = max(delivery_idx + 1, follow_through_idx)

        # Map back to original frame indices
        frame_map = [i for i, _ in valid_frames]
        
        def safe_frame(idx):
            return frame_map[max(0, min(idx, n - 1))]

        phases = {
            "run_up": {
                "start_frame": frame_map[0],
                "end_frame": safe_frame(bound_idx),
                "start_time": frame_map[0] / fps,
                "end_time": safe_frame(bound_idx) / fps,
            },
            "bound": {
                "start_frame": safe_frame(bound_idx),
                "end_frame": safe_frame(bfc_idx),
                "start_time": safe_frame(bound_idx) / fps,
                "end_time": safe_frame(bfc_idx) / fps,
            },
            "back_foot_contact": {
                "start_frame": safe_frame(bfc_idx),
                "end_frame": safe_frame(ffc_idx),
                "start_time": safe_frame(bfc_idx) / fps,
                "end_time": safe_frame(ffc_idx) / fps,
            },
            "front_foot_contact": {
                "start_frame": safe_frame(ffc_idx),
                "end_frame": safe_frame(delivery_idx),
                "start_time": safe_frame(ffc_idx) / fps,
                "end_time": safe_frame(delivery_idx) / fps,
            },
            "delivery": {
                "start_frame": safe_frame(delivery_idx),
                "end_frame": safe_frame(follow_through_idx),
                "start_time": safe_frame(delivery_idx) / fps,
                "end_time": safe_frame(follow_through_idx) / fps,
            },
            "follow_through": {
                "start_frame": safe_frame(follow_through_idx),
                "end_frame": frame_map[-1],
                "start_time": safe_frame(follow_through_idx) / fps,
                "end_time": frame_map[-1] / fps,
            },
        }

        return phases
