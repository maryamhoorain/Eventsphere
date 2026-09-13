import express from "express";

import {
  createBooth,
  getEventBooths,
  getAvailableBooths,
  updateBooth,
  assignBooth,
  releaseBooth,
  getMyBooths,
  deleteBooth,
} from "../controllers/boothController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import authorizeRoles from "../middleware/roleMiddleware.mjs";

const router = express.Router();

router.post(
  "/event/:eventId",
  authMiddleware,
  authorizeRoles("admin", "organizer"),
  createBooth
);

router.get(
  "/event/:eventId",
  authMiddleware,
  authorizeRoles("admin", "organizer"),
  getEventBooths
);

router.patch(
  "/:id",
  authMiddleware,
  authorizeRoles("admin", "organizer"),
  updateBooth
);

router.patch(
  "/:id/assign",
  authMiddleware,
  authorizeRoles("admin", "organizer"),
  assignBooth
);

router.patch(
  "/:id/release",
  authMiddleware,
  authorizeRoles("admin", "organizer"),
  releaseBooth
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("admin", "organizer"),
  deleteBooth
);

router.get(
  "/event/:eventId/available",
  authMiddleware,
  authorizeRoles("exhibitor"),
  getAvailableBooths
);

router.get(
  "/my",
  authMiddleware,
  authorizeRoles("exhibitor"),
  getMyBooths
);

export default router;