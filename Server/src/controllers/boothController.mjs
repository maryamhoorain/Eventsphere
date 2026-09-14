import mongoose from "mongoose";
import Booth from "../models/Booth.mjs";
import BoothRequest from "../models/BoothRequest.mjs";
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
    const { boothNumber, size, location, price, floor, positionX, positionY } = req.body;

    if (!boothNumber) {
      return res.status(400).json({
        message: "Booth number is required",
      });
    }
    if (floor !== undefined && !["1", "2", "Ground Floor", "First Floor"].includes(String(floor))) {
      return res.status(400).json({ message: "Floor must be Ground Floor or First Floor" });
    }
    if (positionX !== undefined && (!Number.isFinite(Number(positionX)) || Number(positionX) < 0 || Number(positionX) > 100) ||
        positionY !== undefined && (!Number.isFinite(Number(positionY)) || Number(positionY) < 0 || Number(positionY) > 100)) {
      return res.status(400).json({ message: "Booth positions must be between 0 and 100" });
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
      floor: floor !== undefined ? (String(floor) === "1" ? "Ground Floor" : String(floor) === "2" ? "First Floor" : floor) : "Ground Floor",
      positionX: positionX !== undefined ? positionX : null,
      positionY: positionY !== undefined ? positionY : null,
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

    const booths = await BoothRequest.find({
      event: eventId,
      status: { $in: ["available", "pending"] },
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

const requestBooth = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid booth ID" });
    }

    const booth = await BoothRequest.findById(id);
    if (!booth) return res.status(404).json({ message: "Booth map entry not found" });
    const event = await Event.findOne({ _id: booth.event, status: "published", isPublished: true });
    if (!event) return res.status(404).json({ message: "Published event not found" });

    if (booth.status !== "available") {
      return res.status(409).json({ message: "This booth is no longer available" });
    }

    try {
      const request = await BoothRequest.findOneAndUpdate(
        { _id: id, status: "available" },
        { $set: { status: "pending", exhibitor: req.user._id, requestedAt: new Date(), reviewedAt: null, reviewedBy: null } },
        { new: true, runValidators: true },
      ).populate("event", "title").populate("exhibitor", "name email companyName");
      if (!request) return res.status(409).json({ message: "This booth is no longer available" });
      return res.status(201).json({ message: "Booth request submitted", request });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error("Request booth error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const getPendingBooths = async (req, res) => {
  try {
    const requests = await BoothRequest.find({ status: "pending" })
      .populate("event", "title")
      .populate("exhibitor", "name email companyName")
      .sort({ requestedAt: 1 });
    return res.status(200).json({ count: requests.length, requests });
  } catch (error) {
    console.error("Get pending booths error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const approveBoothRequest = async (req, res) => {
  try {
    const request = await BoothRequest.findOne({ _id: req.params.id, status: "pending" })
      .populate("exhibitor", "name email companyName");
    if (!request) return res.status(404).json({ message: "Booth request not found" });
    await authorizeEventAccess(req.user, request.event);

    const application = await ExhibitorParticipation.findOne({
      exhibitor: request.exhibitor._id,
      event: request.event,
      status: "approved",
    });
    if (application?.booth) {
      return res.status(400).json({ message: "This exhibitor already has a booth assigned for this event" });
    }

    const booth = await Booth.create({
      event: request.event,
      boothNumber: request.boothNumber,
      size: request.size,
      location: request.location,
      floor: ["First Floor", "2"].includes(String(request.floor)) ? 2 : 1,
      mapCoordinates: request.mapCoordinates,
      positionX: request.positionX,
      positionY: request.positionY,
      price: request.price,
      exhibitor: request.exhibitor._id,
      status: "occupied",
      approvedAt: new Date(),
      approvedBy: req.user._id,
    });
    if (application) {
      try {
      application.booth = booth._id;
      await application.save();
      } catch (error) {
        await Booth.findByIdAndDelete(booth._id);
        throw error;
      }
    }
    await createNotification({
      recipient: request.exhibitor._id,
      title: "Booth request approved",
      message: `Booth ${booth.boothNumber} has been approved and assigned to you.`,
      type: "booth",
      relatedEvent: request.event,
    });
    await BoothRequest.findByIdAndDelete(request._id);
    return res.status(200).json({ message: "Booth request approved", booth, request });
  } catch (error) {
    console.error("Approve booth request error:", error.message);
    if (handleEventAccessError(error, res, "approve booths for")) return;
    return res.status(500).json({ message: "Server error" });
  }
};

const rejectBoothRequest = async (req, res) => {
  try {
    const request = await BoothRequest.findOne({ _id: req.params.id, status: "pending" })
      .populate("exhibitor", "name email companyName");
    if (!request) return res.status(404).json({ message: "Booth request not found" });
    await authorizeEventAccess(req.user, request.event);
    const exhibitorId = request.exhibitor._id;
    request.status = "available";
    request.exhibitor = null;
    request.reviewedAt = new Date();
    request.reviewedBy = req.user._id;
    await request.save();
    await createNotification({
      recipient: exhibitorId,
      title: "Booth request rejected",
      message: `Your request for booth ${request.boothNumber} was rejected.`,
      type: "booth",
      relatedEvent: request.event,
    });
    return res.status(200).json({ message: "Booth request rejected", request });
  } catch (error) {
    console.error("Reject booth request error:", error.message);
    if (handleEventAccessError(error, res, "reject booths for")) return;
    return res.status(500).json({ message: "Server error" });
  }
};

// ==========================================
// UPDATE BOOTH
// ADMIN
// ==========================================

const updateBooth = async (req, res) => {
  try {
    const { id } = req.params;
    const { boothNumber, size, location, price, floor, positionX, positionY } = req.body;

    const booth = await Booth.findById(id);

    if (!booth) {
      return res.status(404).json({
        message: "Booth not found",
      });
    }

    await authorizeBoothEventAccess(req.user, booth);

    if (floor !== undefined && (!Number.isInteger(Number(floor)) || ![1, 2].includes(Number(floor)))) {
      return res.status(400).json({ message: "Floor must be 1 or 2" });
    }
    if (positionX !== undefined && (!Number.isFinite(Number(positionX)) || Number(positionX) < 0 || Number(positionX) > 100) ||
        positionY !== undefined && (!Number.isFinite(Number(positionY)) || Number(positionY) < 0 || Number(positionY) > 100)) {
      return res.status(400).json({ message: "Booth positions must be between 0 and 100" });
    }

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
    if (floor !== undefined) booth.floor = floor;
    if (positionX !== undefined) booth.positionX = positionX;
    if (positionY !== undefined) booth.positionY = positionY;

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

const getEventBoothMap = async (req, res) => {
  try {
    if (req.user.role !== "exhibitor") {
      await authorizeEventAccess(req.user, req.params.eventId);
    }
    const event = await Event.findOne({
      _id: req.params.eventId,
      ...(req.user.role === "exhibitor"
        ? { status: "published", isPublished: true }
        : {}),
    });
    if (!event) return res.status(404).json({ message: "Published event not found" });

    const mapBooths = await BoothRequest.find({ event: event._id })
      .select("boothNumber size location price floor positionX positionY mapCoordinates status exhibitor")
      .sort({ floor: 1, boothNumber: 1 })
      .lean();
    const assignedBooths = await Booth.find({ event: event._id })
      .populate("exhibitor", "name email phone")
      .select("boothNumber size location price floor positionX positionY mapCoordinates status exhibitor")
      .lean();
    const assignedByNumber = new Map(assignedBooths.map((booth) => [booth.boothNumber, booth]));
    const booths = mapBooths.map((mapBooth) => {
      const assigned = assignedByNumber.get(mapBooth.boothNumber);
      return assigned
        ? { ...mapBooth, ...assigned, status: assigned.status === "occupied" ? "occupied" : assigned.status }
        : mapBooth;
    });
    for (const assigned of assignedBooths) {
      if (!booths.some((booth) => booth.boothNumber === assigned.boothNumber)) booths.push(assigned);
    }
    const grouped = booths.reduce((floors, booth) => {
      const key = String(booth.floor || 1);
      if (!floors[key]) floors[key] = [];
      floors[key].push(booth);
      return floors;
    }, {});
    const floors = Object.entries(grouped).map(([floor, floorBooths]) => ({
      floor,
      booths: floorBooths,
    }));
    return res.status(200).json({ count: booths.length, floors });
  } catch (error) {
    console.error("Get booth map error:", error.message);
    return res.status(500).json({ message: "Server error" });
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

const getMyBoothRequests = async (req, res) => {
  try {
    const requests = await BoothRequest.find({
      exhibitor: req.user._id,
      status: "pending",
    })
      .populate("event", "title")
      .sort({ requestedAt: -1 });

    res.status(200).json({ count: requests.length, requests });
  } catch (error) {
    console.error("Get my booth requests error:", error.message);
    res.status(500).json({ message: "Server error" });
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
  getEventBoothMap,
  getAvailableBooths,
  requestBooth,
  getPendingBooths,
  approveBoothRequest,
  rejectBoothRequest,
  updateBooth,
  assignBooth,
  releaseBooth,
  getMyBooths,
  getMyBoothRequests,
  deleteBooth,
};