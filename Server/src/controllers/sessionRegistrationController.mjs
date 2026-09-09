import SessionRegistration from "../models/SessionRegistration.mjs";

import Session from "../models/Session.mjs";
import Registration from "../models/Registration.mjs";
import Event from "../models/Event.mjs";

import createNotification from "../utils/createNotification.mjs";

// ==========================================
// REGISTER FOR SESSION
//
// This endpoint is kept for convenience.
//
// Internally:
// Session → Event Registration
// Session → Session Registration
// ==========================================

const registerForSession = async (
  req,
  res
) => {
  try {
    const { sessionId } =
      req.params;

    const attendeeId =
      req.user._id;

    // ==========================================
    // FIND SESSION
    // ==========================================

    const session =
      await Session.findOne({
        _id: sessionId,
        isActive: true,
      });

    if (!session) {
      return res.status(404).json({
        message:
          "Session not found",
      });
    }

    // ==========================================
    // FIND EVENT
    // ==========================================

    const event =
      await Event.findById(
        session.event
      );

    if (!event) {
      return res.status(404).json({
        message:
          "Associated event not found",
      });
    }

    // ==========================================
    // EVENT MUST BE PUBLISHED
    // ==========================================

    if (
      event.status !== "published" ||
      !event.isPublished
    ) {
      return res.status(400).json({
        message:
          "This event is not available for registration",
      });
    }

    // ==========================================
    // REGISTRATION DEADLINE
    // ==========================================

    if (
      event.registrationDeadline &&
      new Date() >
        new Date(
          event.registrationDeadline
        )
    ) {
      return res.status(400).json({
        message:
          "Registration deadline has passed",
      });
    }

    // ==========================================
    // SESSION START CHECK
    // ==========================================

    const sessionDate =
      new Date(session.date);

    const [hours, minutes] =
      session.startTime
        .split(":")
        .map(Number);

    sessionDate.setHours(
      hours,
      minutes,
      0,
      0
    );

    if (
      new Date() >= sessionDate
    ) {
      return res.status(400).json({
        message:
          "You cannot register for a session that has already started",
      });
    }

    // ==========================================
    // EVENT REGISTRATION
    // ==========================================

    let eventRegistration =
      await Registration.findOne({
        attendee: attendeeId,
        event: event._id,
      });

    // ==========================================
    // CREATE EVENT REGISTRATION IF NEEDED
    // ==========================================

    if (!eventRegistration) {
      // Check event capacity
      if (event.capacity) {
        const registeredCount =
          await Registration.countDocuments(
            {
              event: event._id,
              status: "registered",
            }
          );

        if (
          registeredCount >=
          event.capacity
        ) {
          return res.status(400).json({
            message:
              "This event is full",
          });
        }
      }

      const ticketCode =
        `EVT-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase()}`;

      eventRegistration =
        await Registration.create({
          attendee: attendeeId,
          event: event._id,
          status: "registered",
          ticketCode,
        });

      await createNotification({
        recipient: attendeeId,

        title:
          "Event Registration",

        message: `You have automatically been registered for ${event.title} because you registered for the session "${session.title}".`,

        type: "registration",

        relatedEvent:
          event._id,
      });
    } else if (
      eventRegistration.status ===
      "cancelled"
    ) {
      eventRegistration.status =
        "registered";

      eventRegistration.registrationDate =
        new Date();

      eventRegistration.checkedInAt =
        null;

      eventRegistration.ticketCode =
        `EVT-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase()}`;

      await eventRegistration.save();
    } else if (
      eventRegistration.status ===
      "attended"
    ) {
      return res.status(400).json({
        message:
          "You have already attended this event",
      });
    }

    // ==========================================
    // CHECK SESSION CAPACITY
    // ==========================================

    if (session.capacity) {
      const registeredCount =
        await SessionRegistration.countDocuments(
          {
            session: session._id,
            status: "registered",
          }
        );

      if (
        registeredCount >=
        session.capacity
      ) {
        return res.status(400).json({
          message:
            "This session is full",
        });
      }
    }

    // ==========================================
    // CHECK EXISTING SESSION REGISTRATION
    // ==========================================

    let sessionRegistration =
      await SessionRegistration.findOne(
        {
          attendee: attendeeId,
          session: session._id,
        }
      );

    if (sessionRegistration) {
      if (
        sessionRegistration.status ===
        "cancelled"
      ) {
        sessionRegistration.status =
          "registered";

        sessionRegistration.registeredAt =
          new Date();

        sessionRegistration.cancelledAt =
          null;

        sessionRegistration.attendedAt =
          null;

        await sessionRegistration.save();

        return res.status(200).json({
          message:
            "Session registration restored successfully",

          eventRegistration,

          registration:
            sessionRegistration,
        });
      }

      if (
        sessionRegistration.status ===
        "attended"
      ) {
        return res.status(400).json({
          message:
            "You have already attended this session",
        });
      }

      return res.status(400).json({
        message:
          "You are already registered for this session",
      });
    }

    // ==========================================
    // CREATE SESSION REGISTRATION
    // ==========================================

    sessionRegistration =
      await SessionRegistration.create({
        attendee: attendeeId,

        session: session._id,

        event: event._id,

        status: "registered",
      });

    // ==========================================
    // NOTIFICATION
    // ==========================================

    await createNotification({
      recipient: attendeeId,

      title:
        "Session Registration Confirmed",

      message: `You have successfully registered for the session "${session.title}".`,

      type: "session",

      relatedEvent:
        event._id,
    });

    res.status(201).json({
      success: true,

      message:
        "Successfully registered for the session. Event registration was automatically created.",

      eventRegistration,

      registration:
        sessionRegistration,
    });
  } catch (error) {
    console.error(
      "Session registration error:",
      error.message
    );

    if (
      error.code === 11000
    ) {
      return res.status(400).json({
        message:
          "You are already registered",
      });
    }

    if (
      error.name === "CastError"
    ) {
      return res.status(400).json({
        message:
          "Invalid session ID",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET MY SESSION REGISTRATIONS
// ==========================================

const getMySessionRegistrations =
  async (req, res) => {
    try {
      const registrations =
        await SessionRegistration.find(
          {
            attendee:
              req.user._id,
          }
        )
          .populate(
            "session",
            "title topic description speaker date startTime endTime location capacity"
          )
          .populate(
            "event",
            "title category location startDate endDate bannerImage"
          )
          .sort({
            registeredAt: -1,
          });

      res.status(200).json({
        success: true,

        count:
          registrations.length,

        registrations,
      });
    } catch (error) {
      console.error(
        "Get session registrations error:",
        error.message
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };

// ==========================================
// GET SESSION REGISTRATION BY ID
// ==========================================

const getSessionRegistrationById =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const registration =
        await SessionRegistration.findOne(
          {
            _id: id,
            attendee:
              req.user._id,
          }
        )
          .populate(
            "session",
            "title topic description speaker date startTime endTime location capacity"
          )
          .populate(
            "event",
            "title category location startDate endDate bannerImage"
          );

      if (!registration) {
        return res.status(404).json({
          message:
            "Session registration not found",
        });
      }

      res.status(200).json({
        success: true,
        registration,
      });
    } catch (error) {
      console.error(
        "Get session registration error:",
        error.message
      );

      if (
        error.name === "CastError"
      ) {
        return res.status(400).json({
          message:
            "Invalid session registration ID",
        });
      }

      res.status(500).json({
        message: "Server error",
      });
    }
  };

// ==========================================
// CANCEL SESSION REGISTRATION
// ==========================================

const cancelSessionRegistration =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const registration =
        await SessionRegistration.findOne(
          {
            _id: id,
            attendee:
              req.user._id,
          }
        )
          .populate("session")
          .populate("event");

      if (!registration) {
        return res.status(404).json({
          message:
            "Session registration not found",
        });
      }

      if (
        registration.status ===
        "cancelled"
      ) {
        return res.status(400).json({
          message:
            "Session registration is already cancelled",
        });
      }

      if (
        registration.status ===
        "attended"
      ) {
        return res.status(400).json({
          message:
            "An attended session cannot be cancelled",
        });
      }

      // ==========================================
      // CHECK SESSION START
      // ==========================================

      const session =
        registration.session;

      const sessionDate =
        new Date(session.date);

      const [hours, minutes] =
        session.startTime
          .split(":")
          .map(Number);

      sessionDate.setHours(
        hours,
        minutes,
        0,
        0
      );

      if (
        new Date() >=
        sessionDate
      ) {
        return res.status(400).json({
          message:
            "Session registration cannot be cancelled after the session has started",
        });
      }

      // ==========================================
      // CANCEL
      // ==========================================

      registration.status =
        "cancelled";

      registration.cancelledAt =
        new Date();

      registration.attendedAt =
        null;

      await registration.save();

      // ==========================================
      // NOTIFICATION
      // ==========================================

      await createNotification({
        recipient:
          req.user._id,

        title:
          "Session Registration Cancelled",

        message: `Your registration for the session "${session.title}" has been cancelled successfully.`,

        type: "session",

        relatedEvent:
          registration.event._id,
      });

      res.status(200).json({
        success: true,

        message:
          "Session registration cancelled successfully",

        registration,
      });
    } catch (error) {
      console.error(
        "Cancel session registration error:",
        error.message
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };

// ==========================================
// CHECK SESSION REGISTRATION STATUS
// ==========================================

const getSessionRegistrationStatus =
  async (req, res) => {
    try {
      const { sessionId } =
        req.params;

      const registration =
        await SessionRegistration.findOne(
          {
            attendee:
              req.user._id,

            session:
              sessionId,
          }
        );

      res.status(200).json({
        success: true,

        registered:
          registration?.status ===
          "registered",

        status:
          registration
            ? registration.status
            : null,

        registration:
          registration || null,
      });
    } catch (error) {
      console.error(
        "Session registration status error:",
        error.message
      );

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