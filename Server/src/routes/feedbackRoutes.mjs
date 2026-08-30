import express from "express";

import {
  createBoothFeedback,
  getMyFeedback,
  getFeedbackById,
} from "../controllers/feedbackController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import authorizeRoles from "../middleware/roleMiddleware.mjs";

const router = express.Router();


// ==========================================
// CREATE BOOTH FEEDBACK
// ATTENDEE
// ==========================================

router.post(
  "/booth-visit/:boothVisitId",
  authMiddleware,
  authorizeRoles("attendee"),
  createBoothFeedback
);


// ==========================================
// GET MY FEEDBACK
// ATTENDEE
// ==========================================

router.get(
  "/my",
  authMiddleware,
  authorizeRoles("attendee"),
  getMyFeedback
);


// ==========================================
// GET FEEDBACK BY ID
// ATTENDEE
// ==========================================

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("attendee"),
  getFeedbackById
);


export default router;