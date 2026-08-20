import express from "express";

import {
    registerForEvent,
    getMyRegistrations,
    getRegistrationById,
    cancelRegistration
} from "../controllers/registrationController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import authorizeRoles from "../middleware/roleMiddleware.mjs";

const router = express.Router();

// Register for an event
router.post(
    "/:eventId",
    authMiddleware,
    authorizeRoles("attendee"),
    registerForEvent
);

// Get all registrations of logged-in attendee
router.get(
    "/my",
    authMiddleware,
    authorizeRoles("attendee"),
    getMyRegistrations
);

// Get one registration
router.get(
    "/:id",
    authMiddleware,
    authorizeRoles("attendee"),
    getRegistrationById
);

// Cancel registration
router.patch(
    "/:id/cancel",
    authMiddleware,
    authorizeRoles("attendee"),
    cancelRegistration
);

export default router;