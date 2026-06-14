"""
Injury Risk Scorer — calculates a 0-100 injury risk score based on
biomechanical analysis data and bowler profile.

Weighted risk factors based on published cricket sports science:
- Mixed bowling action (highest risk factor for lumbar stress fractures)
- Excessive lateral trunk flexion
- Front knee collapse
- Shoulder counter-rotation
- Bowling workload
"""


class InjuryScorer:
    """Calculates injury risk scores from biomechanics data."""

    # Risk factor weights (sum = 100)
    RISK_WEIGHTS = {
        "mixed_action": 25,
        "lateral_flexion": 20,
        "front_knee_collapse": 15,
        "shoulder_counter_rotation": 15,
        "elbow_hyperextension": 10,
        "stride_issues": 10,
        "poor_follow_through": 5,
    }

    def calculate_risk(self, biomechanics: dict, bowler_profile) -> dict:
        """
        Calculate comprehensive injury risk assessment.
        
        Returns:
        - overall_risk: 0-100
        - risk_level: Low/Moderate/High/Critical
        - body_areas: per-area risk breakdown
        - risk_factors: individual factor scores
        - explanations: plain English explanations
        """
        joint_angles = biomechanics.get("joint_angles", {})
        alignment = biomechanics.get("body_alignment", {})
        action_class = biomechanics.get("action_classification", {})
        stride = biomechanics.get("stride_analysis", {})

        risk_factors = {}
        explanations = {}

        # 1. Mixed Action Risk
        realignment = alignment.get("shoulder_realignment", 0)
        if realignment > 40:
            risk_factors["mixed_action"] = 1.0
            explanations["mixed_action"] = f"Your shoulders realign by {realignment:.0f}° between back-foot and front-foot contact. This creates a 'wringing' motion on your spine, which is the #1 cause of lower back stress fractures in fast bowlers."
        elif realignment > 30:
            risk_factors["mixed_action"] = 0.7
            explanations["mixed_action"] = f"Shoulder realignment of {realignment:.0f}° is in the borderline zone. Work on maintaining consistent alignment throughout your action."
        elif realignment > 20:
            risk_factors["mixed_action"] = 0.3
            explanations["mixed_action"] = "Your action alignment is generally consistent. Keep it up."
        else:
            risk_factors["mixed_action"] = 0.0
            explanations["mixed_action"] = "Excellent alignment consistency. Very low risk from action type."

        # 2. Lateral Trunk Flexion
        ffc_angles = joint_angles.get("ffc", {})
        lat_flex = ffc_angles.get("lateral_trunk_flexion", 0)
        if lat_flex > 45:
            risk_factors["lateral_flexion"] = 1.0
            explanations["lateral_flexion"] = f"Lateral trunk flexion of {lat_flex:.0f}° is excessive (danger zone is >40°). This puts enormous stress on your lower back. This is often a compensation for poor front leg bracing."
        elif lat_flex > 35:
            risk_factors["lateral_flexion"] = 0.6
            explanations["lateral_flexion"] = f"Lateral flexion of {lat_flex:.0f}° is moderate. Monitor this — it can creep up with fatigue."
        elif lat_flex > 25:
            risk_factors["lateral_flexion"] = 0.3
            explanations["lateral_flexion"] = "Lateral trunk flexion is within acceptable range."
        else:
            risk_factors["lateral_flexion"] = 0.0
            explanations["lateral_flexion"] = "Minimal lateral flexion. Great spinal control."

        # 3. Front Knee Collapse
        front_knee = ffc_angles.get("front_knee_angle", 180)
        if front_knee < 130:
            risk_factors["front_knee_collapse"] = 1.0
            explanations["front_knee_collapse"] = f"Front knee angle of {front_knee:.0f}° shows significant collapse. This stresses the patellar tendon and wastes energy. Your knee should ideally stay above 160°."
        elif front_knee < 150:
            risk_factors["front_knee_collapse"] = 0.6
            explanations["front_knee_collapse"] = f"Front knee at {front_knee:.0f}° shows moderate flexion. Strengthening your quads will help maintain a firmer brace."
        elif front_knee < 160:
            risk_factors["front_knee_collapse"] = 0.3
            explanations["front_knee_collapse"] = "Slight knee flexion detected. Not dangerous but could be more efficient."
        else:
            risk_factors["front_knee_collapse"] = 0.0
            explanations["front_knee_collapse"] = "Excellent front leg brace. Your knee stays firm on landing."

        # 4. Shoulder Counter-Rotation
        bfc_sep = alignment.get("bfc", {}).get("hip_shoulder_separation", 0)
        if bfc_sep > 60:
            risk_factors["shoulder_counter_rotation"] = 0.8
            explanations["shoulder_counter_rotation"] = f"Hip-shoulder separation of {bfc_sep:.0f}° is excessive (>60°). While some separation is good for pace, too much creates torsional stress on the lumbar spine."
        elif bfc_sep > 50:
            risk_factors["shoulder_counter_rotation"] = 0.3
            explanations["shoulder_counter_rotation"] = "Hip-shoulder separation is at the upper end of optimal. Good power generation."
        else:
            risk_factors["shoulder_counter_rotation"] = 0.0
            explanations["shoulder_counter_rotation"] = "Hip-shoulder separation is within optimal range."

        # 5. Elbow Hyperextension
        delivery_angles = joint_angles.get("delivery", {})
        elbow_angle = delivery_angles.get("bowling_arm_elbow_angle", 170)
        elbow_change = abs(180 - elbow_angle)
        if elbow_change > 15:
            risk_factors["elbow_hyperextension"] = 0.7
            explanations["elbow_hyperextension"] = f"Bowling arm extension change of {elbow_change:.0f}° exceeds the 15° legal limit. This could lead to elbow injuries and may be flagged as an illegal action."
        elif elbow_change > 10:
            risk_factors["elbow_hyperextension"] = 0.3
            explanations["elbow_hyperextension"] = "Elbow extension is within legal limits but worth monitoring."
        else:
            risk_factors["elbow_hyperextension"] = 0.0
            explanations["elbow_hyperextension"] = "Clean bowling arm action. No hyperextension concerns."

        # 6. Stride Issues
        stride_ratio = stride.get("stride_ratio", 0.8)
        if stride_ratio > 0.95:
            risk_factors["stride_issues"] = 0.7
            explanations["stride_issues"] = "Over-striding increases impact forces on the front leg and back."
        elif stride_ratio < 0.6:
            risk_factors["stride_issues"] = 0.5
            explanations["stride_issues"] = "Short stride suggests limited momentum transfer. Less risky but less efficient."
        else:
            risk_factors["stride_issues"] = 0.0
            explanations["stride_issues"] = "Stride length is well-proportioned to your height."

        # 7. Follow-through (simplified)
        risk_factors["poor_follow_through"] = 0.1  # Default low risk
        explanations["poor_follow_through"] = "Follow-through analysis is based on deceleration patterns."

        # Calculate overall risk score
        overall_risk = 0
        for factor, weight in self.RISK_WEIGHTS.items():
            overall_risk += risk_factors.get(factor, 0) * weight

        overall_risk = min(100, max(0, round(overall_risk)))

        # Classify risk level
        if overall_risk < 25:
            risk_level = "Low"
        elif overall_risk < 50:
            risk_level = "Moderate"
        elif overall_risk < 75:
            risk_level = "High"
        else:
            risk_level = "Critical"

        # Body area risk breakdown
        body_areas = {
            "lower_back": {
                "risk": min(100, round(
                    (risk_factors.get("mixed_action", 0) * 35 + 
                     risk_factors.get("lateral_flexion", 0) * 35 +
                     risk_factors.get("shoulder_counter_rotation", 0) * 30)
                )),
                "level": "",
            },
            "front_knee": {
                "risk": min(100, round(risk_factors.get("front_knee_collapse", 0) * 80 + risk_factors.get("stride_issues", 0) * 20)),
                "level": "",
            },
            "bowling_shoulder": {
                "risk": min(100, round(
                    risk_factors.get("shoulder_counter_rotation", 0) * 50 +
                    risk_factors.get("elbow_hyperextension", 0) * 30 +
                    risk_factors.get("mixed_action", 0) * 20
                )),
                "level": "",
            },
            "ankle": {
                "risk": min(100, round(risk_factors.get("stride_issues", 0) * 60)),
                "level": "",
            },
            "elbow": {
                "risk": min(100, round(risk_factors.get("elbow_hyperextension", 0) * 90)),
                "level": "",
            },
        }

        # Assign levels to body areas
        for area_name, area_data in body_areas.items():
            r = area_data["risk"]
            area_data["level"] = "low" if r < 25 else "moderate" if r < 50 else "high" if r < 75 else "critical"

        return {
            "overall_risk": overall_risk,
            "risk_level": risk_level,
            "body_areas": body_areas,
            "risk_factors": risk_factors,
            "explanations": explanations,
        }
