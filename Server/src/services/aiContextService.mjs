import mongoose from "mongoose";

import Event from "../models/Event.mjs";
import Registration from "../models/Registration.mjs";
import Session from "../models/Session.mjs";
import SessionRegistration from "../models/SessionRegistration.mjs";
import Booth from "../models/Booth.mjs";
import BoothVisit from "../models/BoothVisit.mjs";
import Exhibitor from "../models/Exhibitor.mjs";
import ExhibitorParticipation from "../models/ExhibitorParticipation.mjs";
import Favorite from "../models/Favorite.mjs";
import Feedback from "../models/Feedback.mjs";

// ======================================================
// HELPER
// ======================================================

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// ======================================================
// PUBLIC EVENT CONTEXT
// ======================================================

const getPublicEventContext = async () => {
    return await Event.find({
        isPublished: true,
        status: {
            $in: ["published", "ongoing"],
        },
    })
        .select(
            "title description category location startDate endDate registrationDeadline capacity tags status organizer"
        )
        .sort({
            startDate: 1,
        })
        .lean();
};

// ======================================================
// PUBLIC SESSION CONTEXT
// ======================================================

const getPublicSessionContext = async () => {
    return await Session.find({
        isActive: true,
    })
        .populate(
            "event",
            "title startDate endDate status"
        )
        .select(
            "event title topic description speaker date startTime endTime location capacity"
        )
        .sort({
            date: 1,
            startTime: 1,
        })
        .lean();
};

// ======================================================
// ATTENDEE CONTEXT
// ======================================================

// ------------------------------------------------------
// Event registrations
// ------------------------------------------------------

const getAttendeeRegistrations = async (userId) => {
    if (!isValidObjectId(userId)) {
        throw new Error("Invalid user ID");
    }

    return await Registration.find({
        attendee: userId,
        status: {
            $ne: "cancelled",
        },
    })
        .populate(
            "event",
            "title description category location startDate endDate status"
        )
        .select(
            "event status registrationDate checkedInAt"
        )
        .sort({
            registrationDate: -1,
        })
        .lean();
};

// ------------------------------------------------------
// Session registrations
// ------------------------------------------------------

const getAttendeeSessionRegistrations = async (userId) => {
    if (!isValidObjectId(userId)) {
        throw new Error("Invalid user ID");
    }

    return await SessionRegistration.find({
        attendee: userId,
        status: {
            $ne: "cancelled",
        },
    })
        .populate(
            "session",
            "title topic description speaker date startTime endTime location capacity event"
        )
        .populate(
            "event",
            "title startDate endDate status"
        )
        .select(
            "session event status registeredAt attendedAt"
        )
        .sort({
            registeredAt: -1,
        })
        .lean();
};

// ------------------------------------------------------
// Favorites
// ------------------------------------------------------

const getAttendeeFavorites = async (userId) => {
    if (!isValidObjectId(userId)) {
        throw new Error("Invalid user ID");
    }

    return await Favorite.find({
        attendee: userId,
    })
        .populate(
            "event",
            "title description category location startDate endDate status"
        )
        .select(
            "event createdAt"
        )
        .sort({
            createdAt: -1,
        })
        .lean();
};

// ------------------------------------------------------
// Booth visits
// ------------------------------------------------------

const getAttendeeBoothVisits = async (userId) => {
    if (!isValidObjectId(userId)) {
        throw new Error("Invalid user ID");
    }

    return await BoothVisit.find({
        attendee: userId,
    })
        .populate(
            "booth",
            "boothNumber size location status"
        )
        .populate(
            "event",
            "title startDate endDate status"
        )
        .select(
            "booth event visitedAt"
        )
        .sort({
            visitedAt: -1,
        })
        .lean();
};

// ------------------------------------------------------
// Feedback
// ------------------------------------------------------

// ------------------------------------------------------
// Feedback
// ------------------------------------------------------

