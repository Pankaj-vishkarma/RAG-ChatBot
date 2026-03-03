import { useContext, useState } from "react";
import { ChatContext } from "../context/ChatContext";
import { askQuestion } from "../api/rag.api";

export const useChat = () => {
  const { messages, setMessages } = useContext(ChatContext);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (question) => {
    const userMessage = { type: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await askQuestion({ question });

      const aiMessage = {
        type: "ai",
        text: res.data.data.answer,
        sources: res.data.data.sources,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { type: "ai", text: "Error occurred." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, sendMessage };
};