import express from "express";

import {
    addFavorite,
    removeFavorite,
    getMyFavorites,
    checkFavorite
} from "../controllers/favoriteController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import authorizeRoles from "../middleware/roleMiddleware.mjs";

const router = express.Router();


// ==========================================
// ATTENDEE FAVORITES
// ==========================================

// Add favorite
router.post(
    "/event/:eventId",
    authMiddleware,
    authorizeRoles("attendee"),
    addFavorite
);
router.post("/session/:sessionId", authMiddleware, authorizeRoles("attendee"), addFavorite);
router.post("/:eventId", authMiddleware, authorizeRoles("attendee"), addFavorite);


// Remove favorite
router.delete(
    "/event/:eventId",
    authMiddleware,
    authorizeRoles("attendee"),
    removeFavorite
);
router.delete("/session/:sessionId", authMiddleware, authorizeRoles("attendee"), removeFavorite);
router.delete("/:eventId", authMiddleware, authorizeRoles("attendee"), removeFavorite);


// Get my favorites
router.get(
    "/my",
    authMiddleware,
    authorizeRoles("attendee"),
    getMyFavorites
);


// Check favorite
router.get(
    "/check/event/:eventId",
    authMiddleware,
    authorizeRoles("attendee"),
    checkFavorite
);
router.get("/event/:eventId", authMiddleware, authorizeRoles("attendee"), checkFavorite);
router.get("/check/session/:sessionId", authMiddleware, authorizeRoles("attendee"), checkFavorite);
router.get("/session/:sessionId", authMiddleware, authorizeRoles("attendee"), checkFavorite);


export default router;