const getAttendeeFeedback = async (userId) => {
    if (!isValidObjectId(userId)) {
        throw new Error("Invalid user ID");
    }

    const feedback = await Feedback.find({
        user: userId,
    })
        .populate(
            "event",
            "title"
        )
        .populate(
            "booth",
            "boothNumber"
        )
        .populate(
            "session",
            "title topic"
        )
        .select(
            "event booth session feedbackType rating message createdAt"
        )
        .sort({
            createdAt: -1,
        })
        .lean();

    // --------------------------------------------------
    // Normalize feedback for AI
    // --------------------------------------------------
    //
    // A feedback message is only valid/useful when
    // rating is below 3.
    //
    // We intentionally do not expose a message for
    // ratings >= 3 to the AI context.
    // --------------------------------------------------

    return feedback.map((item) => ({
        _id: item._id,
        event: item.event,
        booth: item.booth,
        session: item.session,
        feedbackType: item.feedbackType,
        rating: item.rating,

        message:
            item.rating < 3
                ? item.message ?? null
                : null,

        createdAt: item.createdAt,
    }));
};

// ======================================================
// EXHIBITOR CONTEXT
// ======================================================

// ------------------------------------------------------
// Exhibitor profile
// ------------------------------------------------------

const getExhibitorProfile = async (userId) => {
    if (!isValidObjectId(userId)) {
        throw new Error("Invalid user ID");
    }

    return await Exhibitor.findOne({
        user: userId,
    })
        .select(
            "companyName description website industry status"
        )
        .lean();
};

// ------------------------------------------------------
// Participations
// ------------------------------------------------------

const getExhibitorParticipations = async (userId) => {
    if (!isValidObjectId(userId)) {
        throw new Error("Invalid user ID");
    }

    return await ExhibitorParticipation.find({
        exhibitor: userId,
    })
        .populate(
            "event",
            "title description category location startDate endDate status"
        )
        .populate(
            "booth",
            "boothNumber size location status"
        )
        .select(
            "event businessName businessDescription category boothRequired booth status adminNotes appliedAt approvedAt"
        )
        .sort({
            appliedAt: -1,
        })
        .lean();
};

// ------------------------------------------------------
// Exhibitor booths
// ------------------------------------------------------

const getExhibitorBooths = async (userId) => {
    if (!isValidObjectId(userId)) {
        throw new Error("Invalid user ID");
    }

    return await Booth.find({
        exhibitor: userId,
    })
        .populate(
            "event",
            "title startDate endDate status"
        )
        .select(
            "event boothNumber size location status"
        )
        .sort({
            createdAt: -1,
        })
        .lean();
};

// ------------------------------------------------------
// Exhibitor booth visits
// ------------------------------------------------------

const getExhibitorBoothVisits = async (
    userId,
    booths = null
) => {
    if (!isValidObjectId(userId)) {
        throw new Error("Invalid user ID");
    }

    const exhibitorBooths =
        booths ||
        await getExhibitorBooths(userId);

    const boothIds =
        exhibitorBooths.map(
            (booth) => booth._id
        );

    if (boothIds.length === 0) {
        return [];
    }

    return await BoothVisit.find({
        booth: {
            $in: boothIds,
        },
    })
        .populate(
            "booth",
            "boothNumber size location"
        )
        .populate(
            "event",
            "title startDate endDate status"
        )
        .select(
            "booth event visitedAt"
        )
        .sort({
            visitedAt: -1,
        })
        .lean();
};

// ------------------------------------------------------
// Exhibitor booth feedback
// ------------------------------------------------------

// ------------------------------------------------------
// Exhibitor booth feedback
// ------------------------------------------------------

const getExhibitorBoothFeedback = async (
    userId,
    booths = null
) => {
    if (!isValidObjectId(userId)) {
        throw new Error("Invalid user ID");
    }

    const exhibitorBooths =
        booths ||
        await getExhibitorBooths(userId);

    const boothIds =
        exhibitorBooths.map(
            (booth) => booth._id
        );

    if (boothIds.length === 0) {
        return [];
    }

    const feedback = await Feedback.find({
        booth: {
            $in: boothIds,
        },
        feedbackType: "booth",
    })
        .populate(
            "booth",
            "boothNumber"
        )
        .populate(
            "event",
            "title"
        )
        .select(
            "booth event rating message feedbackType createdAt"
        )
        .sort({
            createdAt: -1,
        })
        .lean();

    return feedback.map((item) => ({
        _id: item._id,
        booth: item.booth,
        event: item.event,
        rating: item.rating,
        feedbackType: item.feedbackType,

        message:
            item.rating < 3
                ? item.message ?? null
                : null,

        createdAt: item.createdAt,
    }));
};
// ======================================================
// ORGANIZER CONTEXT
// ======================================================

