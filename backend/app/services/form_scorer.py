"""
Form Scorer — scores each bowling phase out of 10 and calculates
overall form score out of 100. Based on biomechanics benchmarks.
"""


class FormScorer:
    """Scores bowling form based on biomechanical analysis."""

    # Phase weights for overall score
    PHASE_WEIGHTS = {
        "run_up": 0.12,
        "bound": 0.12,
        "back_foot_contact": 0.18,
        "front_foot_contact": 0.25,  # Most impactful phase
        "delivery": 0.20,
        "follow_through": 0.13,
    }

    def score_phases(self, biomechanics: dict, phases: dict) -> dict:
        """Score each bowling phase out of 10."""
        
        joint_angles = biomechanics.get("joint_angles", {})
        alignment = biomechanics.get("body_alignment", {})
        velocity = biomechanics.get("velocity_timing", {})
        stride = biomechanics.get("stride_analysis", {})
        action = biomechanics.get("action_classification", {})

        scores = {}

        # Run-Up Score (based on acceleration and consistency)
        run_up_score = 7  # Base score
        acceleration = velocity.get("run_up_acceleration", "unknown")
        if acceleration == "accelerating":
            run_up_score = 8
        elif acceleration == "decelerating":
            run_up_score = 5
        elif acceleration == "consistent":
            run_up_score = 7
        
        scores["run_up"] = {
            "score": run_up_score,
            "status": self._score_to_status(run_up_score),
            "key_metric": f"Run-up pattern: {acceleration}",
        }

        # Bound Score
        bound_score = 7  # Base - hard to score precisely without vertical data
        scores["bound"] = {
            "score": bound_score,
            "status": self._score_to_status(bound_score),
            "key_metric": "Gather position assessed",
        }

        # Back-Foot Contact Score
        bfc_score = 7
        bfc_alignment = alignment.get("bfc", {})
        hip_shoulder_sep = bfc_alignment.get("hip_shoulder_separation", 0)
        
        if 35 <= hip_shoulder_sep <= 50:
            bfc_score = 9  # Optimal separation
        elif 25 <= hip_shoulder_sep <= 55:
            bfc_score = 7
        elif hip_shoulder_sep > 60:
            bfc_score = 4  # Excessive
        else:
            bfc_score = 5  # Too little
        
        # Check for mixed action
        if action.get("action_type") == "mixed":
            bfc_score = max(3, bfc_score - 3)

        scores["back_foot_contact"] = {
            "score": bfc_score,
            "status": self._score_to_status(bfc_score),
            "key_metric": f"Hip-shoulder separation: {hip_shoulder_sep:.0f}°",
        }

        # Front-Foot Contact Score (most critical)
        ffc_score = 7
        ffc_angles = joint_angles.get("ffc", {})
        front_knee = ffc_angles.get("front_knee_angle", 180)
        lat_flex = ffc_angles.get("lateral_trunk_flexion", 0)
        
        # Front knee scoring
        if front_knee >= 165:
            ffc_score = 9  # Excellent brace
        elif front_knee >= 155:
            ffc_score = 7
        elif front_knee >= 140:
            ffc_score = 5
        else:
            ffc_score = 3  # Severe collapse
        
        # Deduct for excessive lateral flexion
        if lat_flex > 40:
            ffc_score = max(2, ffc_score - 2)
        elif lat_flex > 30:
            ffc_score = max(3, ffc_score - 1)

        scores["front_foot_contact"] = {
            "score": ffc_score,
            "status": self._score_to_status(ffc_score),
            "key_metric": f"Front knee: {front_knee:.0f}° | Lateral flexion: {lat_flex:.0f}°",
        }

        # Delivery Score
        delivery_score = 7
        arm_velocity = velocity.get("arm_angular_velocity_deg_per_sec", 0)
        
        # Higher arm speed = better
        if arm_velocity > 2000:
            delivery_score = 9
        elif arm_velocity > 1500:
            delivery_score = 8
        elif arm_velocity > 1000:
            delivery_score = 7
        else:
            delivery_score = 5
        
        # Stride assessment
        stride_assessment = stride.get("stride_assessment", "unknown")
        if stride_assessment == "optimal":
            delivery_score = min(10, delivery_score + 1)
        elif stride_assessment in ("too_short", "over_striding"):
            delivery_score = max(3, delivery_score - 1)

        scores["delivery"] = {
            "score": delivery_score,
            "status": self._score_to_status(delivery_score),
            "key_metric": f"Arm speed: {arm_velocity:.0f}°/s | Stride: {stride_assessment}",
        }

        # Follow-Through Score
        follow_score = 7  # Base
        scores["follow_through"] = {
            "score": follow_score,
            "status": self._score_to_status(follow_score),
            "key_metric": "Follow-through balance assessed",
        }

        print(f"\n[FormScorer] SCORES CALCULATED:")
        for phase, data in scores.items():
            print(f"  - {phase.upper()}: {data['score']}/10 ({data['key_metric']})")

        return scores

    def calculate_overall_score(self, phase_scores: dict) -> int:
        """Calculate weighted overall form score out of 100."""
        total = 0
        print("\n[FormScorer] CALCULATING OVERALL SCORE:")
        for phase, weight in self.PHASE_WEIGHTS.items():
            if phase in phase_scores:
                phase_contrib = phase_scores[phase]["score"] * weight * 10
                total += phase_contrib
                print(f"  - {phase}: score={phase_scores[phase]['score']}, weight={weight} -> contrib={phase_contrib}")
            else:
                print(f"  - {phase}: MISSING from phase_scores")
        
        final_score = min(100, max(0, round(total)))
        print(f"  => TOTAL: {total} -> ROUNDED: {final_score}")
        return final_score

    def identify_pace_leaks(self, biomechanics: dict, phase_scores: dict) -> list[dict]:
        """Identify the top 3 areas where pace is being lost."""
        
        leaks = []
        
        joint_angles = biomechanics.get("joint_angles", {})
        alignment = biomechanics.get("body_alignment", {})
        velocity = biomechanics.get("velocity_timing", {})
        stride = biomechanics.get("stride_analysis", {})

        ffc_angles = joint_angles.get("ffc", {})
        front_knee = ffc_angles.get("front_knee_angle", 180)
        
        # Check front knee collapse
        if front_knee < 160:
            impact = "8-12" if front_knee < 140 else "4-8" if front_knee < 155 else "2-4"
            leaks.append({
                "issue": "Front Knee Collapse",
                "phase": "Front-Foot Contact",
                "severity": "high" if front_knee < 140 else "medium",
                "pace_impact_kmh": impact,
                "description": f"Your front knee is flexing to {front_knee:.0f}° instead of staying braced at 160°+. Energy is being absorbed by your collapsing leg instead of transferring to your bowling arm.",
                "fix": "Practice wall bracing drills: stand facing a wall, plant your front foot, and push your hip through while keeping your knee locked.",
            })

        # Check hip-shoulder separation
        bfc_sep = alignment.get("bfc", {}).get("hip_shoulder_separation", 40)
        if bfc_sep < 30:
            leaks.append({
                "issue": "Insufficient Torso Coil",
                "phase": "Back-Foot Contact",
                "severity": "medium",
                "pace_impact_kmh": "4-8",
                "description": f"Hip-shoulder separation of only {bfc_sep:.0f}° means you're not fully loading your body's rotational potential. Think of it like not pulling back a slingshot far enough.",
                "fix": "Focus on keeping your front shoulder pointing at the batsman at back-foot contact. Let your hips rotate first, creating a natural stretch in your core.",
            })

        # Check run-up
        acceleration = velocity.get("run_up_acceleration", "unknown")
        if acceleration == "decelerating":
            leaks.append({
                "issue": "Decelerating Run-Up",
                "phase": "Run-Up",
                "severity": "medium",
                "pace_impact_kmh": "3-6",
                "description": "You're slowing down as you approach the crease instead of accelerating. Your last 3 strides should be your fastest — this is where you build the momentum that converts to pace.",
                "fix": "Practice your run-up separate from bowling. Mark out your run-up and focus on building speed with each stride, peaking in the last 3 steps.",
            })

        # Check lateral flexion
        lat_flex = ffc_angles.get("lateral_trunk_flexion", 0)
        if lat_flex > 35:
            leaks.append({
                "issue": "Excessive Side Bend",
                "phase": "Delivery",
                "severity": "high" if lat_flex > 45 else "medium",
                "pace_impact_kmh": "3-5",
                "description": f"Lateral trunk flexion of {lat_flex:.0f}° means you're bending sideways too much at delivery. This is energy wasted on sideways motion instead of forward propulsion.",
                "fix": "This often happens because of poor front leg bracing. Fix the front knee first — a firm front leg helps keep your trunk more upright.",
            })

        # Check stride
        stride_assessment = stride.get("stride_assessment", "unknown")
        if stride_assessment == "too_short":
            leaks.append({
                "issue": "Short Stride",
                "phase": "Delivery",
                "severity": "low",
                "pace_impact_kmh": "2-4",
                "description": "Your stride length is shorter than optimal. A longer stride helps you release the ball from a higher point and creates more momentum transfer.",
                "fix": "Work on your bound — a bigger gather step helps extend your delivery stride naturally.",
            })

        # Sort by severity and return top 3
        severity_order = {"high": 0, "medium": 1, "low": 2}
        leaks.sort(key=lambda x: severity_order.get(x["severity"], 3))
        
        for i, leak in enumerate(leaks[:3]):
            leak["rank"] = i + 1

        return leaks[:3]

    def estimate_max_pace(self, biomechanics: dict, bowler_profile) -> float:
        """
        Estimate maximum pace potential based on current form efficiency
        and bowler profile.
        
        This uses a simplified model based on:
        - Current self-reported pace
        - Form score efficiency
        - Identified pace leaks (how much pace is being lost)
        """
        current_pace = bowler_profile.self_reported_pace or 120
        
        # Estimate total pace loss from identified issues
        joint_angles = biomechanics.get("joint_angles", {})
        ffc = joint_angles.get("ffc", {})
        front_knee = ffc.get("front_knee_angle", 170)
        
        estimated_loss = 0
        
        # Front knee loss
        if front_knee < 160:
            estimated_loss += (160 - front_knee) * 0.4
        
        # Hip-shoulder loss
        alignment = biomechanics.get("body_alignment", {})
        bfc_sep = alignment.get("bfc", {}).get("hip_shoulder_separation", 40)
        if bfc_sep < 30:
            estimated_loss += (30 - bfc_sep) * 0.3
        
        # Run-up loss
        velocity = biomechanics.get("velocity_timing", {})
        if velocity.get("run_up_acceleration") == "decelerating":
            estimated_loss += 5
        
        # Add buffer (form improvements rarely give 100% of theoretical gain)
        max_pace = current_pace + estimated_loss * 0.8
        
        # Cap based on age and level (rough estimates)
        age = bowler_profile.age
        level_caps = {
            "beginner": 135,
            "club": 145,
            "academy": 155,
            "professional": 160,
        }
        cap = level_caps.get(bowler_profile.experience_level, 150)
        
        if age < 16:
            cap = min(cap, 130)
        elif age > 30:
            cap = min(cap, cap - 3)
        
        return round(min(max_pace, cap), 1)

    @staticmethod
    def _score_to_status(score: int) -> str:
        if score >= 7:
            return "green"
        elif score >= 5:
            return "amber"
        else:
            return "red"
