import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquareDashed, Send } from "lucide-react";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore";

export default function ChatWindow() {
  const { currentChat, sendMessage, newChat, fetchMessages } = useChatStore();
  const { user } = useAuthStore();
  const [input, setInput] = useState("");
  const [awaiting, setAwaiting] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [currentChat?.messages?.length]);

  useEffect(() => {
    if (currentChat && (!currentChat.messages || currentChat.messages.length === 0)) {
      void fetchMessages(currentChat._id);
    }
  }, [currentChat, fetchMessages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    try {
      setAwaiting(true);
      await sendMessage(input.trim());
      setInput("");
    } finally {
      setAwaiting(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  // Empty state
  if (!currentChat)
    return (
      <div className="flex-1 h-screen flex flex-col items-center justify-center text-center px-6 py-12 
        bg-[radial-gradient(circle_at_top_left,_#0d0d1a,_#151533,_#1e1e3f)] 
        backdrop-blur-xl text-gray-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center"
        >
          <motion.div
            initial={{ rotate: -10, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="p-5 rounded-full bg-linear-to-tr from-blue-600 to-purple-600 shadow-lg shadow-purple-800/40 mb-5"
          >
            <MessageSquareDashed size={44} className="text-white" />
          </motion.div>

          <h3 className="text-2xl font-semibold text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400 mb-2">
            Start a New Chat
          </h3>

          <p className="text-sm text-gray-400 max-w-sm mb-6">
            Your private space to share thoughts with your AI psychologist.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => newChat()}
            className="inline-flex items-center gap-2 px-5 py-2.5 
              bg-linear-to-r from-blue-600 to-purple-600 
              text-white rounded-xl shadow-md hover:shadow-blue-500/30 
              transition cursor-pointer"
          >
            <Send size={16} />
            <span className="font-medium">Start Conversation</span>
          </motion.button>
        </motion.div>
      </div>
    );

  // Chat area
  return (
    <div className="flex flex-col h-full 
      bg-[radial-gradient(circle_at_top_right,_#0d0d1a,_#141432,_#1c1c3a)] 
      backdrop-blur-xl text-gray-100">
      
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div>
          <div className="text-xs text-gray-400">Conversation</div>
          <div className="text-lg font-semibold text-white truncate">
            {currentChat.title || "Untitled"}
          </div>
        </div>
        <div className="text-xs text-green-400 animate-pulse">● Live</div>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-5 py-6 space-y-5 no-scrollbar"
      >
        <AnimatePresence mode="popLayout">
          {currentChat.messages?.map((m, i) => {
            const isUser = m.role === "user";
            const initials = isUser
              ? (user?.name?.[0] || "U").toUpperCase()
              : "AI";

            return (
              <motion.div
                key={m._id ?? i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex items-end gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {/* Avatar */}
                {!isUser && (
                  <div className="flex items-center justify-center h-9 w-9 rounded-full bg-linear-to-br from-blue-500 to-purple-500 text-white font-bold shadow-md">
                    {initials}
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={`relative px-4 py-2.5 rounded-2xl max-w-[75%] text-sm sm:text-base shadow-lg ${
                    isUser
                      ? "bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-br-none"
                      : "bg-white/10 backdrop-blur-md border border-white/10 text-gray-100 rounded-bl-none"
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  <div
                    className={`absolute text-[10px] text-gray-400 ${
                      isUser ? "right-2 -bottom-4" : "left-2 -bottom-4"
                    }`}
                  >
                    {m.createdAt
                      ? new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </div>
                </div>

                {/* User avatar */}
                {isUser && (
                  <div className="flex items-center justify-center h-9 w-9 rounded-full bg-linear-to-br from-blue-500 to-purple-500 text-white font-bold shadow-md">
                    {initials}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        {awaiting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-[60%] p-3 rounded-2xl mr-auto bg-white/10 backdrop-blur-md flex gap-2 items-center border border-white/10"
          >
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" />
              <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce delay-100" />
              <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce delay-200" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input box */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-lg"
      >
        <div className="flex items-center gap-3">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type your message..."
            className="flex-1 resize-none bg-white/10 border border-white/20 
              rounded-xl px-3 py-3 text-sm text-gray-100 placeholder-gray-400 
              focus:ring-2 focus:ring-blue-500 focus:outline-none 
              backdrop-blur-md"
          />

          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            type="submit"
            disabled={awaiting}
            className={`inline-flex items-center  gap-2 px-4 py-3 rounded-xl text-sm text-white font-medium transition cursor-pointer ${
              awaiting
                ? "bg-linear-to-r from-blue-400 to-purple-400 opacity-60 cursor-wait"
                : "bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            }`}
          >
            <Send size={16} />
            <span>Send</span>
          </motion.button>
        </div>
      </form>
    </div>
  );
}
