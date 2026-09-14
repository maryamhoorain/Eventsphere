import express from "express";

import {
  createBoothFeedback,
  createEventFeedback,
  createSessionFeedback,
  createWebsiteFeedback,
  getMyFeedback,
  getPublicFeedback,
  getFeedbackById,
  updateFeedback,
  deleteFeedback,
} from "../controllers/feedbackController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import authorizeRoles from "../middleware/roleMiddleware.mjs";

const router = express.Router();


// ======================================================
// CREATE BOOTH FEEDBACK
// ATTENDEE
// ======================================================

router.post(
  "/booth-visit/:boothVisitId",
  authMiddleware,
  authorizeRoles("attendee"),
  createBoothFeedback
);


// ======================================================
// CREATE EVENT FEEDBACK
// ATTENDEE
// ======================================================

router.post(
  "/event/:eventId",
  authMiddleware,
  authorizeRoles("attendee"),
  createEventFeedback
);


// ======================================================
// CREATE SESSION FEEDBACK
// ATTENDEE
// ======================================================

router.post(
  "/session/:sessionId",
  authMiddleware,
  authorizeRoles("attendee"),
  createSessionFeedback
);


// ======================================================
// CREATE WEBSITE FEEDBACK
// ATTENDEE
// ======================================================

router.post(
  "/website",
  authMiddleware,
  authorizeRoles("attendee"),
  createWebsiteFeedback
);


// ======================================================
// GET MY FEEDBACK
// ATTENDEE
// ======================================================

router.get(
  "/my",
  authMiddleware,
  authorizeRoles("attendee"),
  getMyFeedback
);

router.get("/public", getPublicFeedback);


// ======================================================
// UPDATE MY FEEDBACK
// ATTENDEE
// ======================================================

router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("attendee"),
  updateFeedback
);


// ======================================================
// DELETE FEEDBACK
// ADMIN / ORGANIZER
// ======================================================

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("admin", "organizer"),
  deleteFeedback
);


// ======================================================
// GET FEEDBACK BY ID
// ATTENDEE
// ======================================================

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("attendee"),
  getFeedbackById
);


export default router;