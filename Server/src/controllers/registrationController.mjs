import Registration from "../models/Registration.mjs";
import Event from "../models/Event.mjs";

const registerForEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        const attendeeId = req.user._id;

        // Find event
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        // Event must be published
        if (
            event.status !== "published" ||
            !event.isPublished
        ) {
            return res.status(400).json({
                message: "This event is not available for registration"
            });
        }

        // Check registration deadline
        if (
            event.registrationDeadline &&
            new Date() > event.registrationDeadline
        ) {
            return res.status(400).json({
                message: "Registration deadline has passed"
            });
        }

        // Check if already registered
        const existingRegistration =
            await Registration.findOne({
                attendee: attendeeId,
                event: eventId
            });

        if (existingRegistration) {
    if (existingRegistration.status === "cancelled") {
        existingRegistration.status = "registered";
        existingRegistration.registrationDate = new Date();

        const ticketCode =
            `EVT-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase()}`;

        existingRegistration.ticketCode = ticketCode;

        await existingRegistration.save();

        return res.status(200).json({
            message: "Registration restored successfully",
            registration: existingRegistration
        });
    }

    return res.status(400).json({
        message: "You are already registered for this event"
    });
}

        // Check capacity
        if (event.capacity) {
            const registeredCount =
                await Registration.countDocuments({
                    event: eventId,
                    status: "registered"
                });

            if (registeredCount >= event.capacity) {
                return res.status(400).json({
                    message: "This event is full"
                });
            }
        }

        // Generate ticket code
        const ticketCode =
            `EVT-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase()}`;

        // Create registration
        const registration = await Registration.create({
            attendee: attendeeId,
            event: eventId,
            ticketCode,
            status: "registered"
        });

        res.status(201).json({
            message: "Successfully registered for the event",
            registration
        });

    } catch (error) {
        console.error(
            "Event registration error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};
const getMyRegistrations = async (req, res) => {
    try {
        const attendeeId = req.user._id;

        const registrations = await Registration.find({
            attendee: attendeeId
        })
            .populate(
                "event",
                "title description category location startDate endDate bannerImage status"
            )
            .sort({ registrationDate: -1 });

        res.status(200).json({
            count: registrations.length,
            registrations
        });

    } catch (error) {
        console.error(
            "Get registrations error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getRegistrationById = async (req, res) => {
    try {
        const { id } = req.params;

        const registration = await Registration.findOne({
            _id: id,
            attendee: req.user._id
        }).populate(
            "event",
            "title description category location startDate endDate bannerImage"
        );

        if (!registration) {
            return res.status(404).json({
                message: "Registration not found"
            });
        }

        res.status(200).json({
            registration
        });

    } catch (error) {
        console.error(
            "Get registration details error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};
const cancelRegistration = async (req, res) => {
    try {
        const { id } = req.params;

        const registration = await Registration.findOne({
            _id: id,
            attendee: req.user._id
        }).populate("event");

        if (!registration) {
            return res.status(404).json({
                message: "Registration not found"
            });
        }

        if (registration.status === "cancelled") {
            return res.status(400).json({
                message: "Registration is already cancelled"
            });
        }

        if (registration.status === "attended") {
            return res.status(400).json({
                message:
                    "An attended registration cannot be cancelled"
            });
        }

        // Don't allow cancellation after event has started
        if (new Date() >= registration.event.startDate) {
            return res.status(400).json({
                message:
                    "Registration cannot be cancelled after the event has started"
            });
        }

        registration.status = "cancelled";

        await registration.save();

        res.status(200).json({
            message: "Registration cancelled successfully",
            registration
        });

    } catch (error) {
        console.error(
            "Cancel registration error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};
const getEventRegistrations = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        const registrations = await Registration.find({
            event: eventId
        })
            .populate(
                "attendee",
                "name email phone"
            )
            .populate(
                "event",
                "title startDate endDate"
            )
            .sort({ registrationDate: -1 });

        res.status(200).json({
            event: {
                id: event._id,
                title: event.title
            },
            count: registrations.length,
            registrations
        });

    } catch (error) {
        console.error(
            "Get event registrations error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};
const verifyTicket = async (req, res) => {
    try {
        const { ticketCode } = req.body;

        if (!ticketCode) {
            return res.status(400).json({
                message: "Ticket code is required"
            });
        }

        const registration =
            await Registration.findOne({
                ticketCode
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
                message: "Invalid ticket"
            });
        }

        if (registration.status === "cancelled") {
            return res.status(400).json({
                message: "This registration has been cancelled"
            });
        }

        if (registration.status === "attended") {
            return res.status(400).json({
                message: "This ticket has already been used",
                registration
            });
        }

        res.status(200).json({
            message: "Ticket is valid",
            registration
        });

    } catch (error) {
        console.error(
            "Verify ticket error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};

const checkInAttendee = async (req, res) => {
    try {
        const { ticketCode } = req.body;

        if (!ticketCode) {
            return res.status(400).json({
                message: "Ticket code is required"
            });
        }

        const registration =
            await Registration.findOne({
                ticketCode
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
                message: "Invalid ticket"
            });
        }

        if (registration.status === "cancelled") {
            return res.status(400).json({
                message:
                    "Cancelled registration cannot be checked in"
            });
        }

        if (registration.status === "attended") {
            return res.status(400).json({
                message:
                    "Attendee has already been checked in"
            });
        }

        registration.status = "attended";
        registration.checkedInAt = new Date();

        await registration.save();

        res.status(200).json({
            message:
                "Attendee checked in successfully",
            registration
        });

    } catch (error) {
        console.error(
            "Check-in error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
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
    checkInAttendee
};