// ------------------------------------------------------
// Organizer events
// ------------------------------------------------------

const getOrganizerEvents = async (userId) => {
    if (!isValidObjectId(userId)) {
        throw new Error("Invalid user ID");
    }

    return await Event.find({
        organizer: userId,
    })
        .select(
            "title description category location startDate endDate registrationDeadline capacity tags status isPublished organizer"
        )
        .sort({
            startDate: -1,
        })
        .lean();
};

// ------------------------------------------------------
// Organizer event IDs
// ------------------------------------------------------

const getOrganizerEventIds = async (userId) => {
    const events = await Event.find({
        organizer: userId,
    })
        .select("_id")
        .lean();

    return events.map(
        (event) => event._id
    );
};

// ------------------------------------------------------
// Registration statistics
// ------------------------------------------------------

const getOrganizerRegistrationStats = async (
    eventIds
) => {
    if (eventIds.length === 0) {
        return [];
    }

    return await Registration.aggregate([
        {
            $match: {
                event: {
                    $in: eventIds,
                },
            },
        },

        {
            $group: {
                _id: "$event",

                total: {
                    $sum: 1,
                },

                registered: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$status",
                                    "registered",
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },

                attended: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$status",
                                    "attended",
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },

                cancelled: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$status",
                                    "cancelled",
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
            },
        },

        {
            $lookup: {
                from: "events",
                localField: "_id",
                foreignField: "_id",
                as: "event",
            },
        },

        {
            $unwind: "$event",
        },

        {
            $project: {
                _id: 0,
                eventId: "$_id",
                eventTitle: "$event.title",
                total: 1,
                registered: 1,
                attended: 1,
                cancelled: 1,
            },
        },
    ]);
};

// ------------------------------------------------------
// Exhibitor statistics
// ------------------------------------------------------

const getOrganizerExhibitorStats = async (
    eventIds
) => {
    if (eventIds.length === 0) {
        return [];
    }

    return await ExhibitorParticipation.aggregate([
        {
            $match: {
                event: {
                    $in: eventIds,
                },
            },
        },

        {
            $group: {
                _id: "$event",

                total: {
                    $sum: 1,
                },

                approved: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$status",
                                    "approved",
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },

                pending: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$status",
                                    "pending",
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },

                rejected: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$status",
                                    "rejected",
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
            },
        },

        {
            $lookup: {
                from: "events",
                localField: "_id",
                foreignField: "_id",
                as: "event",
            },
        },

        {
            $unwind: "$event",
        },

        {
            $project: {
                _id: 0,
                eventId: "$_id",
                eventTitle: "$event.title",
                total: 1,
                approved: 1,
                pending: 1,
                rejected: 1,
            },
        },
    ]);
};

// ------------------------------------------------------
// Booth statistics
// ------------------------------------------------------

const getOrganizerBoothStats = async (
    eventIds
) => {
    if (eventIds.length === 0) {
        return [];
    }

    return await Booth.aggregate([
        {
            $match: {
                event: {
                    $in: eventIds,
                },
            },
        },

        {
            $group: {
                _id: "$event",

                total: {
                    $sum: 1,
                },

                available: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$status",
                                    "available",
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },

                reserved: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$status",
                                    "reserved",
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },

                occupied: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$status",
                                    "occupied",
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
            },
        },

        {
            $lookup: {
                from: "events",
                localField: "_id",
                foreignField: "_id",
                as: "event",
            },
        },

        {
            $unwind: "$event",
        },

        {
            $project: {
                _id: 0,
                eventId: "$_id",
                eventTitle: "$event.title",
                total: 1,
                available: 1,
                reserved: 1,
                occupied: 1,
            },
        },
    ]);
};

