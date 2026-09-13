import mongoose from "mongoose";

const organizerApplicationSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    organizationName: {
      type: String,
      required: true,
      trim: true,
    },

    organizationDescription: {
      type: String,
      trim: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    experience: {
      type: String,
      trim: true,
    },

    website: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    adminNotes: {
      type: String,
      trim: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

organizerApplicationSchema.index(
  { applicant: 1 },
  { unique: true }
);

const OrganizerApplication =
  mongoose.model(
    "OrganizerApplication",
    organizerApplicationSchema
  );

export default OrganizerApplication;