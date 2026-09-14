import Favorite from "../models/Favorite.mjs";
import Event from "../models/Event.mjs";
import Session from "../models/Session.mjs";
import mongoose from "mongoose";

const targetDetails = (req) => req.params.eventId
    ? { type: "event", id: req.params.eventId, field: "event" }
    : { type: "session", id: req.params.sessionId, field: "session" };

const getTarget = async (target) => {
    if (target.type === "event") {
        return Event.findOne({ _id: target.id, status: "published", isPublished: true });
    }

    const session = await Session.findOne({ _id: target.id, isActive: true }).populate({
        path: "event",
        match: { status: "published", isPublished: true }
    });
    return session && session.event ? session : null;
};

const addFavorite = async (req, res) => {
    try {
        const target = targetDetails(req);
        if (!mongoose.isValidObjectId(target.id)) {
            return res.status(400).json({ message: `Invalid ${target.type} id` });
        }
        if (!await getTarget(target)) {
            return res.status(404).json({ message: `${target.type === "event" ? "Event" : "Session"} not found` });
        }

        const existingFavorite = await Favorite.findOne({
            attendee: req.user._id,
            [target.field]: target.id
        });
        if (existingFavorite) {
            return res.status(400).json({
                message: `${target.type === "event" ? "Event" : "Session"} is already in your favorites`
            });
        }

        const favorite = await Favorite.findOneAndUpdate(
            {
                attendee: req.user._id,
                [target.field]: target.id
            },
            {
                $setOnInsert: {
                    attendee: req.user._id,
                    [target.field]: target.id
                }
            },
            { new: true, upsert: true, runValidators: true }
        );
        return res.status(201).json({
            message: `${target.type === "event" ? "Event" : "Session"} added to favorites successfully`,
            favorite
        });
    } catch (error) {
        console.error("Add favorite error:", error.message);
        if (error?.code === 11000) {
            return res.status(409).json({ message: "This favorite already exists" });
        }
        if (error?.name === "CastError" || error?.name === "ValidationError") {
            return res.status(400).json({ message: "Favorite data is invalid" });
        }
        return res.status(500).json({ message: "Unable to save favorite" });
    }
};

const removeFavorite = async (req, res) => {
    try {
        const target = targetDetails(req);
        const favorite = await Favorite.findOneAndDelete({
            attendee: req.user._id,
            [target.field]: target.id
        });
        if (!favorite) {
            return res.status(404).json({
                message: `${target.type === "event" ? "Event" : "Session"} is not in your favorites`
            });
        }
        return res.status(200).json({
            message: `${target.type === "event" ? "Event" : "Session"} removed from favorites successfully`
        });
    } catch (error) {
        console.error("Remove favorite error:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
};

const getMyFavorites = async (req, res) => {
    try {
        const favorites = await Favorite.find({ attendee: req.user._id })
            .populate({
                path: "event",
                select: "title description category location startDate endDate registrationDeadline bannerImage status isPublished"
            })
            .populate({
                path: "session",
                select: "event title topic description speaker date startTime endTime location capacity isActive",
                populate: { path: "event", select: "_id title slug" }
            })
            .sort({ createdAt: -1 });
        return res.status(200).json({ count: favorites.length, favorites });
    } catch (error) {
        console.error("Get favorites error:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
};

const checkFavorite = async (req, res) => {
    try {
        const target = targetDetails(req);
        const favorite = await Favorite.findOne({
            attendee: req.user._id,
            [target.field]: target.id
        });
        return res.status(200).json({ isFavorite: !!favorite });
    } catch (error) {
        console.error("Check favorite error:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
};

export { addFavorite, removeFavorite, getMyFavorites, checkFavorite };
