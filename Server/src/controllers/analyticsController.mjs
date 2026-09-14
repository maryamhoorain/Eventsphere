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
} from "../services/analyticsService.mjs";
import authorizeEventAccess, {
    handleEventAccessError,
} from "../utils/authorizeEventAccess.mjs";


// ==========================================
// EVENT OVERVIEW
// ADMIN / ORGANIZER
// ==========================================

const eventOverview = async (req, res) => {

    try {

        const { eventId } = req.params;
        await authorizeEventAccess(req.user, eventId);

        const overview =
            await getEventOverview(eventId);

        res.status(200).json({
            message: "Event overview fetched successfully",
            overview
        });

    } catch (error) {

        console.error(
            "Event overview error:",
            error.message
        );

        if (handleEventAccessError(error, res, "view analytics for")) {
            return;
        }
        if (error.message === "Event not found") {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// REGISTRATION ANALYTICS
// ADMIN / ORGANIZER
// ==========================================

const registrationAnalytics = async (req, res) => {

    try {

        const { eventId } = req.params;
        await authorizeEventAccess(req.user, eventId);

        const data =
            await getRegistrationAnalytics(eventId);

        res.status(200).json({
            message:
                "Registration analytics fetched successfully",
            data
        });

    } catch (error) {

        console.error(
            "Registration analytics error:",
            error.message
        );

        if (handleEventAccessError(error, res, "view registrations for")) {
            return;
        }
        if (error.message === "Event not found") {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// EXHIBITOR ANALYTICS
// ADMIN / ORGANIZER
// ==========================================

const exhibitorAnalytics = async (req, res) => {

    try {

        const { eventId } = req.params;
        await authorizeEventAccess(req.user, eventId);

        const data =
            await getExhibitorAnalytics(eventId);

        res.status(200).json({
            message:
                "Exhibitor analytics fetched successfully",
            data
        });

    } catch (error) {

        console.error(
            "Exhibitor analytics error:",
            error.message
        );

        if (handleEventAccessError(error, res, "view exhibitor analytics for")) {
            return;
        }
        if (error.message === "Event not found") {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// BOOTH ANALYTICS
// ADMIN / ORGANIZER
// ==========================================

const boothAnalytics = async (req, res) => {

    try {

        const { eventId } = req.params;
        await authorizeEventAccess(req.user, eventId);

        const data =
            await getBoothAnalytics(eventId);

        res.status(200).json({
            message:
                "Booth analytics fetched successfully",
            data
        });

    } catch (error) {

        console.error(
            "Booth analytics error:",
            error.message
        );

        if (handleEventAccessError(error, res, "view booth analytics for")) {
            return;
        }
        if (error.message === "Event not found") {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// VISITOR ANALYTICS
// ADMIN / ORGANIZER
// ==========================================

const visitorAnalytics = async (req, res) => {

    try {

        const { eventId } = req.params;
        await authorizeEventAccess(req.user, eventId);

        const data =
            await getVisitorAnalytics(eventId);

        res.status(200).json({
            message:
                "Visitor analytics fetched successfully",
            data
        });

    } catch (error) {

        console.error(
            "Visitor analytics error:",
            error.message
        );

        if (handleEventAccessError(error, res, "view visitor analytics for")) {
            return;
        }
        if (error.message === "Event not found") {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// FEEDBACK ANALYTICS
// ADMIN / ORGANIZER
// ==========================================

const feedbackAnalytics = async (req, res) => {

    try {

        const { eventId } = req.params;
        await authorizeEventAccess(req.user, eventId);

        const data =
            await getFeedbackAnalytics(eventId);

        res.status(200).json({
            message:
                "Feedback analytics fetched successfully",
            data
        });

    } catch (error) {

        console.error(
            "Feedback analytics error:",
            error.message
        );

        if (handleEventAccessError(error, res, "view feedback for")) {
            return;
        }
        if (error.message === "Event not found") {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        res.status(500).json({
            message: "Server error"
        });
    }
};
// ==========================================
// MY EXHIBITOR OVERVIEW
// EXHIBITOR
// ==========================================

const myExhibitorOverview = async (req, res) => {

    try {

        const exhibitorId =
            req.user._id;

        const data =
            await getMyExhibitorOverview(
                exhibitorId
            );

        res.status(200).json({

            message:
                "Exhibitor overview fetched successfully",

            data

        });

    } catch (error) {

        console.error(
            "My exhibitor overview error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });

    }
};


// ==========================================
// MY BOOTH ANALYTICS
// EXHIBITOR
// ==========================================

const myBoothAnalytics = async (req, res) => {

    try {

        const exhibitorId =
            req.user._id;

        const data =
            await getMyBoothAnalytics(
                exhibitorId
            );

        res.status(200).json({

            message:
                "Exhibitor booth analytics fetched successfully",

            data

        });

    } catch (error) {

        console.error(
            "My booth analytics error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });

    }
};


// ==========================================
// MY VISITOR ANALYTICS
// EXHIBITOR
// ==========================================

const myVisitorAnalytics = async (req, res) => {

    try {

        const exhibitorId =
            req.user._id;

        const data =
            await getMyVisitorAnalytics(
                exhibitorId
            );

        res.status(200).json({

            message:
                "Exhibitor visitor analytics fetched successfully",

            data

        });

    } catch (error) {

        console.error(
            "My visitor analytics error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });

    }
};


// ==========================================
// MY FEEDBACK ANALYTICS
// EXHIBITOR
// ==========================================

const myFeedbackAnalytics = async (req, res) => {

    try {

        const exhibitorId =
            req.user._id;

        const data =
            await getMyFeedbackAnalytics(
                exhibitorId
            );

        res.status(200).json({

            message:
                "Exhibitor feedback analytics fetched successfully",

            data

        });

    } catch (error) {

        console.error(
            "My feedback analytics error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });

    }
};


export {
    eventOverview,
    registrationAnalytics,
    exhibitorAnalytics,
    boothAnalytics,
    visitorAnalytics,
    feedbackAnalytics,

    myExhibitorOverview,
    myBoothAnalytics,
    myVisitorAnalytics,
    myFeedbackAnalytics
};