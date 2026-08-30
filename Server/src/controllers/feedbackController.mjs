import Feedback from "../models/Feedback.mjs";
import BoothVisit from "../models/BoothVisit.mjs";


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
      rating,
      comment: comment || null,
    });

    // ==========================================
    // RETURN POPULATED FEEDBACK
    // ==========================================

    const populatedFeedback = await Feedback.findById(
      feedback._id
    )
      .populate("booth", "boothNumber size location price")
      .populate("event", "title category")
      .populate("boothVisit", "visitedAt");

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback: populatedFeedback,
    });

  } catch (error) {
    console.error(
      "Create booth feedback error:",
      error.message
    );

    // Handle duplicate index error
    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "You have already submitted feedback for this booth visit",
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
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
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
      );

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found",
      });
    }

    res.status(200).json({
      feedback,
    });

  } catch (error) {
    console.error(
      "Get feedback by ID error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


export {
  createBoothFeedback,
  getMyFeedback,
  getFeedbackById,
};