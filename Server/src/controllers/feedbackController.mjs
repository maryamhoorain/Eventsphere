import Feedback from "../models/Feedback.mjs";
import BoothVisit from "../models/BoothVisit.mjs";
import Registration from "../models/Registration.mjs";
import Event from "../models/Event.mjs";
import Session from "../models/Session.mjs";
import SessionRegistration from "../models/SessionRegistration.mjs";


// ==========================================
// CREATE BOOTH FEEDBACK
// ATTENDEE
// ==========================================

const createBoothFeedback = async (req, res) => {
  try {
    const { boothVisitId } = req.params;
    const { rating, comment } = req.body;

    const userId = req.user._id;

    // ==========================================
    // VALIDATE RATING
    // ==========================================

    if (rating === undefined || rating === null) {
      return res.status(400).json({
        message: "Rating is required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
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
    // CHECK IF FEEDBACK ALREADY EXISTS
    // ==========================================

    const existingFeedback = await Feedback.findOne({
      user: userId,
      boothVisit: boothVisit._id,
    });

    if (existingFeedback) {
      return res.status(400).json({
        message: "You have already submitted feedback for this booth visit",
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
      rating,
      comment: comment || null,
    });

    // ==========================================
    // RETURN POPULATED FEEDBACK
    // ==========================================

    const populatedFeedback = await Feedback.findById(feedback._id)
      .populate("booth", "boothNumber size location price")
      .populate("event", "title category")
      .populate("boothVisit", "visitedAt");

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback: populatedFeedback,
    });
  } catch (error) {
    console.error("Create booth feedback error:", error.message);

    // Handle duplicate index error
    if (error.code === 11000) {
      return res.status(400).json({
        message: "You have already submitted feedback for this booth visit",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET MY FEEDBACK
// ATTENDEE
// ==========================================

const getMyFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({
      user: req.user._id,
    })
      .populate("booth", "boothNumber size location price status")
      .populate("event", "title category location startDate endDate")
      .populate("boothVisit", "visitedAt")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      count: feedback.length,
      feedback,
    });
  } catch (error) {
    console.error("Get my feedback error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET FEEDBACK BY ID
// ATTENDEE
// ==========================================

const getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findOne({
      _id: id,
      user: req.user._id,
    })
      .populate("booth", "boothNumber size location price status")
      .populate("event", "title category location startDate endDate")
      .populate("boothVisit", "visitedAt");

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found",
      });
    }

    res.status(200).json({
      feedback,
    });
  } catch (error) {
    console.error("Get feedback by ID error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// CREATE EVENT FEEDBACK
// ATTENDEE
// ==========================================

const createEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, comment } = req.body;

    const userId = req.user._id;

    // ==========================================
    // VALIDATE RATING
    // ==========================================

    if (rating === undefined || rating === null) {
      return res.status(400).json({
        message: "Rating is required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    // ==========================================
    // CHECK EVENT EXISTS
    // ==========================================

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // ==========================================
    // CHECK ATTENDEE PARTICIPATED IN EVENT
    // ==========================================

    const registration = await Registration.findOne({
      attendee: userId,
      event: eventId,
      status: "attended",
    });

    if (!registration) {
      return res.status(403).json({
        message: "You can only give feedback for an event you attended",
      });
    }

    // ==========================================
    // CHECK IF FEEDBACK ALREADY EXISTS
    // ==========================================

    const existingFeedback = await Feedback.findOne({
      user: userId,
      event: eventId,
      feedbackType: "event",
    });

    if (existingFeedback) {
      return res.status(400).json({
        message: "You have already submitted feedback for this event",
        feedback: existingFeedback,
      });
    }

    // ==========================================
    // CREATE EVENT FEEDBACK
    // ==========================================

    const feedback = await Feedback.create({
      user: userId,
      event: eventId,
      feedbackType: "event",
      rating,
      comment: comment || null,
    });

    // ==========================================
    // RETURN POPULATED FEEDBACK
    // ==========================================

    const populatedFeedback = await Feedback.findById(feedback._id)
      .populate("event", "title category location startDate endDate")
      .populate("user", "name email");

    res.status(201).json({
      message: "Event feedback submitted successfully",
      feedback: populatedFeedback,
    });
  } catch (error) {
    console.error("Create event feedback error:", error.message);

    // ==========================================
    // HANDLE DUPLICATE FEEDBACK
    // ==========================================

    if (error.code === 11000) {
      return res.status(400).json({
        message: "You have already submitted feedback for this event",
      });
    }

    // ==========================================
    // INVALID OBJECT ID
    // ==========================================

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

// ==========================================
// CREATE SESSION FEEDBACK
// ATTENDEE
// ==========================================

const createSessionFeedback = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { rating, comment } = req.body;

    const userId = req.user._id;

    // ==========================================
    // VALIDATE RATING
    // ==========================================

    if (rating === undefined || rating === null) {
      return res.status(400).json({
        message: "Rating is required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    // ==========================================
    // CHECK SESSION EXISTS
    // ==========================================

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    // ==========================================
    // CHECK ATTENDEE ATTENDED THE SESSION
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
    // CHECK IF FEEDBACK ALREADY EXISTS
    // ==========================================

    const existingFeedback = await Feedback.findOne({
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
    // CREATE SESSION FEEDBACK
    // ==========================================

    const feedback = await Feedback.create({
      user: userId,
      event: session.event,
      session: sessionId,
      feedbackType: "session",
      rating,
      comment: comment || null,
    });

    // ==========================================
    // RETURN POPULATED FEEDBACK
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
      message: "Session feedback submitted successfully",
      feedback: populatedFeedback,
    });

  } catch (error) {
    console.error(
      "Create session feedback error:",
      error.message
    );

    // ==========================================
    // HANDLE DUPLICATE FEEDBACK
    // ==========================================

    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "You have already submitted feedback for this session",
      });
    }

    // ==========================================
    // INVALID OBJECT ID
    // ==========================================

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

// ==========================================
// UPDATE MY FEEDBACK
// ATTENDEE
// ==========================================

const updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const userId = req.user._id;

    // ==========================================
    // FIND FEEDBACK BELONGING TO CURRENT USER
    // ==========================================

    const feedback = await Feedback.findOne({
      _id: id,
      user: userId,
    });

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found",
      });
    }

    // ==========================================
    // VALIDATE RATING IF PROVIDED
    // ==========================================

    if (rating !== undefined) {
      if (
        typeof rating !== "number" ||
        rating < 1 ||
        rating > 5
      ) {
        return res.status(400).json({
          message: "Rating must be a number between 1 and 5",
        });
      }

      feedback.rating = rating;
    }

    // ==========================================
    // UPDATE COMMENT IF PROVIDED
    // ==========================================

    if (comment !== undefined) {
      feedback.comment =
        comment === "" ? null : comment;
    }

    // ==========================================
    // SAVE CHANGES
    // ==========================================

    await feedback.save();

    // ==========================================
    // RETURN POPULATED FEEDBACK
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
        );

    res.status(200).json({
      message: "Feedback updated successfully",
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

// ==========================================
// DELETE FEEDBACK
// ADMIN / ORGANIZER
// ==========================================

const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const userId = req.user._id;

    // ==========================================
    // FIND FEEDBACK
    // ==========================================

    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found",
      });
    }

    // ==========================================
    // FIND EVENT
    // ==========================================

    const event = await Event.findById(
      feedback.event
    );

    if (!event) {
      return res.status(404).json({
        message: "Associated event not found",
      });
    }

    // ==========================================
    // CHECK EVENT ORGANIZER
    // ==========================================

    if (
      event.organizer.toString() !==
      userId.toString()
    ) {
      return res.status(403).json({
        message:
          "You are not authorized to delete feedback for this event",
      });
    }

    // ==========================================
    // DELETE FEEDBACK
    // ==========================================

    await Feedback.findByIdAndDelete(id);

    res.status(200).json({
      message: "Feedback deleted successfully",
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
  getMyFeedback,
  getFeedbackById,
  updateFeedback,
  deleteFeedback,
};
