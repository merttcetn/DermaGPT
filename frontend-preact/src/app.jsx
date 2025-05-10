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

    // chat input
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

    const handleOptionSelect = (key, option, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const toggleMultiSelect = (key, value) => {
        setFormData((prev) => {
            const currentSelections = [...prev[key]];
            const index = currentSelections.indexOf(value);

            if (index === -1) {
                return { ...prev, [key]: [...currentSelections, value] };
            } else {
                currentSelections.splice(index, 1);
                return { ...prev, [key]: currentSelections };
            }
        });
    };

    const isSelected = (key, value) => {
        return formData[key].includes(value);
    };

    // Function to format markdown-like text
    const formatBotMessage = (text) => {
        if (!text || text === "...") return text;

        // Process bold text (** **)
        let formattedText = text.replace(
            /\*\*(.*?)\*\*/g,
            '<strong class="text-white font-semibold">$1</strong>'
        );

        // Process titled sections (Title:** or Title:**)
        formattedText = formattedText.replace(
            /(\w+):\*\*/g,
            '<span class="text-pink-300 font-semibold">$1:</span>'
        );

        // Process list items (- item)
        formattedText = formattedText.replace(
            /^-\s+(.*?)$/gm,
            '<div class="flex items-start my-1"><span class="text-pink-400 mr-2">•</span><span>$1</span></div>'
        );

        // Process numbered lists with patterns like "1. text" at the start of a line
        formattedText = formattedText.replace(
            /^(\d+)\.\s+(.*?)$/gm,
            '<div class="flex items-start my-1.5"><span class="text-pink-400 font-medium min-w-[24px] mr-1">$1.</span><span>$2</span></div>'
        );

        // Process morning/evening routines - handle specific patterns like "**Morning Routine:**"
        formattedText = formattedText.replace(
            /\*\*(Morning|Evening) Routine:\*\*/g,
            '<h3 class="text-lg font-bold text-pink-400 mt-4 mb-2">$1 Routine:</h3>'
        );

        // Process steps like **Step 1**, **Step 2**
        formattedText = formattedText.replace(
            /\*\*(Step \d+):\*\*/g,
            '<div class="font-bold text-purple-400 mt-3 mb-1">$1:</div>'
        );

        // Convert newlines to <br> but avoid converting inside list items we already processed
        formattedText = formattedText.replace(
            /\n((?!<div class="flex))/g,
            "<br>$1"
        );

        return formattedText;
    };

    const startChat = async () => {
        setLoading(true);
        try {
            const quiz_data = { ...formData };
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
        setChatHistory((prev) => [...prev, { user: input, bot: "..." }]);

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

    const renderOptionPills = (options, selectedValue, onChange) => {
        return (
            <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-thin">
                {Object.entries(options).map(([label, value]) => (
                    <button
                        key={value}
                        onClick={() => onChange(value)}
                        className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                            selectedValue === value
                                ? "bg-pink-500 text-white"
                                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>
        );
    };

    const renderMultiSelectPills = (options, key) => {
        return (
            <div className="flex flex-wrap gap-2">
                {Object.entries(options).map(([label, value]) => (
                    <button
                        key={value}
                        onClick={() => toggleMultiSelect(key, value)}
                        className={`px-4 py-2 rounded-full transition-all ${
                            isSelected(key, value)
                                ? "bg-pink-500 text-white"
                                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>
        );
    };

    const FormCard = ({ icon, title, children }) => (
        <div className="bg-zinc-800/60 backdrop-blur-md p-5 rounded-xl border border-zinc-700/50 shadow-lg hover:shadow-pink-500/5 transition-all">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-pink-500/20 to-purple-600/20 p-2 rounded-lg">
                    <span className="text-xl">{icon}</span>
                </div>
                <h3 className="font-medium text-zinc-200">{title}</h3>
            </div>
            <div>{children}</div>
        </div>
    );

    return (
        <div className="h-[90vh] flex flex-col bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white p-3 overflow-hidden">
            <div className="max-w-6xl mx-auto w-full h-full flex flex-col justify-center">
                <div className="text-center mb-6">
                    <div className="inline-block bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-500 rounded-2xl mb-3 shadow-2xl shadow-pink-500/20 w-full max-w-lg mx-auto py-3">
                        <div className="flex items-center justify-center gap-3">
                            <img
                                src="/favicon.png"
                                alt="DermaGPT Logo"
                                className="w-12 h-12 object-contain rounded-xl"
                            />
                            <div className="text-left">
                                <h1 className="text-3xl font-extrabold">
                                    <span className="text-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.1)] hover:text-fuchsia-500 transition-all duration-300">
                                        DermaGPT
                                    </span>
                                </h1>
                                <p className="text-sm font-light italic text-zinc-300 bg-gradient-to-r from-purple-300 to-indigo-400 bg-clip-text text-transparent">
                                    Your Personal Skincare Assistant
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {!sessionId ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-pink-500/30 scrollbar-track-zinc-800/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                                <FormCard
                                    icon="📷"
                                    title="Your Photo URL (optional)"
                                >
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="photo_url"
                                            placeholder="Paste image link..."
                                            value={formData.photo_url}
                                            onChange={handleChange}
                                            className="w-full p-3 bg-zinc-900/70 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder:text-zinc-500 pl-10"
                                        />
                                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500">
                                            🔗
                                        </div>
                                    </div>
                                </FormCard>

                                <FormCard icon="🎂" title="How old are you?">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="age"
                                            min="10"
                                            max="80"
                                            value={formData.age}
                                            onChange={handleChange}
                                            className="w-full p-3 bg-zinc-900/70 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        />
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 text-sm">
                                            years
                                        </div>
                                    </div>
                                </FormCard>

                                <FormCard
                                    icon="⚧️"
                                    title="What is your gender?"
                                >
                                    {renderOptionPills(
                                        options.gender,
                                        formData.gender,
                                        (value) =>
                                            handleOptionSelect(
                                                "gender",
                                                "gender",
                                                value
                                            )
                                    )}
                                </FormCard>

                                <FormCard icon="💉" title="Have you had Botox?">
                                    {renderOptionPills(
                                        options.botox,
                                        formData.has_botox,
                                        (value) =>
                                            handleOptionSelect(
                                                "has_botox",
                                                "botox",
                                                value
                                            )
                                    )}
                                </FormCard>

                                <FormCard
                                    icon="🧬"
                                    title="What is your skin type?"
                                >
                                    {renderOptionPills(
                                        options.skinType,
                                        formData.skin_type,
                                        (value) =>
                                            handleOptionSelect(
                                                "skin_type",
                                                "skinType",
                                                value
                                            )
                                    )}
                                </FormCard>

                                <FormCard
                                    icon="💡"
                                    title="What are your main goals?"
                                >
                                    {renderMultiSelectPills(
                                        options.mainGoals,
                                        "main_goals"
                                    )}
                                </FormCard>

                                <FormCard
                                    icon="💧"
                                    title="How much water do you drink daily?"
                                >
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="0"
                                            max="15"
                                            value={formData.daily_water}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    daily_water: parseInt(
                                                        e.target.value
                                                    ),
                                                })
                                            }
                                            className="w-full accent-pink-500 h-2 bg-zinc-700 rounded-lg appearance-none"
                                        />
                                        <span className="bg-zinc-900 px-3 py-1 rounded-lg min-w-[3rem] text-center">
                                            {formData.daily_water} L
                                        </span>
                                    </div>
                                </FormCard>

                                <FormCard
                                    icon="🛏️"
                                    title="How many hours do you sleep?"
                                >
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="0"
                                            max="12"
                                            value={formData.sleep_duration}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    sleep_duration: parseInt(
                                                        e.target.value
                                                    ),
                                                })
                                            }
                                            className="w-full accent-pink-500 h-2 bg-zinc-700 rounded-lg appearance-none"
                                        />
                                        <span className="bg-zinc-900 px-3 py-1 rounded-lg min-w-[3rem] text-center">
                                            {formData.sleep_duration} hrs
                                        </span>
                                    </div>
                                </FormCard>

                                <FormCard
                                    icon="📍"
                                    title="What are your focused face areas?"
                                >
                                    <div className="overflow-x-auto">
                                        {renderMultiSelectPills(
                                            options.faceAreas,
                                            "focused_face_area"
                                        )}
                                    </div>
                                </FormCard>

                                <FormCard
                                    icon="⚠️"
                                    title="Do you have any skin sensitivities?"
                                >
                                    <div className="overflow-x-auto">
                                        {renderMultiSelectPills(
                                            options.sensitivities,
                                            "skin_sensitivities"
                                        )}
                                    </div>
                                </FormCard>

                                <FormCard
                                    icon="🏃"
                                    title="How much time do you spend exercising?"
                                >
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="0"
                                            max="120"
                                            value={
                                                formData.daily_exercise_duration
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    daily_exercise_duration:
                                                        parseInt(
                                                            e.target.value
                                                        ),
                                                })
                                            }
                                            className="w-full accent-pink-500 h-2 bg-zinc-700 rounded-lg appearance-none"
                                        />
                                        <span className="bg-zinc-900 px-3 py-1 rounded-lg min-w-[3rem] text-center">
                                            {formData.daily_exercise_duration}{" "}
                                            min
                                        </span>
                                    </div>
                                </FormCard>

                                <FormCard
                                    icon="📅"
                                    title="How many days do you exercise per week?"
                                >
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="0"
                                            max="7"
                                            value={
                                                formData.daily_exercise_days_per_week
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    daily_exercise_days_per_week:
                                                        parseInt(
                                                            e.target.value
                                                        ),
                                                })
                                            }
                                            className="w-full accent-pink-500 h-2 bg-zinc-700 rounded-lg appearance-none"
                                        />
                                        <span className="bg-zinc-900 px-3 py-1 rounded-lg min-w-[3rem] text-center">
                                            {
                                                formData.daily_exercise_days_per_week
                                            }{" "}
                                            days
                                        </span>
                                    </div>
                                </FormCard>
                            </div>
                        </div>
                        <div className="mt-2 mb-1">
                            <button
                                onClick={startChat}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition duration-300 shadow-lg hover:shadow-pink-500/30 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <svg
                                            className="animate-spin h-5 w-5"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    <>Start Chatting! 💬</>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                        <div className="flex-1 bg-gradient-to-br from-zinc-900/95 to-zinc-800/95 backdrop-blur-md p-4 rounded-2xl shadow-inner border border-zinc-700/50 overflow-y-auto scrollbar-thin scrollbar-thumb-pink-500/30 scrollbar-track-zinc-800/30">
                            {chatHistory.length === 0 ? (
                                <div className="h-full flex flex-col justify-center items-center py-8 px-4">
                                    <div className="bg-gradient-to-br from-pink-400/20 via-purple-500/20 to-indigo-500/20 p-4 rounded-xl mb-5 max-w-md w-full mx-auto">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src="/favicon.png"
                                                alt="DermaGPT Logo"
                                                className="w-10 h-10 object-contain rounded-lg"
                                            />
                                            <div>
                                                <h3 className="text-xl font-semibold text-white">
                                                    Your Personal Consultation
                                                </h3>
                                                <p className="text-zinc-400 text-sm">
                                                    Based on your skincare
                                                    profile, I'm ready to
                                                    provide personalized
                                                    recommendations.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto w-full">
                                        <button
                                            onClick={() => {
                                                setInput(
                                                    "What are the best products for my skin type?"
                                                );
                                                sendMessage();
                                            }}
                                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-3 rounded-xl transition-all text-left"
                                        >
                                            What are the best products for my
                                            skin type?
                                        </button>
                                        <button
                                            onClick={() => {
                                                setInput(
                                                    "How can I improve my skincare routine?"
                                                );
                                                sendMessage();
                                            }}
                                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-3 rounded-xl transition-all text-left"
                                        >
                                            How can I improve my skincare
                                            routine?
                                        </button>
                                        <button
                                            onClick={() => {
                                                setInput(
                                                    "What can help with my skin concerns?"
                                                );
                                                sendMessage();
                                            }}
                                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-3 rounded-xl transition-all text-left"
                                        >
                                            What can help with my skin concerns?
                                        </button>
                                        <button
                                            onClick={() => {
                                                setInput(
                                                    "Recommend a morning and evening routine"
                                                );
                                                sendMessage();
                                            }}
                                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-3 rounded-xl transition-all text-left"
                                        >
                                            Recommend a morning and evening
                                            routine
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 px-1">
                                    {chatHistory.map((chat, i) => (
                                        <div key={i} className="animate-fadeIn">
                                            {/* Kullanıcı mesajı - ChatGPT benzeri düzenleme */}
                                            <div className="mb-6">
                                                <div className="flex items-center mb-1.5">
                                                    <div className="shrink-0 h-8 w-8 bg-pink-500/20 flex items-center justify-center rounded-full shadow-md mr-2">
                                                        <span className="text-pink-400">
                                                            👤
                                                        </span>
                                                    </div>
                                                    <div className="text-sm font-medium text-zinc-400">
                                                        You
                                                    </div>
                                                </div>
                                                <div className="pl-10 pr-2">
                                                    <div className="bg-zinc-800/70 backdrop-blur-sm px-4 py-3 rounded-xl border border-zinc-700/20">
                                                        <p className="text-white text-base">
                                                            {chat.user}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bot mesajı - ChatGPT gibi düzenle */}
                                            <div className="mb-6">
                                                <div className="flex items-center mb-1.5">
                                                    <div className="shrink-0 h-8 w-8 bg-purple-500/20 flex items-center justify-center rounded-full shadow-md mr-2 overflow-hidden">
                                                        <img
                                                            src="/favicon.png"
                                                            alt="DermaGPT"
                                                            className="w-6 h-6 object-contain"
                                                        />
                                                    </div>
                                                    <div className="text-sm font-medium text-zinc-400">
                                                        DermaGPT
                                                    </div>
                                                </div>
                                                <div className="pl-10 pr-2">
                                                    <div className="bg-gradient-to-r from-pink-500/5 to-purple-600/5 backdrop-blur-sm px-4 py-3 rounded-xl border border-zinc-700/20 bot-message">
                                                        {chat.bot === "..." ? (
                                                            <div className="flex items-center space-x-2">
                                                                <div
                                                                    className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                                                                    style={{
                                                                        animationDelay:
                                                                            "0ms",
                                                                    }}
                                                                ></div>
                                                                <div
                                                                    className="w-2 h-2 rounded-full bg-pink-400 animate-bounce"
                                                                    style={{
                                                                        animationDelay:
                                                                            "150ms",
                                                                    }}
                                                                ></div>
                                                                <div
                                                                    className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                                                                    style={{
                                                                        animationDelay:
                                                                            "300ms",
                                                                    }}
                                                                ></div>
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className="prose prose-lg prose-invert max-w-none prose-headings:text-pink-300 prose-strong:text-white prose-strong:font-semibold prose-p:text-zinc-200 prose-ul:text-zinc-200 prose-li:my-0.5 prose-li:py-0.5 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: formatBotMessage(
                                                                        chat.bot
                                                                    ),
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500/5 to-transparent blur-xl h-[1px] w-full"></div>
                                <div className="relative flex gap-2">
                                    <div className="relative flex-1 group">
                                        <input
                                            value={input}
                                            onChange={(e) =>
                                                setInput(e.target.value)
                                            }
                                            onKeyPress={(e) =>
                                                e.key === "Enter" &&
                                                sendMessage()
                                            }
                                            placeholder="Ask about your skincare routine..."
                                            className="w-full p-4 bg-zinc-900/90 border border-zinc-700 group-focus-within:border-pink-500/50 rounded-lg focus:outline-none ring-2 ring-transparent focus:ring-pink-500/20 pl-10 transition-all duration-300"
                                        />
                                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500">
                                            💬
                                        </div>
                                    </div>
                                    <button
                                        onClick={sendMessage}
                                        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-5 py-2 rounded-lg font-semibold transition-all shadow-lg hover:shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        disabled={!input.trim()}
                                    >
                                        <span>Send</span>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <button
                                    onClick={resetSession}
                                    className="text-sm text-zinc-400 hover:text-pink-400 transition-colors flex items-center gap-1 group"
                                >
                                    <div className="p-1 rounded-full bg-zinc-800 group-hover:bg-pink-500/10 transition-all">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                            />
                                        </svg>
                                    </div>
                                    <span>Start Over</span>
                                </button>
                                <div className="text-xs bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent font-medium">
                                    Developed by Mert Çetin
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