// ------------------------------------------------------
// Booth visit statistics
// ------------------------------------------------------

const getOrganizerBoothVisitStats = async (
    eventIds
) => {
    if (eventIds.length === 0) {
        return [];
    }

    return await BoothVisit.aggregate([
        {
            $match: {
                event: {
                    $in: eventIds,
                },
            },
        },

        {
            $group: {
                _id: "$event",

                totalVisits: {
                    $sum: 1,
                },
            },
        },

        {
            $lookup: {
                from: "events",
                localField: "_id",
                foreignField: "_id",
                as: "event",
            },
        },

        {
            $unwind: "$event",
        },

        {
            $project: {
                _id: 0,
                eventId: "$_id",
                eventTitle: "$event.title",
                totalVisits: 1,
            },
        },
    ]);
};

// ------------------------------------------------------
// Session statistics
// ------------------------------------------------------

const getOrganizerSessionStats = async (
    eventIds
) => {
    if (eventIds.length === 0) {
        return [];
    }

    return await Session.aggregate([
        {
            $match: {
                event: {
                    $in: eventIds,
                },
            },
        },

        {
            $group: {
                _id: "$event",

                totalSessions: {
                    $sum: 1,
                },
            },
        },

        {
            $lookup: {
                from: "events",
                localField: "_id",
                foreignField: "_id",
                as: "event",
            },
        },

        {
            $unwind: "$event",
        },

        {
            $project: {
                _id: 0,
                eventId: "$_id",
                eventTitle: "$event.title",
                totalSessions: 1,
            },
        },
    ]);
};

// ------------------------------------------------------
// Feedback statistics
// ------------------------------------------------------

