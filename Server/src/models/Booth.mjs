import mongoose from "mongoose";

const boothSchema = new mongoose.Schema(
    {
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },

        boothNumber: {
            type: String,
            required: true,
            trim: true
        },

        size: {
            type: String,
            trim: true
        },

        location: {
            type: String,
            trim: true
        },

        floor: {
            type: Number,
            min: 1,
            enum: [1, 2],
            default: 1
        },

        positionX: {
            type: Number,
            min: 0,
            max: 100,
            default: null
        },

        positionY: {
            type: Number,
            min: 0,
            max: 100,
            default: null
        },

        mapCoordinates: {
            x: { type: Number, default: null },
            y: { type: Number, default: null }
        },

        price: {
            type: Number,
            default: 0,
            min: 0
        },

        exhibitor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        status: {
            type: String,
            enum: [
                "available",
                "pending",
                "reserved",
                "occupied",
                "rejected"
            ],
            default: "available"
        },

        requestedAt: {
            type: Date,
            default: null
        },

        approvedAt: {
            type: Date,
            default: null
        },

        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        rejectedAt: {
            type: Date,
            default: null
        },

        rejectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate booth numbers within the same event
boothSchema.index(
    {
        event: 1,
        boothNumber: 1
    },
    {
        unique: true
    }
);

const Booth = mongoose.model("Booth", boothSchema);

export default Booth;