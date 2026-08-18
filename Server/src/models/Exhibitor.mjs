import mongoose from "mongoose";

const exhibitorSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        companyName: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String
        },

        logo: {
            type: String
        },

        website: {
            type: String
        },

        industry: {
            type: String
        },

        contactEmail: {
            type: String
        },

        contactPhone: {
            type: String
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

const Exhibitor = mongoose.model("Exhibitor", exhibitorSchema);

export default Exhibitor;