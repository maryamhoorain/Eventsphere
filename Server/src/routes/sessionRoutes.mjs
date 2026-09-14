import express from "express";

import {
  createSession,
  getEventSessions,
  getSessionById,
  updateSession,
  deleteSession,
} from "../controllers/sessionController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import authorizeRoles from "../middleware/roleMiddleware.mjs";

const router = express.Router();

router.post(
  "/event/:eventId",
  authMiddleware,
  authorizeRoles("admin", "organizer"),
  createSession
);

router.patch(
  "/:id",
  authMiddleware,
  authorizeRoles("admin", "organizer"),
  updateSession
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("admin", "organizer"),
  deleteSession
);

router.get("/event/:eventId", getEventSessions);

router.get("/:id", getSessionById);

export default router;