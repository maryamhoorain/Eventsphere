import Registration from "../models/Registration.mjs";
import ExhibitorParticipation from "../models/ExhibitorParticipation.mjs";
import Booth from "../models/Booth.mjs";
import BoothVisit from "../models/BoothVisit.mjs";
import Feedback from "../models/Feedback.mjs";
import Event from "../models/Event.mjs";


// ==========================================
// EVENT OVERVIEW
// ==========================================

const getEventOverview = async (eventId) => {

    const event = await Event.findById(eventId)
        .select(
            "title category location startDate endDate status isPublished"
        );

    if (!event) {
        throw new Error("Event not found");
    }


    // ==========================================
    // REGISTRATIONS
    // ==========================================

    const totalRegistrations =
        await Registration.countDocuments({
            event: eventId
        });

    const registered =
        await Registration.countDocuments({
            event: eventId,
            status: "registered"
        });

    const cancelled =
        await Registration.countDocuments({
            event: eventId,
            status: "cancelled"
        });

    const attended =
        await Registration.countDocuments({
            event: eventId,
            status: "attended"
        });


    // ==========================================
    // EXHIBITORS
    // ==========================================

    const totalExhibitors =
        await ExhibitorParticipation.countDocuments({
            event: eventId
        });

    const approvedExhibitors =
        await ExhibitorParticipation.countDocuments({
            event: eventId,
            status: "approved"
        });

    const pendingExhibitors =
        await ExhibitorParticipation.countDocuments({
            event: eventId,
            status: "pending"
        });

    const rejectedExhibitors =
        await ExhibitorParticipation.countDocuments({
            event: eventId,
            status: "rejected"
        });


    // ==========================================
    // BOOTHS
    // ==========================================

    const totalBooths =
        await Booth.countDocuments({
            event: eventId
        });

    const availableBooths =
        await Booth.countDocuments({
            event: eventId,
            status: "available"
        });

    const occupiedBooths =
        await Booth.countDocuments({
            event: eventId,
            status: "occupied"
        });

    const reservedBooths =
        await Booth.countDocuments({
            event: eventId,
            status: "reserved"
        });


    // ==========================================
    // BOOTH VISITS
    // ==========================================

    const totalBoothVisits =
        await BoothVisit.countDocuments({
            event: eventId
        });


    const uniqueVisitorsResult =
        await BoothVisit.aggregate([
            {
                $match: {
                    event: event._id
                }
            },
            {
                $group: {
                    _id: "$attendee"
                }
            },
            {
                $count: "total"
            }
        ]);

    const uniqueVisitors =
        uniqueVisitorsResult.length > 0
            ? uniqueVisitorsResult[0].total
            : 0;


    // ==========================================
    // FEEDBACK
    // ==========================================

    const totalFeedback =
        await Feedback.countDocuments({
            event: eventId
        });


    const feedbackResult =
        await Feedback.aggregate([
            {
                $match: {
                    event: event._id
                }
            },
            {
                $group: {
                    _id: null,
                    averageRating: {
                        $avg: "$rating"
                    }
                }
            }
        ]);

    const averageRating =
        feedbackResult.length > 0
            ? Number(
                feedbackResult[0].averageRating.toFixed(2)
            )
            : 0;


    // ==========================================
    // RETURN OVERVIEW
    // ==========================================

    return {

        event,

        registrations: {
            total: totalRegistrations,
            registered,
            cancelled,
            attended
        },

        exhibitors: {
            total: totalExhibitors,
            approved: approvedExhibitors,
            pending: pendingExhibitors,
            rejected: rejectedExhibitors
        },

        booths: {
            total: totalBooths,
            available: availableBooths,
            occupied: occupiedBooths,
            reserved: reservedBooths
        },

        visitors: {
            totalVisits: totalBoothVisits,
            uniqueVisitors
        },

        feedback: {
            total: totalFeedback,
            averageRating
        }

    };
};


// ==========================================
// REGISTRATION ANALYTICS
// ==========================================

