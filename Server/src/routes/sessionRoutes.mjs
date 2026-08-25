import express from "express";

import {
    createSession,
    getEventSessions,
    getSessionById,
    updateSession,
    deleteSession
} from "../controllers/sessionController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import authorizeRoles from "../middleware/roleMiddleware.mjs";

const router = express.Router();


// ==========================================
// ADMIN ROUTES
// ==========================================

// Create session for an event
router.post(
    "/event/:eventId",
    authMiddleware,
    authorizeRoles("admin"),
    createSession
);


// Update session
router.patch(
    "/:id",
    authMiddleware,
    authorizeRoles("admin"),
    updateSession
);


// Delete session
router.delete(
    "/:id",
    authMiddleware,
    authorizeRoles("admin"),
    deleteSession
);


// ==========================================
// AUTHENTICATED USER ROUTES
// ==========================================

// Get all sessions for an event
router.get(
    "/event/:eventId",
    authMiddleware,
    getEventSessions
);


// Get one session
router.get(
    "/:id",
    authMiddleware,
    getSessionById
);


export default router;