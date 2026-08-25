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
                "reserved",
                "occupied"
            ],
            default: "available"
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