const getRegistrationAnalytics = async (eventId) => {

    const event = await Event.findById(eventId)
        .select("title");

    if (!event) {
        throw new Error("Event not found");
    }


    const registrations =
        await Registration.aggregate([

            {
                $match: {
                    event: event._id
                }
            },

            {
                $group: {
                    _id: "$status",
                    count: {
                        $sum: 1
                    }
                }
            }

        ]);


    return {
        event,
        registrations
    };
};


// ==========================================
// EXHIBITOR ANALYTICS
// ==========================================

const getExhibitorAnalytics = async (eventId) => {

    const event = await Event.findById(eventId)
        .select("title");

    if (!event) {
        throw new Error("Event not found");
    }


    const exhibitors =
        await ExhibitorParticipation.aggregate([

            {
                $match: {
                    event: event._id
                }
            },

            {
                $group: {
                    _id: "$status",
                    count: {
                        $sum: 1
                    }
                }
            }

        ]);


    return {
        event,
        exhibitors
    };
};


// ==========================================
// BOOTH ANALYTICS
// ==========================================

const getBoothAnalytics = async (eventId) => {

    const event = await Event.findById(eventId)
        .select("title");

    if (!event) {
        throw new Error("Event not found");
    }


    const booths =
        await Booth.aggregate([

            {
                $match: {
                    event: event._id
                }
            },

            {
                $group: {
                    _id: "$status",
                    count: {
                        $sum: 1
                    }
                }
            }

        ]);


    return {
        event,
        booths
    };
};


// ==========================================
// VISITOR ANALYTICS
// ==========================================

const getVisitorAnalytics = async (eventId) => {

    const event = await Event.findById(eventId)
        .select("title");

    if (!event) {
        throw new Error("Event not found");
    }


    const totalVisits =
        await BoothVisit.countDocuments({
            event: eventId
        });


    const uniqueVisitorsResult =
        await BoothVisit.aggregate([

            {
                $match: {
                    event: event._id
                }
            },

            {
                $group: {
                    _id: "$attendee"
                }
            },

            {
                $count: "total"
            }

        ]);


    const uniqueVisitors =
        uniqueVisitorsResult.length > 0
            ? uniqueVisitorsResult[0].total
            : 0;


    // ==========================================
    // MOST VISITED BOOTHS
    // ==========================================

    const mostVisitedBooths =
        await BoothVisit.aggregate([

            {
                $match: {
                    event: event._id
                }
            },

            {
                $group: {
                    _id: "$booth",
                    visits: {
                        $sum: 1
                    }
                }
            },

            {
                $sort: {
                    visits: -1
                }
            },

            {
                $limit: 10
            },

            {
                $lookup: {
                    from: "booths",
                    localField: "_id",
                    foreignField: "_id",
                    as: "booth"
                }
            },

            {
                $unwind: "$booth"
            },

            {
                $project: {
                    _id: 0,
                    boothId: "$booth._id",
                    boothNumber: "$booth.boothNumber",
                    visits: 1
                }
            }

        ]);


    return {

        event,

        visitors: {
            totalVisits,
            uniqueVisitors
        },

        mostVisitedBooths

    };
};


// ==========================================
// FEEDBACK ANALYTICS
// ==========================================

const getFeedbackAnalytics = async (eventId) => {

    const event = await Event.findById(eventId)
        .select("title");

    if (!event) {
        throw new Error("Event not found");
    }


    const totalFeedback =
        await Feedback.countDocuments({
            event: eventId
        });


    const averageResult =
        await Feedback.aggregate([

            {
                $match: {
                    event: event._id
                }
            },

            {
                $group: {
                    _id: null,
                    averageRating: {
                        $avg: "$rating"
                    }
                }
            }

        ]);


    const averageRating =
        averageResult.length > 0
            ? Number(
                averageResult[0].averageRating.toFixed(2)
            )
            : 0;


    // ==========================================
    // RATING DISTRIBUTION
    // ==========================================

    const ratingDistribution =
        await Feedback.aggregate([

            {
                $match: {
                    event: event._id
                }
            },

            {
                $group: {
                    _id: "$rating",
                    count: {
                        $sum: 1
                    }
                }
            },

            {
                $sort: {
                    _id: 1
                }
            }

        ]);


    return {

        event,

        feedback: {
            total: totalFeedback,
            averageRating,
            ratingDistribution
        }

    };
    
};

