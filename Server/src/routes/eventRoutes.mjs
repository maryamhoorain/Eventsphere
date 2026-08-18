import express from "express";

import {
    createEvent,
    getAllEvents,
    getEventById,
    publishEvent,
    updateEvent,
    deleteEvent
} from "../controllers/eventController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import authorizeRoles from "../middleware/roleMiddleware.mjs";

const router = express.Router();

// Public - get all published events
router.get("/", getAllEvents);

// Public - get single published event
router.get("/:id", getEventById);

router.patch(
    "/:id/publish",
    authMiddleware,
    authorizeRoles("admin"),
    publishEvent
);

router.post(
    "/",
    authMiddleware,
    authorizeRoles("admin"),
    createEvent
);
router.patch(
    "/:id",
    authMiddleware,
    authorizeRoles("admin"),
    updateEvent
);

router.delete(
    "/:id",
    authMiddleware,
    authorizeRoles("admin"),
    deleteEvent
);

export default router;