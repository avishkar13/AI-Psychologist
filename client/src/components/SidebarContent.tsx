import { Plus, MessageCircle, Bot } from "lucide-react";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore";

interface SidebarContentProps {
  onChatSelect?: () => void;
}

export default function SidebarContent({ onChatSelect }: SidebarContentProps) {
  const { chats, selectChat, newChat, currentChat, loading } = useChatStore();
  const { user, logout } = useAuthStore();

  const handleSelect = (id: string) => {
    void selectChat(id);
    onChatSelect?.();
  };

  return (
    <div className="flex flex-col h-full bg-[radial-gradient(circle_at_top_left,_#0d0d1a,_#141432,_#1e1e3f)] backdrop-blur-xl border-r border-white/10 text-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400">
          AI Psychologist
        </h2>
      </div>

      {/* New Chat */}
      <div className="px-4 py-3">
        <button
          onClick={newChat}
          className="flex items-center gap-2 w-full py-2 justify-center rounded-lg 
                     bg-linear-to-r from-blue-600/80 to-purple-600/40
                     hover:from-blue-500 hover:to-purple-500/60
                     text-white font-medium shadow-md transition-all duration-200 cursor-pointer"
        >
          <Plus size={16} /> New Chat
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 no-scrollbar">
        {loading && chats.length === 0 ? (
          <div className="px-3 text-sm text-gray-400">Loading chats...</div>
        ) : chats.length === 0 ? (
          <div className="px-3 text-sm text-gray-400">No chats yet.</div>
        ) : (
          chats.map((chat) => {
            const selected = currentChat && currentChat._id === chat._id;
            return (
              <div
                key={chat._id}
                onClick={() => handleSelect(chat._id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all
                ${
                  selected
                    ? "bg-linear-to-r from-blue-700/50 to-purple-700/50 ring-1 ring-blue-400/50 scale-[1.02]"
                    : "hover:bg-white/10"
                }`}
              >
                <div
                  className={`p-2 rounded-md ${
                    selected
                      ? "bg-linear-to-br from-blue-500/40 to-purple-500/40"
                      : "bg-white/10"
                  }`}
                >
                  {(chat.messages?.[0]?.role ?? "ai") === "user" ? (
                    <MessageCircle size={18} className="text-blue-300" />
                  ) : (
                    <Bot size={18} className="text-purple-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate text-white">
                    {chat.title || "Untitled Chat"}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {chat.lastMessage || "No messages"}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {user?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <span className="truncate font-semibold text-white">{user?.name}</span>
        </div>
        <button
          onClick={() => void logout()}
          className="text-gray-400 hover:text-red-400 transition-colors duration-150 cursor-pointer"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
