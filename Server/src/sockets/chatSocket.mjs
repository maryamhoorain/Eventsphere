import socketAuth from "../middleware/socketAuth.mjs";
import Conversation from "../models/Conversation.mjs";
import Message from "../models/Message.mjs";

// userId -> number of active socket connections
const onlineUsers = new Map();

const initializeChatSocket = (io) => {
  io.use(socketAuth);

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();

    console.log(`Socket connected: ${socket.id}`);
    console.log(
      `Authenticated user: ${socket.user.name} (${socket.user.role})`
    );

    // ==========================================
    // ONLINE PRESENCE
    // ==========================================

    const previousConnections = onlineUsers.get(userId) || 0;
    onlineUsers.set(userId, previousConnections + 1);

    // User became online only when this is their first connection
    if (previousConnections === 0) {
      io.emit("user_online", {
        userId: socket.user._id,
        name: socket.user.name,
      });

      console.log(`${socket.user.name} is now online`);
    }

    // Tell the newly connected user who is currently online
    const currentlyOnlineUsers = Array.from(onlineUsers.keys());

    socket.emit("online_users", {
      userIds: currentlyOnlineUsers,
    });

    // ==========================================
    // JOIN CONVERSATION
    // ==========================================

    socket.on("join_conversation", async (conversationId) => {
      try {
        if (!conversationId) {
          socket.emit("chat_error", {
            message: "Conversation ID is required",
          });
          return;
        }

        const conversation = await Conversation.findOne({
          _id: conversationId,
          isActive: true,
          participants: socket.user._id,
        });

        if (!conversation) {
          socket.emit("chat_error", {
            message: "You are not a participant in this conversation",
          });
          return;
        }

        const roomName = `conversation:${conversationId}`;

        socket.join(roomName);

        console.log(`${socket.user.name} joined ${roomName}`);

        socket.emit("conversation_joined", {
          conversationId,
        });
      } catch (error) {
        console.error("Join conversation error:", error.message);

        socket.emit("chat_error", {
          message: "Unable to join conversation",
        });
      }
    });

    // ==========================================
    // SEND TEXT MESSAGE
    // ==========================================

    socket.on("send_message", async (data) => {
      try {
        const { conversationId, text } = data || {};

        if (!conversationId) {
          socket.emit("message_error", {
            message: "Conversation ID is required",
          });
          return;
        }

        if (typeof text !== "string" || !text.trim()) {
          socket.emit("message_error", {
            message: "Message text is required",
          });
          return;
        }

        const trimmedText = text.trim();

        const conversation = await Conversation.findOne({
          _id: conversationId,
          isActive: true,
          participants: socket.user._id,
        });

        if (!conversation) {
          socket.emit("message_error", {
            message: "You are not a participant in this conversation",
          });
          return;
        }

        const message = await Message.create({
          conversation: conversationId,
          sender: socket.user._id,
          messageType: "text",
          text: trimmedText,
          fileUrl: null,
          filePublicId: null,
        });

        conversation.lastMessage = message._id;
        conversation.lastMessageAt = message.createdAt;

        await conversation.save();

        await message.populate(
          "sender",
          "name email role"
        );

        const roomName = `conversation:${conversationId}`;

        io.to(roomName).emit("new_message", message);

        console.log(
          `${socket.user.name} sent a message in ${conversationId}`
        );
      } catch (error) {
        console.error("Send message error:", error.message);

        socket.emit("message_error", {
          message: "Unable to send message",
        });
      }
    });

    // ==========================================
    // TYPING INDICATOR
    // ==========================================

    socket.on("typing_start", async (data) => {
      try {
        const { conversationId } = data || {};

        if (!conversationId) {
          return;
        }

        const conversation = await Conversation.findOne({
          _id: conversationId,
          isActive: true,
          participants: socket.user._id,
        });

        if (!conversation) {
          return;
        }

        const roomName = `conversation:${conversationId}`;

        socket.to(roomName).emit("user_typing", {
          conversationId,
          userId: socket.user._id,
          name: socket.user.name,
          isTyping: true,
        });
      } catch (error) {
        console.error("Typing start error:", error.message);
      }
    });

    socket.on("typing_stop", async (data) => {
      try {
        const { conversationId } = data || {};

        if (!conversationId) {
          return;
        }

        const conversation = await Conversation.findOne({
          _id: conversationId,
          isActive: true,
          participants: socket.user._id,
        });

        if (!conversation) {
          return;
        }

        const roomName = `conversation:${conversationId}`;

        socket.to(roomName).emit("user_typing", {
          conversationId,
          userId: socket.user._id,
          name: socket.user.name,
          isTyping: false,
        });
      } catch (error) {
        console.error("Typing stop error:", error.message);
      }
    });

    // ==========================================
    // MARK MESSAGES AS READ
    // ==========================================

    socket.on("mark_messages_read", async (data) => {
      try {
        const { conversationId } = data || {};

        if (!conversationId) {
          socket.emit("message_error", {
            message: "Conversation ID is required",
          });
          return;
        }

        const conversation = await Conversation.findOne({
          _id: conversationId,
          isActive: true,
          participants: socket.user._id,
        });

        if (!conversation) {
          socket.emit("message_error", {
            message: "You are not a participant in this conversation",
          });
          return;
        }

        const unreadMessages = await Message.find({
          conversation: conversationId,
          sender: { $ne: socket.user._id },
          isRead: false,
        }).select("_id");

        if (unreadMessages.length === 0) {
          socket.emit("messages_read", {
            conversationId,
            messageIds: [],
            readBy: socket.user._id,
          });

          return;
        }

        const messageIds = unreadMessages.map(
          (message) => message._id
        );

        await Message.updateMany(
          {
            _id: { $in: messageIds },
            conversation: conversationId,
            sender: { $ne: socket.user._id },
            isRead: false,
          },
          {
            $set: {
              isRead: true,
              readAt: new Date(),
            },
          }
        );

        const roomName = `conversation:${conversationId}`;

        io.to(roomName).emit("messages_read", {
          conversationId,
          messageIds,
          readBy: socket.user._id,
        });

        console.log(
          `${socket.user.name} marked ${messageIds.length} message(s) as read`
        );
      } catch (error) {
        console.error(
          "Mark messages read error:",
          error.message
        );

        socket.emit("message_error", {
          message: "Unable to mark messages as read",
        });
      }
    });

    // ==========================================
    // LEAVE CONVERSATION
    // ==========================================

    socket.on("leave_conversation", (conversationId) => {
      if (!conversationId) return;

      const roomName = `conversation:${conversationId}`;

      socket.leave(roomName);

      console.log(
        `${socket.user.name} left ${roomName}`
      );
    });

    // ==========================================
    // DISCONNECT / OFFLINE PRESENCE
    // ==========================================

    socket.on("disconnect", () => {
      const currentConnections =
        onlineUsers.get(userId) || 0;

      if (currentConnections <= 1) {
        onlineUsers.delete(userId);

        io.emit("user_offline", {
          userId: socket.user._id,
          name: socket.user.name,
        });

        console.log(`${socket.user.name} is now offline`);
      } else {
        onlineUsers.set(
          userId,
          currentConnections - 1
        );

        console.log(
          `${socket.user.name} disconnected one socket`
        );
      }

      console.log(
        `Socket disconnected: ${socket.id}`
      );
    });
  });
};

export default initializeChatSocket;