// ==========================================
// MY EXHIBITOR OVERVIEW
// EXHIBITOR
// ==========================================

const getMyExhibitorOverview = async (exhibitorId) => {

    const applications =
        await ExhibitorParticipation.find({
            exhibitor: exhibitorId
        })
            .populate(
                "event",
                "title category location startDate endDate bannerImage status"
            )
            .populate(
                "booth",
                "boothNumber size location price status"
            )
            .sort({
                appliedAt: -1
            });


    if (applications.length === 0) {
        return {
            applications: [],
            summary: {
                totalEvents: 0,
                approvedEvents: 0,
                pendingEvents: 0,
                rejectedEvents: 0,
                totalBooths: 0,
                totalVisits: 0,
                uniqueVisitors: 0,
                totalFeedback: 0,
                averageRating: 0
            }
        };
    }


    const eventIds = applications.map(
        application => application.event._id
    );


    // ==========================================
    // BOOTHS
    // ==========================================

    const booths =
        await Booth.find({
            exhibitor: exhibitorId
        });


    const boothIds = booths.map(
        booth => booth._id
    );


    // ==========================================
    // BOOTH VISITS
    // ==========================================

    const totalVisits =
        await BoothVisit.countDocuments({
            booth: {
                $in: boothIds
            }
        });


    const uniqueVisitorsResult =
        await BoothVisit.aggregate([

            {
                $match: {
                    booth: {
                        $in: boothIds
                    }
                }
            },

            {
                $group: {
                    _id: "$attendee"
                }
            },

            {
                $count: "total"
            }

        ]);


    const uniqueVisitors =
        uniqueVisitorsResult.length > 0
            ? uniqueVisitorsResult[0].total
            : 0;


    // ==========================================
    // FEEDBACK
    // ==========================================

   const feedback =
    await Feedback.find({
        booth: {
            $in: boothIds
        }
    });

    const totalFeedback =
        feedback.length;


    const averageRating =
        totalFeedback > 0
            ? Number(
                (
                    feedback.reduce(
                        (sum, item) => sum + item.rating,
                        0
                    ) / totalFeedback
                ).toFixed(2)
            )
            : 0;


    // ==========================================
    // RETURN
    // ==========================================

    return {

        applications,

        summary: {

            totalEvents:
                applications.length,

            approvedEvents:
                applications.filter(
                    item => item.status === "approved"
                ).length,

            pendingEvents:
                applications.filter(
                    item => item.status === "pending"
                ).length,

            rejectedEvents:
                applications.filter(
                    item => item.status === "rejected"
                ).length,

            totalBooths:
                booths.length,

            totalVisits,

            uniqueVisitors,

            totalFeedback,

            averageRating

        }

    };
};


// ==========================================
// MY BOOTH ANALYTICS
// EXHIBITOR
// ==========================================

const getMyBoothAnalytics = async (exhibitorId) => {

    const booths =
        await Booth.find({
            exhibitor: exhibitorId
        })
            .populate(
                "event",
                "title category location startDate endDate"
            )
            .sort({
                createdAt: -1
            });


    const boothAnalytics =
        await Promise.all(

            booths.map(async (booth) => {

                const totalVisits =
                    await BoothVisit.countDocuments({
                        booth: booth._id
                    });


                const uniqueVisitorsResult =
                    await BoothVisit.aggregate([

                        {
                            $match: {
                                booth: booth._id
                            }
                        },

                        {
                            $group: {
                                _id: "$attendee"
                            }
                        },

                        {
                            $count: "total"
                        }

                    ]);


                const uniqueVisitors =
                    uniqueVisitorsResult.length > 0
                        ? uniqueVisitorsResult[0].total
                        : 0;


                return {

                    boothId:
                        booth._id,

                    boothNumber:
                        booth.boothNumber,

                    size:
                        booth.size,

                    location:
                        booth.location,

                    price:
                        booth.price,

                    status:
                        booth.status,

                    event:
                        booth.event,

                    totalVisits,

                    uniqueVisitors

                };

            })

        );


    return {
        booths: boothAnalytics
    };
};


