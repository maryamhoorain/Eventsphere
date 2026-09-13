import Conversation from "../models/Conversation.mjs";
import Message from "../models/Message.mjs";
import User from "../models/User.mjs";
import uploadToCloudinary, {
  deleteFromCloudinary,
} from "../utils/uploadToCloudinary.mjs";
import { getSocketIO } from "../config/socket.mjs";

// ==========================================
// CREATE CONVERSATION
// ADMIN / EXHIBITOR
// ==========================================

const createConversation = async (req, res) => {
  try {
    const { participantId } = req.body;

    const currentUserId = req.user._id;

    // ==========================================
    // VALIDATE PARTICIPANT
    // ==========================================

    if (!participantId) {
      return res.status(400).json({
        message: "Participant ID is required",
      });
    }

    // ==========================================
    // CANNOT CHAT WITH YOURSELF
    // ==========================================

    if (currentUserId.toString() === participantId.toString()) {
      return res.status(400).json({
        message: "You cannot create a conversation with yourself",
      });
    }

    // ==========================================
    // FIND PARTICIPANT
    // ==========================================

    const participant = await User.findById(participantId).select(
      "_id name email role",
    );

    if (!participant) {
      return res.status(404).json({
        message: "Participant not found",
      });
    }

    // ==========================================
    // CHECK ALLOWED ROLES
    // ==========================================

    const currentUserRole = req.user.role;
    const participantRole = participant.role;

    const staffRoles = ["admin", "organizer"];

    const allowed =
      (staffRoles.includes(currentUserRole) &&
        (participantRole === "exhibitor" || staffRoles.includes(participantRole))) ||
      (currentUserRole === "exhibitor" &&
        (staffRoles.includes(participantRole) || participantRole === "exhibitor"));

    if (!allowed) {
      return res.status(403).json({
        message:
          "You are not authorized to start a conversation with this user",
      });
    }

    // ==========================================
    // CHECK EXISTING CONVERSATION
    // ==========================================

    const existingConversation = await Conversation.findOne({
      participants: {
        $all: [currentUserId, participantId],
      },
      $expr: {
        $eq: [
          {
            $size: "$participants",
          },
          2,
        ],
      },
    })
      .populate("participants", "_id name email role")
      .populate("lastMessage");

    if (existingConversation) {
      return res.status(200).json({
        message: "Conversation already exists",
        conversation: existingConversation,
      });
    }

    // ==========================================
    // CREATE CONVERSATION
    // ==========================================

    const conversation = await Conversation.create({
      participants: [currentUserId, participantId],
    });

    // ==========================================
    // POPULATE PARTICIPANTS
    // ==========================================

    const populatedConversation = await Conversation.findById(
      conversation._id,
    ).populate("participants", "_id name email role");

    res.status(201).json({
      message: "Conversation created successfully",
      conversation: populatedConversation,
    });
  } catch (error) {
    console.error("Create conversation error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET MY CONVERSATIONS
// ADMIN / EXHIBITOR
// ==========================================

const getMyConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
      isActive: true,
    })
      .populate("participants", "name email role")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "name email role",
        },
      })
      .sort({
        lastMessageAt: -1,
        updatedAt: -1,
      });

    // Add unread message count for each conversation
    const conversationsWithUnreadCount = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,
          sender: { $ne: req.user._id },
          isRead: false,
        });

        return {
          ...conversation.toObject(),
          unreadCount,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      data: conversationsWithUnreadCount,
    });
  } catch (error) {
    console.error("Get conversations error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to get conversations",
    });
  }
};

// ==========================================
// GET CONVERSATION MESSAGES
// ADMIN / EXHIBITOR
// ==========================================

const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const userId = req.user._id;

    // ==========================================
    // VERIFY USER IS PARTICIPANT
    // ==========================================

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found or you are not a participant",
      });
    }

    // ==========================================
    // GET MESSAGES
    // ==========================================

    const messages = await Message.find({
      conversation: conversationId,
    })
      .populate("sender", "_id name email role")
      .sort({
        createdAt: 1,
      });

    res.status(200).json({
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error("Get conversation messages error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// SEND TEXT MESSAGE
// ADMIN / EXHIBITOR
// ==========================================

const sendTextMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;

    const senderId = req.user._id;

    // ==========================================
    // VALIDATE TEXT
    // ==========================================

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        message: "Message text is required",
      });
    }

    const trimmedText = text.trim();

    if (!trimmedText) {
      return res.status(400).json({
        message: "Message cannot be empty",
      });
    }

    // ==========================================
    // FIND CONVERSATION
    // AND VERIFY PARTICIPATION
    // ==========================================

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: senderId,
      isActive: true,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found or you are not a participant",
      });
    }

    // ==========================================
    // CREATE MESSAGE
    // ==========================================

    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      messageType: "text",
      text: trimmedText,
    });

    // ==========================================
    // UPDATE CONVERSATION
    // ==========================================

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;

    await conversation.save();

    // ==========================================
    // POPULATE SENDER
    // ==========================================

    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "_id name email role",
    );

    res.status(201).json({
      message: "Message sent successfully",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Send text message error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};
// ==========================================
// SEND IMAGE MESSAGE
// ADMIN / EXHIBITOR
// ==========================================

export const sendImageMessage = async (req, res) => {
  let uploadedPublicId = null;

  try {
    const { conversationId } = req.params;

    // ------------------------------------------
    // CHECK FILE
    // ------------------------------------------

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    // ------------------------------------------
    // CHECK CONVERSATION
    // ------------------------------------------

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
      isActive: true,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or you are not a participant",
      });
    }

    // ------------------------------------------
    // UPLOAD IMAGE TO CLOUDINARY
    // ------------------------------------------

    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: "eventsphere/chat/images",
      resourceType: "image",
    });

    uploadedPublicId = uploadResult.public_id;

    // ------------------------------------------
    // CREATE MESSAGE
    // ------------------------------------------

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      messageType: "image",
      text: null,
      fileUrl: uploadResult.secure_url,
      filePublicId: uploadResult.public_id,
    });

    // ------------------------------------------
    // UPDATE CONVERSATION
    // ------------------------------------------

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;

    await conversation.save();

    // ------------------------------------------
    // POPULATE SENDER
    // ------------------------------------------

    await message.populate("sender", "name email role");

    const io = getSocketIO();

    const roomName = `conversation:${conversationId}`;

    io.to(roomName).emit("new_message", message);

    // ------------------------------------------
    // RESPONSE
    // ------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Image message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Send image message error:", error);

    // ------------------------------------------
    // CLEANUP CLOUDINARY IMAGE
    // ------------------------------------------

    if (uploadedPublicId) {
      try {
        await deleteFromCloudinary(uploadedPublicId, "image");

        console.log("Cloudinary image cleaned up:", uploadedPublicId);
      } catch (cleanupError) {
        console.error("Cloudinary cleanup failed:", cleanupError.message);
      }
    }

    // ------------------------------------------
    // RESPONSE
    // ------------------------------------------

    return res.status(500).json({
      success: false,
      message: "Failed to send image message",
      error: error.message,
    });
  }
};

