import express from "express";

import {
    createBooth,
    getEventBooths,
    getAvailableBooths,
    updateBooth,
    assignBooth,
    releaseBooth,
    getMyBooths,
    deleteBooth
} from "../controllers/boothController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import authorizeRoles from "../middleware/roleMiddleware.mjs";

const router = express.Router();


// ==========================================
// ADMIN ROUTES
// ==========================================

// Create booth for an event
router.post(
    "/event/:eventId",
    authMiddleware,
    authorizeRoles("admin"),
    createBooth
);


// Get all booths for an event
router.get(
    "/event/:eventId",
    authMiddleware,
    authorizeRoles("admin"),
    getEventBooths
);


// Update booth
router.patch(
    "/:id",
    authMiddleware,
    authorizeRoles("admin"),
    updateBooth
);


// Assign booth to exhibitor
router.patch(
    "/:id/assign",
    authMiddleware,
    authorizeRoles("admin"),
    assignBooth
);


// Release booth
router.patch(
    "/:id/release",
    authMiddleware,
    authorizeRoles("admin"),
    releaseBooth
);


// Delete booth
router.delete(
    "/:id",
    authMiddleware,
    authorizeRoles("admin"),
    deleteBooth
);


// ==========================================
// EXHIBITOR ROUTES
// ==========================================

// Get available booths for an event
router.get(
    "/event/:eventId/available",
    authMiddleware,
    authorizeRoles("exhibitor"),
    getAvailableBooths
);


// Get my assigned booths
router.get(
    "/my",
    authMiddleware,
    authorizeRoles("exhibitor"),
    getMyBooths
);


export default router;