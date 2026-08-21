import ExhibitorParticipation from "../models/ExhibitorParticipation.mjs";
import Event from "../models/Event.mjs";
import createNotification from "../utils/createNotification.mjs";
import Notification from "../models/Notification.mjs";

const applyForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const exhibitorId = req.user._id;

    // Find event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // Event must be published
    if (event.status !== "published" || !event.isPublished) {
      return res.status(400).json({
        message: "This event is not available for exhibitor applications",
      });
    }

    // Check registration deadline
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return res.status(400).json({
        message: "Exhibitor application deadline has passed",
      });
    }

    // Check existing application
    const existingApplication = await ExhibitorParticipation.findOne({
      exhibitor: exhibitorId,
      event: eventId,
    });

    if (existingApplication) {
      if (existingApplication.status === "cancelled") {
        existingApplication.status = "pending";
        existingApplication.appliedAt = new Date();
        existingApplication.adminNotes = null;

        await existingApplication.save();

        return res.status(200).json({
          message: "Exhibitor application submitted again",
          application: existingApplication,
        });
      }

      return res.status(400).json({
        message: "You already have an application for this event",
      });
    }

    const { businessName, businessDescription, category, boothRequired } =
      req.body;

    // Required fields
    if (!businessName || !businessDescription || !category) {
      return res.status(400).json({
        message: "Business name, description and category are required",
      });
    }

    // Create application
    const application = await ExhibitorParticipation.create({
      exhibitor: exhibitorId,
      event: eventId,
      businessName,
      businessDescription,
      category,
      boothRequired: boothRequired !== undefined ? boothRequired : true,
      status: "pending",
    });

    // Notify exhibitor
    await createNotification({
      recipient: exhibitorId,
      title: "Exhibitor Application Submitted",
      message: `Your application to exhibit at ${event.title} has been submitted successfully.`,
      type: "exhibitor",
      relatedEvent: event._id,
    });

    // Notify event organizer/admin
    await createNotification({
      recipient: event.organizer,
      title: "New Exhibitor Application",
      message: `A new exhibitor application has been submitted for ${event.title}.`,
      type: "exhibitor",
      relatedEvent: event._id,
    });

    res.status(201).json({
      message: "Exhibitor application submitted successfully",
      application,
    });
  } catch (error) {
    console.error("Exhibitor application error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const applications = await ExhibitorParticipation.find({
      exhibitor: req.user._id,
    })
      .populate(
        "event",
        "title category location startDate endDate bannerImage status",
      )
      .sort({ appliedAt: -1 });

    res.status(200).json({
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Get exhibitor applications error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await ExhibitorParticipation.findOne({
      _id: id,
      exhibitor: req.user._id,
    })
      .populate(
        "event",
        "title description category location startDate endDate bannerImage",
      )
      .populate("exhibitor", "name email phone");

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    res.status(200).json({
      application,
    });
  } catch (error) {
    console.error("Get application error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const cancelApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await ExhibitorParticipation.findOne({
      _id: id,
      exhibitor: req.user._id,
    }).populate("event");

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    if (application.status === "cancelled") {
      return res.status(400).json({
        message: "Application is already cancelled",
      });
    }

    if (application.status === "rejected") {
      return res.status(400).json({
        message: "A rejected application cannot be cancelled",
      });
    }

    if (application.event && new Date() >= application.event.startDate) {
      return res.status(400).json({
        message: "Application cannot be cancelled after the event has started",
      });
    }

    application.status = "cancelled";

    await application.save();

    res.status(200).json({
      message: "Exhibitor application cancelled successfully",
      application,
    });
  } catch (error) {
    console.error("Cancel exhibitor application error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getEventApplications = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const applications = await ExhibitorParticipation.find({
      event: eventId,
    })
      .populate("exhibitor", "name email phone")
      .sort({ appliedAt: -1 });

    res.status(200).json({
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Get event applications error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const approveApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { boothNumber, adminNotes } = req.body;

        const application =
            await ExhibitorParticipation.findById(id)
                .populate("event", "title");

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        if (application.status === "approved") {
            return res.status(400).json({
                message: "Application is already approved"
            });
        }

        if (application.status === "cancelled") {
            return res.status(400).json({
                message: "Cancelled application cannot be approved"
            });
        }

        if (application.status === "rejected") {
            return res.status(400).json({
                message: "Rejected application cannot be approved"
            });
        }

        application.status = "approved";
        application.boothNumber = boothNumber || null;
        application.adminNotes = adminNotes || null;
        application.approvedAt = new Date();

        await application.save();

        // Create notification for exhibitor
        await Notification.create({
            recipient: application.exhibitor,
            title: "Exhibitor Application Approved",
            message: `Your application for ${application.event.title} has been approved.`,
            type: "exhibitor",
            relatedEvent: application.event._id,
            isRead: false
        });

        res.status(200).json({
            message: "Exhibitor application approved successfully",
            application
        });

    } catch (error) {
        console.error(
            "Approve exhibitor application error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};

const rejectApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;

        const application =
            await ExhibitorParticipation.findById(id)
                .populate("event", "title");

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        if (application.status === "approved") {
            return res.status(400).json({
                message: "An approved application cannot be rejected"
            });
        }

        if (application.status === "cancelled") {
            return res.status(400).json({
                message: "Cancelled application cannot be rejected"
            });
        }

        if (application.status === "rejected") {
            return res.status(400).json({
                message: "Application is already rejected"
            });
        }

        application.status = "rejected";
        application.adminNotes = adminNotes || null;

        await application.save();

        // Create notification for exhibitor
        await Notification.create({
            recipient: application.exhibitor,
            title: "Exhibitor Application Rejected",
            message: `Your application for ${application.event.title} has been rejected.`,
            type: "exhibitor",
            relatedEvent: application.event._id,
            isRead: false
        });

        res.status(200).json({
            message: "Exhibitor application rejected successfully",
            application
        });

    } catch (error) {
        console.error(
            "Reject exhibitor application error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};
export {
  applyForEvent,
  getMyApplications,
  getApplicationById,
  cancelApplication,
  getEventApplications,
  approveApplication,
  rejectApplication,
};
