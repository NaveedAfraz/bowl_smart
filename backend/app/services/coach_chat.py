"""
Coach Chat — Contextual AI chat for phase-by-phase bowling analysis.
Users can select a phase and have a conversation with Coach BowlSmart
about the specific biomechanics, angles, and improvements for that phase.
"""

import json
from app.config import settings


PHASE_CONTEXT = {
    "run_up": {
        "display_name": "Run-Up",
        "focus_areas": ["rhythm", "acceleration pattern", "body alignment", "head position", "approach speed"],
        "elite_refs": "Think Shoaib Akhtar's explosive run-up or Pat Cummins' smooth controlled approach.",
    },
    "bound": {
        "display_name": "Bound / Gather / Jump",
        "focus_areas": ["jump height", "body coil", "hip-shoulder separation", "back foot positioning", "momentum transfer"],
        "elite_refs": "Mitchell Starc gets incredible height in his bound which gives him time to rotate. Bumrah's unique gather.",
    },
    "back_foot_contact": {
        "display_name": "Back-Foot Contact",
        "focus_areas": ["foot alignment", "hip rotation", "shoulder counter-rotation", "back knee angle", "trunk position"],
        "elite_refs": "Dale Steyn's perfect back-foot alignment. Brett Lee's explosive hip drive from BFC.",
    },
    "front_foot_contact": {
        "display_name": "Front-Foot Contact",
        "focus_areas": ["front knee brace", "foot plant angle", "trunk flexion", "head position", "energy transfer"],
        "elite_refs": "Dennis Lillee's braced front leg. Jasprit Bumrah's stiff front knee generating 150+ km/h.",
    },
    "delivery": {
        "display_name": "Delivery Stride / Bowling Arm",
        "focus_areas": ["elbow extension", "arm speed", "wrist position", "shoulder rotation", "release point height"],
        "elite_refs": "Wasim Akram's wrist position at release. Jofra Archer's high arm and smooth rotation.",
    },
    "follow_through": {
        "display_name": "Follow-Through",
        "focus_areas": ["deceleration", "body rotation completion", "balance", "injury prevention", "momentum dissipation"],
        "elite_refs": "McGrath's textbook follow-through. Broad's full rotation.",
    },
    "bowling_arm": {
        "display_name": "Bowling Arm Action",
        "focus_areas": ["elbow angle legality (<15°)", "arm path", "shoulder rotation speed", "wrist cock", "release point"],
        "elite_refs": "Bumrah's hyperextended arm. Malinga's unique round-arm. Cummins' classical high-arm action.",
    },
    "non_bowling_arm": {
        "display_name": "Non-Bowling Arm",
        "focus_areas": ["pull-down timing", "direction of pull", "balance contribution", "counter-rotation", "tucking speed"],
        "elite_refs": "Anderson's perfect non-bowling arm pull. Steyn's aggressive front arm drive generating pace.",
    },
}

SYSTEM_PROMPT = """You are Coach BowlSmart — a personalised expert fast bowling coach with 10+ years 
of hands-on experience. The bowler is asking you about a SPECIFIC PHASE of their bowling action.

You have their actual biomechanical data from their video analysis. Use it to give specific, 
personalised answers — not generic advice.

Rules:
- Speak directly to them ("your knee angle is 135° — that's collapsing...")
- Reference their actual measurements when answering
- Compare to elite benchmarks and name real bowlers
- Keep answers focused on the phase they're asking about
- If they ask something outside the phase, briefly answer but guide back
- Suggest 1-2 specific drills if relevant
- Keep responses concise but informative (2-4 paragraphs max)
- Adapt complexity to their experience level
"""


