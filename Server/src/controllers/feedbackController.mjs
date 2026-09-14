import Feedback from "../models/Feedback.mjs";
import BoothVisit from "../models/BoothVisit.mjs";
import Registration from "../models/Registration.mjs";
import Event from "../models/Event.mjs";
import Session from "../models/Session.mjs";
import SessionRegistration from "../models/SessionRegistration.mjs";


// ======================================================
// ALLOWED FEEDBACK REASONS
// ======================================================

const BOOTH_REASONS = [
  "poor_interaction",
  "staff_unavailable",
  "unclear_information",
  "poor_booth_setup",
  "product_or_service_issue",
  "other",
];

const SESSION_REASONS = [
  "poor_content",
  "speaker_issue",
  "too_long",
  "too_short",
  "technical_issue",
  "topic_not_as_expected",
  "other",
];


// ======================================================
// COMMON VALIDATION HELPERS
// ======================================================

const validateRating = (rating) => {
  if (
    rating === undefined ||
    rating === null ||
    rating === ""
  ) {
    return "Rating is required";
  }

  const numericRating = Number(rating);

  if (
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    return "Rating must be an integer between 1 and 5";
  }

  return null;
};


const validateLowRatingReason = (
  feedbackType,
  rating,
  reason
) => {
  // Only booth and session require a reason
  // when rating is below 3.

  if (
    (feedbackType === "booth" ||
      feedbackType === "session") &&
    rating < 3
  ) {
    if (!reason) {
      return "A reason is required for ratings below 3";
    }

    const allowedReasons =
      feedbackType === "booth"
        ? BOOTH_REASONS
        : SESSION_REASONS;

    if (!allowedReasons.includes(reason)) {
      return `Invalid reason for ${feedbackType} feedback`;
    }
  }

  return null;
};


const cleanOptionalText = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  return value.trim();
};


// ======================================================
// CREATE BOOTH FEEDBACK
// ATTENDEE
// ======================================================

