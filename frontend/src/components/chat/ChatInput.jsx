import { useState } from "react";
import Button from "../common/Button";

const ChatInput = ({ onSend, loading }) => {
  const [question, setQuestion] = useState("");

  const handleSubmit = () => {
    if (!question.trim()) return;
    onSend(question);
    setQuestion("");
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question..."
        className="flex-1 px-4 py-2 rounded-lg bg-gray-800"
      />
      <Button onClick={handleSubmit}>
        {loading ? "..." : "Ask"}
      </Button>
    </div>
  );
};

export default ChatInput;