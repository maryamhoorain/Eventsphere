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
            required: true
        },

        size: {
            type: String
        },

        location: {
            type: String
        },

        price: {
            type: Number,
            default: 0
        },

        exhibitor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Exhibitor",
            default: null
        },

        status: {
            type: String,
            enum: ["available", "reserved", "occupied"],
            default: "available"
        }
    },
    {
        timestamps: true
    }
);

const Booth = mongoose.model("Booth", boothSchema);

export default Booth;