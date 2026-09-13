import Booth from "../models/Booth.mjs";
import Event from "../models/Event.mjs";
import ExhibitorParticipation from "../models/ExhibitorParticipation.mjs";
import createNotification from "../utils/createNotification.mjs";
import authorizeEventAccess, {
  handleEventAccessError,
} from "../utils/authorizeEventAccess.mjs";

const authorizeBoothEventAccess = async (user, booth) => {
  return authorizeEventAccess(user, booth.event);
};

const createBooth = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { boothNumber, size, location, price } = req.body;

    if (!boothNumber) {
      return res.status(400).json({
        message: "Booth number is required",
      });
    }

    await authorizeEventAccess(req.user, eventId);

    const existingBooth = await Booth.findOne({
      event: eventId,
      boothNumber,
    });

    if (existingBooth) {
      return res.status(400).json({
        message: "This booth number already exists for this event",
      });
    }

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

    if (handleEventAccessError(error, res, "manage booths for")) {
      return;
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getEventBooths = async (req, res) => {
  try {
    const { eventId } = req.params;

    await authorizeEventAccess(req.user, eventId);

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

    if (handleEventAccessError(error, res, "view booths for")) {
      return;
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

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

    await authorizeBoothEventAccess(req.user, booth);

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

    if (size !== undefined) booth.size = size;
    if (location !== undefined) booth.location = location;
    if (price !== undefined) booth.price = price;

    await booth.save();

    res.status(200).json({
      message: "Booth updated successfully",
      booth,
    });
  } catch (error) {
    console.error("Update booth error:", error.message);

    if (handleEventAccessError(error, res, "update booths for")) {
      return;
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

const assignBooth = async (req, res) => {
  try {
    const { id } = req.params;
    const { exhibitorId } = req.body;

    if (!exhibitorId) {
      return res.status(400).json({
        message: "Exhibitor ID is required",
      });
    }

    const booth = await Booth.findById(id);

    if (!booth) {
      return res.status(404).json({
        message: "Booth not found",
      });
    }

    await authorizeBoothEventAccess(req.user, booth);

    if (booth.status !== "available") {
      return res.status(400).json({
        message: "This booth is not available",
      });
    }

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

    if (application.booth) {
      return res.status(400).json({
        message: "This exhibitor already has a booth assigned for this event",
      });
    }

    booth.exhibitor = exhibitorId;
    booth.status = "occupied";
    await booth.save();

    const updatedApplication = await ExhibitorParticipation.findByIdAndUpdate(
      application._id,
      {
        $set: { booth: booth._id },
        $unset: { boothNumber: "" },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    await createNotification({
      recipient: exhibitorId,
      title: "Booth Assigned",
      message: `Booth ${booth.boothNumber} has been assigned to you for your event participation.`,
      type: "booth",
      relatedEvent: booth.event,
    });

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
    console.error("Assign booth error:", error.message);

    if (handleEventAccessError(error, res, "assign booths for")) {
      return;
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

const releaseBooth = async (req, res) => {
  try {
    const { id } = req.params;

    const booth = await Booth.findById(id);

    if (!booth) {
      return res.status(404).json({
        message: "Booth not found",
      });
    }

    await authorizeBoothEventAccess(req.user, booth);

    if (!booth.exhibitor) {
      return res.status(400).json({
        message: "This booth is not assigned",
      });
    }

    const exhibitorId = booth.exhibitor;

    await ExhibitorParticipation.findOneAndUpdate(
      {
        exhibitor: exhibitorId,
        event: booth.event,
      },
      {
        $set: { booth: null },
      }
    );

    booth.exhibitor = null;
    booth.status = "available";
    await booth.save();

    res.status(200).json({
      message: "Booth released successfully",
      booth,
    });
  } catch (error) {
    console.error("Release booth error:", error.message);

    if (handleEventAccessError(error, res, "release booths for")) {
      return;
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getMyBooths = async (req, res) => {
  try {
    const booths = await Booth.find({
      exhibitor: req.user._id,
    })
      .populate(
        "event",
        "title category location startDate endDate bannerImage"
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

const deleteBooth = async (req, res) => {
  try {
    const { id } = req.params;

    const booth = await Booth.findById(id);

    if (!booth) {
      return res.status(404).json({
        message: "Booth not found",
      });
    }

    await authorizeBoothEventAccess(req.user, booth);

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

    if (handleEventAccessError(error, res, "delete booths for")) {
      return;
    }

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