import User from "../models/User.mjs";
import Event from "../models/Event.mjs";
import Registration from "../models/Registration.mjs";
import ExhibitorParticipation from "../models/ExhibitorParticipation.mjs";

const getAdminDashboard = async (req, res) => {
    try {
        const [
            totalUsers,
            totalAttendees,
            totalExhibitors,
            totalEvents,
            publishedEvents,
            upcomingEvents,
            totalRegistrations,
            pendingApplications
        ] = await Promise.all([

            User.countDocuments(),

            User.countDocuments({
                role: "attendee"
            }),

            User.countDocuments({
                role: "exhibitor"
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
            })
        ]);

        res.status(200).json({
            message: "Admin dashboard data retrieved successfully",

            statistics: {
                totalUsers,
                totalAttendees,
                totalExhibitors,
                totalEvents,
                publishedEvents,
                upcomingEvents,
                totalRegistrations,
                pendingApplications
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


        // Get upcoming approved events
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


        // Because populate with match can return null
        const validUpcomingEvents =
            upcomingEvents.filter(
                application => application.event !== null
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

const getAttendeeDashboard = async (req, res) => {
    try {
        const attendeeId = req.user._id;

        // Get all registrations
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


        // Separate registrations
        const upcomingRegistrations =
            registrations.filter(registration =>
                registration.event &&
                registration.event.startDate > new Date() &&
                registration.status === "registered"
            );


        const pastRegistrations =
            registrations.filter(registration =>
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

export {
    getAdminDashboard,
    getExhibitorDashboard,
    getAttendeeDashboard
};