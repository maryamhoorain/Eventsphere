import mongoose from "mongoose";

// This collection is the unassigned booth map. Approved assignments are copied
// into Booth; pending selections remain here until an admin decides.
const boothRequestSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    boothNumber: { type: String, required: true, trim: true },
    size: { type: String, trim: true },
    location: { type: String, trim: true },
    floor: { type: String, trim: true, default: "Ground Floor" },
    positionX: { type: Number, min: 0, max: 100, default: null },
    positionY: { type: Number, min: 0, max: 100, default: null },
    mapCoordinates: {
      x: { type: Number, default: null },
      y: { type: Number, default: null },
    },
    price: { type: Number, min: 0, default: 0 },
    exhibitor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: {
      type: String,
      enum: ["available", "pending"],
      default: "available",
    },
    requestedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    adminNotes: { type: String, trim: true, default: null },
  },
  { timestamps: true, collection: "request Booths" },
);

boothRequestSchema.index({ event: 1, boothNumber: 1 }, { unique: true });

const BoothRequest = mongoose.model("BoothRequest", boothRequestSchema);

export default BoothRequest;