// ==========================================
// SEND AUDIO MESSAGE
// ADMIN / EXHIBITOR
// ==========================================

export const sendAudioMessage = async (req, res) => {
  let uploadedPublicId = null;

  try {
    const { conversationId } = req.params;

    // ------------------------------------------
    // CHECK FILE
    // ------------------------------------------

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Audio file is required",
      });
    }

    // ------------------------------------------
    // CHECK CONVERSATION
    // ------------------------------------------

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
      isActive: true,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or you are not a participant",
      });
    }

    // ------------------------------------------
    // UPLOAD AUDIO TO CLOUDINARY
    // ------------------------------------------

    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: "eventsphere/chat/audio",
      resourceType: "video",
    });

    uploadedPublicId = uploadResult.public_id;

    // ------------------------------------------
    // CREATE MESSAGE
    // ------------------------------------------

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      messageType: "audio",
      text: null,
      fileUrl: uploadResult.secure_url,
      filePublicId: uploadResult.public_id,
    });

    // ------------------------------------------
    // UPDATE CONVERSATION
    // ------------------------------------------

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;

    await conversation.save();

    // ------------------------------------------
    // POPULATE SENDER
    // ------------------------------------------

    await message.populate("sender", "name email role");

    const io = getSocketIO();

    const roomName = `conversation:${conversationId}`;

    io.to(roomName).emit("new_message", message);

    // ------------------------------------------
    // RESPONSE
    // ------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Audio message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Send audio message error:", error);

    // ------------------------------------------
    // CLEANUP CLOUDINARY AUDIO
    // ------------------------------------------

    if (uploadedPublicId) {
      try {
        await deleteFromCloudinary(uploadedPublicId, "video");

        console.log("Cloudinary audio cleaned up:", uploadedPublicId);
      } catch (cleanupError) {
        console.error("Cloudinary audio cleanup failed:", cleanupError.message);
      }
    }

    // ------------------------------------------
    // RESPONSE
    // ------------------------------------------

    return res.status(500).json({
      success: false,
      message: "Failed to send audio message",
      error: error.message,
    });
  }
};

const editMessage = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const { text } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message text is required",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      isActive: true,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant in this conversation",
      });
    }

    const message = await Message.findOne({
      _id: messageId,
      conversation: conversationId,
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own messages",
      });
    }

    if (message.messageType !== "text") {
      return res.status(400).json({
        success: false,
        message: "Only text messages can be edited",
      });
    }

    if (message.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Deleted messages cannot be edited",
      });
    }

    message.text = text.trim();
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();

    await message.populate("sender", "name email role");

    // Real-time update
    const io = getSocketIO();

    const roomName = `conversation:${conversationId}`;

    io.to(roomName).emit("message_edited", message);

    return res.status(200).json({
      success: true,
      message: "Message edited successfully",
      data: message,
    });
  } catch (error) {
    console.error("Edit message error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to edit message",
    });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      isActive: true,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant in this conversation",
      });
    }

    const message = await Message.findOne({
      _id: messageId,
      conversation: conversationId,
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      });
    }

    if (message.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Message is already deleted",
      });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();

    // Remove text from a deleted text message
    message.text = null;

    await message.save();

    await message.populate("sender", "name email role");

    const io = getSocketIO();

    const roomName = `conversation:${conversationId}`;

    io.to(roomName).emit("message_deleted", {
      _id: message._id,
      conversation: conversationId,
      sender: message.sender,
      messageType: message.messageType,
      isDeleted: true,
      deletedAt: message.deletedAt,
    });

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully",
      data: message,
    });
  } catch (error) {
    console.error("Delete message error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete message",
    });
  }
};

export {
  createConversation,
  getMyConversations,
  getConversationMessages,
  sendTextMessage,
  editMessage,
  deleteMessage,
};