const createBoothFeedback = async (req, res) => {
  try {
    const { boothVisitId } = req.params;

    const {
      rating,
      reason,
      reasonDetails,
      comment,
    } = req.body;

    const userId = req.user._id;

    // ==========================================
    // VALIDATE RATING
    // ==========================================

    const ratingError = validateRating(rating);

    if (ratingError) {
      return res.status(400).json({
        message: ratingError,
      });
    }

    const numericRating = Number(rating);

    // ==========================================
    // VALIDATE LOW RATING REASON
    // ==========================================

    const reasonError = validateLowRatingReason(
      "booth",
      numericRating,
      reason
    );

    if (reasonError) {
      return res.status(400).json({
        message: reasonError,
      });
    }

    // ==========================================
    // FIND BOOTH VISIT
    // ==========================================

    const boothVisit = await BoothVisit.findOne({
      _id: boothVisitId,
      attendee: userId,
    });

    if (!boothVisit) {
      return res.status(404).json({
        message:
          "Booth visit not found or you are not authorized to give feedback for this visit",
      });
    }

    // ==========================================
    // CHECK EXISTING FEEDBACK
    // ==========================================

    const existingFeedback =
      await Feedback.findOne({
        user: userId,
        boothVisit: boothVisit._id,
        feedbackType: "booth",
      });

    if (existingFeedback) {
      return res.status(400).json({
        message:
          "You have already submitted feedback for this booth visit",
        feedback: existingFeedback,
      });
    }

    // ==========================================
    // CREATE FEEDBACK
    // ==========================================

    const feedback = await Feedback.create({
      user: userId,
      event: boothVisit.event,
      booth: boothVisit.booth,
      boothVisit: boothVisit._id,
      feedbackType: "booth",
      rating: numericRating,
      reason: cleanOptionalText(reason),
      reasonDetails: cleanOptionalText(reasonDetails),
      comment: cleanOptionalText(comment),
    });

    // ==========================================
    // POPULATE
    // ==========================================

    const populatedFeedback =
      await Feedback.findById(feedback._id)
        .populate(
          "booth",
          "boothNumber size location price status"
        )
        .populate(
          "event",
          "title category location startDate endDate"
        )
        .populate(
          "boothVisit",
          "visitedAt"
        )
        .populate(
          "user",
          "name email"
        );

    res.status(201).json({
      success: true,
      message:
        "Booth feedback submitted successfully",
      feedback: populatedFeedback,
    });

  } catch (error) {
    console.error(
      "Create booth feedback error:",
      error.message
    );

    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "You have already submitted feedback for this booth visit",
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid booth visit ID",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};


// ======================================================
// CREATE EVENT FEEDBACK
// ATTENDEE
// ======================================================

const createEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;

    const {
      rating,
      reason,
      reasonDetails,
      comment,
    } = req.body;

    const userId = req.user._id;

    // ==========================================
    // VALIDATE RATING
    // ==========================================

    const ratingError = validateRating(rating);

    if (ratingError) {
      return res.status(400).json({
        message: ratingError,
      });
    }

    const numericRating = Number(rating);

    // ==========================================
    // CHECK EVENT
    // ==========================================

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // ==========================================
    // CHECK ATTENDANCE
    // ==========================================

    const registration =
      await Registration.findOne({
        attendee: userId,
        event: eventId,
        status: "attended",
      });

    if (!registration) {
      return res.status(403).json({
        message:
          "You can only give feedback for an event you attended",
      });
    }

    // ==========================================
    // CHECK EXISTING FEEDBACK
    // ==========================================

    const existingFeedback =
      await Feedback.findOne({
        user: userId,
        event: eventId,
        feedbackType: "event",
      });

    if (existingFeedback) {
      return res.status(400).json({
        message:
          "You have already submitted feedback for this event",
        feedback: existingFeedback,
      });
    }

    // ==========================================
    // CREATE
    // ==========================================

    const feedback = await Feedback.create({
      user: userId,
      event: eventId,
      feedbackType: "event",
      rating: numericRating,
      reason: cleanOptionalText(reason),
      reasonDetails: cleanOptionalText(reasonDetails),
      comment: cleanOptionalText(comment),
    });

    // ==========================================
    // POPULATE
    // ==========================================

    const populatedFeedback =
      await Feedback.findById(feedback._id)
        .populate(
          "event",
          "title category location startDate endDate"
        )
        .populate(
          "user",
          "name email"
        );

    res.status(201).json({
      success: true,
      message:
        "Event feedback submitted successfully",
      feedback: populatedFeedback,
    });

  } catch (error) {
    console.error(
      "Create event feedback error:",
      error.message
    );

    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "You have already submitted feedback for this event",
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid event ID",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};


// ======================================================
// CREATE SESSION FEEDBACK
// ATTENDEE
// ======================================================

const createSessionFeedback = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const {
      rating,
      reason,
      reasonDetails,
      comment,
    } = req.body;

    const userId = req.user._id;

    // ==========================================
    // VALIDATE RATING
    // ==========================================

    const ratingError = validateRating(rating);

    if (ratingError) {
      return res.status(400).json({
        message: ratingError,
      });
    }

    const numericRating = Number(rating);

    // ==========================================
    // VALIDATE LOW RATING REASON
    // ==========================================

    const reasonError = validateLowRatingReason(
      "session",
      numericRating,
      reason
    );

    if (reasonError) {
      return res.status(400).json({
        message: reasonError,
      });
    }

    // ==========================================
    // CHECK SESSION
    // ==========================================

    const session =
      await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    // ==========================================
    // CHECK SESSION ATTENDANCE
    // ==========================================

    const sessionRegistration =
      await SessionRegistration.findOne({
        attendee: userId,
        session: sessionId,
        status: "attended",
      });

    if (!sessionRegistration) {
      return res.status(403).json({
        message:
          "You can only give feedback for a session you attended",
      });
    }

    // ==========================================
    // CHECK EXISTING FEEDBACK
    // ==========================================

    const existingFeedback =
      await Feedback.findOne({
        user: userId,
        session: sessionId,
        feedbackType: "session",
      });

    if (existingFeedback) {
      return res.status(400).json({
        message:
          "You have already submitted feedback for this session",
        feedback: existingFeedback,
      });
    }

    // ==========================================
    // CREATE
    // ==========================================

    const feedback = await Feedback.create({
      user: userId,
      event: session.event,
      session: sessionId,
      feedbackType: "session",
      rating: numericRating,
      reason: cleanOptionalText(reason),
      reasonDetails: cleanOptionalText(reasonDetails),
      comment: cleanOptionalText(comment),
    });

    // ==========================================
    // POPULATE
    // ==========================================

    const populatedFeedback =
      await Feedback.findById(feedback._id)
        .populate(
          "event",
          "title category location startDate endDate"
        )
        .populate(
          "session",
          "title topic description speaker date startTime endTime location"
        )
        .populate(
          "user",
          "name email"
        );

    res.status(201).json({
      success: true,
      message:
        "Session feedback submitted successfully",
      feedback: populatedFeedback,
    });

  } catch (error) {
    console.error(
      "Create session feedback error:",
      error.message
    );

    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "You have already submitted feedback for this session",
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid session ID",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};


// ======================================================
// CREATE WEBSITE FEEDBACK
// ATTENDEE
// ======================================================

const createWebsiteFeedback = async (req, res) => {
  try {
    const {
      rating,
      comment,
    } = req.body;

    const userId = req.user._id;

    // ==========================================
    // VALIDATE RATING
    // ==========================================

    const ratingError = validateRating(rating);

    if (ratingError) {
      return res.status(400).json({
        message: ratingError,
      });
    }

    const numericRating = Number(rating);

    // ==========================================
    // CHECK EXISTING WEBSITE FEEDBACK
    // ==========================================

    const existingFeedback =
      await Feedback.findOne({
        user: userId,
        feedbackType: "website",
      });

    if (existingFeedback) {
      return res.status(400).json({
        message:
          "You have already submitted website feedback",
        feedback: existingFeedback,
      });
    }

    // ==========================================
    // CREATE
    // ==========================================

    const feedback = await Feedback.create({
      user: userId,
      event: null,
      feedbackType: "website",
      rating: numericRating,
      comment: cleanOptionalText(comment),
    });

    // ==========================================
    // POPULATE
    // ==========================================

    const populatedFeedback =
      await Feedback.findById(feedback._id)
        .populate(
          "user",
          "name email"
        );

    res.status(201).json({
      success: true,
      message:
        "Website feedback submitted successfully",
      feedback: populatedFeedback,
    });

  } catch (error) {
    console.error(
      "Create website feedback error:",
      error.message
    );

    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "You have already submitted website feedback",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};


// ======================================================
// GET MY FEEDBACK
// ATTENDEE
// ======================================================

const getMyFeedback = async (req, res) => {
  try {
    const feedback =
      await Feedback.find({
        user: req.user._id,
      })
        .populate(
          "booth",
          "boothNumber size location price status"
        )
        .populate(
          "event",
          "title category location startDate endDate"
        )
        .populate(
          "boothVisit",
          "visitedAt"
        )
        .populate(
          "session",
          "title topic description speaker date startTime endTime location"
        )
        .sort({
          createdAt: -1,
        });

    res.status(200).json({
      success: true,
      count: feedback.length,
      feedback,
    });

  } catch (error) {
    console.error(
      "Get my feedback error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getPublicFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({
      rating: { $gte: 1 },
      comment: { $nin: [null, ""] },
    })
      .select("feedbackType rating comment createdAt user event session booth")
      .populate("user", "name")
      .populate("event", "title")
      .populate("session", "title")
      .populate("booth", "boothNumber")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({ count: feedback.length, feedback });
  } catch (error) {
    console.error("Get public feedback error:", error.message);
    return res.status(500).json({ message: "Unable to load public feedback" });
  }
};


// ======================================================
// GET FEEDBACK BY ID
// ATTENDEE
// ======================================================

const getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback =
      await Feedback.findOne({
        _id: id,
        user: req.user._id,
      })
        .populate(
          "booth",
          "boothNumber size location price status"
        )
        .populate(
          "event",
          "title category location startDate endDate"
        )
        .populate(
          "boothVisit",
          "visitedAt"
        )
        .populate(
          "session",
          "title topic description speaker date startTime endTime location"
        );

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found",
      });
    }

    res.status(200).json({
      success: true,
      feedback,
    });

  } catch (error) {
    console.error(
      "Get feedback by ID error:",
      error.message
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid feedback ID",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};


// ======================================================
// UPDATE MY FEEDBACK
// ATTENDEE
// ======================================================

const updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      rating,
      reason,
      reasonDetails,
      comment,
    } = req.body;

    const userId = req.user._id;

    // ==========================================
    // FIND USER'S FEEDBACK
    // ==========================================

    const feedback =
      await Feedback.findOne({
        _id: id,
        user: userId,
      });

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found",
      });
    }

    // ==========================================
    // UPDATE RATING
    // ==========================================

    let finalRating = feedback.rating;

    if (rating !== undefined) {
      const ratingError =
        validateRating(rating);

      if (ratingError) {
        return res.status(400).json({
          message: ratingError,
        });
      }

      finalRating = Number(rating);
      feedback.rating = finalRating;
    }

    // ==========================================
    // UPDATE REASON
    // ==========================================

    let finalReason =
      reason !== undefined
        ? cleanOptionalText(reason)
        : feedback.reason;

    if (
      feedback.feedbackType === "booth" ||
      feedback.feedbackType === "session"
    ) {
      const reasonError =
        validateLowRatingReason(
          feedback.feedbackType,
          finalRating,
          finalReason
        );

      if (reasonError) {
        return res.status(400).json({
          message: reasonError,
        });
      }
    }

    if (reason !== undefined) {
      feedback.reason = finalReason;
    }

    // ==========================================
    // UPDATE REASON DETAILS
    // ==========================================

    if (reasonDetails !== undefined) {
      feedback.reasonDetails =
        cleanOptionalText(reasonDetails);
    }

    // ==========================================
    // UPDATE COMMENT
    // ==========================================

    if (comment !== undefined) {
      feedback.comment =
        cleanOptionalText(comment);
    }

    // ==========================================
    // CLEAN REASON WHEN RATING IS 3+
    // ==========================================

    if (
      finalRating >= 3 &&
      (feedback.feedbackType === "booth" ||
        feedback.feedbackType === "session")
    ) {
      feedback.reason = null;
      feedback.reasonDetails = null;
    }

    await feedback.save();

    // ==========================================
    // POPULATE
    // ==========================================

    const populatedFeedback =
      await Feedback.findById(feedback._id)
        .populate(
          "event",
          "title category location startDate endDate"
        )
        .populate(
          "booth",
          "boothNumber size location price status"
        )
        .populate(
          "boothVisit",
          "visitedAt"
        )
        .populate(
          "session",
          "title topic description speaker date startTime endTime location"
        )
        .populate(
          "user",
          "name email"
        );

    res.status(200).json({
      success: true,
      message:
        "Feedback updated successfully",
      feedback: populatedFeedback,
    });

  } catch (error) {
    console.error(
      "Update feedback error:",
      error.message
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid feedback ID",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};


// ======================================================
// DELETE FEEDBACK
// ADMIN / ORGANIZER
// ======================================================

const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const userId = req.user._id;
    const userRole = req.user.role;

    // ==========================================
    // FIND FEEDBACK
    // ==========================================

    const feedback =
      await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found",
      });
    }

    // ==========================================
    // ADMIN CAN DELETE ANY FEEDBACK
    // ==========================================

    if (userRole === "admin") {
      await Feedback.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message:
          "Feedback deleted successfully",
      });
    }

    // ==========================================
    // WEBSITE FEEDBACK
    //
    // Organizer cannot delete website feedback.
    // ==========================================

    if (feedback.feedbackType === "website") {
      return res.status(403).json({
        message:
          "Only an admin can delete website feedback",
      });
    }

    // ==========================================
    // FIND ASSOCIATED EVENT
    // ==========================================

    const event =
      await Event.findById(feedback.event);

    if (!event) {
      return res.status(404).json({
        message:
          "Associated event not found",
      });
    }

    // ==========================================
    // ORGANIZER CAN ONLY DELETE THEIR OWN
    // EVENT'S FEEDBACK
    // ==========================================

    if (userRole === "organizer") {
      if (
        event.organizer.toString() !==
        userId.toString()
      ) {
        return res.status(403).json({
          message:
            "You are not authorized to delete feedback for this event",
        });
      }
    }

    // ==========================================
    // DELETE
    // ==========================================

    await Feedback.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message:
        "Feedback deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete feedback error:",
      error.message
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid feedback ID",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};


export {
  createBoothFeedback,
  createEventFeedback,
  createSessionFeedback,
  createWebsiteFeedback,
  getMyFeedback,
  getPublicFeedback,
  getFeedbackById,
  updateFeedback,
  deleteFeedback,
};