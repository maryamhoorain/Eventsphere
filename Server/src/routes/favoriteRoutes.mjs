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
    "/:eventId",
    authMiddleware,
    authorizeRoles("attendee"),
    addFavorite
);


// Remove favorite
router.delete(
    "/:eventId",
    authMiddleware,
    authorizeRoles("attendee"),
    removeFavorite
);


// Get my favorites
router.get(
    "/my",
    authMiddleware,
    authorizeRoles("attendee"),
    getMyFavorites
);


// Check favorite
router.get(
    "/check/:eventId",
    authMiddleware,
    authorizeRoles("attendee"),
    checkFavorite
);


export default router;