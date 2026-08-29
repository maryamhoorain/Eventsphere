import express from "express";

import {
    registerForSession,
    getMySessionRegistrations,
    getSessionRegistrationById,
    cancelSessionRegistration,
    getSessionRegistrationStatus
} from "../controllers/sessionRegistrationController.mjs";

import authMiddleware
    from "../middleware/authMiddleware.mjs";

import authorizeRoles
    from "../middleware/roleMiddleware.mjs";


const router = express.Router();


// ==========================================
// ATTENDEE SESSION REGISTRATION
// ==========================================

// Register for session
router.post(
    "/:sessionId",
    authMiddleware,
    authorizeRoles("attendee"),
    registerForSession
);


// Get my session registrations
router.get(
    "/my",
    authMiddleware,
    authorizeRoles("attendee"),
    getMySessionRegistrations
);


// Check registration status
router.get(
    "/session/:sessionId/status",
    authMiddleware,
    authorizeRoles("attendee"),
    getSessionRegistrationStatus
);


// Get registration details
router.get(
    "/:id",
    authMiddleware,
    authorizeRoles("attendee"),
    getSessionRegistrationById
);


// Cancel session registration
router.patch(
    "/:id/cancel",
    authMiddleware,
    authorizeRoles("attendee"),
    cancelSessionRegistration
);


export default router;