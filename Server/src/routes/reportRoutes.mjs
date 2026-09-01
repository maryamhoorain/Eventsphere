import express from "express";

import {
    createReport,
    getReports,
    downloadReportController,
    deleteReportController
} from "../controllers/reportController.mjs";

import authMiddleware
    from "../middleware/authMiddleware.mjs";

import authorizeRoles
    from "../middleware/roleMiddleware.mjs";


const reportRouter =
    express.Router();


// ======================================================
// GENERATE REPORT
// ADMIN / ORGANIZER / EXHIBITOR
// ======================================================

reportRouter.post(

    "/events/:eventId",

    authMiddleware,

    authorizeRoles(
        "admin",
        "exhibitor"
    ),

    createReport

);


// ======================================================
// GET PREVIOUSLY GENERATED REPORTS
// ADMIN / ORGANIZER / EXHIBITOR
// ======================================================

reportRouter.get(

    "/events/:eventId",

    authMiddleware,

    authorizeRoles(
        "admin",
        "exhibitor"
    ),

    getReports

);
// ======================================================
// DOWNLOAD REPORT
// ======================================================

reportRouter.get(
    "/:reportId/download",
    authMiddleware,
    authorizeRoles(
        "admin",
        "exhibitor"
    ),
    downloadReportController
);

// ======================================================
// DELETE REPORT
// ======================================================

reportRouter.delete(
    "/:reportId",
    authMiddleware,
    authorizeRoles(
        "admin",
        "exhibitor"
    ),
    deleteReportController
);


export default reportRouter;