const getOrganizerFeedbackStats = async (
    eventIds
) => {
    if (eventIds.length === 0) {
        return [];
    }

    return await Feedback.aggregate([
        {
            $match: {
                event: {
                    $in: eventIds,
                },
            },
        },

        {
            $group: {
                _id: {
                    event: "$event",
                    feedbackType: "$feedbackType",
                },

                total: {
                    $sum: 1,
                },

                averageRating: {
                    $avg: "$rating",
                },

                lowRatings: {
                    $sum: {
                        $cond: [
                            {
                                $lt: [
                                    "$rating",
                                    3,
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
            },
        },

        {
            $lookup: {
                from: "events",
                localField: "_id.event",
                foreignField: "_id",
                as: "event",
            },
        },

        {
            $unwind: "$event",
        },

        {
            $project: {
                _id: 0,
                eventId: "$_id.event",
                eventTitle: "$event.title",
                feedbackType: "$_id.feedbackType",
                total: 1,

                averageRating: {
                    $round: [
                        "$averageRating",
                        2,
                    ],
                },

                lowRatings: 1,
            },
        },

        {
            $sort: {
                eventTitle: 1,
                feedbackType: 1,
            },
        },
    ]);
};

// ======================================================
// COMPLETE ORGANIZER CONTEXT
// ======================================================

const getOrganizerContext = async (userId) => {
    if (!isValidObjectId(userId)) {
        throw new Error("Invalid user ID");
    }

    const eventIds =
        await getOrganizerEventIds(userId);

    const events =
        await getOrganizerEvents(userId);

    const [
        registrationStats,
        exhibitorStats,
        boothStats,
        boothVisitStats,
        sessionStats,
        feedbackStats,
    ] = await Promise.all([
        getOrganizerRegistrationStats(eventIds),
        getOrganizerExhibitorStats(eventIds),
        getOrganizerBoothStats(eventIds),
        getOrganizerBoothVisitStats(eventIds),
        getOrganizerSessionStats(eventIds),
        getOrganizerFeedbackStats(eventIds),
    ]);

    return {
        events,
        registrationStats,
        exhibitorStats,
        boothStats,
        boothVisitStats,
        sessionStats,
        feedbackStats,
    };
};

// ======================================================
// ADMIN CONTEXT
// ======================================================

const getAdminContext = async () => {
    const events = await Event.find({})
        .select(
            "title description category location startDate endDate registrationDeadline capacity tags status isPublished organizer"
        )
        .populate(
            "organizer",
            "name email role"
        )
        .sort({
            startDate: -1,
        })
        .lean();

    const [
        registrationStats,
        exhibitorStats,
        boothStats,
        boothVisitStats,
        sessionStats,
        feedbackStats,
    ] = await Promise.all([
        getAdminRegistrationStats(),
        getAdminExhibitorStats(),
        getAdminBoothStats(),
        getAdminBoothVisitStats(),
        getAdminSessionStats(),
        getAdminFeedbackStats(),
    ]);

    return {
        events,
        registrationStats,
        exhibitorStats,
        boothStats,
        boothVisitStats,
        sessionStats,
        feedbackStats,
    };
};

// ======================================================
// ADMIN REGISTRATION STATS
// ======================================================

const getAdminRegistrationStats = async () => {
    return await Registration.aggregate([
        {
            $group: {
                _id: "$event",

                total: {
                    $sum: 1,
                },

                registered: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$status",
                                    "registered",
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },

                attended: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$status",
                                    "attended",
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },

                cancelled: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$status",
                                    "cancelled",
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
            },
        },

        {
            $lookup: {
                from: "events",
                localField: "_id",
                foreignField: "_id",
                as: "event",
            },
        },

        {
            $unwind: "$event",
        },

        {
            $project: {
                _id: 0,
                eventId: "$_id",
                eventTitle: "$event.title",
                total: 1,
                registered: 1,
                attended: 1,
                cancelled: 1,
            },
        },
    ]);
};

// ======================================================
// ADMIN EXHIBITOR STATS
// ======================================================

const getAdminExhibitorStats = async () => {
    return await ExhibitorParticipation.aggregate([
        {
            $group: {
                _id: "$event",

                total: {
                    $sum: 1,
                },

                approved: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$status",
                                    "approved",
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },

                pending: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$status",
                                    "pending",
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },

                rejected: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$status",
                                    "rejected",
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
            },
        },

        {
            $lookup: {
                from: "events",
                localField: "_id",
                foreignField: "_id",
                as: "event",
            },
        },

        {
            $unwind: "$event",
        },

        {
            $project: {
                _id: 0,
                eventId: "$_id",
                eventTitle: "$event.title",
                total: 1,
                approved: 1,
                pending: 1,
                rejected: 1,
            },
        },
    ]);
};

// ======================================================
// ADMIN BOOTH STATS
// ======================================================

const getAdminBoothStats = async () => {
    return await Booth.aggregate([
        {
            $group: {
                _id: "$event",

                total: {
                    $sum: 1,
                },

                available: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$status",
                                    "available",
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },

                reserved: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$status",
                                    "reserved",
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },

                occupied: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$status",
                                    "occupied",
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
            },
        },

        {
            $lookup: {
                from: "events",
                localField: "_id",
                foreignField: "_id",
                as: "event",
            },
        },

        {
            $unwind: "$event",
        },

        {
            $project: {
                _id: 0,
                eventId: "$_id",
                eventTitle: "$event.title",
                total: 1,
                available: 1,
                reserved: 1,
                occupied: 1,
            },
        },
    ]);
};

// ======================================================
// ADMIN BOOTH VISIT STATS
// ======================================================

const getAdminBoothVisitStats = async () => {
    return await BoothVisit.aggregate([
        {
            $group: {
                _id: "$event",

                totalVisits: {
                    $sum: 1,
                },
            },
        },

        {
            $lookup: {
                from: "events",
                localField: "_id",
                foreignField: "_id",
                as: "event",
            },
        },

        {
            $unwind: "$event",
        },

        {
            $project: {
                _id: 0,
                eventId: "$_id",
                eventTitle: "$event.title",
                totalVisits: 1,
            },
        },
    ]);
};

// ======================================================
// ADMIN SESSION STATS
// ======================================================

const getAdminSessionStats = async () => {
    return await Session.aggregate([
        {
            $group: {
                _id: "$event",

                totalSessions: {
                    $sum: 1,
                },
            },
        },

        {
            $lookup: {
                from: "events",
                localField: "_id",
                foreignField: "_id",
                as: "event",
            },
        },

        {
            $unwind: "$event",
        },

        {
            $project: {
                _id: 0,
                eventId: "$_id",
                eventTitle: "$event.title",
                totalSessions: 1,
            },
        },
    ]);
};

