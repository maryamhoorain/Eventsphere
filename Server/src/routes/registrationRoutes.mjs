import express from "express";

import {
    registerForEvent,
    getMyRegistrations,
    getRegistrationById,
    cancelRegistration,
    getEventRegistrations,
    verifyTicket,
    checkInAttendee
} from "../controllers/registrationController.mjs";

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
    getEventRegistrations
);

console.log("REGISTERING: POST /verify-ticket -> ADMIN");

router.post(
    "/verify-ticket",
    authMiddleware,
    authorizeRoles("admin"),
    verifyTicket
);

console.log("REGISTERING: POST /check-in -> ADMIN");

router.post(
    "/check-in",
    authMiddleware,
    authorizeRoles("admin"),
    checkInAttendee
);


// ==========================================
// ATTENDEE
// ==========================================

router.get(
    "/my",
    authMiddleware,
    authorizeRoles("attendee"),
    getMyRegistrations
);

console.log("REGISTERING: POST /:eventId -> ATTENDEE");

router.post(
    "/:eventId",
    authMiddleware,
    authorizeRoles("attendee"),
    registerForEvent
);

router.get(
    "/:id",
    authMiddleware,
    authorizeRoles("attendee"),
    getRegistrationById
);

router.patch(
    "/:id/cancel",
    authMiddleware,
    authorizeRoles("attendee"),
    cancelRegistration
);

export default router;