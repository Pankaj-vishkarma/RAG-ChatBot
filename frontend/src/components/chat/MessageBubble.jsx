import { motion } from "framer-motion";

const MessageBubble = ({ type, text, sources }) => {
  const isUser = type === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl shadow-md text-sm md:text-base break-words
        ${
          isUser
            ? "ml-auto bg-indigo-600 text-white rounded-br-md"
            : "bg-white/10 backdrop-blur-md text-white rounded-bl-md border border-white/10"
        }`}
    >
      <p className="whitespace-pre-wrap leading-relaxed">
        {text}
      </p>

      {sources && sources.length > 0 && (
        <details className="mt-3 text-xs text-gray-300 bg-black/20 p-2 rounded-lg">
          <summary className="cursor-pointer hover:text-white transition">
            📄 View Sources
          </summary>

          <ul className="list-disc ml-4 mt-2 space-y-1">
            {sources.map((src, i) => (
              <li key={i} className="break-words">
                {src}
              </li>
            ))}
          </ul>
        </details>
      )}
    </motion.div>
  );
};

export default MessageBubble;