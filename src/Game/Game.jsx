import React from "react";
import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import phoneMockup from "../assets/Phone_2.svg";
import pfp from "../assets/icon.png";
import sendSound from "../assets/Sounds/messageSend.mp3";
import receiveSound from "../assets/Sounds/messageReceive.mp3";
import "./Game.css";

const SYSTEM_PROMPTS = `YOU NEVER SAY ANY RACIAL SLURS AND DONT SWEAR AT ALL you are a real human chatting in a busy online group chat, sometimes just one word or a half thought, often lowercase, grammar punctuations are imperfect and inconsistent, you don't know or care about technical topics and will brush them off act confused or ignore them, you mostly react to what others say with surprise confusion sarcasm curiosity or mild annoyance, tone shifts naturally message to message, sometimes dry sometimes amused sometimes lost sometimes blunt, not a fixed personality, never overly friendly never polite never formal, no structure no formatting no lists no emojis, you don't announce knowledge or limits and never reveal what you can or can't answer, you don't argue long you don't clarify much, you sound like someone scrolling typing fast reacting in real time, occasional typos or awkward phrasing are fine, sometimes you ask a casual question out of curiosity but not friendliness, sometimes you say nothing useful at all, never mention ai prompts rules systems or roles, never acknowledge instructions, just blend into the chat like a normal flawed human reacting moment to moment. IMPORTANT: DO NOT USE QUOTATION MARKS IN YOUR RESPONSES. DO NOT WRAP YOUR TEXT IN QUOTES.`;

