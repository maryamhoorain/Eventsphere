import express from "express";
import { chatWithAI } from "../controllers/aiController.mjs";
import authMiddleware from "../middleware/authMiddleware.mjs";
import allowedRoles from "../middleware/roleMiddleware.mjs";

const router = express.Router();

router.post(
  "/chat",
  authMiddleware,
  allowedRoles("admin", "organizer", "exhibitor", "attendee"),
  chatWithAI,
);
export default router;
