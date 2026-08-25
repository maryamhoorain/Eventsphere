import Session from "../models/Session.mjs";
import Event from "../models/Event.mjs";

// ==========================================
// CREATE SESSION
// ADMIN
// ==========================================

const createSession = async (req, res) => {
  try {
    const { eventId } = req.params;

    const {
      title,
      topic,
      description,
      speaker,
      date,
      startTime,
      endTime,
      location,
      capacity,
    } = req.body;

    // ==============================
    // REQUIRED FIELDS
    // ==============================

    if (!title || !topic || !date || !startTime || !endTime) {
      return res.status(400).json({
        message: "Title, topic, date, start time and end time are required",
      });
    }

    // ==============================
    // CHECK EVENT
    // ==============================

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // ==============================
    // VALIDATE SESSION DATE
    // ==============================

    const sessionDate = new Date(date);

    if (isNaN(sessionDate.getTime())) {
      return res.status(400).json({
        message: "Invalid session date",
      });
    }

    // ==========================================
    // CHECK SESSION DATE AGAINST EVENT DATE
    // ==========================================

    const sessionDay = sessionDate.toISOString().split("T")[0];

    const eventStartDay = new Date(event.startDate).toISOString().split("T")[0];

    const eventEndDay = new Date(event.endDate).toISOString().split("T")[0];

    if (sessionDay < eventStartDay || sessionDay > eventEndDay) {
      return res.status(400).json({
        message: "Session date must be within the event dates",
      });
    }

    // ==============================
    // VALIDATE TIME
    // ==============================

    if (startTime >= endTime) {
      return res.status(400).json({
        message: "End time must be after start time",
      });
    }

    // ==============================
    // CREATE SESSION
    // ==============================

    const session = await Session.create({
      event: eventId,
      title,
      topic,
      description,
      speaker,
      date: sessionDate,
      startTime,
      endTime,
      location,
      capacity,
      createdBy: req.user._id,
      isActive: true,
    });

    res.status(201).json({
      message: "Session created successfully",
      session,
    });
  } catch (error) {
    console.error("Create session error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET ALL SESSIONS FOR EVENT
// ADMIN / ORGANIZER / ATTENDEE
// ==========================================

const getEventSessions = async (req, res) => {
  try {
    const { eventId } = req.params;

    // ==============================
    // CHECK EVENT
    // ==============================

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // ==============================
    // GET SESSIONS
    // ==============================

    const sessions = await Session.find({
      event: eventId,
      isActive: true,
    }).sort({
      date: 1,
      startTime: 1,
    });

    res.status(200).json({
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    console.error("Get event sessions error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET SESSION BY ID
// ==========================================

const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await Session.findOne({
      _id: id,
      isActive: true,
    })
      .populate("event", "title category location startDate endDate")
      .populate("createdBy", "name email");

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    res.status(200).json({
      session,
    });
  } catch (error) {
    console.error("Get session error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// UPDATE SESSION
// ADMIN
// ==========================================

const updateSession = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    const {
      title,
      topic,
      description,
      speaker,
      date,
      startTime,
      endTime,
      location,
      capacity,
    } = req.body;

    // ==============================
    // VALIDATE DATES
    // ==============================
const newDate = date
    ? new Date(date)
    : new Date(session.date);

if (isNaN(newDate.getTime())) {
    return res.status(400).json({
        message: "Invalid session date"
    });
}


// ==========================================
// CHECK EVENT
// ==========================================

const event =
    await Event.findById(session.event);

if (!event) {
    return res.status(404).json({
        message: "Event not found"
    });
}


// ==========================================
// COMPARE CALENDAR DATES ONLY
// ==========================================

const sessionDay =
    newDate.toISOString().split("T")[0];

const eventStartDay =
    new Date(event.startDate)
        .toISOString()
        .split("T")[0];

const eventEndDay =
    new Date(event.endDate)
        .toISOString()
        .split("T")[0];


if (
    sessionDay < eventStartDay ||
    sessionDay > eventEndDay
) {
    return res.status(400).json({
        message:
            "Session date must be within the event dates"
    });
}

    // ==============================
    // VALIDATE TIME
    // ==============================

    const newStartTime = startTime || session.startTime;

    const newEndTime = endTime || session.endTime;

    if (newStartTime >= newEndTime) {
      return res.status(400).json({
        message: "End time must be after start time",
      });
    }

    // ==============================
    // UPDATE PROVIDED FIELDS
    // ==============================

    if (title !== undefined) session.title = title;

    if (topic !== undefined) session.topic = topic;

    if (description !== undefined) session.description = description;

    if (speaker !== undefined) session.speaker = speaker;

    if (date !== undefined) session.date = newDate;

    if (startTime !== undefined) session.startTime = startTime;

    if (endTime !== undefined) session.endTime = endTime;

    if (location !== undefined) session.location = location;

    if (capacity !== undefined) session.capacity = capacity;

    await session.save();

    res.status(200).json({
      message: "Session updated successfully",
      session,
    });
  } catch (error) {
    console.error("Update session error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// DELETE SESSION
// ADMIN
// ==========================================

const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    // Soft delete
    session.isActive = false;

    await session.save();

    res.status(200).json({
      message: "Session deleted successfully",
    });
  } catch (error) {
    console.error("Delete session error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export {
  createSession,
  getEventSessions,
  getSessionById,
  updateSession,
  deleteSession,
};
