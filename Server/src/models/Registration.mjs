import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    attendee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    status: {
      type: String,
      enum: ["registered", "cancelled", "attended"],
      default: "registered",
    },
    checkedInAt: {
      type: Date,
      default: null,
    },

    registrationDate: {
      type: Date,
      default: Date.now,
    },

    ticketCode: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  },
);
// Prevent duplicate registration for the same event
registrationSchema.index({ attendee: 1, event: 1 }, { unique: true });

const Registration = mongoose.model("Registration", registrationSchema);

export default Registration;
