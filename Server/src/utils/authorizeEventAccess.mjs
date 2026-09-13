import Event from "../models/Event.mjs";

/**
 * Checks whether the logged-in user can manage an event.
 *
 * ADMIN:
 * Can access every event.
 *
 * ORGANIZER:
 * Can access only events they own.
 *
 * ANY OTHER ROLE:
 * Denied.
 *
 * Returns the event if authorized.
 *
 * Throws:
 * - EVENT_NOT_FOUND
 * - EVENT_ACCESS_DENIED
 */
const authorizeEventAccess = async (user, eventId) => {
  if (!user || !eventId) {
    const error = new Error("EVENT_ACCESS_DENIED");
    throw error;
  }

  const event = await Event.findById(eventId);

  if (!event) {
    const error = new Error("EVENT_NOT_FOUND");
    throw error;
  }

  if (user.role === "admin") {
    return event;
  }

  if (user.role === "organizer") {
    if (
      !event.organizer ||
      event.organizer.toString() !== user._id.toString()
    ) {
      const error = new Error("EVENT_ACCESS_DENIED");
      throw error;
    }

    return event;
  }

  // Attendee, exhibitor, or unknown role must never
  // receive another organizer's event through this helper.
  const error = new Error("EVENT_ACCESS_DENIED");
  throw error;
};

export const handleEventAccessError = (error, res, action = "access") => {
  if (error.message === "EVENT_NOT_FOUND") {
    res.status(404).json({
      message: "Event not found",
    });
    return true;
  }

  if (error.message === "EVENT_ACCESS_DENIED") {
    res.status(403).json({
      message: `You are not authorized to ${action} this event`,
    });
    return true;
  }

  return false;
};

export default authorizeEventAccess;