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
    // Required for booth, event and session
    // Not required for website feedback
    // ==========================================

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
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
        "website",
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
    // LOW RATING REASON
    //
    // Required for booth/session if rating < 3
    // ==========================================

    reason: {
      type: String,
      trim: true,
      default: null,
    },

    // ==========================================
    // REASON DETAILS
    // Optional additional explanation
    // ==========================================

    reasonDetails: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    // ==========================================
    // OPTIONAL COMMENT
    // ==========================================

    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
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
      event: {
        $exists: true,
        $ne: null,
      },
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

// ======================================================
// ONE WEBSITE FEEDBACK PER USER
// ======================================================

feedbackSchema.index(
  {
    user: 1,
    feedbackType: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      feedbackType: "website",
    },
  }
);

const Feedback = mongoose.model(
  "Feedback",
  feedbackSchema
);

export default Feedback;