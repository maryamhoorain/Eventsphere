import Event from "../models/Event.mjs";
import Report from "../models/Report.mjs";
import authorizeEventAccess from "../utils/authorizeEventAccess.mjs";

import {
    getEventOverview,
    getRegistrationAnalytics,
    getExhibitorAnalytics,
    getBoothAnalytics,
    getVisitorAnalytics,
    getFeedbackAnalytics,
    getMyExhibitorOverview,
    getMyBoothAnalytics,
    getMyVisitorAnalytics,
    getMyFeedbackAnalytics
} from "./analyticsService.mjs";

import generatePdfReport
    from "../utils/reportGenerators/pdfGenerator.mjs";

import generateExcelReport
    from "../utils/reportGenerators/excelGenerator.mjs";

import generateWordReport
    from "../utils/reportGenerators/wordGenerator.mjs";

import uploadToCloudinary
    from "../utils/uploadToCloudinary.mjs";

import deleteFromCloudinary
    from "../utils/deleteFromCloudinary.mjs";

import ExhibitorParticipation
    from "../models/ExhibitorParticipation.mjs";


// ======================================================
// REPORT CONFIGURATION
// ======================================================

const reportTitles = {

    event_overview:
        "Event Overview Report",

    registration:
        "Registration Analytics Report",

    exhibitor:
        "Exhibitor Analytics Report",

    booth:
        "Booth Analytics Report",

    visitor:
        "Visitor Analytics Report",

    feedback:
        "Feedback Analytics Report",

    complete_event:
        "Complete Event Report",

    my_exhibitor_overview:
        "My Exhibitor Overview Report",

    my_booth:
        "My Booth Analytics Report",

    my_visitors:
        "My Visitor Analytics Report",

    my_feedback:
        "My Feedback Analytics Report"

};


// ======================================================
// GET ANALYTICS DATA FOR REPORT
// ======================================================

const getReportData = async ({
    reportType,
    eventId,
    userId
}) => {

    switch (reportType) {

        // ==========================================
        // ADMIN / ORGANIZER
        // ==========================================

        case "event_overview":

            return await getEventOverview(eventId);


        case "registration":

            return await getRegistrationAnalytics(
                eventId
            );


        case "exhibitor":

            return await getExhibitorAnalytics(
                eventId
            );


        case "booth":

            return await getBoothAnalytics(
                eventId
            );


        case "visitor":

            return await getVisitorAnalytics(
                eventId
            );


        case "feedback":

            return await getFeedbackAnalytics(
                eventId
            );


        // ==========================================
        // COMPLETE EVENT
        // ==========================================

        case "complete_event": {

            const overview =
                await getEventOverview(eventId);

            const registrations =
                await getRegistrationAnalytics(eventId);

            const exhibitors =
                await getExhibitorAnalytics(eventId);

            const booths =
                await getBoothAnalytics(eventId);

            const visitors =
                await getVisitorAnalytics(eventId);

            const feedback =
                await getFeedbackAnalytics(eventId);

            return {

                event: overview.event,

                overview,

                registrations,

                exhibitors,

                booths,

                visitors,

                feedback

            };

        }


        // ==========================================
        // EXHIBITOR
        // ==========================================

        case "my_exhibitor_overview":

            return await getMyExhibitorOverview(
                userId
            );


        case "my_booth":

            return await getMyBoothAnalytics(
                userId
            );


        case "my_visitors":

            return await getMyVisitorAnalytics(
                userId
            );


        case "my_feedback":

            return await getMyFeedbackAnalytics(
                userId
            );


        default:

            throw new Error(
                "Invalid report type"
            );

    }

};


// ======================================================
// BUILD REPORT SECTIONS
// ======================================================

