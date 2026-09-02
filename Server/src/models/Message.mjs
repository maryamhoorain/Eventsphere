import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    messageType: {
      type: String,
      enum: ["text", "image", "audio"],
      required: true,
    },

    text: {
      type: String,
      trim: true,
      default: null,
    },

    fileUrl: {
      type: String,
      trim: true,
      default: null,
    },

    filePublicId: {
      type: String,
      trim: true,
      default: null,
    },

    // =========================
    // EDIT / DELETE
    // =========================

    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    // =========================
    // READ STATUS
    // =========================

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);


// ==========================================
// MESSAGE HISTORY INDEX
// ==========================================

messageSchema.index({
  conversation: 1,
  createdAt: 1,
});


const Message = mongoose.model(
  "Message",
  messageSchema
);

export default Message;