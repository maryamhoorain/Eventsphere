import express from "express";

import {
  registerForSession,
  getMySessionRegistrations,
  getSessionRegistrationById,
  cancelSessionRegistration,
  getSessionRegistrationStatus,
} from "../controllers/sessionRegistrationController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import authorizeRoles from "../middleware/roleMiddleware.mjs";

const router = express.Router();

// ======================================================
// REGISTER FOR SESSION
//
// ATTENDEE
//
// If event registration does not exist,
// the backend automatically creates it.
// ======================================================

router.post(
  "/session/:sessionId",
  authMiddleware,
  authorizeRoles("attendee"),
  registerForSession
);

// ======================================================
// GET MY SESSION REGISTRATIONS
// ======================================================

router.get(
  "/my",
  authMiddleware,
  authorizeRoles("attendee"),
  getMySessionRegistrations
);

// ======================================================
// GET SESSION REGISTRATION BY ID
// ======================================================

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("attendee"),
  getSessionRegistrationById
);

// ======================================================
// CANCEL SESSION REGISTRATION
// ======================================================

router.put(
  "/:id/cancel",
  authMiddleware,
  authorizeRoles("attendee"),
  cancelSessionRegistration
);

// ======================================================
// SESSION REGISTRATION STATUS
// ======================================================

router.get(
  "/status/:sessionId",
  authMiddleware,
  authorizeRoles("attendee"),
  getSessionRegistrationStatus
);

export default router;