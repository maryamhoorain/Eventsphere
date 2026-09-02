import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    // ==========================================
    // USER WHO SUBMITTED FEEDBACK
    // ==========================================

    user: {
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
    // BOOTH
    // Only used for booth feedback
    // ==========================================

    booth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booth",
      default: null,
    },

    // ==========================================
    // BOOTH VISIT
    // Only used for booth feedback
    // ==========================================

    boothVisit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BoothVisit",
      default: null,
    },

    // ==========================================
    // SESSION
    // Only used for session feedback
    // ==========================================

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null,
    },

    // ==========================================
    // FEEDBACK TYPE
    // ==========================================

    feedbackType: {
      type: String,
      enum: [
        "booth",
        "event",
        "session",
      ],
      required: true,
    },

    // ==========================================
    // RATING
    // ==========================================

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // ==========================================
    // COMMENT
    // ==========================================

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


// ======================================================
// ONE BOOTH FEEDBACK PER ATTENDEE PER BOOTH VISIT
// ======================================================

feedbackSchema.index(
  {
    user: 1,
    boothVisit: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      feedbackType: "booth",
      boothVisit: {
        $exists: true,
        $ne: null,
      },
    },
  }
);


// ======================================================
// ONE EVENT FEEDBACK PER ATTENDEE PER EVENT
// ======================================================

feedbackSchema.index(
  {
    user: 1,
    event: 1,
    feedbackType: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      feedbackType: "event",
    },
  }
);


// ======================================================
// ONE SESSION FEEDBACK PER ATTENDEE PER SESSION
// ======================================================

feedbackSchema.index(
  {
    user: 1,
    session: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      feedbackType: "session",
      session: {
        $exists: true,
        $ne: null,
      },
    },
  }
);


const Feedback =
  mongoose.model(
    "Feedback",
    feedbackSchema
  );

export default Feedback;