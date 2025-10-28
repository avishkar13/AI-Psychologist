import { create } from "zustand";
import axiosClient from "../api/axiosClient";

type AnyHttpError = {
  response?: { data?: { message?: string } };
  message?: string;
};

export interface Message {
  _id?: string;
  role: "user" | "ai";
  content: string;
  createdAt?: string;
}

export interface Chat {
  _id: string;
  userId?: string;
  title?: string;
  lastMessage?: string;
  messages?: Message[];
  createdAt?: string;
  updatedAt?: string;
}

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  loading: boolean;
  error: string | null;
  reset: () => void;

  setChats: (chats: Chat[]) => void;
  setCurrentChat: (chat: Chat) => void;
  fetchChats: () => Promise<void>;
  selectChat: (chatId: string) => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  newChat: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChat: null,
  loading: false,
  error: null,

  setChats: (chats) => set({ chats }),
  setCurrentChat: (chat) => set({ currentChat: chat }),

  // Fetch all user chats
  fetchChats: async () => {
    try {
      set({ loading: true, error: null });
      const res = await axiosClient.get("/chats");
      const chats = Array.isArray(res.data) ? res.data : [];
      set({ chats });
      if (!get().currentChat && chats.length > 0)
        set({ currentChat: { ...chats[0], messages: [] } });
    } catch (err: unknown) {
      const message =
        typeof err === "object"
          ? (err as AnyHttpError).response?.data?.message || (err as AnyHttpError).message
          : "Failed to fetch chats";
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  // Select chat
selectChat: async (chatId) => {
  const { chats, currentChat } = get();

  // Delete the current empty chat before switching
  if (currentChat && (!currentChat.messages || currentChat.messages.length === 0)) {
    try {
      await axiosClient.delete(`/chats/${currentChat._id}`);
      set({
        chats: chats.filter((c) => c._id !== currentChat._id),
        currentChat: null,
      });
    } catch {
      set({ error: "Failed to delete empty chat" });
    }
  }

  // Select the target chat
  const chat = get().chats.find((c) => c._id === chatId);
  if (!chat) return;
  set({ currentChat: { ...chat, messages: [] } });

  try {
    const res = await axiosClient.get(`/chats/${chatId}/messages`);
    const messages = Array.isArray(res.data) ? res.data : [];
    set((s) => ({
      currentChat: { ...chat, messages },
      chats: s.chats.map((c) =>
        c._id === chatId
          ? { ...c, messages, updatedAt: new Date().toISOString() }
          : c
      ),
    }));
  } catch {
    set({ error: "Failed to load chat messages" });
  }
},


  // New chat
  newChat: async () => {
    try {
      const res = await axiosClient.post("/chats");
      const newChat = { ...res.data, messages: [] };
      set((s) => ({
        chats: [newChat, ...s.chats],
        currentChat: newChat,
      }));
    } catch (err: unknown) {
      const message =
        typeof err === "object"
          ? (err as AnyHttpError).response?.data?.message || (err as AnyHttpError).message
          : "Failed to create chat";
      set({ error: message });
    }
  },

  // Fetch messages
  fetchMessages: async (chatId) => {
    try {
      const res = await axiosClient.get(`/chats/${chatId}/messages`);
      const messages = Array.isArray(res.data) ? res.data : [];
      set((s) => ({
        currentChat: { ...s.currentChat!, messages },
        chats: s.chats.map((c) =>
          c._id === chatId ? { ...c, messages, updatedAt: new Date().toISOString() } : c
        ),
      }));
    } catch {
      set({ error: "Failed to fetch messages" });
    }
  },

  // Send message
  sendMessage: async (content) => {
    const chat = get().currentChat;
    if (!chat) return;

    const userMessage: Message = { role: "user", content, createdAt: new Date().toISOString() };

    // Optimistic UI
    set({
      currentChat: { ...chat, messages: [...(chat.messages || []), userMessage] },
    });

    try {
      const res = await axiosClient.post(`/chats/${chat._id}/message`, { content });
      const aiMessage: Message = {
        role: "ai",
        content: res.data.reply,
        createdAt: new Date().toISOString(),
      };

      // Update chat + title locally if backend sent updatedTitle
      set((s) => {
        const updatedTitle =
          s.currentChat?.title === "New Chat"
            ? res.data.updatedTitle || s.currentChat.title
            : s.currentChat?.title;

        const updatedChat = {
          ...s.currentChat!,
          title: updatedTitle,
          lastMessage: content,
          updatedAt: new Date().toISOString(),
          messages: [...(s.currentChat?.messages || []), aiMessage],
        };

        return {
          currentChat: updatedChat,
          chats: [
            updatedChat,
            ...s.chats.filter((c) => c._id !== updatedChat._id),
          ],
        };
      });
    } catch {
      set({ error: "Failed to send message" });
    }
  },

  reset: () => set({ chats: [], currentChat: null, loading: false, error: null }),
}));
