import express from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import Chat from "../models/Chat";
import Message from "../models/Message";
import { aiClient, SYSTEM_PROMPT } from "../utils/geminiClient";

const router = express.Router();

// Get all user chats
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  const chats = await Chat.find({ userId: req.user!.id }).sort({ updatedAt: -1 });
  res.json(chats);
});

// Create a new chat
router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  const chat = await Chat.create({ userId: req.user!.id });
  res.json(chat);
});

// Get all messages for a chat
router.get("/:chatId/messages", authMiddleware, async (req: AuthRequest, res) => {
  const messages = await Message.find({ chatId: req.params.chatId }).sort({ timestamp: 1 });
  res.json(messages);
});

// Send message and get AI response
router.post("/:chatId/message", authMiddleware, async (req: AuthRequest, res) => {
  const { content } = req.body;
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ message: "Chat not found" });

  // Update title if still default
  let updatedTitle = chat.title;
  if (chat.title === "New Chat") {
    updatedTitle = content.split(" ").slice(0, 5).join(" ");
    await Chat.findByIdAndUpdate(chatId, { title: updatedTitle });
  }

  // Save user message
  await Message.create({ chatId, userId: req.user!.id, role: "user", content });

  // Fetch last 10 messages for context
  const prev = await Message.find({ chatId }).sort({ timestamp: 1 }).limit(10);

  // Build conversation
  const conversation = [
    { role: "system", content: SYSTEM_PROMPT },
    ...prev.map((m) => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.content,
    })),
    { role: "user", content },
  ];

  // Gemini response
  const completion = await aiClient.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: conversation.map((msg) => msg.content).join("\n"),
  });

  const aiReply = completion.text || "I'm here to listen and support you.";

  // Save AI reply
  await Message.create({ chatId, userId: req.user!.id, role: "ai", content: aiReply });

  // Update chat metadata
  await Chat.findByIdAndUpdate(chatId, {
    updatedAt: new Date(),
    lastMessage: content,
  });

  // Respond with updated title for frontend sync
  res.json({ reply: aiReply, updatedTitle });
});

// DELETE /api/chats/:id
router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id; // using authenticated user
    const chatId = req.params.id;

    const chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    await Chat.deleteOne({ _id: chatId, userId });
    await Message.deleteMany({ chatId }); // optional cleanup

    res.json({ message: "Chat deleted successfully" });
  } catch (err) {
    console.error("Error deleting chat:", err);
    res.status(500).json({ message: "Failed to delete chat" });
  }
});


export default router;
