import express from "express";

import {
  createEvent,
  getAllEvents,
  getManagedEvents,
  getEventById,
  getManagedEventById,
  publishEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import authorizeRoles from "../middleware/roleMiddleware.mjs";
import upload from "../middleware/uploadMiddleware.mjs";

const router = express.Router();

// PUBLIC
router.get("/", getAllEvents);

// ADMIN / ORGANIZER — list drafts + published they can manage
// Must be declared before /:id
router.get(
  "/manage",
  authMiddleware,
  authorizeRoles("admin", "organizer"),
  getManagedEvents
);

router.get(
  "/manage/:id",
  authMiddleware,
  authorizeRoles("admin", "organizer"),
  getManagedEventById
);

router.get("/:id", getEventById);

router.patch(
  "/:id/publish",
  authMiddleware,
  authorizeRoles("admin", "organizer"),
  publishEvent
);

router.post(
  "/",
  authMiddleware,
  authorizeRoles("admin", "organizer"),
  upload.single("bannerImage"),
  createEvent
);

router.patch(
  "/:id",
  authMiddleware,
  authorizeRoles("admin", "organizer"),
  updateEvent
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("admin", "organizer"),
  deleteEvent
);

export default router;