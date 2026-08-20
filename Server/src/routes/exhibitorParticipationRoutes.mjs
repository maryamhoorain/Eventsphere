import express from "express";

import {
    applyForEvent,
    getMyApplications,
    getApplicationById,
    cancelApplication,
    getEventApplications,
    approveApplication,
    rejectApplication
} from "../controllers/exhibitorParticipationController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import authorizeRoles from "../middleware/roleMiddleware.mjs";

const router = express.Router();


// ==========================================
// ADMIN / ORGANIZER
// ==========================================

router.get(
    "/event/:eventId",
    authMiddleware,
    authorizeRoles("admin"),
    getEventApplications
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


// ==========================================
// EXHIBITOR
// ==========================================

router.post(
    "/:eventId",
    authMiddleware,
    authorizeRoles("exhibitor"),
    applyForEvent
);

router.get(
    "/my",
    authMiddleware,
    authorizeRoles("exhibitor"),
    getMyApplications
);

router.get(
    "/:id",
    authMiddleware,
    authorizeRoles("exhibitor"),
    getApplicationById
);

router.patch(
    "/:id/cancel",
    authMiddleware,
    authorizeRoles("exhibitor"),
    cancelApplication
);


export default router;