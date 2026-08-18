import express from "express";

import {
    applyAsExhibitor,
    getApplications,
    approveApplication,
    rejectApplication
} from "../controllers/exhibitorController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import authorizeRoles from "../middleware/roleMiddleware.mjs";

const router = express.Router();

// Attendee
router.post(
    "/apply",
    authMiddleware,
    authorizeRoles("attendee"),
    applyAsExhibitor
);

// Admin / Organizer
router.get(
    "/applications",
    authMiddleware,
    authorizeRoles("admin"),
    getApplications
);

router.patch(
    "/:id/approve",
    authMiddleware,
    authorizeRoles("admin"),
    approveApplication
);

router.patch(
    "/:id/reject",
    authMiddleware,
    authorizeRoles("admin"),
    rejectApplication
);

export default router;