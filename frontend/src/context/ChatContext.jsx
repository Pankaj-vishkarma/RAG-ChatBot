import { createContext, useState, useEffect, useRef } from "react";
import {
  createConversation,
  getUserConversations,
  deleteConversation,
} from "../api/conversation.api";
import axiosInstance from "../api/axiosInstance";

export const ChatContext = createContext();

const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const isCreatingConversationRef = useRef(false);
  const abortControllerRef = useRef(null);

  /* ================= LOAD CONVERSATIONS ================= */
  const loadConversations = async () => {
    try {
      const res = await getUserConversations();
      const data = res?.data?.data || [];

      if (!data.length) {
        const newRes = await createConversation();
        const newConv = newRes?.data?.data;

        if (!newConv?._id) {
          setLoading(false);
          return;
        }

        setConversations([newConv]);
        setActiveConversationId(newConv._id);
      } else {
        setConversations(data);

        setActiveConversationId((prev) =>
          prev && data.find((c) => c._id === prev)
            ? prev
            : data[0]._id
        );
      }
    } catch (err) {
      console.error("Failed to load conversations", err?.message);
    }
  };

  /* ================= LOAD MESSAGES ================= */
  const loadMessages = async (conversationId) => {
    try {
      if (!conversationId) return;

      const res = await axiosInstance.get(
        `/messages/${conversationId}`
      );

      setMessages(res?.data?.data || []);
    } catch (err) {
      console.error("Failed to load messages", err?.message);
    }
  };

  /* ================= LOAD DOCUMENTS ================= */
  const loadDocuments = async (conversationId) => {
    try {
      if (!conversationId) return;

      const res = await axiosInstance.get(
        `/documents/${conversationId}`
      );

      setDocuments(res?.data?.data || []);
    } catch (err) {
      console.error("Failed to load documents", err?.message);
    }
  };

  /* ================= UPLOAD DOCUMENT ================= */
  const uploadDocument = async (file, conversationId) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("conversationId", conversationId);

      await axiosInstance.post(
        "/documents/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      await loadDocuments(conversationId);
    } catch (err) {
      console.error("Upload error:", err?.response?.data || err?.message);
    }
  };

  /* ================= NEW CHAT ================= */
  const handleNewChat = async () => {
    try {
      const res = await createConversation();
      const newConv = res?.data?.data;

      if (!newConv?._id) return;

      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv._id);
      setMessages([]);
      setDocuments([]);
    } catch (err) {
      console.error("Failed to create chat", err?.message);
    }
  };

  /* ================= DELETE CHAT ================= */
  const handleDeleteChat = async (conversationId) => {
    try {
      await deleteConversation(conversationId);

      const updated = conversations.filter(
        (c) => c._id !== conversationId
      );

      setConversations(updated);

      if (activeConversationId === conversationId) {
        if (updated.length) {
          setActiveConversationId(updated[0]._id);
        } else {
          setActiveConversationId(null);
          setMessages([]);
          setDocuments([]);
        }
      }
    } catch (err) {
      console.error("Delete failed", err?.message);
    }
  };

  /* ================= STREAM MESSAGE ================= */
  const sendMessage = async (question, isRegenerate = false) => {

    const token = localStorage.getItem("token");
    if (!token) return;
    if (!question?.trim()) return;
    if (loading || abortControllerRef.current) return;

    try {
      setLoading(true);

      let currentConversationId = activeConversationId;

      if (!currentConversationId) {
        isCreatingConversationRef.current = true;

        const newRes = await createConversation();
        const newConv = newRes?.data?.data;

        if (!newConv?._id) return;

        currentConversationId = newConv._id;

        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(newConv._id);
        setMessages([]);

        setTimeout(() => {
          isCreatingConversationRef.current = false;
        }, 300);
      }

      setMessages((prev) =>
        isRegenerate
          ? [...prev, { role: "assistant", content: "" }]
          : [
            ...prev,
            { role: "user", content: question },
            { role: "assistant", content: "" },
          ]
      );

      // Abort previous request safely
      abortControllerRef.current?.abort();

      abortControllerRef.current = new AbortController();

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/rag/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question,
            conversationId: currentConversationId,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok || !response.body) {
        throw new Error(`Streaming failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      let chunkCount = 0;

      while (true) {

        if (chunkCount > 10000) {
          console.warn("Stream safety break triggered");
          break;
        }

        chunkCount++;

        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;

          const data = line.replace("data:", "").trim();

          if (data === "[DONE]") {
            reader.releaseLock();
            abortControllerRef.current = null;
            setLoading(false);
            return;
          }

          try {
            const parsed = JSON.parse(data);

            if (!parsed?.text) continue;

            fullText += parsed.text;

            setMessages((prev) => {
              const updated = [...prev];
              const lastIndex = updated.length - 1;

              if (updated[lastIndex]?.role === "assistant") {
                updated[lastIndex] = {
                  ...updated[lastIndex],
                  content: fullText,
                };
              }

              return updated;
            });

          } catch (err) {
            console.warn("Stream parse error:", err.message);
          }
        }
      }
      reader.releaseLock();
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Streaming error:", error?.message);

        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;

          if (updated[lastIndex]?.role === "assistant") {
            updated[lastIndex].content =
              "⚠️ Something went wrong. Please try again.";
          } else {
            updated.push({
              role: "assistant",
              content: "⚠️ Something went wrong. Please try again.",
            });
          }

          return updated;
        });
      }
    } finally {
      setLoading(false);

      if (abortControllerRef.current) {
        abortControllerRef.current = null;
      }
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = null;
    setLoading(false);
  };

  const regenerateLastMessage = async () => {
    if (loading || messages.length < 2) return;

    const lastIndex = messages.length - 1;

    // Last message assistant hona chahiye
    if (messages[lastIndex].role !== "assistant") return;

    // Last user message find karo
    const lastUserMessage = [...messages]
      .slice(0, lastIndex)
      .reverse()
      .find((msg) => msg.role === "user");

    if (!lastUserMessage) return;

    // Remove last assistant message
    setMessages((prev) => {
      const copy = [...prev];
      if (copy[copy.length - 1]?.role === "assistant") {
        copy.pop();
      }
      return copy;
    });

    if (lastUserMessage?.content) {
      await sendMessage(lastUserMessage.content, true);
    }
  }

  /* ================= EFFECTS ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return; // 🛑 stop if not logged in

    loadConversations();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return; // 🛑 stop unauthorized calls
    if (!activeConversationId) return;
    if (isCreatingConversationRef.current) return;

    loadMessages(activeConversationId);
    loadDocuments(activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        setActiveConversationId,
        messages,
        documents,
        setDocuments,
        loading,
        handleNewChat,
        handleDeleteChat,
        sendMessage,
        stopGeneration,
        regenerateLastMessage,
        uploadDocument,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;