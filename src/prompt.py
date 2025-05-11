def convert_quiz_to_text(
    quiz_data: dict,
    wrinkle_data: list = None,
    acne_data: list = None,
    wrinkle_score: float = None,
    acne_score: float = None
) -> str:
    skin_type_map = {0: "Normal", 1: "Oily", 2: "Dry", 3: "Combination"}
    goals_map = {1: "hydration", 2: "wrinkle prevention", 3: "acne care", 4: "brightening"}
    areas_map = {1: "Frontal", 2: "Eye", 3: "Nose", 4: "Lips", 5: "Leftcheeks", 6: "Rightcheeks"}
    sensitivities_map = {0: "Fragrance", 1: "Alcohol", 2: "Parabens", 3: "Sulfates"}
    gender_pronoun = {"0": ("he", "his"), "1": ("she", "her"), "2": ("they", "their")}

    def interpret_score(score):
        try:
            score = float(score)
        except (TypeError, ValueError):
            return "None"
        if score == 0:
            return "None"
        elif score < 1.5:
            return "Low"
        else:
            return "Moderate"

    def get_level(region_list, region_name):
        for region in region_list or []:
            if region["region"] == region_name:
                return interpret_score(region["level"])
        return "None"

    def pluralize(value, unit):
        return f"{value} {unit}" + ("" if value == 1 else "s")

    pronoun, possessive = gender_pronoun.get(str(quiz_data.get("gender", "2")), ("they", "their"))

    base_text = f"""{pronoun.capitalize()} is {quiz_data['age']} years old and has {'had botox' if quiz_data['has_botox'] == '1' else 'not had botox'}.
{possessive.capitalize()} skin type is {skin_type_map.get(int(quiz_data['skin_type']), 'unknown')}.
{possessive.capitalize()} main skincare goals are: {', '.join([goals_map.get(g, 'unknown') for g in quiz_data['main_goals']])}.
{pronoun.capitalize()} drinks {quiz_data['daily_water']} cups of water daily and sleeps around {pluralize(quiz_data['sleep_duration'], 'hour')} per night.
{pronoun.capitalize()} exercises {pluralize(quiz_data['daily_exercise_duration'], 'minute')} per day, {pluralize(quiz_data['daily_exercise_days_per_week'], 'day')} per week."""

    sensitivities = quiz_data.get("skin_sensitivities", [])
    if sensitivities:
        base_text += f"\n{pronoun.capitalize()} has sensitivities to: " + ", ".join(
            [sensitivities_map.get(s, "unknown") for s in sensitivities]) + "."

    if wrinkle_score is not None and acne_score is not None:
        wrinkle_level = interpret_score(wrinkle_score)
        acne_level = interpret_score(acne_score)
        base_text += f"\nBased on image analysis, {possessive} wrinkle level is {wrinkle_level} ({wrinkle_score:.2f}) and acne level is {acne_level} ({acne_score:.2f}), on a 3-point scale."

    if wrinkle_data and acne_data:
        focused_details = []
        for area_id in quiz_data.get("focused_face_area", []):
            name = areas_map.get(area_id, "unknown")
            wrinkle = get_level(wrinkle_data, name)
            acne = get_level(acne_data, name)
            focused_details.append(f"{name} (wrinkle: {wrinkle}, acne: {acne})")
        if focused_details:
            base_text += f"\n{possessive.capitalize()} focused facial regions include: {', '.join(focused_details)}."

    return base_text

from langchain.prompts import PromptTemplate

prompt_template = PromptTemplate.from_template("""
You are a certified dermatologist providing personalized skincare advice.

Use the following information to answer the user's question or provide a recommendation:

User Profile (Quiz Summary):
{quiz_text}

Retrieved Dermatology QA Snippets:
{context}

User's Question:
{user_question}

Your Answer (please provide a personalized, clear and concise answer or recommendation):
""")

def build_full_prompt(quiz_text: str, context_snippets: list, user_question: str) -> str:
    """
    Builds a full prompt using quiz summary + retrieved QA + user input.
    context_snippets: list of (question, answer) tuples
    """
    context_text = "\n\n".join([f"Q: {q}\nA: {a}" for q, a in context_snippets])
    return prompt_template.format(
        quiz_text=quiz_text,
        context=context_text,
        user_question=user_question
    )
