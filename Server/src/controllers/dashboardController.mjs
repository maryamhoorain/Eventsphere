import User from "../models/User.mjs";
import Event from "../models/Event.mjs";
import Registration from "../models/Registration.mjs";
import ExhibitorParticipation from "../models/ExhibitorParticipation.mjs";
import OrganizerApplication from "../models/OrganizerApplication.mjs";
import Booth from "../models/Booth.mjs";
import Session from "../models/Session.mjs";
import BoothVisit from "../models/BoothVisit.mjs";
import Feedback from "../models/Feedback.mjs";

// ======================================================
// ADMIN DASHBOARD
// ======================================================

const getAdminDashboard = async (req, res) => {
    try {
        const [
            totalUsers,
            totalAttendees,
            totalExhibitors,
            totalOrganizers,
            activeOrganizers,
            totalEvents,
            publishedEvents,
            upcomingEvents,
            totalRegistrations,
            pendingApplications,
            pendingOrganizerApplications,
            totalSessions,
            totalBooths,
            totalBoothVisits,
            totalFeedback,
            averageRating,
            usersByRole,
            eventsByStatus,
            registrationsByStatus,
            applicationsByStatus,
            boothsByStatus
        ] = await Promise.all([

            User.countDocuments(),

            User.countDocuments({
                role: "attendee"
            }),

            User.countDocuments({
                role: "exhibitor"
            }),

            User.countDocuments({
                role: "organizer"
            }),

            User.countDocuments({
                role: "organizer",
                isActive: true
            }),

            Event.countDocuments(),

            Event.countDocuments({
                status: "published",
                isPublished: true
            }),

            Event.countDocuments({
                startDate: {
                    $gt: new Date()
                },
                status: "published",
                isPublished: true
            }),

            Registration.countDocuments({
                status: "registered"
            }),

            ExhibitorParticipation.countDocuments({
                status: "pending"
            }),

            OrganizerApplication.countDocuments({
                status: "pending"
            }),

            Session.countDocuments(),

            Booth.countDocuments(),

            BoothVisit.countDocuments(),

            Feedback.countDocuments(),

            Feedback.aggregate([
                { $group: { _id: null, average: { $avg: "$rating" } } }
            ]),

            User.aggregate([
                { $group: { _id: "$role", count: { $sum: 1 } } },
                { $project: { _id: 0, label: "$_id", value: "$count" } },
                { $sort: { label: 1 } }
            ]),

            Event.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
                { $project: { _id: 0, label: "$_id", value: "$count" } },
                { $sort: { label: 1 } }
            ]),

            Registration.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
                { $project: { _id: 0, label: "$_id", value: "$count" } },
                { $sort: { label: 1 } }
            ]),

            ExhibitorParticipation.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
                { $project: { _id: 0, label: "$_id", value: "$count" } },
                { $sort: { label: 1 } }
            ]),

            Booth.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
                { $project: { _id: 0, label: "$_id", value: "$count" } },
                { $sort: { label: 1 } }
            ])
        ]);

        res.status(200).json({
            message: "Admin dashboard data retrieved successfully",

            statistics: {
                totalUsers,
                totalAttendees,
                totalExhibitors,

                totalOrganizers,
                activeOrganizers,

                totalEvents,
                publishedEvents,
                upcomingEvents,

                totalRegistrations,

                pendingApplications,
                pendingOrganizerApplications,
                totalSessions,
                totalBooths,
                totalBoothVisits,
                totalFeedback,
                averageRating: Number(averageRating[0]?.average || 0).toFixed(2)
            },
            charts: {
                usersByRole,
                eventsByStatus,
                registrationsByStatus,
                applicationsByStatus,
                boothsByStatus
            }
        });

    } catch (error) {
        console.error(
            "Admin dashboard error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ======================================================
// ORGANIZER DASHBOARD
// ======================================================

const getOrganizerDashboard = async (req, res) => {
    try {
        const organizerId = req.user._id;
        const now = new Date();

        // --------------------------------------------------
        // GET ONLY THIS ORGANIZER'S EVENTS
        // --------------------------------------------------

        const organizerEvents = await Event.find({
            organizer: organizerId
        })
            .select(
                "title description category location startDate endDate registrationDeadline bannerImage capacity tags status isPublished createdAt"
            )
            .sort({
                startDate: 1
            })
            .lean();

        const eventIds = organizerEvents.map(
            (event) => event._id
        );

        // --------------------------------------------------
        // IF ORGANIZER HAS NO EVENTS
        // --------------------------------------------------

        if (eventIds.length === 0) {
            return res.status(200).json({
                message:
                    "Organizer dashboard data retrieved successfully",

                statistics: {
                    totalEvents: 0,
                    publishedEvents: 0,
                    upcomingEvents: 0,
                    ongoingEvents: 0,
                    completedEvents: 0,

                    totalRegistrations: 0,

                    totalExhibitorApplications: 0,
                    pendingExhibitorApplications: 0,
                    approvedExhibitorApplications: 0,

                    totalBooths: 0,
                    availableBooths: 0,
                    reservedBooths: 0,
                    occupiedBooths: 0,

                    totalSessions: 0,
                    totalBoothVisits: 0,

                    totalFeedback: 0,
                    averageRating: 0,
                    lowRatingFeedback: 0
                },

                upcomingEvents: [],

                recentEvents: []
            });
        }

        // --------------------------------------------------
        // STATISTICS
        // --------------------------------------------------

        const [
            publishedEvents,
            upcomingEvents,
            ongoingEvents,
            completedEvents,

            totalRegistrations,

            totalExhibitorApplications,
            pendingExhibitorApplications,
            approvedExhibitorApplications,

            totalBooths,
            availableBooths,
            reservedBooths,
            occupiedBooths,

            totalSessions,
            totalBoothVisits,

            feedbackStats
        ] = await Promise.all([

            // Published events
            Event.countDocuments({
                _id: {
                    $in: eventIds
                },
                status: "published",
                isPublished: true
            }),

            // Upcoming published events
            Event.countDocuments({
                _id: {
                    $in: eventIds
                },
                startDate: {
                    $gt: now
                },
                status: "published",
                isPublished: true
            }),

            // Ongoing events
            Event.countDocuments({
                _id: {
                    $in: eventIds
                },
                status: "ongoing"
            }),

            // Completed events
            Event.countDocuments({
                _id: {
                    $in: eventIds
                },
                status: "completed"
            }),

            // Registrations
            Registration.countDocuments({
                event: {
                    $in: eventIds
                },
                status: {
                    $ne: "cancelled"
                }
            }),

            // Exhibitor applications
            ExhibitorParticipation.countDocuments({
                event: {
                    $in: eventIds
                }
            }),

            ExhibitorParticipation.countDocuments({
                event: {
                    $in: eventIds
                },
                status: "pending"
            }),

            ExhibitorParticipation.countDocuments({
                event: {
                    $in: eventIds
                },
                status: "approved"
            }),

            // Booths
            Booth.countDocuments({
                event: {
                    $in: eventIds
                }
            }),

            Booth.countDocuments({
                event: {
                    $in: eventIds
                },
                status: "available"
            }),

            Booth.countDocuments({
                event: {
                    $in: eventIds
                },
                status: "reserved"
            }),

            Booth.countDocuments({
                event: {
                    $in: eventIds
                },
                status: "occupied"
            }),

            // Sessions
            Session.countDocuments({
                event: {
                    $in: eventIds
                }
            }),

            // Booth visits
            BoothVisit.countDocuments({
                event: {
                    $in: eventIds
                }
            }),

            // Feedback
            Feedback.aggregate([
                {
                    $match: {
                        event: {
                            $in: eventIds
                        }
                    }
                },
                {
                    $group: {
                        _id: null,

                        totalFeedback: {
                            $sum: 1
                        },

                        averageRating: {
                            $avg: "$rating"
                        },

                        lowRatingFeedback: {
                            $sum: {
                                $cond: [
                                    {
                                        $lt: ["$rating", 3]
                                    },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ])
        ]);

        // --------------------------------------------------
        // UPCOMING EVENTS LIST
        // --------------------------------------------------

        const upcomingEventList =
            organizerEvents
                .filter(
                    (event) =>
                        event.startDate > now &&
                        event.status === "published" &&
                        event.isPublished === true
                )
                .slice(0, 5);

        // --------------------------------------------------
        // RECENT EVENTS
        // --------------------------------------------------

        const recentEvents =
            [...organizerEvents]
                .sort(
                    (a, b) =>
                        new Date(b.createdAt) -
                        new Date(a.createdAt)
                )
                .slice(0, 5);

        // --------------------------------------------------
        // FEEDBACK SUMMARY
        // --------------------------------------------------

        const feedbackSummary =
            feedbackStats[0] || {
                totalFeedback: 0,
                averageRating: 0,
                lowRatingFeedback: 0
            };

        res.status(200).json({
            message:
                "Organizer dashboard data retrieved successfully",

            statistics: {
                totalEvents:
                    organizerEvents.length,

                publishedEvents,

                upcomingEvents,

                ongoingEvents,

                completedEvents,

                totalRegistrations,

                totalExhibitorApplications,

                pendingExhibitorApplications,

                approvedExhibitorApplications,

                totalBooths,

                availableBooths,

                reservedBooths,

                occupiedBooths,

                totalSessions,

                totalBoothVisits,

                totalFeedback:
                    feedbackSummary.totalFeedback,

                averageRating:
                    Number(
                        feedbackSummary.averageRating || 0
                    ).toFixed(2),

                lowRatingFeedback:
                    feedbackSummary.lowRatingFeedback
            },

            upcomingEvents:
                upcomingEventList,

            recentEvents
        });

    } catch (error) {
        console.error(
            "Organizer dashboard error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ======================================================
// EXHIBITOR DASHBOARD
// ======================================================

const getExhibitorDashboard = async (req, res) => {
    try {
        const exhibitorId = req.user._id;

        const [
            totalApplications,
            pendingApplications,
            approvedApplications,
            rejectedApplications
        ] = await Promise.all([

            ExhibitorParticipation.countDocuments({
                exhibitor: exhibitorId
            }),

            ExhibitorParticipation.countDocuments({
                exhibitor: exhibitorId,
                status: "pending"
            }),

            ExhibitorParticipation.countDocuments({
                exhibitor: exhibitorId,
                status: "approved"
            }),

            ExhibitorParticipation.countDocuments({
                exhibitor: exhibitorId,
                status: "rejected"
            })
        ]);

        const upcomingEvents =
            await ExhibitorParticipation.find({
                exhibitor: exhibitorId,
                status: "approved"
            })
                .populate({
                    path: "event",
                    match: {
                        startDate: {
                            $gt: new Date()
                        },
                        status: "published",
                        isPublished: true
                    },
                    select:
                        "title category location startDate endDate bannerImage status"
                })
                .sort({
                    appliedAt: -1
                });

        const validUpcomingEvents =
            upcomingEvents.filter(
                application =>
                    application.event !== null
            );

        res.status(200).json({
            message:
                "Exhibitor dashboard data retrieved successfully",

            statistics: {
                totalApplications,
                pendingApplications,
                approvedApplications,
                rejectedApplications,
                upcomingEvents:
                    validUpcomingEvents.length
            },

            upcomingEvents:
                validUpcomingEvents
        });

    } catch (error) {
        console.error(
            "Exhibitor dashboard error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ======================================================
// ATTENDEE DASHBOARD
// ======================================================

const getAttendeeDashboard = async (req, res) => {
    try {
        const attendeeId = req.user._id;

        const registrations =
            await Registration.find({
                attendee: attendeeId
            })
                .populate({
                    path: "event",
                    select:
                        "title description category location startDate endDate registrationDeadline bannerImage status isPublished"
                })
                .sort({
                    registrationDate: -1
                });

        const upcomingRegistrations =
            registrations.filter(
                registration =>
                    registration.event &&
                    registration.event.startDate > new Date() &&
                    registration.status === "registered"
            );

        const pastRegistrations =
            registrations.filter(
                registration =>
                    registration.event &&
                    registration.event.endDate < new Date()
            );

        const cancelledRegistrations =
            registrations.filter(
                registration =>
                    registration.status === "cancelled"
            );

        const attendedRegistrations =
            registrations.filter(
                registration =>
                    registration.status === "attended"
            );

        res.status(200).json({
            message:
                "Attendee dashboard data retrieved successfully",

            statistics: {
                totalRegistrations:
                    registrations.length,

                upcomingEvents:
                    upcomingRegistrations.length,

                pastEvents:
                    pastRegistrations.length,

                cancelledRegistrations:
                    cancelledRegistrations.length,

                attendedEvents:
                    attendedRegistrations.length
            },

            upcomingEvents:
                upcomingRegistrations,

            pastEvents:
                pastRegistrations,

            cancelledEvents:
                cancelledRegistrations,

            attendedEvents:
                attendedRegistrations
        });

    } catch (error) {
        console.error(
            "Attendee dashboard error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ======================================================
// EXPORTS
// ======================================================

export {
    getAdminDashboard,
    getOrganizerDashboard,
    getExhibitorDashboard,
    getAttendeeDashboard
};