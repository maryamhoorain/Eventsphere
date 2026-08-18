import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true
        },

        category: {
            type: String,
            required: true
        },

        organizer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        location: {
            venue: String,
            address: String,
            city: String,
            country: String
        },

        startDate: {
            type: Date,
            required: true
        },

        endDate: {
            type: Date,
            required: true
        },

        registrationDeadline: {
            type: Date
        },

        bannerImage: {
            type: String
        },

        capacity: {
            type: Number
        },

        tags: [
            {
                type: String
            }
        ],

        status: {
            type: String,
            enum: ["draft", "published", "ongoing", "completed", "cancelled"],
            default: "draft"
        },

        isPublished: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const Event = mongoose.model("Event", eventSchema);

export default Event;