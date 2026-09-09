import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
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
    // EVENT
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
    // EVENT CHECK-IN
    // ==========================================

    checkedInAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // REGISTRATION DATE
    // ==========================================

    registrationDate: {
      type: Date,
      default: Date.now,
    },

    // ==========================================
    // EVENT TICKET
    // ==========================================

    ticketCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// PREVENT DUPLICATE EVENT REGISTRATION
// ==========================================

registrationSchema.index(
  {
    attendee: 1,
    event: 1,
  },
  {
    unique: true,
  }
);

const Registration = mongoose.model(
  "Registration",
  registrationSchema
);

export default Registration;