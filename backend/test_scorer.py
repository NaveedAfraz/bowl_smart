import sys
import os

# Add backend dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.form_scorer import FormScorer
from app.services.injury_scorer import InjuryScorer
from app.services.biomechanics import BiomechanicsCalculator

# Standard mock biomechanics calculated in similar format to what the pipeline produces
biomechanics = {}

phases = {
    "run_up": {"start_frame": 0, "end_frame": 20},
    "bound": {"start_frame": 20, "end_frame": 30},
    "back_foot_contact": {"start_frame": 30, "end_frame": 40},
    "front_foot_contact": {"start_frame": 40, "end_frame": 50},
    "delivery": {"start_frame": 50, "end_frame": 60},
    "follow_through": {"start_frame": 60, "end_frame": 80}
}

class DummyBowlerProfile:
    age = 22
    height_cm = 175
    weight_kg = 72
    dominant_arm = "right"
    bowling_style = "seam"
    experience_level = "club"
    self_reported_pace = 130

profile = DummyBowlerProfile()

scorer = FormScorer()
phase_scores = scorer.score_phases(biomechanics, phases)
overall_score = scorer.calculate_overall_score(phase_scores)
pace_leaks = scorer.identify_pace_leaks(biomechanics, phase_scores)
max_pace = scorer.estimate_max_pace(biomechanics, profile)

injury_scorer = InjuryScorer()
injury_risk = injury_scorer.calculate_risk(biomechanics, profile)

print("--- RULE-BASED SCORER RESULTS ---")
print(f"Phase Scores: {phase_scores}")
print(f"Overall Score: {overall_score}")
print(f"Pace Leaks: {pace_leaks}")
print(f"Max Pace: {max_pace}")
print(f"Injury Risk: {injury_risk}")
