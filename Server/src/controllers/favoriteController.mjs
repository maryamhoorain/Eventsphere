import Favorite from "../models/Favorite.mjs";
import Event from "../models/Event.mjs";


// ==========================================
// ADD EVENT TO FAVORITES
// ==========================================

const addFavorite = async (req, res) => {
    try {
        const { eventId } = req.params;

        const attendeeId = req.user._id;

        // Check event
        const event = await Event.findOne({
            _id: eventId,
            status: "published",
            isPublished: true
        });

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        // Check if already favorited
        const existingFavorite =
            await Favorite.findOne({
                attendee: attendeeId,
                event: eventId
            });

        if (existingFavorite) {
            return res.status(400).json({
                message:
                    "Event is already in your favorites"
            });
        }

        const favorite =
            await Favorite.create({
                attendee: attendeeId,
                event: eventId
            });

        res.status(201).json({
            message:
                "Event added to favorites successfully",
            favorite
        });

    } catch (error) {

        console.error(
            "Add favorite error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// REMOVE EVENT FROM FAVORITES
// ==========================================

const removeFavorite = async (req, res) => {
    try {
        const { eventId } = req.params;

        const attendeeId = req.user._id;

        const favorite =
            await Favorite.findOneAndDelete({
                attendee: attendeeId,
                event: eventId
            });

        if (!favorite) {
            return res.status(404).json({
                message:
                    "Event is not in your favorites"
            });
        }

        res.status(200).json({
            message:
                "Event removed from favorites successfully"
        });

    } catch (error) {

        console.error(
            "Remove favorite error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// GET MY FAVORITES
// ==========================================

const getMyFavorites = async (req, res) => {
    try {

        const favorites =
            await Favorite.find({
                attendee: req.user._id
            })
                .populate({
                    path: "event",
                    select:
                        "title description category location startDate endDate registrationDeadline bannerImage status isPublished"
                })
                .sort({
                    createdAt: -1
                });

        res.status(200).json({
            count: favorites.length,
            favorites
        });

    } catch (error) {

        console.error(
            "Get favorites error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// CHECK IF EVENT IS FAVORITED
// ==========================================

const checkFavorite = async (req, res) => {
    try {
        const { eventId } = req.params;

        const favorite =
            await Favorite.findOne({
                attendee: req.user._id,
                event: eventId
            });

        res.status(200).json({
            isFavorite: !!favorite
        });

    } catch (error) {

        console.error(
            "Check favorite error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


export {
    addFavorite,
    removeFavorite,
    getMyFavorites,
    checkFavorite
};