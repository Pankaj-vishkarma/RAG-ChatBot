import { useState, useContext, useEffect, useRef, useCallback } from "react";
import { ChatContext } from "../../context/ChatContext";
import { createConversation } from "../../api/conversation.api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { motion } from "framer-motion";

/* -------------------- Code Block Component -------------------- */
const CodeBlock = ({ inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const codeText = String(children).replace(/\n$/, "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  if (inline) {
    return (
      <code className="bg-black/30 px-1 py-0.5 rounded text-sm">
        {children}
      </code>
    );
  }

  return (
    <div className="relative group not-prose my-3">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 text-xs bg-black/60 hover:bg-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>

      <pre className="bg-black/70 p-4 rounded-xl overflow-x-auto text-sm border border-white/10">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
};

/* -------------------- Chat Window -------------------- */
const ChatWindow = () => {
  const {
    messages,
    loading,
    sendMessage,
    stopGeneration,
    regenerateLastMessage,
    activeConversationId,
    uploadDocument,
    setActiveConversationId,
  } = useContext(ChatContext);

  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  const textareaRef = useRef(null);

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  };

  /* -------------------- Auto Scroll -------------------- */
  useEffect(() => {
    if (!containerRef.current) return;

    bottomRef.current?.scrollIntoView({
      behavior: messages.length > 1 ? "smooth" : "auto",
    });
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);


  /* -------------------- Send Handler -------------------- */
  const handleSend = useCallback(async () => {
    if (loading) return;

    // Stop speaking if active
    if (isSpeaking) {
      stopSpeaking();
    }

    // Stop mic if active
    if (isListening) {
      stopListening();
    }

    const trimmed = input.trim();

    if (!trimmed) {
      if (selectedFiles.length > 0) {
        try {
          await sendMessage(
            "Please summarize the uploaded document."
          );
        } catch (err) {
          console.error("Send failed:", err);
        }
        setSelectedFiles([]);
      }
      return;
    }

    try {
      await sendMessage(trimmed);
    } catch (err) {
      console.error("Send failed:", err);
    }

    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
    setSelectedFiles([]);
  }, [input, selectedFiles, sendMessage, loading, isSpeaking, isListening]);

  const handleCopy = async (content, index) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  /* -------------------- Voice Recognition -------------------- */
  const startListening = () => {
    if (
      typeof window === "undefined" ||
      !("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      console.warn("Speech recognition not supported");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.lang = "en-IN"; // default English
    recognition.interimResults = true;

    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const result = event.results?.[event.resultIndex]?.[0];

      if (!result) return;

      const transcript = result.transcript.trim();

      // Detect Hindi characters
      const hindiRegex = /[\u0900-\u097F]/;

      // language detection only for logging
      const detectedLang = hindiRegex.test(transcript) ? "hi-IN" : "en-US";
      console.log("Speech detected language:", detectedLang);

      const confidence = result.confidence ?? 1;

      if (confidence < 0.4) {
        console.warn("Low confidence speech result");
      }
      if (transcript) {
        recognitionRef.current.lastTranscript = transcript;
        setInput(transcript);
      }
    };

    recognition.onend = async () => {
      setIsListening(false);

      const transcript = recognitionRef.current?.lastTranscript;

      if (transcript?.trim()) {
        try {
          await sendMessage(transcript.trim());
          setInput("");
        } catch (err) {
          console.error("Auto send failed:", err);
        }
      }

      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      console.error("Recognition start failed:", err);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  /* -------------------- Text To Speech -------------------- */

  const cleanTextForSpeech = (text) => {
    if (!text) return "";

    return text
      .replace(/```[\s\S]*?```/g, "")     // remove code blocks
      .replace(/`.*?`/g, "")              // remove inline code
      .replace(/[*>~-]/g, "")           // remove markdown symbols
      .replace(/\[(.*?)\]\(.*?\)/g, "$1") // keep link text
      .replace(/\n+/g, " ")               // remove line breaks
      .trim();
  };

  const detectLanguage = (text) => {
    const hindiRegex = /[\u0900-\u097F]/;
    return hindiRegex.test(text) ? "hi-IN" : "en-US";
  };

  const speak = (text) => {

    if (!text || typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const cleanedText = cleanTextForSpeech(text);
    const detectedLang = detectLanguage(cleanedText || text);

    console.log("Detected language:", detectedLang);
    console.log("Voices:", window.speechSynthesis.getVoices());

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = detectedLang || "hi-IN";
    utterance.rate = 1;
    utterance.pitch = 1;

    const setVoiceAndSpeak = () => {
      let voices = window.speechSynthesis.getVoices();

      if (!voices.length) {
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          setVoiceAndSpeak();
        };
        return;
      }

      let voice = null;

      if (detectedLang === "hi-IN") {
        // If Hindi voice not available fallback to English India
        voice =
          voices.find((v) => v.lang === "hi-IN") ||
          voices.find((v) => v.lang === "en-IN") ||
          voices.find((v) => v.lang.startsWith("en")) ||
          voices[0];
      } else {
        voice =
          voices.find((v) => v.lang.toLowerCase().includes("en")) ||
          voices[0];
      }

      if (voice) {
        utterance.voice = voice;
      }

      window.speechSynthesis.speak(utterance);
    };

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setVoiceAndSpeak();
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  useEffect(() => {
    return () => {
      // 🎤 Stop Speech Recognition Safely
      if (recognitionRef.current) {
        try {
          if (typeof recognitionRef.current.stop === "function") {
            recognitionRef.current.onresult = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.onend = null;
            recognitionRef.current.stop();
          }
        } catch (err) {
          console.warn("Recognition cleanup error:", err);
        }
        recognitionRef.current = null;
      }

      // 🔊 Stop Speech Synthesis Safely
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (err) {
          console.warn("Speech cleanup error:", err);
        }
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full w-full text-white">

      {/* ================= MESSAGES ================= */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto w-full px-3 sm:px-6 md:px-10 py-6"
      >
        <div className="w-full max-w-3xl mx-auto space-y-8">

          {messages.length === 0 && (
            <div className="text-gray-400 text-center mt-24 text-base sm:text-lg">
              How can I help you today?
            </div>
          )}

          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {msg.role === "user" && (
                <div className="flex justify-end">
                  <div className="bg-indigo-600 text-white px-4 py-3 rounded-2xl max-w-[80%] sm:max-w-md break-words shadow-md text-sm sm:text-base">
                    {msg.content}
                  </div>
                </div>
              )}

              {msg.role === "assistant" && (
                <div className="flex justify-center">
                  <div className="bg-white/5 backdrop-blur-lg p-5 sm:p-6 rounded-2xl border border-white/10 shadow-lg w-full max-w-3xl">
                    <div className="prose prose-invert max-w-none break-words text-sm sm:text-base">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{ code: CodeBlock }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                      {!loading &&
                        msg.role === "assistant" &&
                        index === messages.length - 1 && (
                          <button
                            onClick={() => {
                              if (!loading && regenerateLastMessage) {
                                regenerateLastMessage();
                              }
                            }}
                            className="hover:text-white transition"
                          >
                            🔁 Regenerate
                          </button>
                        )}

                      <button
                        onClick={() => handleCopy(msg.content, index)}
                        className="hover:text-white transition"
                      >
                        {copiedIndex === index ? "✓ Copied" : "📋 Copy"}
                      </button>

                      {/* 🔊 Speak Button */}
                      <button
                        onClick={() => {
                          if (isSpeaking) {
                            stopSpeaking();
                          } else {
                            speak(msg.content);
                          }
                        }}
                        className="hover:text-white transition"
                      >
                        {isSpeaking ? "🔇 Stop" : "🔊 Speak"}
                      </button>

                      {msg.createdAt && (
                        <span className="ml-auto text-gray-500">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {loading && (
            <div className="flex justify-center items-center gap-2 text-gray-400 text-sm animate-pulse">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ================= INPUT ================= */}
      <div className="border-t border-white/10 bg-white/5 backdrop-blur-lg p-3 sm:p-4">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">

          {/* File Preview */}
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 max-w-full overflow-hidden">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="bg-black/40 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  📄 {file.name}
                  <button
                    onClick={() =>
                      setSelectedFiles(prev =>
                        prev.filter((_, i) => i !== index)
                      )
                    }
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">

            {/* Upload */}
            <label className="cursor-pointer bg-black/40 hover:bg-black/60 px-2 sm:px-3 py-2 rounded-xl transition text-sm">
              📎
              <input
                type="file"
                multiple
                hidden
                accept=".pdf"
                onChange={async (e) => {
                  const files = Array.from(e.target.files);
                  let currentConversationId = activeConversationId;

                  if (!currentConversationId) {
                    const newRes = await createConversation();
                    const newConv = newRes.data.data;
                    setActiveConversationId(newConv._id);
                    currentConversationId = newConv._id;
                  }

                  setSelectedFiles(prev => [...prev, ...files]);

                  try {
                    for (let file of files) {
                      await uploadDocument(file, currentConversationId);
                    }
                  } catch (err) {
                    console.error("Upload failed:", err);
                  }

                  e.target.value = "";
                }}
              />
            </label>

            {/* Input */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResize();
              }}
              placeholder="Send a message..."
              className="flex-1 resize-none bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-150 max-h-40 overflow-y-auto scrollbar-thin"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            {/* Mic */}
            <button
              onClick={isListening ? stopListening : startListening}
              className={`px-3 sm:px-4 py-3 rounded-xl transition text-sm ${isListening
                ? "bg-red-600 animate-pulse"
                : "bg-indigo-600 hover:bg-indigo-700"
                }`}
            >
              🎤
            </button>

            {/* Stop Voice */}
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="px-4 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-xl transition"
              >
                🔇
              </button>
            )}

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={loading}
              className={`px-3 sm:px-6 py-3 rounded-xl text-sm sm:text-base whitespace-nowrap transition ${loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
                }`}
            >
              Send
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;