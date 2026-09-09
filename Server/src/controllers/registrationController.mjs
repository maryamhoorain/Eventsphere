import mongoose from "mongoose";

import Registration from "../models/Registration.mjs";
import SessionRegistration from "../models/SessionRegistration.mjs";
import Session from "../models/Session.mjs";
import Event from "../models/Event.mjs";

import createNotification from "../utils/createNotification.mjs";

// ======================================================
// HELPER: GENERATE EVENT TICKET
// ======================================================

const generateTicketCode = () => {
  return `EVT-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;
};

// ======================================================
// HELPER: CONVERT SESSION DATE + TIME TO DATE
// ======================================================

const getSessionDateTime = (date, time) => {
  const sessionDate = new Date(date);

  const [hours, minutes] = time.split(":").map(Number);

  sessionDate.setHours(
    hours,
    minutes,
    0,
    0
  );

  return sessionDate;
};

// ======================================================
// HELPER: CHECK SESSION OVERLAP
// ======================================================

const sessionsOverlap = (sessionA, sessionB) => {
  const startA = getSessionDateTime(
    sessionA.date,
    sessionA.startTime
  );

  const endA = getSessionDateTime(
    sessionA.date,
    sessionA.endTime
  );

  const startB = getSessionDateTime(
    sessionB.date,
    sessionB.startTime
  );

  const endB = getSessionDateTime(
    sessionB.date,
    sessionB.endTime
  );

  // No overlap if:
  // A ends before/equal B starts
  // OR
  // B ends before/equal A starts

  return (
    startA < endB &&
    startB < endA
  );
};

// ======================================================
// REGISTER FOR EVENT + OPTIONAL SESSIONS
//
// POST /registrations
//
// Body:
//
// {
//   "eventId": "...",
//   "sessionIds": ["...", "..."]
// }
//
// OR:
//
// {
//   "sessionIds": ["..."]
// }
//
// ======================================================

const registerForEvent = async (req, res) => {
  const mongoSession =
    await mongoose.startSession();

  try {
    const attendeeId = req.user._id;

    let {
      eventId,
      sessionIds = [],
    } = req.body;

    // ==========================================
    // NORMALIZE SESSION IDS
    // ==========================================

    if (!Array.isArray(sessionIds)) {
      return res.status(400).json({
        message:
          "sessionIds must be an array",
      });
    }

    // Remove duplicates
    sessionIds = [
      ...new Set(
        sessionIds.map((id) =>
          id.toString()
        )
      ),
    ];

    // ==========================================
    // VALIDATE EVENT ID IF PROVIDED
    // ==========================================

    if (
      eventId &&
      !mongoose.Types.ObjectId.isValid(eventId)
    ) {
      return res.status(400).json({
        message: "Invalid event ID",
      });
    }

    // ==========================================
    // VALIDATE SESSION IDS
    // ==========================================

    for (const sessionId of sessionIds) {
      if (
        !mongoose.Types.ObjectId.isValid(
          sessionId
        )
      ) {
        return res.status(400).json({
          message:
            "One or more session IDs are invalid",
        });
      }
    }

    // ==========================================
    // AT LEAST EVENT OR SESSION REQUIRED
    // ==========================================

    if (!eventId && sessionIds.length === 0) {
      return res.status(400).json({
        message:
          "Event ID or at least one session ID is required",
      });
    }

    // ==========================================
    // FIND SELECTED SESSIONS
    // ==========================================

    let selectedSessions = [];

    if (sessionIds.length > 0) {
      selectedSessions =
        await Session.find({
          _id: {
            $in: sessionIds,
          },
          isActive: true,
        });

      if (
        selectedSessions.length !==
        sessionIds.length
      ) {
        return res.status(404).json({
          message:
            "One or more selected sessions were not found or are inactive",
        });
      }
    }

    // ==========================================
    // DETERMINE EVENT
    // ==========================================

    let event;

    if (eventId) {
      event = await Event.findById(
        eventId
      );
    } else {
      // Event ID was not supplied.
      // Get event from selected session.

      const eventIds = [
        ...new Set(
          selectedSessions.map((session) =>
            session.event.toString()
          )
        ),
      ];

      if (eventIds.length !== 1) {
        return res.status(400).json({
          message:
            "All selected sessions must belong to the same event",
        });
      }

      event = await Event.findById(
        eventIds[0]
      );

      eventId = event?._id;
    }

    // ==========================================
    // EVENT EXISTS
    // ==========================================

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
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
    // VERIFY ALL SESSIONS BELONG TO EVENT
    // ==========================================

    for (const session of selectedSessions) {
      if (
        session.event.toString() !==
        event._id.toString()
      ) {
        return res.status(400).json({
          message:
            `Session "${session.title}" does not belong to this event`,
        });
      }
    }

    // ==========================================
    // CHECK SESSION OVERLAPS
    // ==========================================

    for (
      let i = 0;
      i < selectedSessions.length;
      i++
    ) {
      for (
        let j = i + 1;
        j < selectedSessions.length;
        j++
      ) {
        const sessionA =
          selectedSessions[i];

        const sessionB =
          selectedSessions[j];

        if (
          sessionsOverlap(
            sessionA,
            sessionB
          )
        ) {
          return res.status(400).json({
            message:
              `Selected sessions "${sessionA.title}" and "${sessionB.title}" overlap. Please choose sessions happening at different times.`,
          });
        }
      }
    }

    // ==========================================
    // CHECK SELECTED SESSIONS HAVE NOT STARTED
    // ==========================================

    const now = new Date();

    for (const session of selectedSessions) {
      const sessionStart =
        getSessionDateTime(
          session.date,
          session.startTime
        );

      if (now >= sessionStart) {
        return res.status(400).json({
          message:
            `You cannot register for the session "${session.title}" because it has already started`,
        });
      }
    }

    // ==========================================
    // CHECK EVENT CAPACITY
    // ==========================================

    const existingEventRegistration =
      await Registration.findOne({
        attendee: attendeeId,
        event: event._id,
      });

    // Only count capacity when creating a
    // completely new event registration.
    if (
      !existingEventRegistration &&
      event.capacity
    ) {
      const registeredCount =
        await Registration.countDocuments({
          event: event._id,
          status: "registered",
        });

      if (
        registeredCount >= event.capacity
      ) {
        return res.status(400).json({
          message: "This event is full",
        });
      }
    }

    // ==========================================
    // CHECK SESSION CAPACITY
    // ==========================================

    for (const session of selectedSessions) {
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
              `Session "${session.title}" is full`,
          });
        }
      }
    }

    // ==================================================
    // START TRANSACTION
    // ==================================================

    let finalRegistration;
    let createdSessionRegistrations =
      [];

    await mongoSession.withTransaction(
      async () => {
        // ==========================================
        // EVENT REGISTRATION
        // ==========================================

        let registration =
          await Registration.findOne({
            attendee: attendeeId,
            event: event._id,
          }).session(mongoSession);

        if (registration) {
          // ==========================================
          // RESTORE CANCELLED EVENT REGISTRATION
          // ==========================================

          if (
            registration.status ===
            "cancelled"
          ) {
            registration.status =
              "registered";

            registration.registrationDate =
              new Date();

            registration.checkedInAt =
              null;

            registration.ticketCode =
              generateTicketCode();

            await registration.save({
              session: mongoSession,
            });
          } else if (
            registration.status ===
            "attended"
          ) {
            // An attendee who already checked in
            // should not create another event registration.
            throw new Error(
              "EVENT_ALREADY_ATTENDED"
            );
          }
        } else {
          // ==========================================
          // CREATE NEW EVENT REGISTRATION
          // ==========================================

          registration =
            new Registration({
              attendee: attendeeId,
              event: event._id,
              status: "registered",
              ticketCode:
                generateTicketCode(),
            });

          await registration.save({
            session: mongoSession,
          });
        }

        finalRegistration =
          registration;

        // ==========================================
        // CREATE / RESTORE SESSION REGISTRATIONS
        // ==========================================

        for (const selectedSession of selectedSessions) {
          let sessionRegistration =
            await SessionRegistration.findOne(
              {
                attendee: attendeeId,
                session:
                  selectedSession._id,
              }
            ).session(
              mongoSession
            );

          if (sessionRegistration) {
            // ==========================================
            // ALREADY ATTENDED
            // ==========================================

            if (
              sessionRegistration.status ===
              "attended"
            ) {
              throw new Error(
                `SESSION_ALREADY_ATTENDED:${selectedSession.title}`
              );
            }

            // ==========================================
            // RESTORE CANCELLED SESSION
            // ==========================================

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

              await sessionRegistration.save({
                session:
                  mongoSession,
              });
            } else {
              // Already registered.
              throw new Error(
                `SESSION_ALREADY_REGISTERED:${selectedSession.title}`
              );
            }
          } else {
            // ==========================================
            // CREATE SESSION REGISTRATION
            // ==========================================

            sessionRegistration =
              new SessionRegistration({
                attendee: attendeeId,
                session:
                  selectedSession._id,
                event: event._id,
                status: "registered",
              });

            await sessionRegistration.save({
              session:
                mongoSession,
            });
          }

          createdSessionRegistrations.push(
            sessionRegistration
          );
        }
      }
    );

    // ==================================================
    // NOTIFICATION
    // ==================================================

    await createNotification({
      recipient: attendeeId,

      title:
        selectedSessions.length > 0
          ? "Registration Confirmed"
          : "Event Registration",

      message:
        selectedSessions.length > 0
          ? `You have successfully registered for ${event.title} and ${selectedSessions.length} session${selectedSessions.length > 1 ? "s" : ""}.`
          : `You have successfully registered for ${event.title}.`,

      type: "registration",

      relatedEvent: event._id,
    });

    // ==================================================
    // RESPONSE
    // ==================================================

    res.status(201).json({
      success: true,

      message:
        selectedSessions.length > 0
          ? "Event and session registration completed successfully"
          : "Successfully registered for the event",

      registration:
        finalRegistration,

      sessionRegistrations:
        createdSessionRegistrations,
    });
  } catch (error) {
    console.error(
      "Registration error:",
      error.message
    );

    if (
      error.message ===
      "EVENT_ALREADY_ATTENDED"
    ) {
      return res.status(400).json({
        message:
          "You have already attended this event",
      });
    }

    if (
      error.message.startsWith(
        "SESSION_ALREADY_ATTENDED:"
      )
    ) {
      const sessionTitle =
        error.message.split(":")[1];

      return res.status(400).json({
        message:
          `You have already attended the session "${sessionTitle}"`,
      });
    }

    if (
      error.message.startsWith(
        "SESSION_ALREADY_REGISTERED:"
      )
    ) {
      const sessionTitle =
        error.message.split(":")[1];

      return res.status(400).json({
        message:
          `You are already registered for the session "${sessionTitle}"`,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "A registration already exists",
      });
    }

    if (
      error.name === "CastError"
    ) {
      return res.status(400).json({
        message:
          "Invalid registration ID",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  } finally {
    await mongoSession.endSession();
  }
};

// ======================================================
// GET MY EVENT REGISTRATIONS
// ======================================================

const getMyRegistrations = async (
  req,
  res
) => {
  try {
    const attendeeId =
      req.user._id;

    const registrations =
      await Registration.find({
        attendee: attendeeId,
      })
        .populate(
          "event",
          "title description category location startDate endDate bannerImage status"
        )
        .sort({
          registrationDate: -1,
        });

    res.status(200).json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    console.error(
      "Get registrations error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// GET REGISTRATION BY ID
// ======================================================

const getRegistrationById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const registration =
      await Registration.findOne({
        _id: id,
        attendee: req.user._id,
      }).populate(
        "event",
        "title description category location startDate endDate bannerImage status"
      );

    if (!registration) {
      return res.status(404).json({
        message:
          "Registration not found",
      });
    }

    res.status(200).json({
      success: true,
      registration,
    });
  } catch (error) {
    console.error(
      "Get registration details error:",
      error.message
    );

    if (
      error.name === "CastError"
    ) {
      return res.status(400).json({
        message:
          "Invalid registration ID",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// CANCEL EVENT REGISTRATION
//
// Cancelling the event also cancels all active
// session registrations for that event.
// ======================================================

const cancelRegistration = async (
  req,
  res
) => {
  const mongoSession =
    await mongoose.startSession();

  try {
    const { id } = req.params;

    let cancelledRegistration;

    await mongoSession.withTransaction(
      async () => {
        const registration =
          await Registration.findOne({
            _id: id,
            attendee: req.user._id,
          })
            .populate("event")
            .session(mongoSession);

        if (!registration) {
          throw new Error(
            "REGISTRATION_NOT_FOUND"
          );
        }

        if (
          registration.status ===
          "cancelled"
        ) {
          throw new Error(
            "REGISTRATION_ALREADY_CANCELLED"
          );
        }

        if (
          registration.status ===
          "attended"
        ) {
          throw new Error(
            "REGISTRATION_ATTENDED"
          );
        }

        // ==========================================
        // EVENT MUST NOT HAVE STARTED
        // ==========================================

        if (
          new Date() >=
          registration.event.startDate
        ) {
          throw new Error(
            "EVENT_ALREADY_STARTED"
          );
        }

        // ==========================================
        // CANCEL EVENT REGISTRATION
        // ==========================================

        registration.status =
          "cancelled";

        registration.checkedInAt =
          null;

        await registration.save({
          session:
            mongoSession,
        });

        // ==========================================
        // CANCEL ACTIVE SESSION REGISTRATIONS
        // ==========================================

        await SessionRegistration.updateMany(
          {
            attendee:
              req.user._id,

            event:
              registration.event._id,

            status:
              "registered",
          },
          {
            $set: {
              status: "cancelled",
              cancelledAt:
                new Date(),
              attendedAt: null,
            },
          },
          {
            session:
              mongoSession,
          }
        );

        cancelledRegistration =
          registration;
      }
    );

    // ==========================================
    // NOTIFICATION
    // ==========================================

    await createNotification({
      recipient:
        req.user._id,

      title:
        "Event Registration Cancelled",

      message: `Your registration for ${cancelledRegistration.event.title} has been cancelled. Any active session registrations for this event were also cancelled.`,

      type: "registration",

      relatedEvent:
        cancelledRegistration.event._id,
    });

    res.status(200).json({
      success: true,

      message:
        "Event registration cancelled successfully. Associated session registrations were also cancelled.",

      registration:
        cancelledRegistration,
    });
  } catch (error) {
    console.error(
      "Cancel registration error:",
      error.message
    );

    switch (error.message) {
      case "REGISTRATION_NOT_FOUND":
        return res.status(404).json({
          message:
            "Registration not found",
        });

      case "REGISTRATION_ALREADY_CANCELLED":
        return res.status(400).json({
          message:
            "Registration is already cancelled",
        });

      case "REGISTRATION_ATTENDED":
        return res.status(400).json({
          message:
            "An attended registration cannot be cancelled",
        });

      case "EVENT_ALREADY_STARTED":
        return res.status(400).json({
          message:
            "Registration cannot be cancelled after the event has started",
        });

      default:
        res.status(500).json({
          message: "Server error",
        });
    }
  } finally {
    await mongoSession.endSession();
  }
};

// ======================================================
// GET EVENT REGISTRATIONS
// ADMIN / ORGANIZER
// ======================================================

const getEventRegistrations = async (
  req,
  res
) => {
  try {
    const { eventId } = req.params;

    const event =
      await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const registrations =
      await Registration.find({
        event: eventId,
      })
        .populate(
          "attendee",
          "name email phone"
        )
        .populate(
          "event",
          "title startDate endDate"
        )
        .sort({
          registrationDate: -1,
        });

    res.status(200).json({
      success: true,

      event: {
        id: event._id,
        title: event.title,
      },

      count: registrations.length,

      registrations,
    });
  } catch (error) {
    console.error(
      "Get event registrations error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// VERIFY EVENT TICKET
// ======================================================

const verifyTicket = async (
  req,
  res
) => {
  try {
    const { ticketCode } =
      req.body;

    if (!ticketCode) {
      return res.status(400).json({
        message:
          "Ticket code is required",
      });
    }

    const registration =
      await Registration.findOne({
        ticketCode,
      })
        .populate(
          "attendee",
          "name email phone"
        )
        .populate(
          "event",
          "title startDate endDate location"
        );

    if (!registration) {
      return res.status(404).json({
        message: "Invalid ticket",
      });
    }

    if (
      registration.status ===
      "cancelled"
    ) {
      return res.status(400).json({
        message:
          "This registration has been cancelled",
      });
    }

    if (
      registration.status ===
      "attended"
    ) {
      return res.status(400).json({
        message:
          "This ticket has already been used",
        registration,
      });
    }

    res.status(200).json({
      success: true,
      message: "Ticket is valid",
      registration,
    });
  } catch (error) {
    console.error(
      "Verify ticket error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// CHECK IN ATTENDEE
// ======================================================

const checkInAttendee = async (
  req,
  res
) => {
  try {
    const { ticketCode } =
      req.body;

    if (!ticketCode) {
      return res.status(400).json({
        message:
          "Ticket code is required",
      });
    }

    const registration =
      await Registration.findOne({
        ticketCode,
      })
        .populate(
          "attendee",
          "name email phone"
        )
        .populate(
          "event",
          "title startDate endDate"
        );

    if (!registration) {
      return res.status(404).json({
        message: "Invalid ticket",
      });
    }

    if (
      registration.status ===
      "cancelled"
    ) {
      return res.status(400).json({
        message:
          "Cancelled registration cannot be checked in",
      });
    }

    if (
      registration.status ===
      "attended"
    ) {
      return res.status(400).json({
        message:
          "Attendee has already been checked in",
      });
    }

    registration.status =
      "attended";

    registration.checkedInAt =
      new Date();

    await registration.save();

    res.status(200).json({
      success: true,

      message:
        "Attendee checked in successfully",

      registration,
    });
  } catch (error) {
    console.error(
      "Check-in error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

export {
  registerForEvent,
  getMyRegistrations,
  getRegistrationById,
  cancelRegistration,
  getEventRegistrations,
  verifyTicket,
  checkInAttendee,
};