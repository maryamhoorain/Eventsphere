import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
    {
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true,
            index: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        topic: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        speaker: {
            name: {
                type: String,
                required: true,
                trim: true
            },

            bio: {
                type: String,
                trim: true
            },

            image: {
                type: String,
                trim: true
            }
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
            type: String,
            trim: true
        },

        capacity: {
            type: Number,
            min: 1
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

sessionSchema.index({
    event: 1,
    date: 1,
    startTime: 1
});

const Session = mongoose.model("Session", sessionSchema);

export default Session;