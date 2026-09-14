import express from "express";

import {
    createBooth,
    getEventBooths,
    getEventBoothMap,
    getAvailableBooths,
    requestBooth,
    getPendingBooths,
    approveBoothRequest,
    rejectBoothRequest,
    updateBooth,
    assignBooth,
    releaseBooth,
    getMyBooths,
    getMyBoothRequests,
    deleteBooth
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
  "/event/:eventId/map",
  authMiddleware,
  authorizeRoles("admin", "organizer", "exhibitor"),
  getEventBoothMap
);

router.get(
  "/event/:eventId",
  authMiddleware,
  authorizeRoles("admin", "organizer"),
  getEventBooths
);

router.get("/pending", authMiddleware, authorizeRoles("admin"), getPendingBooths);

router.patch(
  "/:id",
  authMiddleware,
  authorizeRoles("admin", "organizer"),
  updateBooth
);

router.post(
    "/:id/request",
    authMiddleware,
    authorizeRoles("exhibitor"),
    requestBooth
);

router.patch(
    "/:id/approve-request",
    authMiddleware,
    authorizeRoles("admin"),
    approveBoothRequest
);

router.patch(
    "/:id/reject-request",
    authMiddleware,
    authorizeRoles("admin"),
    rejectBoothRequest
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
  "/my/requests",
  authMiddleware,
  authorizeRoles("exhibitor"),
  getMyBoothRequests
);

router.get(
  "/my",
  authMiddleware,
  authorizeRoles("exhibitor"),
  getMyBooths
);

export default router;