import express from "express";

import {
  registerForEvent,
  getMyRegistrations,
  getRegistrationById,
  cancelRegistration,
  getEventRegistrations,
  verifyTicket,
  checkInAttendee,
} from "../controllers/registrationController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import authorizeRoles from "../middleware/roleMiddleware.mjs";

const router = express.Router();

// ======================================================
// COMBINED EVENT + SESSION REGISTRATION
//
// ATTENDEE
//
// Body:
// {
//   "eventId": "...",
//   "sessionIds": ["...", "..."]
// }
//
// Event ID can be omitted when sessionIds are provided.
// ======================================================

router.post(
  "/",
  authMiddleware,
  authorizeRoles("attendee"),
  registerForEvent
);

// ======================================================
// GET MY EVENT REGISTRATIONS
// ATTENDEE
// ======================================================

router.get(
  "/my",
  authMiddleware,
  authorizeRoles("attendee"),
  getMyRegistrations
);

// ======================================================
// GET REGISTRATION BY ID
// ATTENDEE
// ======================================================

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("attendee"),
  getRegistrationById
);

// ======================================================
// CANCEL EVENT REGISTRATION
// ATTENDEE
// ======================================================

router.put(
  "/:id/cancel",
  authMiddleware,
  authorizeRoles("attendee"),
  cancelRegistration
);

// ======================================================
// GET EVENT REGISTRATIONS
// ADMIN / ORGANIZER
// ======================================================

router.get(
  "/event/:eventId",
  authMiddleware,
  authorizeRoles(
    "admin",
    "organizer"
  ),
  getEventRegistrations
);

// ======================================================
// VERIFY EVENT TICKET
// ADMIN / ORGANIZER
// ======================================================

router.post(
  "/verify-ticket",
  authMiddleware,
  authorizeRoles(
    "admin",
    "organizer"
  ),
  verifyTicket
);

// ======================================================
// CHECK-IN ATTENDEE
// ADMIN / ORGANIZER
// ======================================================

router.post(
  "/check-in",
  authMiddleware,
  authorizeRoles(
    "admin",
    "organizer"
  ),
  checkInAttendee
);

export default router;