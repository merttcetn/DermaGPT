import { useState } from "preact/hooks";
import "./index.css";

export default function App() {
    const [formData, setFormData] = useState({
        photo_url: "",
        age: 25,
        gender: "0",
        has_botox: "0",
        skin_type: "0",
        main_goals: [],
        daily_water: 3,
        sleep_duration: 7,
        focused_face_area: [],
        skin_sensitivities: [],
        daily_exercise_duration: 30,
        daily_exercise_days_per_week: 3,
    });

    const [sessionId, setSessionId] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const options = {
        gender: { Male: "0", Female: "1", Other: "2" },
        botox: { No: "0", Yes: "1" },
        skinType: { Normal: "0", Oily: "1", Dry: "2", Combination: "3" },
        mainGoals: {
            Hydration: 1,
            "Wrinkle Prevention": 2,
            "Acne Care": 3,
            Brightening: 4,
        },
        faceAreas: {
            Frontal: 1,
            Eye: 2,
            Nose: 3,
            Lips: 4,
            Leftcheeks: 5,
            Rightcheeks: 6,
        },
        sensitivities: {
            Fragrance: 0,
            Alcohol: 1,
            Parabens: 2,
            Sulfates: 3,
        },
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleMultiSelect = (e, key, map) => {
        const selected = Array.from(e.target.selectedOptions).map(
            (o) => map[o.value]
        );
        setFormData((prev) => ({ ...prev, [key]: selected }));
    };

    const startChat = async () => {
        setLoading(true);
        try {
            const quiz_data = {
                age: formData.age,
                gender: formData.gender,
                has_botox: formData.has_botox,
                skin_type: formData.skin_type,
                main_goals: formData.main_goals,
                daily_water: formData.daily_water,
                sleep_duration: formData.sleep_duration,
                focused_face_area: formData.focused_face_area,
                skin_sensitivities: formData.skin_sensitivities,
                daily_exercise_duration: formData.daily_exercise_duration,
                daily_exercise_days_per_week:
                    formData.daily_exercise_days_per_week,
            };

            const res = await fetch("http://localhost:8000/start_session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    photo_url: formData.photo_url || null,
                    quiz_data,
                }),
            });

            const data = await res.json();
            setSessionId(data.session_id);
        } catch (err) {
            alert("❌ Failed to start session");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim()) return;
        const currentMessage = { user: input, bot: "..." };
        setChatHistory((prev) => [...prev, currentMessage]);

        try {
            const res = await fetch("http://localhost:8000/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    user_message: input,
                }),
            });

            const data = await res.json();
            setChatHistory((prev) => {
                const copy = [...prev];
                copy[copy.length - 1].bot = data.bot_response;
                return copy;
            });
            setInput("");
        } catch (err) {
            alert("❌ Chat failed");
            console.error(err);
        }
    };

    const resetSession = () => {
        setSessionId(null);
        setFormData({
            photo_url: "",
            age: 25,
            gender: "0",
            has_botox: "0",
            skin_type: "0",
            main_goals: [],
            daily_water: 3,
            sleep_duration: 7,
            focused_face_area: [],
            skin_sensitivities: [],
            daily_exercise_duration: 30,
            daily_exercise_days_per_week: 3,
        });
        setChatHistory([]);
        setInput("");
    };

    return (
        <div className="min-h-screen bg-zinc-900 text-white p-6">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-6">
                    🧴 DermaGPT
                </h1>

                {!sessionId ? (
                    <div className="space-y-4 bg-zinc-800 p-6 rounded-xl shadow-xl">
                        <input
                            type="text"
                            name="photo_url"
                            placeholder="📷 Photo URL"
                            value={formData.photo_url}
                            onChange={handleChange}
                            className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded"
                        />
                        <input
                            type="number"
                            name="age"
                            min="10"
                            max="80"
                            value={formData.age}
                            onChange={handleChange}
                            className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded"
                        />
                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded"
                        >
                            {Object.entries(options.gender).map(
                                ([label, val]) => (
                                    <option key={val} value={val}>
                                        {label}
                                    </option>
                                )
                            )}
                        </select>
                        <select
                            name="has_botox"
                            value={formData.has_botox}
                            onChange={handleChange}
                            className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded"
                        >
                            {Object.entries(options.botox).map(
                                ([label, val]) => (
                                    <option key={val} value={val}>
                                        {label}
                                    </option>
                                )
                            )}
                        </select>
                        <select
                            name="skin_type"
                            value={formData.skin_type}
                            onChange={handleChange}
                            className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded"
                        >
                            {Object.entries(options.skinType).map(
                                ([label, val]) => (
                                    <option key={val} value={val}>
                                        {label}
                                    </option>
                                )
                            )}
                        </select>
                        <select
                            multiple
                            onChange={(e) =>
                                handleMultiSelect(
                                    e,
                                    "main_goals",
                                    options.mainGoals
                                )
                            }
                            className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded h-32"
                        >
                            {Object.keys(options.mainGoals).map((goal) => (
                                <option key={goal}>{goal}</option>
                            ))}
                        </select>
                        <input
                            type="range"
                            min="0"
                            max="15"
                            value={formData.daily_water}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    daily_water: parseInt(e.target.value),
                                })
                            }
                        />
                        <input
                            type="range"
                            min="0"
                            max="12"
                            value={formData.sleep_duration}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    sleep_duration: parseInt(e.target.value),
                                })
                            }
                        />
                        <select
                            multiple
                            onChange={(e) =>
                                handleMultiSelect(
                                    e,
                                    "focused_face_area",
                                    options.faceAreas
                                )
                            }
                            className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded h-32"
                        >
                            {Object.keys(options.faceAreas).map((area) => (
                                <option key={area}>{area}</option>
                            ))}
                        </select>
                        <select
                            multiple
                            onChange={(e) =>
                                handleMultiSelect(
                                    e,
                                    "skin_sensitivities",
                                    options.sensitivities
                                )
                            }
                            className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded h-32"
                        >
                            {Object.keys(options.sensitivities).map((s) => (
                                <option key={s}>{s}</option>
                            ))}
                        </select>
                        <input
                            type="range"
                            min="0"
                            max="120"
                            value={formData.daily_exercise_duration}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    daily_exercise_duration: parseInt(
                                        e.target.value
                                    ),
                                })
                            }
                        />
                        <input
                            type="range"
                            min="0"
                            max="7"
                            value={formData.daily_exercise_days_per_week}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    daily_exercise_days_per_week: parseInt(
                                        e.target.value
                                    ),
                                })
                            }
                        />
                        <button
                            onClick={startChat}
                            className="w-full bg-pink-500 hover:bg-pink-600 py-3 rounded-lg"
                        >
                            {loading ? "Loading..." : "🚀 Start Chatting"}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-zinc-800 p-4 rounded-xl max-h-[400px] overflow-y-auto">
                            {chatHistory.map((chat, i) => (
                                <div key={i} className="mb-4">
                                    <p className="text-pink-400">
                                        🧍 {chat.user}
                                    </p>
                                    <p className="text-green-400 whitespace-pre-wrap">
                                        🤖 {chat.bot}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask a question..."
                                className="flex-1 p-3 bg-zinc-700 border border-zinc-600 rounded"
                            />
                            <button
                                onClick={sendMessage}
                                className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded"
                            >
                                Send
                            </button>
                        </div>
                        <button
                            onClick={resetSession}
                            className="text-sm text-zinc-400 underline"
                        >
                            🔁 Reset Session
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
