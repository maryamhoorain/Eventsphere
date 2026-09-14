import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
    {
        attendee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event"
        },

        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Session"
        }
    },
    {
        timestamps: true
    }
);

// An attendee can favorite an event or session only once.
favoriteSchema.index(
    {
        attendee: 1,
        event: 1
    },
    {
        unique: true,
        partialFilterExpression: { event: { $type: "objectId" } }
    }
);

favoriteSchema.index(
    {
        attendee: 1,
        session: 1
    },
    {
        unique: true,
        partialFilterExpression: { session: { $type: "objectId" } }
    }
);

favoriteSchema.pre("validate", function (next) {
    if ((this.event && this.session) || (!this.event && !this.session)) {
        next(new Error("A favorite must reference exactly one event or session"));
        return;
    }
    next();
});

const Favorite = mongoose.model(
    "Favorite",
    favoriteSchema
);

export default Favorite;