const buildReportSections = ({
    reportType,
    data
}) => {

    switch (reportType) {

        // ==========================================
        // EVENT OVERVIEW
        // ==========================================

        case "event_overview":

            return [

                {
                    title: "Registrations",
                    data: data.registrations
                },

                {
                    title: "Exhibitors",
                    data: data.exhibitors
                },

                {
                    title: "Booths",
                    data: data.booths
                },

                {
                    title: "Visitors",
                    data: data.visitors
                },

                {
                    title: "Feedback",
                    data: data.feedback
                }

            ];


        // ==========================================
        // REGISTRATION
        // ==========================================

        case "registration":

            return [

                {
                    title: "Registration Statistics",
                    rows: data.registrations
                }

            ];


        // ==========================================
        // EXHIBITOR
        // ==========================================

        case "exhibitor":

            return [

                {
                    title: "Exhibitor Statistics",
                    rows: data.exhibitors
                }

            ];


        // ==========================================
        // BOOTH
        // ==========================================

        case "booth":

            return [

                {
                    title: "Booth Statistics",
                    rows: data.booths
                }

            ];


        // ==========================================
        // VISITOR
        // ==========================================

        case "visitor":

            return [

                {
                    title: "Visitor Statistics",
                    data: data.visitors
                },

                {
                    title: "Most Visited Booths",
                    rows: data.mostVisitedBooths
                }

            ];


        // ==========================================
        // FEEDBACK
        // ==========================================

        case "feedback":

            return [

                {
                    title: "Feedback Summary",
                    data: data.feedback
                }

            ];


        // ==========================================
        // COMPLETE EVENT
        // ==========================================

        case "complete_event":

            return [

                {
                    title: "Event Overview",
                    data: {
                        registrations:
                            data.overview.registrations.total,

                        exhibitors:
                            data.overview.exhibitors.total,

                        booths:
                            data.overview.booths.total,

                        boothVisits:
                            data.overview.visitors.totalVisits,

                        uniqueVisitors:
                            data.overview.visitors.uniqueVisitors,

                        feedback:
                            data.overview.feedback.total,

                        averageRating:
                            data.overview.feedback.averageRating
                    }
                },

                {
                    title: "Registration Analytics",
                    rows: data.registrations.registrations
                },

                {
                    title: "Exhibitor Analytics",
                    rows: data.exhibitors.exhibitors
                },

                {
                    title: "Booth Analytics",
                    rows: data.booths.booths
                },

                {
                    title: "Visitor Analytics",
                    data: data.visitors.visitors
                },

                {
                    title: "Most Visited Booths",
                    rows: data.visitors.mostVisitedBooths
                },

                {
                    title: "Feedback Analytics",
                    data: data.feedback.feedback
                }

            ];


        // ==========================================
        // MY EXHIBITOR OVERVIEW
        // ==========================================

        case "my_exhibitor_overview":

            return [

                {
                    title: "My Exhibitor Summary",
                    data: data.summary
                }

            ];


        // ==========================================
        // MY BOOTH
        // ==========================================

        case "my_booth":

            return [

                {
                    title: "My Booth Analytics",
                    rows: data.booths
                }

            ];


        // ==========================================
        // MY VISITORS
        // ==========================================

        case "my_visitors":

            return [

                {
                    title: "Visitor Statistics",
                    data: data.visitors
                },

                {
                    title: "Most Visited Booths",
                    rows: data.mostVisitedBooths
                }

            ];


        // ==========================================
        // MY FEEDBACK
        // ==========================================

        case "my_feedback":

            return [

                {
                    title: "Feedback Statistics",
                    data: data.feedback
                }

            ];


        default:

            throw new Error(
                "Unable to build report sections"
            );

    }

};


// ======================================================
// GENERATE REPORT
// ======================================================

const generateReport = async ({
    reportType,
    format,
    eventId,
    userId,
    userRole
}) => {

    // ==========================================
    // VALIDATE FORMAT
    // ==========================================

    const allowedFormats = [
        "pdf",
        "xlsx",
        "docx"
    ];

    if (!allowedFormats.includes(format)) {

        throw new Error(
            "Invalid report format"
        );

    }

    // ==========================================
// VALIDATE REPORT TYPE BY USER ROLE
// ==========================================

const adminReportTypes = [

    "event_overview",

    "registration",

    "exhibitor",

    "booth",

    "visitor",

    "feedback",

    "complete_event"

];


const exhibitorReportTypes = [

    "my_exhibitor_overview",

    "my_booth",

    "my_visitors",

    "my_feedback"

];


if (
    ["admin", "organizer"].includes(userRole)
) {

    if (
        !adminReportTypes.includes(reportType)
    ) {

        throw new Error(
            "You are not authorized to generate this report type"
        );

    }

}


if (userRole === "exhibitor") {

    if (
        !exhibitorReportTypes.includes(reportType)
    ) {

        throw new Error(
            "You are not authorized to generate this report type"
        );

    }

}

    // ==========================================
    // FIND EVENT
    // ==========================================

    const event =
        await Event.findById(eventId);

    if (!event) {

        throw new Error(
            "Event not found"
        );

    }

    if (["admin", "organizer"].includes(userRole)) {
        await authorizeEventAccess(
            { _id: userId, role: userRole },
            eventId
        );
    }

    if (userRole === "exhibitor") {
        const participation =
            await ExhibitorParticipation.findOne({
                exhibitor: userId,
                event: eventId,
                status: "approved"
            });

        if (!participation) {
            throw new Error(
                "You are not authorized to generate a report for this event"
            );
        }
    }


    // ==========================================
    // GET ANALYTICS DATA
    // ==========================================

    const data =
        await getReportData({
            reportType,
            eventId,
            userId
        });


    // ==========================================
    // BUILD SECTIONS
    // ==========================================

    const sections =
        buildReportSections({
            reportType,
            data
        });


    const title =
        reportTitles[reportType];


    // ==========================================
    // GENERATE FILE
    // ==========================================

    let fileBuffer;

    if (format === "pdf") {

        fileBuffer =
            await generatePdfReport({
                title,
                event,
                sections
            });

    }

    else if (format === "xlsx") {

        fileBuffer =
            await generateExcelReport({
                title,
                event,
                sections
            });

    }

    else if (format === "docx") {

        fileBuffer =
            await generateWordReport({
                title,
                event,
                sections
            });

    }


    // ==========================================
    // FILE NAME
    // ==========================================

    const safeEventName =
        event.title
            .replace(/[^a-zA-Z0-9-_]/g, "-")
            .toLowerCase();

    const timestamp =
        Date.now();

    const fileName =
        `${safeEventName}-${reportType}-${timestamp}.${format}`;


    // ==========================================
    // UPLOAD TO CLOUDINARY
    // ==========================================

    const cloudinaryResult =
        await uploadToCloudinary(
            fileBuffer,
            {
                folder:
                    "eventsphere/reports",

                resourceType:
                    "raw",

                publicId:
                    fileName.replace(
                        `.${format}`,
                        ""
                    )
            }
        );


    // ==========================================
    // SAVE REPORT RECORD
    // ==========================================

    const report =
        await Report.create({

            reportType,

            event: event._id,

            generatedBy: userId,

            generatedByRole: userRole,

            format,

            fileName,

            cloudinaryUrl:
                cloudinaryResult.secure_url,

            cloudinaryPublicId:
                cloudinaryResult.public_id

        });


    return report;

};


