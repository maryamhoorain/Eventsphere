import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    booth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booth",
      required: true,
    },

    boothVisit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BoothVisit",
      required: true,
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One feedback per attendee per booth visit
feedbackSchema.index(
  {
    user: 1,
    boothVisit: 1,
  },
  {
    unique: true,
  }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;