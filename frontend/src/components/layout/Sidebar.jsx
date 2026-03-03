import { useContext } from "react";
import { ChatContext } from "../../context/ChatContext";
import axiosInstance from "../../api/axiosInstance";
import { Trash2, Plus } from "lucide-react";

const Sidebar = ({ closeSidebar }) => {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    handleNewChat,
    handleDeleteChat,
    documents,
    setDocuments,
  } = useContext(ChatContext);

  const handleDeleteDocument = async (documentId) => {
    const confirmDelete = window.confirm("Delete this document?");
    if (!confirmDelete) return;

    try {
      await axiosInstance.delete(`/document/${documentId}`);

      setDocuments((prev) =>
        prev.filter((doc) => doc._id !== documentId)
      );
    } catch (err) {
      alert(err.message || "Failed to delete document");
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden flex flex-col p-3 sm:p-4 
bg-gradient-to-b from-indigo-900/60 via-purple-900/50 to-black/60 
backdrop-blur-xl border-r border-white/10 shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)]">

      {/* New Chat Button */}
      <button
        onClick={() => {
          handleNewChat();
          closeSidebar?.();
        }}
        className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 hover:scale-[1.03] px-3 py-2 rounded-xl shadow-lg mb-4 text-sm sm:text-base"
      >
        <Plus size={16} />
        New Chat
      </button>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-white/20">

        {conversations.map((conv) => (
          <div key={conv._id}>

            {/* Conversation Row */}
            <div
              onClick={() => {
                setActiveConversationId(conv._id);
                closeSidebar?.();
              }}
              className={`p-2.5 sm:p-3 rounded-xl flex justify-between items-center cursor-pointer transition-all duration-300 group
              ${activeConversationId === conv._id
                  ? "bg-indigo-600 shadow-md ring-1 ring-white/20"
                  : "bg-white/5 hover:bg-white/10 hover:shadow-md"
                }`}
            >
              <span className="truncate text-xs sm:text-sm font-medium">
                {conv.title || "New Chat"}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const confirmDelete =
                    window.confirm("Delete this chat?");
                  if (confirmDelete) {
                    handleDeleteChat(conv._id);
                  }
                }}
                className="text-red-400 hover:text-red-300 transition opacity-70 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Documents Under Active Chat */}
            {activeConversationId === conv._id &&
              documents.length > 0 && (
                <div className="ml-3 sm:ml-4 mt-2 space-y-2 animate-fadeIn">
                  {documents.map((doc) => (
                    <div
                      key={doc._id}
                      className="flex justify-between items-center text-[11px] sm:text-xs bg-white/5 p-2 rounded-lg hover:bg-white/10 transition"
                    >
                      <span className="truncate">
                        📄 {doc.title}
                      </span>
                      <button
                        onClick={() =>
                          handleDeleteDocument(doc._id)
                        }
                        className="text-red-400 hover:text-red-300 transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
          </div>
        ))}

      </div>
    </div>
  );
};

export default Sidebar;