class CoachChat:
    """Handles contextual AI chat about specific bowling phases."""

    def __init__(self):
        self.conversations: dict = {}  # job_id -> list of messages

    def _build_phase_context(self, phase: str, biomechanics: dict, bowler_profile: dict) -> str:
        """Build rich context string for the selected phase."""
        phase_info = PHASE_CONTEXT.get(phase, {})
        display_name = phase_info.get("display_name", phase)
        focus_areas = phase_info.get("focus_areas", [])
        elite_refs = phase_info.get("elite_refs", "")

        # Extract relevant biomechanics for this phase
        joint_angles = biomechanics.get("joint_angles", {})
        body_alignment = biomechanics.get("body_alignment", {})
        velocity = biomechanics.get("velocity_timing", {})
        stride = biomechanics.get("stride_analysis", {})
        action_class = biomechanics.get("action_classification", {})

        context = f"""CURRENT PHASE: {display_name}
Focus areas for this phase: {', '.join(focus_areas)}
Elite references: {elite_refs}

BOWLER PROFILE:
- Age: {bowler_profile.get('age')} | Height: {bowler_profile.get('height_cm')}cm | Weight: {bowler_profile.get('weight_kg')}kg
- Experience: {bowler_profile.get('experience_level')} | Style: {bowler_profile.get('bowling_style')}
- Dominant arm: {bowler_profile.get('dominant_arm')}

THEIR BIOMECHANICAL DATA FOR THIS PHASE:
Joint Angles: {json.dumps(joint_angles, indent=2, default=str)}
Body Alignment: {json.dumps(body_alignment, indent=2, default=str)}
Velocity/Timing: {json.dumps(velocity, indent=2, default=str)}
Stride Analysis: {json.dumps(stride, indent=2, default=str)}
Action Classification: {json.dumps(action_class, indent=2, default=str)}
"""
        return context

    async def chat(
        self,
        job_id: str,
        phase: str,
        user_message: str,
        biomechanics: dict,
        bowler_profile: dict,
        ai_report: dict,
    ) -> str:
        """Send a message to Coach BowlSmart about a specific phase."""

        if not settings.GEMINI_API_KEY:
            return self._fallback_response(phase, user_message, biomechanics)

        try:
            import google.generativeai as genai

            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-2.0-flash")

            # Build conversation context
            phase_context = self._build_phase_context(phase, biomechanics, bowler_profile)

            # Get conversation history for this job+phase
            conv_key = f"{job_id}_{phase}"
            if conv_key not in self.conversations:
                self.conversations[conv_key] = []

            history = self.conversations[conv_key]

            # Build messages for Gemini
            messages = [
                {"role": "user", "parts": [SYSTEM_PROMPT + "\n\n" + phase_context]},
                {"role": "model", "parts": [f"I've reviewed your {PHASE_CONTEXT.get(phase, {}).get('display_name', phase)} phase data. What would you like to know?"]},
            ]

            # Add conversation history
            for msg in history[-10:]:  # last 10 messages for context window
                messages.append({"role": msg["role"], "parts": [msg["content"]]})

            # Add current message
            messages.append({"role": "user", "parts": [user_message]})

            response = model.generate_content(
                messages,
                generation_config=genai.GenerationConfig(
                    temperature=0.8,
                    max_output_tokens=1024,
                ),
            )

            reply = response.text.strip()

            # Save to history
            history.append({"role": "user", "content": user_message})
            history.append({"role": "model", "content": reply})
            self.conversations[conv_key] = history

            return reply

        except Exception as e:
            print(f"Coach chat Gemini error: {e}")
            return self._fallback_response(phase, user_message, biomechanics)

    def _fallback_response(self, phase: str, user_message: str, biomechanics: dict) -> str:
        """Provide a basic response when Gemini is unavailable."""
        phase_info = PHASE_CONTEXT.get(phase, {})
        display_name = phase_info.get("display_name", phase)
        focus_areas = phase_info.get("focus_areas", [])

        joint_angles = biomechanics.get("joint_angles", {})

        return (
            f"I'd love to give you a detailed breakdown of your {display_name} phase! "
            f"Key focus areas here are: {', '.join(focus_areas[:3])}. "
            f"\n\nYour measured angles: {json.dumps(joint_angles, default=str)}"
            f"\n\n(AI chat requires Gemini API — please wait a moment if rate-limited and try again.)"
        )

    def clear_history(self, job_id: str, phase: str = None):
        """Clear conversation history."""
        if phase:
            key = f"{job_id}_{phase}"
            self.conversations.pop(key, None)
        else:
            # Clear all phases for this job
            keys_to_remove = [k for k in self.conversations if k.startswith(f"{job_id}_")]
            for k in keys_to_remove:
                del self.conversations[k]
