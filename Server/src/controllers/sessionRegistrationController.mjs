import SessionRegistration from "../models/SessionRegistration.mjs";

import Session from "../models/Session.mjs";

import Registration from "../models/Registration.mjs";

import Event from "../models/Event.mjs";

import createNotification from "../utils/createNotification.mjs";

// ==========================================
// REGISTER FOR SESSION
// ATTENDEE
// ==========================================

const registerForSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const attendeeId = req.user._id;

    // ==========================================
    // FIND SESSION
    // ==========================================

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    // ==========================================
    // FIND EVENT
    // ==========================================

    const event = await Event.findOne({
      _id: session.event,
      status: "published",
      isPublished: true,
    });

    if (!event) {
      return res.status(404).json({
        message: "Published event not found",
      });
    }
    console.log("========== SESSION REGISTRATION DEBUG ==========");
    console.log("Logged-in attendee:", req.user._id);
    console.log("Session ID:", session._id);
    console.log("Session event:", session.event);

    // ==========================================
    // CHECK EVENT REGISTRATION
    // ==========================================
    const eventRegistration = await Registration.findOne({
      attendee: req.user._id,
      event: session.event,
      status: "registered",
    });

    console.log("Event registration:", eventRegistration);
    console.log("===============================================");

    if (!eventRegistration) {
      return res.status(400).json({
        message:
          "You must be registered for this event before registering for a session",
      });
    }

    // ==========================================
    // SESSION MUST NOT HAVE STARTED
    // ==========================================

    const sessionDate = new Date(session.date);

    const sessionStart = session.startTime.split(":");

    sessionDate.setHours(
      Number(sessionStart[0]),
      Number(sessionStart[1]),
      0,
      0,
    );

    if (new Date() >= sessionDate) {
      return res.status(400).json({
        message: "You cannot register for a session that has already started",
      });
    }

    // ==========================================
    // CHECK EXISTING REGISTRATION
    // ==========================================

    const existingRegistration = await SessionRegistration.findOne({
      attendee: attendeeId,
      session: sessionId,
    });

    if (existingRegistration) {
      // Restore cancelled registration
      if (existingRegistration.status === "cancelled") {
        existingRegistration.status = "registered";

        existingRegistration.registeredAt = new Date();

        existingRegistration.cancelledAt = null;

        existingRegistration.attendedAt = null;

        await existingRegistration.save();

        await createNotification({
          recipient: attendeeId,

          title: "Session Registration Confirmed",

          message: `You have successfully registered again for the session "${session.title}".`,

          type: "session",

          relatedEvent: event._id,
        });

        return res.status(200).json({
          message: "Session registration restored successfully",

          registration: existingRegistration,
        });
      }

      if (existingRegistration.status === "attended") {
        return res.status(400).json({
          message: "You have already attended this session",
        });
      }

      return res.status(400).json({
        message: "You are already registered for this session",
      });
    }

    // ==========================================
    // CHECK SESSION CAPACITY
    // ==========================================

    if (session.capacity) {
      const registeredCount = await SessionRegistration.countDocuments({
        session: sessionId,
        status: "registered",
      });

      if (registeredCount >= session.capacity) {
        return res.status(400).json({
          message: "This session is full",
        });
      }
    }

    // ==========================================
    // CREATE REGISTRATION
    // ==========================================

    const registration = await SessionRegistration.create({
      attendee: attendeeId,

      session: sessionId,

      event: event._id,

      status: "registered",
    });

    // ==========================================
    // NOTIFICATION
    // ==========================================

    await createNotification({
      recipient: attendeeId,

      title: "Session Registration Confirmed",

      message: `You have successfully registered for the session "${session.title}".`,

      type: "session",

      relatedEvent: event._id,
    });

    // ==========================================
    // RESPONSE
    // ==========================================

    res.status(201).json({
      message: "Successfully registered for the session",

      registration,
    });
  } catch (error) {
    console.error("Session registration error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET MY SESSION REGISTRATIONS
// ATTENDEE
// ==========================================

const getMySessionRegistrations = async (req, res) => {
  try {
    const registrations = await SessionRegistration.find({
      attendee: req.user._id,
    })
      .populate(
        "session",
        "title description speaker date startTime endTime location capacity",
      )
      .populate(
        "event",
        "title category location startDate endDate bannerImage",
      )
      .sort({
        registeredAt: -1,
      });

    res.status(200).json({
      count: registrations.length,

      registrations,
    });
  } catch (error) {
    console.error("Get session registrations error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET SESSION REGISTRATION BY ID
// ATTENDEE
// ==========================================

const getSessionRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;

    const registration = await SessionRegistration.findOne({
      _id: id,

      attendee: req.user._id,
    })
      .populate(
        "session",
        "title description speaker date startTime endTime location capacity",
      )
      .populate(
        "event",
        "title category location startDate endDate bannerImage",
      );

    if (!registration) {
      return res.status(404).json({
        message: "Session registration not found",
      });
    }

    res.status(200).json({
      registration,
    });
  } catch (error) {
    console.error("Get session registration error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// CANCEL SESSION REGISTRATION
// ATTENDEE
// ==========================================

const cancelSessionRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    const registration = await SessionRegistration.findOne({
      _id: id,
      attendee: req.user._id,
    })
      .populate("session")
      .populate("event");

    if (!registration) {
      return res.status(404).json({
        message: "Session registration not found",
      });
    }

    if (registration.status === "cancelled") {
      return res.status(400).json({
        message: "Session registration is already cancelled",
      });
    }

    if (registration.status === "attended") {
      return res.status(400).json({
        message: "An attended session cannot be cancelled",
      });
    }

    // ==========================================
    // CHECK SESSION START
    // ==========================================

    const session = registration.session;

    const sessionDate = new Date(session.date);

    const sessionStart = session.startTime.split(":");

    sessionDate.setHours(
      Number(sessionStart[0]),
      Number(sessionStart[1]),
      0,
      0,
    );

    if (new Date() >= sessionDate) {
      return res.status(400).json({
        message:
          "Session registration cannot be cancelled after the session has started",
      });
    }

    registration.status = "cancelled";

    registration.cancelledAt = new Date();

    await registration.save();

    await createNotification({
      recipient: req.user._id,

      title: "Session Registration Cancelled",

      message: `Your registration for the session "${session.title}" has been cancelled successfully.`,

      type: "session",

      relatedEvent: registration.event._id,
    });
    
    res.status(200).json({
      message: "Session registration cancelled successfully",

      registration,
    });
  } catch (error) {
    console.error("Cancel session registration error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// CHECK SESSION REGISTRATION STATUS
// ATTENDEE
// ==========================================

const getSessionRegistrationStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const registration = await SessionRegistration.findOne({
      attendee: req.user._id,

      session: sessionId,
    });

    res.status(200).json({
      registered: registration?.status === "registered",

      status: registration ? registration.status : null,

      registration: registration || null,
    });
  } catch (error) {
    console.error("Session registration status error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export {
  registerForSession,
  getMySessionRegistrations,
  getSessionRegistrationById,
  cancelSessionRegistration,
  getSessionRegistrationStatus,
};
