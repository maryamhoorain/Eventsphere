import express from "express";

import {
    eventOverview,
    registrationAnalytics,
    exhibitorAnalytics,
    boothAnalytics,
    visitorAnalytics,
    feedbackAnalytics,

    // Exhibitor analytics
    myExhibitorOverview,
    myBoothAnalytics,
    myVisitorAnalytics,
    myFeedbackAnalytics
} from "../controllers/analyticsController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import authorizeRoles from "../middleware/roleMiddleware.mjs";

const analyticsRouter = express.Router();


// ======================================================
// ADMIN / ORGANIZER ANALYTICS
// ======================================================


// ==========================================
// EVENT OVERVIEW
// ==========================================

analyticsRouter.get(
    "/events/:eventId/overview",
    authMiddleware,
    authorizeRoles("admin", "organizer"),
    eventOverview
);


// ==========================================
// REGISTRATION ANALYTICS
// ==========================================

analyticsRouter.get(
    "/events/:eventId/registrations",
    authMiddleware,
    authorizeRoles("admin", "organizer"),
    registrationAnalytics
);


// ==========================================
// EXHIBITOR ANALYTICS
// ==========================================

analyticsRouter.get(
    "/events/:eventId/exhibitors",
    authMiddleware,
    authorizeRoles("admin", "organizer"),
    exhibitorAnalytics
);


// ==========================================
// BOOTH ANALYTICS
// ==========================================

analyticsRouter.get(
    "/events/:eventId/booths",
    authMiddleware,
    authorizeRoles("admin", "organizer"),
    boothAnalytics
);


// ==========================================
// VISITOR ANALYTICS
// ==========================================

analyticsRouter.get(
    "/events/:eventId/visitors",
    authMiddleware,
    authorizeRoles("admin", "organizer"),
    visitorAnalytics
);


// ==========================================
// FEEDBACK ANALYTICS
// ==========================================

analyticsRouter.get(
    "/events/:eventId/feedback",
    authMiddleware,
    authorizeRoles("admin", "organizer"),
    feedbackAnalytics
);



// ======================================================
// EXHIBITOR ANALYTICS
// EXHIBITOR CAN ONLY SEE THEIR OWN DATA
// ======================================================


// ==========================================
// MY EXHIBITOR OVERVIEW
// ==========================================

analyticsRouter.get(
    "/events/:eventId/my-overview",
    authMiddleware,
    authorizeRoles("exhibitor"),
    myExhibitorOverview
);


// ==========================================
// MY BOOTH ANALYTICS
// ==========================================

analyticsRouter.get(
    "/events/:eventId/my-booth",
    authMiddleware,
    authorizeRoles("exhibitor"),
    myBoothAnalytics
);


// ==========================================
// MY VISITOR ANALYTICS
// ==========================================

analyticsRouter.get(
    "/events/:eventId/my-visitors",
    authMiddleware,
    authorizeRoles("exhibitor"),
    myVisitorAnalytics
);

//myFeedbackAnalytics
analyticsRouter.get(
    "/events/:eventId/my-feedback",
    authMiddleware,
    authorizeRoles("exhibitor"),
    myFeedbackAnalytics
);

export default analyticsRouter;