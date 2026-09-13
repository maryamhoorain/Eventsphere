import express from "express";

import {
  submitOrganizerApplication,
  getMyOrganizerApplication,
  getOrganizerApplications,
  getOrganizerApplicationById,
  approveOrganizerApplication,
  rejectOrganizerApplication,
} from "../controllers/organizerApplicationController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import roleMiddleware from "../middleware/roleMiddleware.mjs";

const router = express.Router();

// ======================================================
// ATTENDEE
// ======================================================

// Submit organizer application
router.post(
  "/",
  authMiddleware,
  roleMiddleware("attendee"),
  submitOrganizerApplication
);

// Get current user's application
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("attendee", "organizer"),
  getMyOrganizerApplication
);

// ======================================================
// ADMIN
// ======================================================

// Get all applications
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  getOrganizerApplications
);

// Get single application
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  getOrganizerApplicationById
);

// Approve application
router.patch(
  "/:id/approve",
  authMiddleware,
  roleMiddleware("admin"),
  approveOrganizerApplication
);

// Reject application
router.patch(
  "/:id/reject",
  authMiddleware,
  roleMiddleware("admin"),
  rejectOrganizerApplication
);

export default router;