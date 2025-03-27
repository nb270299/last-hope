import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { sendMessageToAI } from "./aiTherapist";

const App = () => {
  const [lastCigarette, setLastCigarette] = useState(localStorage.getItem("lastCigarette") || null);
  const [moneySaved, setMoneySaved] = useState(0);
  const [timeSinceQuit, setTimeSinceQuit] = useState("");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [username, setUsername] = useState(() => {return localStorage.getItem("username") || ""; });
  const [nameInput, setNameInput] = useState("");
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const [badge, setBadge] = useState("");
  const [nextBadge, setNextBadge] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [activeTab, setActiveTab] = useState("tracker");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (lastCigarette) {
      const interval = setInterval(() => {
        const now = new Date();
        const last = new Date(lastCigarette);
        const secondsPassed = Math.floor((now - last) / 1000);
        const costPerDay = 10;
        const costPerSecond = costPerDay / (24 * 60 * 60);
        const saved = secondsPassed * costPerSecond;
        setMoneySaved(saved.toFixed(2));

        const days = Math.floor(secondsPassed / (60 * 60 * 24));
        const hours = Math.floor((secondsPassed % (60 * 60 * 24)) / 3600);
        const minutes = Math.floor((secondsPassed % 3600) / 60);
        setTimeSinceQuit(`${days}d ${hours}h ${minutes}m`);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lastCigarette]);

  useEffect(() => {
    if (lastCigarette) {
      const now = new Date();
      const last = new Date(lastCigarette);
      const diffInMs = now - last;
      const diffInHours = diffInMs / (1000 * 60 * 60);
      const diffInDays = diffInHours / 24;

      let badge = "";
      let next = "";
      let progress = 0;

      if (diffInDays >= 365) {
        badge = "1 Year Smoke-Free 🟣";
        next = "You're at the highest badge!";
        progress = 100;
      } else if (diffInDays >= 30) {
        badge = "1 Month Smoke-Free 🔵";
        next = "1 Year 🟣";
        progress = (diffInDays / 365) * 100;
      } else if (diffInDays >= 7) {
        badge = "1 Week Smoke-Free 🟢";
        next = "1 Month 🔵";
        progress = (diffInDays / 30) * 100;
      } else if (diffInDays >= 1) {
        badge = "1 Day Smoke-Free 🟡";
        next = "1 Week 🟢";
        progress = (diffInDays / 7) * 100;
      } else if (diffInHours >= 1) {
        badge = "1 Hour Smoke-Free 🟠";
        next = "1 Day 🟡";
        progress = (diffInHours / 24) * 100;
      } else {
        badge = "";
        next = "1 Hour 🟠";
        progress = diffInHours * 100;
      }

      setBadge(badge);
      setNextBadge(next);
      setProgressPercent(Math.min(progress, 100).toFixed(0));
    } else {
      setBadge("");
      setNextBadge("");
      setProgressPercent(0);
    }
  }, [lastCigarette]);

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => doc.data()));
    });
    return () => unsubscribe();
  }, []);

  const handleStart = () => {
    const now = new Date().toISOString();
    setLastCigarette(now);
    localStorage.setItem("lastCigarette", now);
  };

  const handleReset = () => {
    setLastCigarette(null);
    setMoneySaved(0);
    localStorage.removeItem("lastCigarette");
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "" || username.trim() === "") return;

    await addDoc(collection(db, "messages"), {
      text: newMessage,
      username,
      timestamp: serverTimestamp(),
    });

    setNewMessage("");
  };

  const sendToAI = async (e) => {
    e.preventDefault();
    if (aiInput.trim() === "") return;

    const userMessage = { role: "user", content: aiInput };
    setAiMessages((prev) => [...prev, userMessage]);
    setAiInput("");
    setAiThinking(true);

    const aiReply = await sendMessageToAI(aiInput);
    const botMessage = { role: "assistant", content: aiReply };
    setAiMessages((prev) => [...prev, botMessage]);
    setAiThinking(false);
  };

  return (
    <div className={`${darkMode ? "dark" : ""} min-h-screen flex flex-col items-center px-4 py-8 bg-blue-50 dark:bg-gray-900 text-center pb-24`}>
      {!username ? (
        <div className="mb-6 w-full max-w-md">
          <h2 className="text-lg font-semibold mb-2">Enter your name to continue</h2>
          <input
            type="text"
            placeholder="Your name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="w-full px-3 py-2 border rounded mb-2"
          />
          <button
            onClick={() => {
              if (nameInput.trim() !== "") {
                const trimmed = nameInput.trim();
                setUsername(trimmed);
                localStorage.setItem("username", trimmed);
              }
            }}            
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Continue
          </button>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold text-blue-800 mb-8">
            Last Hope: Quit Smoking Tracker
          </h1>

          <div className="grid grid-cols-1 gap-6 w-full max-w-2xl">
            {/* Tracker Tab */}
            {activeTab === "tracker" && (
              <div className="bg-white dark:bg-gray-800 text-black dark:text-white p-4 rounded shadow">
                {lastCigarette ? (
                  <>
                    <p>Last cigarette: {new Date(lastCigarette).toLocaleString()}</p>
                    <p>Money saved: ${moneySaved}</p>
                    <p>Time since quitting: {timeSinceQuit}</p>
                    {badge && <p className="text-lg font-semibold text-amber-700 mt-2">{badge}</p>}
                    {nextBadge && (
                      <div className="mt-2">
                        <p className="text-sm">Progress to next badge: {nextBadge}</p>
                        <div className="bg-gray-300 h-4 rounded-full mt-1">
                          <div
                            className="bg-green-500 h-4 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{progressPercent}%</p>
                      </div>
                    )}
                    <button
                      onClick={handleReset}
                      className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Reset
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleStart}
                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    I Quit Smoking Now
                  </button>
                )}
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === "chat" && (
              <div className="bg-white dark:bg-gray-800 text-black dark:text-white p-4 rounded shadow">
                <h2 className="text-xl font-bold mb-2">Chat Room</h2>
                <div className="max-h-60 overflow-y-auto mb-4">
                  {messages.map((msg, index) => {
                    const time = msg.timestamp?.toDate?.().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }) || "⏳";
                    return (
                      <p key={index} className="text-left text-sm mb-1">
                        <span className="font-bold text-blue-700">{msg.username || "Anon"}:</span> {msg.text}
                        <span className="text-xs text-gray-500 ml-2">({time})</span>
                      </p>
                    );
                  })}
                </div>
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border rounded"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}

            {/* AI Therapist Tab */}
            {activeTab === "ai" && (
              <div className="bg-white dark:bg-gray-800 text-black dark:text-white p-4 rounded shadow">
                <h2 className="text-xl font-bold mb-2">AI Therapist</h2>
                <div className="max-h-60 overflow-y-auto mb-4">
                  {aiMessages.map((msg, index) => (
                    <p
                      key={index}
                      className={`text-left text-sm mb-1 ${msg.role === "assistant" ? "text-blue-700" : "text-black"}`}
                    >
                      <strong>{msg.role === "assistant" ? "AI:" : "You:"}</strong> {msg.content}
                    </p>
                  ))}
                  {aiThinking && <p className="italic text-gray-500">AI is typing...</p>}
                </div>
                <form onSubmit={sendToAI} className="flex gap-2">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Ask the AI for advice..."
                    className="flex-1 px-3 py-2 border rounded"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="bg-white p-4 rounded shadow text-left">
                <h2 className="text-xl font-bold mb-2">Profile</h2>
                <p><strong>Username:</strong> {username}</p>
                <p><strong>Time Smoke-Free:</strong> {timeSinceQuit}</p>
                <p><strong>Money Saved:</strong> ${moneySaved}</p>
                <p><strong>Badge:</strong> {badge || "None yet"}</p>

                <hr className="my-4" />
<h3 className="text-lg font-semibold mb-2">Settings</h3>

<div className="flex justify-between items-center mb-3">
  <span>Dark Mode</span>
  <button
    onClick={() => setDarkMode(!darkMode)}
    className={`px-3 py-1 rounded text-white ${
      darkMode ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-700 hover:bg-gray-800"
    }`}
  >
    {darkMode ? "On" : "Off"}
  </button>
</div>

<div className="flex justify-between items-center">
  <span>Logout</span>
  <button
    onClick={() => {
      setUsername("");
      setNameInput("");
      setLastCigarette(null);
      setMoneySaved(0);
      localStorage.removeItem("lastCigarette");
      localStorage.removeItem("username");
    }}
    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
  >
    Log Out
  </button>
</div>
              </div>
              
            )}
          </div>

          {/* Navigation Bar */}
          <div className="fixed bottom-0 left-0 w-full bg-white border-t shadow-inner flex justify-around items-center py-3 px-4 text-sm sm:text-base z-50">
            <button onClick={() => setActiveTab("tracker")} className={`flex flex-col items-center ${activeTab === "tracker" ? "text-yellow-600 font-semibold" : "text-gray-500"}`}>⏱<span className="text-xs mt-1">Tracker</span></button>
            <button onClick={() => setActiveTab("chat")} className={`flex flex-col items-center ${activeTab === "chat" ? "text-blue-600 font-semibold" : "text-gray-500"}`}>🧑‍🤝‍🧑<span className="text-xs mt-1">Chat</span></button>
            <button onClick={() => setActiveTab("ai")} className={`flex flex-col items-center ${activeTab === "ai" ? "text-purple-600 font-semibold" : "text-gray-500"}`}>🤖<span className="text-xs mt-1">Therapist</span></button>
            <button onClick={() => setActiveTab("profile")} className={`flex flex-col items-center ${activeTab === "profile" ? "text-green-600 font-semibold" : "text-gray-500"}`}>👤<span className="text-xs mt-1">Profile</span></button>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
