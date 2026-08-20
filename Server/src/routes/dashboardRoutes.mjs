import express from "express";

import {
    getAdminDashboard,
    getExhibitorDashboard,
    getAttendeeDashboard
} from "../controllers/dashboardController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import authorizeRoles from "../middleware/roleMiddleware.mjs";

const router = express.Router();


// ==========================================
// ADMIN / ORGANIZER
// ==========================================

router.get(
    "/admin",
    authMiddleware,
    authorizeRoles("admin"),
    getAdminDashboard
);


// ==========================================
// EXHIBITOR
// ==========================================

router.get(
    "/exhibitor",
    authMiddleware,
    authorizeRoles("exhibitor"),
    getExhibitorDashboard
);


// ==========================================
// ATTENDEE
// ==========================================

router.get(
    "/attendee",
    authMiddleware,
    authorizeRoles("attendee"),
    getAttendeeDashboard
);


export default router;