// ======================================================
// GET PREVIOUS REPORTS
// ======================================================

const getPreviousReports = async ({
    eventId,
    userId,
    userRole
}) => {

    if (["admin", "organizer"].includes(userRole)) {
        await authorizeEventAccess(
            { _id: userId, role: userRole },
            eventId
        );
    }

    const query = {
        event: eventId
    };


    // ==========================================
    // EXHIBITOR
    // ==========================================

    if (userRole === "exhibitor") {

        query.generatedBy =
            userId;

    }


    const reports =
        await Report.find(query)
            .populate(
                "generatedBy",
                "name email"
            )
            .populate(
                "event",
                "title"
            )
            .sort({
                createdAt: -1
            });


    return reports;

};

// ======================================================
// DOWNLOAD REPORT
// ======================================================

const downloadReport = async ({
    reportId,
    userId,
    userRole
}) => {

    // ==========================================
    // FIND REPORT
    // ==========================================

    const report =
        await Report.findById(reportId);

    if (!report) {

        throw new Error(
            "Report not found"
        );

    }


    // ==========================================
    // ACCESS CONTROL
    // ==========================================

    // Exhibitors can only download
    // reports generated for themselves.

    if (userRole === "exhibitor") {

        if (
            report.generatedBy.toString() !==
            userId.toString()
        ) {

            throw new Error(
                "You are not authorized to download this report"
            );

        }

    }


    // ==========================================
    // ADMIN / ORGANIZER
    // ==========================================

    if (
        userRole !== "admin" &&
        userRole !== "organizer" &&
        userRole !== "exhibitor"
    ) {

        throw new Error(
            "You are not authorized to download this report"
        );

    }

    if (userRole === "organizer") {
        await authorizeEventAccess(
            { _id: userId, role: userRole },
            report.event
        );
    }


    // ==========================================
    // RETURN REPORT INFORMATION
    // ==========================================

    return report;

};

// ======================================================
// DELETE REPORT
// ======================================================

const deleteReport = async ({
    reportId,
    userId,
    userRole
}) => {

    // ==========================================
    // FIND REPORT
    // ==========================================

    const report =
        await Report.findById(reportId);

    if (!report) {

        throw new Error(
            "Report not found"
        );

    }


    // ==========================================
    // ACCESS CONTROL
    // ==========================================

    // Admin can delete any report.
    if (userRole === "admin") {

        // Allowed

    }

    else if (userRole === "organizer") {

        await authorizeEventAccess(
            { _id: userId, role: userRole },
            report.event
        );

    }


    // ==========================================
    // EXHIBITOR
    // ==========================================

    else if (userRole === "exhibitor") {

        // Exhibitor can only delete
        // reports generated by themselves.

        if (
            report.generatedBy.toString() !==
            userId.toString()
        ) {

            throw new Error(
                "You are not authorized to delete this report"
            );

        }

    }


    // ==========================================
    // OTHER ROLES
    // ==========================================

    else {

        throw new Error(
            "You are not authorized to delete this report"
        );

    }


    // ==========================================
    // DELETE FROM CLOUDINARY
    // ==========================================

    if (report.cloudinaryPublicId) {

        const cloudinaryResult =
            await deleteFromCloudinary(
                report.cloudinaryPublicId,
                "raw"
            );


        // Cloudinary normally returns:
        // { result: "ok" }

        // If the file doesn't exist anymore,
        // don't necessarily block MongoDB cleanup.

        if (
            cloudinaryResult.result !== "ok" &&
            cloudinaryResult.result !== "not found"
        ) {

            throw new Error(
                "Failed to delete report from Cloudinary"
            );

        }

    }


    // ==========================================
    // DELETE DATABASE RECORD
    // ==========================================

    await Report.findByIdAndDelete(
        reportId
    );


    // ==========================================
    // RETURN RESULT
    // ==========================================

    return report;

};

export {
    generateReport,
    getPreviousReports,
    downloadReport,
    deleteReport
};