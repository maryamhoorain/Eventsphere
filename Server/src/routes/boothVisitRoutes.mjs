import express from "express";

import {
    recordBoothVisit,
    getMyBoothVisits,
    getBoothVisitById
} from "../controllers/boothVisitController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";

import authorizeRoles from "../middleware/roleMiddleware.mjs";


const router = express.Router();


// ==========================================
// RECORD BOOTH VISIT
// EXHIBITOR
// ==========================================

router.post(
    "/:boothId",
    authMiddleware,
    authorizeRoles("exhibitor"),
    recordBoothVisit
);


// ==========================================
// GET MY BOOTH VISITS
// ATTENDEE
// ==========================================

router.get(
    "/my",
    authMiddleware,
    authorizeRoles("attendee"),
    getMyBoothVisits
);


// ==========================================
// GET BOOTH VISIT BY ID
// ATTENDEE
// ==========================================

router.get(
    "/:id",
    authMiddleware,
    authorizeRoles("attendee"),
    getBoothVisitById
);


export default router;