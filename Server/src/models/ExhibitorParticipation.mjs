import mongoose from "mongoose";

const exhibitorParticipationSchema = new mongoose.Schema(
    {
        exhibitor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },

        businessName: {
            type: String,
            required: true,
            trim: true
        },

        businessDescription: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        boothRequired: {
            type: Boolean,
            default: true
        },

        boothNumber: {
            type: String,
            default: null
        },

        status: {
            type: String,
            enum: [
                "pending",
                "approved",
                "rejected",
                "cancelled"
            ],
            default: "pending"
        },

        adminNotes: {
            type: String,
            default: null
        },

        appliedAt: {
            type: Date,
            default: Date.now
        },

        approvedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);
exhibitorParticipationSchema.index(
    {
        exhibitor: 1,
        event: 1
    },
    {
        unique: true
    }
);
const ExhibitorParticipation =
    mongoose.model(
        "ExhibitorParticipation",
        exhibitorParticipationSchema
    );

export default ExhibitorParticipation;