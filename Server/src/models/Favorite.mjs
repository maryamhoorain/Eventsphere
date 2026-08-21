import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
    {
        attendee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        }
    },
    {
        timestamps: true
    }
);

// An attendee can favorite an event only once
favoriteSchema.index(
    {
        attendee: 1,
        event: 1
    },
    {
        unique: true
    }
);

const Favorite = mongoose.model(
    "Favorite",
    favoriteSchema
);

export default Favorite;