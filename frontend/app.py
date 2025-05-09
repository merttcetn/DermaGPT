import streamlit as st
import requests

st.set_page_config(page_title="DermaGPT", page_icon="🧴")
st.title("🧴 DermaGPT – Personalized Skincare Advisor")

# 🧠 Session State setup
if "session_id" not in st.session_state:
    st.session_state["session_id"] = None
if "chat_history" not in st.session_state:
    st.session_state["chat_history"] = []
if "quiz_submitted" not in st.session_state:
    st.session_state["quiz_submitted"] = False
if "chat_input_value" not in st.session_state:
    st.session_state["chat_input_value"] = ""

# --- STEP 1: QUIZ FORM ---
if not st.session_state["session_id"] and not st.session_state["quiz_submitted"]:
    st.markdown("### 👇 Fill out the quiz and upload your face photo")

    photo_url = st.text_input("📷 Enter your photo URL (optional)")
    age = st.slider("Age", 10, 80, 25)

    gender = st.selectbox("Gender", ["Male", "Female", "Other"])
    gender_map = {"Male": "0", "Female": "1", "Other": "2"}
    gender_value = gender_map[gender]

    has_botox = st.selectbox("Have you had Botox?", ["No", "Yes"])
    has_botox_value = "1" if has_botox == "Yes" else "0"

    skin_type = st.selectbox("Skin Type", ["Normal", "Oily", "Dry", "Combination"])
    skin_type_map = {"Normal": "0", "Oily": "1", "Dry": "2", "Combination": "3"}
    skin_type_value = skin_type_map[skin_type]

    main_goal_options = {
        "Hydration": 1,
        "Wrinkle Prevention": 2,
        "Acne Care": 3,
        "Brightening": 4
    }
    main_goals = st.multiselect("Main Skincare Goals", list(main_goal_options.keys()))
    main_goals_values = [main_goal_options[g] for g in main_goals]

    daily_water = st.slider("How many cups of water do you drink per day?", 0, 15, 3)
    sleep_duration = st.slider("How many hours do you sleep per night?", 0, 12, 7)

    focused_area_options = {
        "Frontal": 1, "Eye": 2, "Nose": 3,
        "Lips": 4, "Leftcheeks": 5, "Rightcheeks": 6
    }
    focused_face_area = st.multiselect("Focused Facial Areas", list(focused_area_options.keys()))
    focused_face_area_values = [focused_area_options[a] for a in focused_face_area]

    sensitivity_options = {
        "Fragrance": 0, "Alcohol": 1, "Parabens": 2, "Sulfates": 3
    }
    skin_sensitivities = st.multiselect("Skin Sensitivities (optional)", list(sensitivity_options.keys()))
    skin_sensitivities_values = [sensitivity_options[s] for s in skin_sensitivities]

    daily_exercise_duration = st.slider("Daily Exercise Duration (minutes)", 0, 120, 30)
    daily_exercise_days_per_week = st.slider("Exercise Days Per Week", 0, 7, 3)

    if st.button("🚀 Start Chatting"):
        quiz_data = {
            "age": age,
            "gender": gender_value,
            "has_botox": has_botox_value,
            "skin_type": skin_type_value,
            "main_goals": main_goals_values,
            "daily_water": daily_water,
            "sleep_duration": sleep_duration,
            "focused_face_area": focused_face_area_values,
            "skin_sensitivities": skin_sensitivities_values,
            "daily_exercise_duration": daily_exercise_duration,
            "daily_exercise_days_per_week": daily_exercise_days_per_week
        }

        request_payload = {
            "photo_url": photo_url if photo_url.strip() else None,
            "quiz_data": quiz_data
        }

        try:
            res = requests.post("http://localhost:8000/start_session", json=request_payload)
            res.raise_for_status()
            result = res.json()

            st.session_state["session_id"] = result["session_id"]
            st.session_state["quiz_submitted"] = True

        except Exception as e:
            st.error(f"❌ Failed to start session: {e}")

# --- STEP 2: CHAT INTERFACE ---
if st.session_state["session_id"]:
    st.markdown("### 💬 Chat with DermaGPT")

    for msg in st.session_state["chat_history"]:
        st.markdown(f"🧍‍♂️ **You:** {msg['user']}")
        st.markdown(f"🤖 **DermaGPT:** {msg['bot']}")
        st.markdown("---")

    user_input = st.text_input("💬 Ask a question", key="chat_input", value=st.session_state["chat_input_value"])

    if st.button("Send") and user_input.strip():
        try:
            chat_payload = {
                "session_id": st.session_state["session_id"],
                "user_message": user_input.strip()
            }

            res = requests.post("http://localhost:8000/chat", json=chat_payload)
            res.raise_for_status()
            result = res.json()

            st.session_state["chat_history"].append({
                "user": user_input.strip(),
                "bot": result["bot_response"]
            })

            st.session_state["chat_input_value"] = ""  # input'u temizle
            st.rerun()

        except Exception as e:
            st.error(f"❌ Chat failed: {e}")

# --- Optional: Reset session (dev use only) ---
with st.sidebar:
    if st.button("🔁 Reset Session"):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.rerun()