// ======================================================
// ADMIN FEEDBACK STATS
// ======================================================

const getAdminFeedbackStats = async () => {
    return await Feedback.aggregate([
        {
            $group: {
                _id: {
                    event: "$event",
                    feedbackType: "$feedbackType",
                },

                total: {
                    $sum: 1,
                },

                averageRating: {
                    $avg: "$rating",
                },

                lowRatings: {
                    $sum: {
                        $cond: [
                            {
                                $lt: [
                                    "$rating",
                                    3,
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
            },
        },

        {
            $lookup: {
                from: "events",
                localField: "_id.event",
                foreignField: "_id",
                as: "event",
            },
        },

        {
            $unwind: {
                path: "$event",
                preserveNullAndEmptyArrays: true,
            },
        },

        {
            $project: {
                _id: 0,
                eventId: "$_id.event",
                eventTitle: "$event.title",
                feedbackType: "$_id.feedbackType",
                total: 1,

                averageRating: {
                    $round: [
                        "$averageRating",
                        2,
                    ],
                },

                lowRatings: 1,
            },
        },

        {
            $sort: {
                eventTitle: 1,
                feedbackType: 1,
            },
        },
    ]);
};

// ======================================================
// MAIN AI CONTEXT BUILDER
// ======================================================

const buildAIContext = async ({
    userId,
    role,
    intent,
}) => {
    if (!userId) {
        throw new Error("User ID is required");
    }

    if (!role) {
        throw new Error("User role is required");
    }

    if (!intent) {
        throw new Error("AI intent is required");
    }

    const context = {
        public: {},
        private: null,
    };

    // ==================================================
    // GENERAL
    // ==================================================

    if (intent === "general") {
        return context;
    }

    // ==================================================
    // ATTENDEE
    // ==================================================

    if (role === "attendee") {
        switch (intent) {

            case "events":

                context.public.events =
                    await getPublicEventContext();

                break;

            case "sessions":

                context.public.sessions =
                    await getPublicSessionContext();

                context.private = {
                    sessionRegistrations:
                        await getAttendeeSessionRegistrations(
                            userId
                        ),
                };

                break;

            case "registrations":

                context.private = {
                    registrations:
                        await getAttendeeRegistrations(
                            userId
                        ),

                    sessionRegistrations:
                        await getAttendeeSessionRegistrations(
                            userId
                        ),
                };

                break;

            case "favorites":

                context.private = {
                    favorites:
                        await getAttendeeFavorites(
                            userId
                        ),
                };

                break;

            case "booth_visits":

                context.private = {
                    boothVisits:
                        await getAttendeeBoothVisits(
                            userId
                        ),
                };

                break;

            case "feedback":

                context.private = {
                    feedback:
                        await getAttendeeFeedback(
                            userId
                        ),
                };

                break;

            case "booths":

                context.private = {
                    boothVisits:
                        await getAttendeeBoothVisits(
                            userId
                        ),
                };

                break;

            default:

                context.public.events =
                    await getPublicEventContext();

                break;
        }

        return context;
    }

    // ==================================================
    // EXHIBITOR
    // ==================================================

    if (role === "exhibitor") {

        switch (intent) {

            case "exhibitor":

                context.private = {
                    exhibitorProfile:
                        await getExhibitorProfile(
                            userId
                        ),

                    participations:
                        await getExhibitorParticipations(
                            userId
                        ),
                };

                break;

            case "events":

                context.public.events =
                    await getPublicEventContext();

                context.private = {
                    participations:
                        await getExhibitorParticipations(
                            userId
                        ),
                };

                break;

            case "booths":

                context.private = {
                    booths:
                        await getExhibitorBooths(
                            userId
                        ),
                };

                break;

            case "booth_visits": {

                const booths =
                    await getExhibitorBooths(
                        userId
                    );

                context.private = {
                    booths,

                    boothVisits:
                        await getExhibitorBoothVisits(
                            userId,
                            booths
                        ),
                };

                break;
            }

            case "feedback": {

                const booths =
                    await getExhibitorBooths(
                        userId
                    );

                context.private = {
                    boothFeedback:
                        await getExhibitorBoothFeedback(
                            userId,
                            booths
                        ),
                };

                break;
            }

            default:

                context.public.events =
                    await getPublicEventContext();

                break;
        }

        return context;
    }

    // ==================================================
    // ORGANIZER
    // ==================================================

    if (role === "organizer") {

        const organizerContext =
            await getOrganizerContext(
                userId
            );

        switch (intent) {

            case "events":

                context.private = {
                    events:
                        organizerContext.events,
                };

                break;

            case "registrations":

                context.private = {
                    registrationStats:
                        organizerContext.registrationStats,
                };

                break;

            case "exhibitor":

                context.private = {
                    exhibitorStats:
                        organizerContext.exhibitorStats,
                };

                break;

            case "booths":

                context.private = {
                    boothStats:
                        organizerContext.boothStats,
                };

                break;

            case "booth_visits":

                context.private = {
                    boothVisitStats:
                        organizerContext.boothVisitStats,
                };

                break;

            case "sessions":

                context.private = {
                    sessionStats:
                        organizerContext.sessionStats,
                };

                break;

            case "feedback":

                context.private = {
                    feedbackStats:
                        organizerContext.feedbackStats,
                };

                break;

            case "analytics":

                context.private = {
                    events:
                        organizerContext.events,

                    registrationStats:
                        organizerContext.registrationStats,

                    exhibitorStats:
                        organizerContext.exhibitorStats,

                    boothStats:
                        organizerContext.boothStats,

                    boothVisitStats:
                        organizerContext.boothVisitStats,

                    sessionStats:
                        organizerContext.sessionStats,

                    feedbackStats:
                        organizerContext.feedbackStats,
                };

                break;

            default:

                context.private = {
                    events:
                        organizerContext.events,
                };

                break;
        }

        return context;
    }

    // ==================================================
    // ADMIN
    // ==================================================

    if (role === "admin") {

        const adminContext =
            await getAdminContext();

        switch (intent) {

            case "events":

                context.private = {
                    events:
                        adminContext.events,
                };

                break;

            case "registrations":

                context.private = {
                    registrationStats:
                        adminContext.registrationStats,
                };

                break;

            case "exhibitor":

                context.private = {
                    exhibitorStats:
                        adminContext.exhibitorStats,
                };

                break;

            case "booths":

                context.private = {
                    boothStats:
                        adminContext.boothStats,
                };

                break;

            case "booth_visits":

                context.private = {
                    boothVisitStats:
                        adminContext.boothVisitStats,
                };

                break;

            case "sessions":

                context.private = {
                    sessionStats:
                        adminContext.sessionStats,
                };

                break;

            case "feedback":

                context.private = {
                    feedbackStats:
                        adminContext.feedbackStats,
                };

                break;

            case "analytics":

                context.private = {
                    events:
                        adminContext.events,

                    registrationStats:
                        adminContext.registrationStats,

                    exhibitorStats:
                        adminContext.exhibitorStats,

                    boothStats:
                        adminContext.boothStats,

                    boothVisitStats:
                        adminContext.boothVisitStats,

                    sessionStats:
                        adminContext.sessionStats,

                    feedbackStats:
                        adminContext.feedbackStats,
                };

                break;

            default:

                context.private = {
                    events:
                        adminContext.events,
                };

                break;
        }

        return context;
    }

    throw new Error(
        `Unsupported user role: ${role}`
    );
};

// ======================================================
// EXPORTS
// ======================================================

export {
    buildAIContext,

    getPublicEventContext,
    getPublicSessionContext,

    getAttendeeRegistrations,
    getAttendeeSessionRegistrations,
    getAttendeeFavorites,
    getAttendeeBoothVisits,
    getAttendeeFeedback,

    getExhibitorProfile,
    getExhibitorParticipations,
    getExhibitorBooths,
    getExhibitorBoothVisits,
    getExhibitorBoothFeedback,

    getOrganizerEvents,
    getOrganizerContext,

    getAdminContext,
};