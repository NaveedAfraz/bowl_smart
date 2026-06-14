"""
Biomechanics Calculator — computes joint angles, body alignment metrics,
velocities, and key biomechanical parameters from pose landmarks.

All angles in degrees. Based on published cricket biomechanics research.
"""

import numpy as np
import math


class BiomechanicsCalculator:
    """Calculates biomechanical metrics from pose landmark data."""

    def __init__(self, dominant_arm: str = "right"):
        self.dominant_arm = dominant_arm
        # Set up limb mappings based on bowling arm
        if dominant_arm == "right":
            self.bowl_shoulder = "right_shoulder"
            self.bowl_elbow = "right_elbow"
            self.bowl_wrist = "right_wrist"
            self.front_shoulder = "left_shoulder"
            self.front_elbow = "left_elbow"
            self.front_wrist = "left_wrist"
            self.front_hip = "left_hip"
            self.back_hip = "right_hip"
            self.front_knee = "left_knee"
            self.back_knee = "right_knee"
            self.front_ankle = "left_ankle"
            self.back_ankle = "right_ankle"
        else:
            self.bowl_shoulder = "left_shoulder"
            self.bowl_elbow = "left_elbow"
            self.bowl_wrist = "left_wrist"
            self.front_shoulder = "right_shoulder"
            self.front_elbow = "right_elbow"
            self.front_wrist = "right_wrist"
            self.front_hip = "right_hip"
            self.back_hip = "left_hip"
            self.front_knee = "right_knee"
            self.back_knee = "left_knee"
            self.front_ankle = "right_ankle"
            self.back_ankle = "left_ankle"

    @staticmethod
    def _angle_between_points(a: dict, b: dict, c: dict) -> float:
        """Calculate angle between three points (b is the vertex) using 3D coordinates if available."""
        # Use z coordinate to reduce perspective distortion if the camera isn't perfectly side-on
        ba = np.array([a["x"] - b["x"], a["y"] - b["y"], a.get("z", 0) - b.get("z", 0)])
        bc = np.array([c["x"] - b["x"], c["y"] - b["y"], c.get("z", 0) - b.get("z", 0)])
        
        cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
        angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
        return float(np.degrees(angle))

    @staticmethod
    def _horizontal_angle(p1: dict, p2: dict) -> float:
        """Angle of line p1→p2 relative to horizontal, in degrees."""
        dx = p2["x"] - p1["x"]
        dy = p2["y"] - p1["y"]
        return float(np.degrees(np.arctan2(dy, dx)))

    def _get_landmark(self, landmarks: dict, name: str) -> dict:
        """Safely get a landmark with defaults."""
        return landmarks.get(name, {"x": 0, "y": 0, "z": 0, "visibility": 0})

    def calculate_all(
        self, landmarks_seq: list[dict | None], phases: dict, fps: float, height_cm: float
    ) -> dict:
        """Calculate all biomechanical metrics for the entire bowling action."""
        
        results = {
            "joint_angles": self._calculate_joint_angles(landmarks_seq, phases),
            "body_alignment": self._calculate_body_alignment(landmarks_seq, phases),
            "velocity_timing": self._calculate_velocities(landmarks_seq, phases, fps),
            "stride_analysis": self._calculate_stride(landmarks_seq, phases, height_cm),
            "action_classification": self._classify_action(landmarks_seq, phases),
        }
        
        return results

    def _calculate_joint_angles(self, landmarks_seq: list[dict | None], phases: dict) -> dict:
        """Calculate key joint angles at critical moments in the action."""
        
        # Get landmarks at key frames
        bfc_frame = phases["back_foot_contact"]["start_frame"]
        ffc_frame = phases["front_foot_contact"]["start_frame"]
        delivery_frame = phases["delivery"]["start_frame"]

        results = {}

        for phase_name, frame_idx in [("bfc", bfc_frame), ("ffc", ffc_frame), ("delivery", delivery_frame)]:
            if frame_idx < len(landmarks_seq) and landmarks_seq[frame_idx] is not None:
                lm = landmarks_seq[frame_idx]["landmarks"]

                # Bowling arm elbow angle
                bowl_elbow_angle = self._angle_between_points(
                    self._get_landmark(lm, self.bowl_shoulder),
                    self._get_landmark(lm, self.bowl_elbow),
                    self._get_landmark(lm, self.bowl_wrist),
                )

                # Front knee angle
                front_knee_angle = self._angle_between_points(
                    self._get_landmark(lm, self.front_hip),
                    self._get_landmark(lm, self.front_knee),
                    self._get_landmark(lm, self.front_ankle),
                )

                # Back knee angle
                back_knee_angle = self._angle_between_points(
                    self._get_landmark(lm, self.back_hip),
                    self._get_landmark(lm, self.back_knee),
                    self._get_landmark(lm, self.back_ankle),
                )

                # Trunk lateral flexion (side bend)
                mid_hip = {
                    "x": (self._get_landmark(lm, self.front_hip)["x"] + self._get_landmark(lm, self.back_hip)["x"]) / 2,
                    "y": (self._get_landmark(lm, self.front_hip)["y"] + self._get_landmark(lm, self.back_hip)["y"]) / 2,
                }
                mid_shoulder = {
                    "x": (self._get_landmark(lm, self.front_shoulder)["x"] + self._get_landmark(lm, self.bowl_shoulder)["x"]) / 2,
                    "y": (self._get_landmark(lm, self.front_shoulder)["y"] + self._get_landmark(lm, self.bowl_shoulder)["y"]) / 2,
                }
                lateral_flexion = abs(self._horizontal_angle(mid_hip, mid_shoulder) + 90)

                results[phase_name] = {
                    "bowling_arm_elbow_angle": round(bowl_elbow_angle, 1),
                    "front_knee_angle": round(front_knee_angle, 1),
                    "back_knee_angle": round(back_knee_angle, 1),
                    "lateral_trunk_flexion": round(lateral_flexion, 1),
                }

        return results

    def _calculate_body_alignment(self, landmarks_seq: list[dict | None], phases: dict) -> dict:
        """Calculate hip-shoulder separation and alignment metrics."""
        
        bfc_frame = phases["back_foot_contact"]["start_frame"]
        ffc_frame = phases["front_foot_contact"]["start_frame"]

        results = {}

        for phase_name, frame_idx in [("bfc", bfc_frame), ("ffc", ffc_frame)]:
            if frame_idx < len(landmarks_seq) and landmarks_seq[frame_idx] is not None:
                lm = landmarks_seq[frame_idx]["landmarks"]

                # Hip alignment angle (angle of hip line relative to horizontal)
                hip_angle = self._horizontal_angle(
                    self._get_landmark(lm, self.back_hip),
                    self._get_landmark(lm, self.front_hip),
                )

                # Shoulder alignment angle
                shoulder_angle = self._horizontal_angle(
                    self._get_landmark(lm, self.bowl_shoulder),
                    self._get_landmark(lm, self.front_shoulder),
                )

                # Hip-shoulder separation = difference between hip and shoulder alignment
                hip_shoulder_separation = abs(shoulder_angle - hip_angle)

                results[phase_name] = {
                    "hip_angle": round(hip_angle, 1),
                    "shoulder_angle": round(shoulder_angle, 1),
                    "hip_shoulder_separation": round(hip_shoulder_separation, 1),
                }

        # Calculate realignment between BFC and FFC (mixed action indicator)
        if "bfc" in results and "ffc" in results:
            shoulder_realignment = abs(
                results["ffc"]["shoulder_angle"] - results["bfc"]["shoulder_angle"]
            )
            results["shoulder_realignment"] = round(shoulder_realignment, 1)
        else:
            results["shoulder_realignment"] = 0.0

        return results

    def _calculate_velocities(
        self, landmarks_seq: list[dict | None], phases: dict, fps: float
    ) -> dict:
        """Estimate arm angular velocity and run-up speed from frame-to-frame displacement."""
        
        # Arm angular velocity at delivery
        delivery_start = phases["delivery"]["start_frame"]
        delivery_end = phases["delivery"]["end_frame"]
        
        wrist_positions = []
        shoulder_positions = []
        
        for i in range(max(0, delivery_start - 5), min(len(landmarks_seq), delivery_end + 5)):
            if landmarks_seq[i] is not None:
                lm = landmarks_seq[i]["landmarks"]
                wrist_positions.append(self._get_landmark(lm, self.bowl_wrist))
                shoulder_positions.append(self._get_landmark(lm, self.bowl_shoulder))

        arm_angular_velocity = 0.0
        if len(wrist_positions) >= 2:
            # Calculate angular change of arm (wrist relative to shoulder) per frame
            angles = []
            for wp, sp in zip(wrist_positions, shoulder_positions):
                angle = math.atan2(wp["y"] - sp["y"], wp["x"] - sp["x"])
                angles.append(angle)
            
            if len(angles) >= 2:
                angular_changes = []
                for i in range(len(angles)-1):
                    diff = angles[i+1] - angles[i]
                    # Normalize difference to be between -pi and pi
                    diff = (diff + math.pi) % (2 * math.pi) - math.pi
                    angular_changes.append(abs(diff))
                arm_angular_velocity = float(np.mean(angular_changes) * fps * (180 / math.pi))

        # Run-up speed (horizontal displacement of hips over time)
        run_up_start = phases["run_up"]["start_frame"]
        run_up_end = phases["run_up"]["end_frame"]
        
        hip_displacements = []
        for i in range(run_up_start, min(len(landmarks_seq) - 1, run_up_end)):
            if landmarks_seq[i] is not None and landmarks_seq[i + 1] is not None:
                lm1 = landmarks_seq[i]["landmarks"]
                lm2 = landmarks_seq[i + 1]["landmarks"]
                
                hip1_x = (self._get_landmark(lm1, self.front_hip)["x"] + self._get_landmark(lm1, self.back_hip)["x"]) / 2
                hip2_x = (self._get_landmark(lm2, self.front_hip)["x"] + self._get_landmark(lm2, self.back_hip)["x"]) / 2
                
                hip_displacements.append(abs(hip2_x - hip1_x))

        run_up_speed = float(np.mean(hip_displacements) * fps) if hip_displacements else 0.0

        return {
            "arm_angular_velocity_deg_per_sec": round(arm_angular_velocity, 1),
            "run_up_speed_normalized": round(run_up_speed, 4),
            "run_up_acceleration": self._check_run_up_acceleration(hip_displacements),
        }

    def _check_run_up_acceleration(self, displacements: list) -> str:
        """Check if run-up is accelerating (good) or decelerating (bad)."""
        if len(displacements) < 4:
            return "unknown"
        
        first_half = np.mean(displacements[:len(displacements)//2])
        second_half = np.mean(displacements[len(displacements)//2:])
        
        if second_half > first_half * 1.1:
            return "accelerating"
        elif second_half < first_half * 0.9:
            return "decelerating"
        else:
            return "consistent"

    def _calculate_stride(
        self, landmarks_seq: list[dict | None], phases: dict, height_cm: float
    ) -> dict:
        """Calculate stride length relative to bowler height."""
        
        ffc_frame = phases["front_foot_contact"]["start_frame"]
        
        if ffc_frame < len(landmarks_seq) and landmarks_seq[ffc_frame] is not None:
            lm = landmarks_seq[ffc_frame]["landmarks"]
            
            front_foot = self._get_landmark(lm, self.front_ankle)
            back_foot = self._get_landmark(lm, self.back_ankle)
            
            stride_pixels = math.sqrt(
                (front_foot["x"] - back_foot["x"])**2 + 
                (front_foot["y"] - back_foot["y"])**2
            )
            
            # Estimate body height in pixels from head to ankle
            nose = self._get_landmark(lm, "nose")
            body_height_pixels = abs(nose["y"] - front_foot["y"])
            
            if body_height_pixels > 0:
                stride_ratio = stride_pixels / body_height_pixels
            else:
                stride_ratio = 0.0
            
            stride_cm = stride_ratio * height_cm
            
            return {
                "stride_length_cm": round(stride_cm, 1),
                "stride_ratio": round(stride_ratio, 3),
                "stride_assessment": (
                    "optimal" if 0.75 <= stride_ratio <= 0.85
                    else "too_short" if stride_ratio < 0.75
                    else "over_striding"
                ),
            }
        
        return {"stride_length_cm": 0, "stride_ratio": 0, "stride_assessment": "unknown"}

    def _classify_action(self, landmarks_seq: list[dict | None], phases: dict) -> dict:
        """Classify the bowling action type: side-on, front-on, or mixed."""
        
        alignment = self._calculate_body_alignment(landmarks_seq, phases)
        
        realignment = alignment.get("shoulder_realignment", 0)
        
        if realignment > 30:
            action_type = "mixed"
            risk_note = "Mixed actions have the highest injury risk. Consider working with a coach to develop a more consistent alignment."
        elif alignment.get("bfc", {}).get("hip_shoulder_separation", 0) > 40:
            action_type = "side_on"
            risk_note = "Good side-on action. This is generally the safest alignment for fast bowling."
        else:
            action_type = "front_on"
            risk_note = "Front-on action detected. This can be effective but monitor lateral trunk flexion."

        return {
            "action_type": action_type,
            "shoulder_realignment_degrees": realignment,
            "risk_note": risk_note,
        }