// ==========================================
// MY VISITOR ANALYTICS
// EXHIBITOR
// ==========================================

const getMyVisitorAnalytics = async (exhibitorId) => {

    const booths =
        await Booth.find({
            exhibitor: exhibitorId
        })
            .select("_id boothNumber event");


    const boothIds =
        booths.map(
            booth => booth._id
        );


    const totalVisits =
        await BoothVisit.countDocuments({
            booth: {
                $in: boothIds
            }
        });


    const uniqueVisitorsResult =
        await BoothVisit.aggregate([

            {
                $match: {
                    booth: {
                        $in: boothIds
                    }
                }
            },

            {
                $group: {
                    _id: "$attendee"
                }
            },

            {
                $count: "total"
            }

        ]);


    const uniqueVisitors =
        uniqueVisitorsResult.length > 0
            ? uniqueVisitorsResult[0].total
            : 0;


    // ==========================================
    // MOST VISITED OWN BOOTHS
    // ==========================================

    const mostVisitedBooths =
        await BoothVisit.aggregate([

            {
                $match: {
                    booth: {
                        $in: boothIds
                    }
                }
            },

            {
                $group: {
                    _id: "$booth",

                    visits: {
                        $sum: 1
                    }
                }
            },

            {
                $sort: {
                    visits: -1
                }
            },

            {
                $lookup: {
                    from: "booths",

                    localField: "_id",

                    foreignField: "_id",

                    as: "booth"
                }
            },

            {
                $unwind: "$booth"
            },

            {
                $project: {
                    _id: 0,

                    boothId:
                        "$booth._id",

                    boothNumber:
                        "$booth.boothNumber",

                    visits: 1
                }
            }

        ]);


    return {

        visitors: {

            totalVisits,

            uniqueVisitors

        },

        mostVisitedBooths

    };
};


// ==========================================
// MY FEEDBACK ANALYTICS
// EXHIBITOR
// ==========================================

const getMyFeedbackAnalytics = async (exhibitorId) => {

    // Get only booths owned by this exhibitor
    const booths =
        await Booth.find({
            exhibitor: exhibitorId
        })
            .select("_id boothNumber event");


    const boothIds =
        booths.map(
            booth => booth._id
        );


    // ==========================================
    // TOTAL FEEDBACK
    // ==========================================

    const totalFeedback =
        await Feedback.countDocuments({
            booth: {
                $in: boothIds
            }
        });


    // ==========================================
    // AVERAGE RATING
    // ==========================================

    const averageResult =
        await Feedback.aggregate([

            {
                $match: {
                    booth: {
                        $in: boothIds
                    }
                }
            },

            {
                $group: {
                    _id: null,

                    averageRating: {
                        $avg: "$rating"
                    }
                }
            }

        ]);


    const averageRating =
        averageResult.length > 0
            ? Number(
                averageResult[0].averageRating.toFixed(2)
            )
            : 0;


    // ==========================================
    // RATING DISTRIBUTION
    // ==========================================

    const ratingDistribution =
        await Feedback.aggregate([

            {
                $match: {
                    booth: {
                        $in: boothIds
                    }
                }
            },

            {
                $group: {
                    _id: "$rating",

                    count: {
                        $sum: 1
                    }
                }
            },

            {
                $sort: {
                    _id: 1
                }
            }

        ]);


    return {

        feedback: {

            total: totalFeedback,

            averageRating,

            ratingDistribution

        }

    };
};

export {
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
};