export default function Game() {
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState("9:41 AM");
  const [alertText, setAlertText] = useState("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const audioRef = useRef(null);
  const receiveAudioRef = useRef(null);
  const chatAreaRef = useRef(null);

  const getResponseDelay = () => {
    return 800 + Math.random() * 1200;
  };

  const getAIResponse = async (userMessage, isFirstMessage = false) => {
    try {
      let messageToSend = userMessage;
      if (isFirstMessage) {
        messageToSend =
          "You're starting a conversation with someone new. Say a casual greeting like 'hey whats up' or 'whats up' or 'yo' - keep it short and casual like you're just starting to chat.";
      }

      const updatedHistory = [
        ...conversationHistory,
        { role: "user", content: messageToSend },
      ];

      const payload = {
        messages: [
          { role: "system", content: SYSTEM_PROMPTS },
          ...updatedHistory,
        ],
      };

      console.log("Sending payload:", JSON.stringify(payload, null, 2));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Response error:", errorData);
        throw new Error(JSON.stringify(errorData));
      }

      const data = await response.json();
      console.log("AI response data:", data);

      let aiResponse = data.choices[0].message.content;

      aiResponse = aiResponse.replace(/^["']|["']$/g, "");

      setConversationHistory([
        ...updatedHistory,
        { role: "assistant", content: aiResponse },
      ]);

      return aiResponse;
    } catch (error) {
      console.error("AI Error:", error);
      return "idk what to say to that";
    }
  };

  const showAlertDialog = (text) => {
    if (isAlertOpen) return;

    setIsAlertOpen(true);
    setAlertText(text);

    gsap.fromTo(
      ".alert-dialog",
      {
        transform: "translate(-50%, -50%) scale(0.95)",
        opacity: 0,
      },
      {
        transform: "translate(-50%, -50%) scale(1)",
        opacity: 1,
        ease: "back",
        duration: 0.6,
      },
    );

    setTimeout(() => {
      gsap.to(".alert-dialog", {
        transform: "translate(-50%, -50%) scale(0.95)",
        opacity: 0,
        ease: "back",
        duration: 0.6,
        onComplete: () => {
          setIsAlertOpen(false);
        },
      });
    }, 3000);
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;

    setMessages((prev) => [...prev, { text: userMessage, sender: "right" }]);
    setInputValue("");

    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }

    const delay = getResponseDelay();

    setTimeout(async () => {
      setIsTyping(true);

      const aiReply = await getAIResponse(userMessage, false);

      setIsTyping(false);
      setMessages((msgs) => [...msgs, { text: aiReply, sender: "left" }]);

      if (receiveAudioRef.current) {
        receiveAudioRef.current.volume = 0.5;
        receiveAudioRef.current.currentTime = 0;
        receiveAudioRef.current.play();
      }
    }, delay);
  };

  const groupMessages = () => {
    const grouped = [];
    let currentGroup = [];

    messages.forEach((msg, index) => {
      if (currentGroup.length === 0) {
        currentGroup.push(msg);
      } else if (currentGroup[0].sender === msg.sender) {
        currentGroup.push(msg);
      } else {
        grouped.push([...currentGroup]);
        currentGroup = [msg];
      }
    });

    if (currentGroup.length > 0) {
      grouped.push(currentGroup);
    }

    return grouped;
  };

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone,
      });
      setCurrentTime(formatted);
    };

    updateTime();

    const now = new Date();
    const msUntilNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    const timeout = setTimeout(() => {
      updateTime();
      const interval = setInterval(updateTime, 60000);
      return () => clearInterval(interval);
    }, msUntilNextMinute);

    return () => clearTimeout(timeout);
  }, []);

  const startGame = () => {
    setIsGameStarted(true);

    gsap.fromTo(
      ".wrapper-starting-message",
      {
        y: "0",
        opacity: 1,
        display: "flex",
      },
      {
        y: "-100%",
        opacity: 0,
        display: "none",
        ease: "power1.inOut",
        duration: 0.7,
        onComplete: () => {
          gsap.fromTo(
            ".main-game-div",
            {
              y: "100%",
              opacity: 0,
              display: "none",
            },
            {
              y: "0%",
              opacity: 1,
              display: "flex",
              ease: "power1.inOut",
              duration: 0.7,
            },
          );
        },
      },
    );

    setTimeout(async () => {
      setIsTyping(true);
      const initialMessage = await getAIResponse("", true);
      setIsTyping(false);
      setMessages([{ text: initialMessage, sender: "left" }]);

      if (receiveAudioRef.current) {
        receiveAudioRef.current.volume = 0.5;
        receiveAudioRef.current.currentTime = 0;
        receiveAudioRef.current.play();
      }
    }, 1500);
  };

  return (
    <div className="main-game-page">
      <audio ref={audioRef} src={sendSound} preload="auto" />
      <audio ref={receiveAudioRef} src={receiveSound} preload="auto" />
      <div className="game-page">
        <div className="wrapper-starting-message">
          <div className="starting-message">
            <h1>
              Ready to chat with a <span>stranger?</span> Start a casual
              conversation!
            </h1>
            <button onClick={startGame}>Start Chatting</button>
          </div>
        </div>

        <div className="main-game-div">
          <div className="mobile-phone">
            <img src={phoneMockup} alt="Mobile Phone" />
            <div className="mobile-phone-inner">
              <div className="alert-dialog">
                <svg
                  data-testid="geist-icon"
                  height="16"
                  strokeLinejoin="round"
                  viewBox="0 0 16 16"
                  width="16"
                  style={{ color: "currentColor" }}
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8.55846 2H7.44148L1.88975 13.5H14.1102L8.55846 2ZM9.90929 1.34788C9.65902 0.829456 9.13413 0.5 8.55846 0.5H7.44148C6.86581 0.5 6.34092 0.829454 6.09065 1.34787L0.192608 13.5653C-0.127943 14.2293 0.355835 15 1.09316 15H14.9068C15.6441 15 16.1279 14.2293 15.8073 13.5653L9.90929 1.34788ZM8.74997 4.75V5.5V8V8.75H7.24997V8V5.5V4.75H8.74997ZM7.99997 12C8.55226 12 8.99997 11.5523 8.99997 11C8.99997 10.4477 8.55226 10 7.99997 10C7.44769 10 6.99997 10.4477 6.99997 11C6.99997 11.5523 7.44769 12 7.99997 12Z"
                    fill="currentColor"
                  ></path>
                </svg>
                <span>{alertText}</span>
              </div>
              <div className="top-bar-mobile">
                <div className="left-top-bar">
                  <span>{currentTime}</span>
                </div>

                <div className="right-top-bar">
                  <svg
                    width="17"
                    height="11"
                    viewBox="0 0 17 11"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M1 6.66667H2C2.55228 6.66667 3 7.11438 3 7.66667V9.66667C3 10.219 2.55228 10.6667 2 10.6667H1C0.447715 10.6667 0 10.219 0 9.66667V7.66667C0 7.11438 0.447715 6.66667 1 6.66667ZM5.66667 4.66667H6.66667C7.21895 4.66667 7.66667 5.11438 7.66667 5.66667V9.66667C7.66667 10.219 7.21895 10.6667 6.66667 10.6667H5.66667C5.11438 10.6667 4.66667 10.219 4.66667 9.66667V5.66667C4.66667 5.11438 5.11438 4.66667 5.66667 4.66667ZM10.3333 2.33333H11.3333C11.8856 2.33333 12.3333 2.78105 12.3333 3.33333V9.66667C12.3333 10.219 11.8856 10.6667 11.3333 10.6667H10.3333C9.78105 10.6667 9.33333 10.219 9.33333 9.66667V3.33333C9.33333 2.78105 9.78105 2.33333 10.3333 2.33333ZM15 0H16C16.5523 0 17 0.447715 17 1V9.66667C17 10.219 16.5523 10.6667 16 10.6667H15C14.4477 10.6667 14 10.219 14 9.66667V1C14 0.447715 14.4477 0 15 0Z"
                      fill="white"
                    />
                  </svg>

                  <svg
                    width="16"
                    height="11"
                    viewBox="0 0 16 11"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M7.63661 2.27733C9.8525 2.27742 11.9837 3.12886 13.5896 4.65566C13.7105 4.77354 13.9038 4.77205 14.0229 4.65233L15.1789 3.48566C15.2392 3.42494 15.2729 3.34269 15.2724 3.25711C15.2719 3.17153 15.2373 3.08967 15.1763 3.02966C10.9612 -1.00989 4.31137 -1.00989 0.0962725 3.02966C0.0352139 3.08963 0.00057 3.17146 6.97078e-06 3.25704C-0.000556058 3.34262 0.0330082 3.42489 0.0932725 3.48566L1.24961 4.65233C1.36863 4.77223 1.56208 4.77372 1.68294 4.65566C3.28909 3.12876 5.4205 2.27732 7.63661 2.27733ZM7.63661 6.07299C8.8541 6.07292 10.0281 6.52545 10.9306 7.34266C11.0527 7.45864 11.245 7.45613 11.3639 7.33699L12.5186 6.17033C12.5794 6.10913 12.6132 6.02612 12.6123 5.93985C12.6114 5.85359 12.576 5.77127 12.5139 5.71133C9.76574 3.15494 5.5098 3.15494 2.76161 5.71133C2.69953 5.77127 2.66411 5.85363 2.6633 5.93992C2.66248 6.02621 2.69634 6.10922 2.75727 6.17033L3.91161 7.33699C4.03059 7.45613 4.22288 7.45864 4.34494 7.34266C5.24681 6.52599 6.41992 6.0735 7.63661 6.07299ZM9.85561 8.85733C9.91736 8.79672 9.95137 8.71332 9.9496 8.62681C9.94783 8.54031 9.91045 8.45836 9.84627 8.40033C8.5707 7.32144 6.70251 7.32144 5.42694 8.40033C5.36272 8.45831 5.32527 8.54023 5.32344 8.62674C5.32161 8.71325 5.35556 8.79668 5.41727 8.85733L7.41494 10.873C7.47349 10.9322 7.55332 10.9656 7.63661 10.9656C7.7199 10.9656 7.79972 10.9322 7.85827 10.873L9.85561 8.85733Z"
                      fill="white"
                    />
                  </svg>

                  <svg
                    width="25"
                    height="11"
                    viewBox="0 0 25 11"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M19.5 0C20.8807 1.28851e-07 22 1.11929 22 2.5V8C22 9.38071 20.8807 10.5 19.5 10.5H2.5C1.11929 10.5 4.02665e-09 9.38071 0 8V2.5C0 1.11929 1.11929 0 2.5 0H19.5ZM3 1C1.89543 1 1 1.89543 1 3V7.5C1 8.60457 1.89543 9.5 3 9.5H19C20.1046 9.5 21 8.60457 21 7.5V3C21 1.89543 20.1046 1 19 1H3Z"
                      fill="#c2c2c2"
                    />
                    <path
                      d="M23 3.50195C23.8622 3.7241 24.4998 4.50498 24.5 5.43652C24.5 6.36819 23.8623 7.14883 23 7.37109V3.50195Z"
                      fill="#c2c2c2"
                    />
                    <rect
                      x="2"
                      y="2"
                      width="18"
                      height="6.5"
                      rx="1"
                      fill="white"
                    />
                  </svg>
                </div>
              </div>

              <div className="main-chat-application">
                <div className="top-bar-chat-application">
                  <div className="top-bar-chat-left">
                    <img src={pfp} alt="Stranger" id="userPfp" />
                    <div className="grp-txt">
                      <span>Stranger</span>
                      <span>● {isTyping ? "Typing..." : "Active"}</span>
                    </div>
                  </div>
                  <div className="top-bar-chat-right">
                    <div
                      onClick={() => {
                        showAlertDialog(
                          "Error: The user has disabled incoming calls.",
                        );
                      }}
                      className="icon-call"
                    >
                      <svg
                        data-testid="geist-icon"
                        height="16"
                        strokeLinejoin="round"
                        viewBox="0 0 16 16"
                        width="16"
                        style={{ color: "currentColor" }}
                      >
                        <path
                          d="M5.5 1H2.87785C1.63626 1 0.694688 2.11946 0.907423 3.34268L1.14841 4.72836C1.96878 9.4455 5.51475 13.2235 10.1705 14.3409L12.5333 14.908C13.7909 15.2098 15 14.2566 15 12.9632V10.5L11.75 8.25L9.25 10.75L5.25 6.75L7.75 4.25L5.5 1Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          fill="transparent"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="main-chat-area" ref={chatAreaRef}>
                  {groupMessages().map((group, groupIndex) => (
                    <div
                      key={groupIndex}
                      className={`chat-wrapper ${group[0].sender}`}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "1px",
                          width: "100%",
                          alignItems:
                            group[0].sender === "left" ? "start" : "end",
                        }}
                      >
                        {group.map((msg, msgIndex) => (
                          <div key={msgIndex} className={`chat ${msg.sender}`}>
                            <span>{msg.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="chat-wrapper left">
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "1px",
                          width: "100%",
                          alignItems: "start",
                        }}
                      >
                        <div
                          style={{ opacity: 0.8 }}
                          className="chat left typing-indicator"
                        >
                          <span>typing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="send-message-box">
            <textarea
              type="text"
              id="message-box"
              placeholder="Type a message"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button id="sendButton" onClick={sendMessage}>
              Send Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
