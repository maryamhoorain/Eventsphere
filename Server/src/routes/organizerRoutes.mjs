import express from "express";

import {
  getOrganizers,
  getOrganizerById,
  createOrganizer,
  updateOrganizer,
  activateOrganizer,
  deactivateOrganizer,
  demoteOrganizer,
  deleteOrganizer,
} from "../controllers/organizerController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import authorizeRoles from "../middleware/roleMiddleware.mjs";

const router = express.Router();

// All organizer management routes are admin-only.
router.use(authMiddleware, authorizeRoles("admin"));

router.get("/", getOrganizers);
router.get("/:id", getOrganizerById);
router.post("/", createOrganizer);
router.patch("/:id", updateOrganizer);
router.patch("/:id/activate", activateOrganizer);
router.patch("/:id/deactivate", deactivateOrganizer);
router.patch("/:id/demote", demoteOrganizer);
router.delete("/:id", deleteOrganizer);

export default router;
