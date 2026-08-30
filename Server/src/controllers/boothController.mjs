import Booth from "../models/Booth.mjs";
import Event from "../models/Event.mjs";
import ExhibitorParticipation from "../models/ExhibitorParticipation.mjs";
import createNotification from "../utils/createNotification.mjs";

// ==========================================
// CREATE BOOTH
// ADMIN
// ==========================================

const createBooth = async (req, res) => {
  try {
    const { eventId } = req.params;

    const { boothNumber, size, location, price } = req.body;

    // Check required field
    if (!boothNumber) {
      return res.status(400).json({
        message: "Booth number is required",
      });
    }

    // Check event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // Check duplicate booth
    const existingBooth = await Booth.findOne({
      event: eventId,
      boothNumber,
    });

    if (existingBooth) {
      return res.status(400).json({
        message: "This booth number already exists for this event",
      });
    }

    // Create booth
    const booth = await Booth.create({
      event: eventId,
      boothNumber,
      size,
      location,
      price: price !== undefined ? price : 0,
      status: "available",
    });

    res.status(201).json({
      message: "Booth created successfully",
      booth,
    });
  } catch (error) {
    console.error("Create booth error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET ALL BOOTHS FOR EVENT
// ADMIN / ORGANIZER
// ==========================================

const getEventBooths = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const booths = await Booth.find({
      event: eventId,
    })
      .populate("exhibitor", "name email phone")
      .sort({
        boothNumber: 1,
      });

    res.status(200).json({
      count: booths.length,
      booths,
    });
  } catch (error) {
    console.error("Get event booths error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET AVAILABLE BOOTHS
// EXHIBITOR
// ==========================================

const getAvailableBooths = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findOne({
      _id: eventId,
      status: "published",
      isPublished: true,
    });

    if (!event) {
      return res.status(404).json({
        message: "Published event not found",
      });
    }

    const booths = await Booth.find({
      event: eventId,
      status: "available",
    }).sort({
      boothNumber: 1,
    });

    res.status(200).json({
      count: booths.length,
      booths,
    });
  } catch (error) {
    console.error("Get available booths error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// UPDATE BOOTH
// ADMIN
// ==========================================

const updateBooth = async (req, res) => {
  try {
    const { id } = req.params;

    const { boothNumber, size, location, price } = req.body;

    const booth = await Booth.findById(id);

    if (!booth) {
      return res.status(404).json({
        message: "Booth not found",
      });
    }

    // Do not allow changing an occupied booth's
    // number without additional handling
    if (boothNumber && boothNumber !== booth.boothNumber) {
      const existingBooth = await Booth.findOne({
        event: booth.event,
        boothNumber,
      });

      if (existingBooth) {
        return res.status(400).json({
          message: "This booth number already exists for this event",
        });
      }

      booth.boothNumber = boothNumber;
    }

    if (size !== undefined) {
      booth.size = size;
    }

    if (location !== undefined) {
      booth.location = location;
    }

    if (price !== undefined) {
      booth.price = price;
    }

    await booth.save();

    res.status(200).json({
      message: "Booth updated successfully",
      booth,
    });
  } catch (error) {
    console.error("Update booth error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// ASSIGN BOOTH
// ADMIN
// ==========================================

const assignBooth = async (req, res) => {
  try {
    const { id } = req.params;
    const { exhibitorId } = req.body;

    if (!exhibitorId) {
      return res.status(400).json({
        message: "Exhibitor ID is required",
      });
    }

    // Find booth
    const booth = await Booth.findById(id);

    if (!booth) {
      return res.status(404).json({
        message: "Booth not found",
      });
    }

    // Booth must be available
    if (booth.status !== "available") {
      return res.status(400).json({
        message: "This booth is not available",
      });
    }

    // Find approved exhibitor participation
    const application = await ExhibitorParticipation.findOne({
      exhibitor: exhibitorId,
      event: booth.event,
      status: "approved",
    });

    if (!application) {
      return res.status(400).json({
        message:
          "Exhibitor does not have an approved application for this event",
      });
    }

    // Optional but strongly recommended:
    // prevent one exhibitor from having multiple booths
    if (application.booth) {
      return res.status(400).json({
        message:
          "This exhibitor already has a booth assigned for this event",
      });
    }

    // Assign exhibitor to booth
    booth.exhibitor = exhibitorId;
    booth.status = "occupied";

    await booth.save();

    // Synchronize participation record
    // Also remove old boothNumber field if it exists
    const updatedApplication =
      await ExhibitorParticipation.findByIdAndUpdate(
        application._id,
        {
          $set: {
            booth: booth._id,
          },
          $unset: {
            boothNumber: "",
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

    console.log("========== BOOTH ASSIGNMENT DEBUG ==========");
    console.log("Booth ID:", booth._id);
    console.log("Booth Number:", booth.boothNumber);
    console.log("Exhibitor ID:", exhibitorId);
    console.log("Application ID:", application._id);
    console.log("Application booth:", updatedApplication.booth);
    console.log("============================================");

    // Notify exhibitor
    await createNotification({
      recipient: exhibitorId,
      title: "Booth Assigned",
      message: `Booth ${booth.boothNumber} has been assigned to you for your event participation.`,
      type: "booth",
      relatedEvent: booth.event,
    });

    // Get updated booth
    const updatedBooth = await Booth.findById(id).populate(
      "exhibitor",
      "name email phone"
    );

    res.status(200).json({
      message: "Booth assigned successfully",
      booth: updatedBooth,
      application: updatedApplication,
    });

  } catch (error) {
    console.error(
      "Assign booth error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};
// ==========================================
// RELEASE BOOTH
// ADMIN
// ==========================================

const releaseBooth = async (req, res) => {
  try {
    const { id } = req.params;

    const booth = await Booth.findById(id);

    if (!booth) {
      return res.status(404).json({
        message: "Booth not found",
      });
    }

    if (!booth.exhibitor) {
      return res.status(400).json({
        message: "This booth is not assigned",
      });
    }

    const exhibitorId = booth.exhibitor;

    // Remove booth from participation
    await ExhibitorParticipation.findOneAndUpdate(
      {
        exhibitor: exhibitorId,
        event: booth.event,
      },
      {
        $set: {
          booth: null,
        },
      },
    );

    // Reset booth
    booth.exhibitor = null;
    booth.status = "available";

    await booth.save();

    res.status(200).json({
      message: "Booth released successfully",
      booth,
    });
  } catch (error) {
    console.error("Release booth error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET MY ASSIGNED BOOTHS
// EXHIBITOR
// ==========================================

const getMyBooths = async (req, res) => {
  try {
    const booths = await Booth.find({
      exhibitor: req.user._id,
    })
      .populate(
        "event",
        "title category location startDate endDate bannerImage",
      )
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      count: booths.length,
      booths,
    });
  } catch (error) {
    console.error("Get my booths error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// DELETE BOOTH
// ADMIN
// ==========================================

const deleteBooth = async (req, res) => {
  try {
    const { id } = req.params;

    const booth = await Booth.findById(id);

    if (!booth) {
      return res.status(404).json({
        message: "Booth not found",
      });
    }

    if (booth.status !== "available") {
      return res.status(400).json({
        message: "Only available booths can be deleted",
      });
    }

    await Booth.findByIdAndDelete(id);

    res.status(200).json({
      message: "Booth deleted successfully",
    });
  } catch (error) {
    console.error("Delete booth error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export {
  createBooth,
  getEventBooths,
  getAvailableBooths,
  updateBooth,
  assignBooth,
  releaseBooth,
  getMyBooths,
  deleteBooth,
};
