import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    // ==========================================
    // PARTICIPANTS
    // ==========================================

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    // ==========================================
    // LAST MESSAGE
    // Used for conversation previews
    // ==========================================

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    lastMessageAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // ACTIVE / INACTIVE
    // ==========================================

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);


// ==========================================
// INDEX
// ==========================================

conversationSchema.index({
  participants: 1,
  lastMessageAt: -1,
});


const Conversation = mongoose.model(
  "Conversation",
  conversationSchema
);

export default Conversation;