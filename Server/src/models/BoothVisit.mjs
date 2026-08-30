import mongoose from "mongoose";

const boothVisitSchema = new mongoose.Schema(
    {
        booth: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booth",
            required: true
        },

        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },

        attendee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        visitedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Useful for analytics queries
boothVisitSchema.index({
    booth: 1,
    visitedAt: -1
});

boothVisitSchema.index({
    event: 1,
    visitedAt: -1
});

boothVisitSchema.index(
    {
        booth: 1,
        attendee: 1,
        event: 1
    },
    {
        unique: true
    }
);

const BoothVisit = mongoose.model(
    "BoothVisit",
    boothVisitSchema
);

export default BoothVisit;