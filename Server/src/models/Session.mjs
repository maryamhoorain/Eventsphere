import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
    {
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },

        title: {
            type: String,
            required: true
        },

        description: {
            type: String
        },

        speaker: {
            name: String,
            bio: String,
            image: String
        },

        date: {
            type: Date,
            required: true
        },

        startTime: {
            type: String,
            required: true
        },

        endTime: {
            type: String,
            required: true
        },

        location: {
            type: String
        },

        capacity: {
            type: Number
        }
    },
    {
        timestamps: true
    }
);

const Session = mongoose.model("Session", sessionSchema);

export default Session;