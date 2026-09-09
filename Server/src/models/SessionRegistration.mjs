import mongoose from "mongoose";

const sessionRegistrationSchema = new mongoose.Schema(
  {
    // ==========================================
    // ATTENDEE
    // ==========================================

    attendee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==========================================
    // SESSION
    // ==========================================

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },

    // ==========================================
    // PARENT EVENT
    // ==========================================

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    // ==========================================
    // REGISTRATION STATUS
    // ==========================================

    status: {
      type: String,
      enum: ["registered", "cancelled", "attended"],
      default: "registered",
    },

    // ==========================================
    // REGISTRATION TIMESTAMPS
    // ==========================================

    registeredAt: {
      type: Date,
      default: Date.now,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    attendedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// ==========================================
// PREVENT DUPLICATE SESSION REGISTRATION
// ==========================================

sessionRegistrationSchema.index(
  {
    attendee: 1,
    session: 1,
  },
  {
    unique: true,
  },
);

const SessionRegistration = mongoose.model(
  "SessionRegistration",
  sessionRegistrationSchema,
);

export default SessionRegistration;
