import bcrypt from "bcryptjs";
import User from "../models/User.mjs";
import Event from "../models/Event.mjs";

const ORGANIZER_SAFE_FIELDS =
  "-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires";

const isOrganizerUser = (user) => user && user.role === "organizer";

const getOrganizerStats = async (organizerId) => {
  const [totalEvents, publishedEvents] = await Promise.all([
    Event.countDocuments({ organizer: organizerId }),
    Event.countDocuments({
      organizer: organizerId,
      status: "published",
      isPublished: true,
    }),
  ]);

  return {
    totalEvents,
    publishedEvents,
  };
};

// ======================================================
// GET ALL ORGANIZERS
// ADMIN ONLY
// ======================================================

const getOrganizers = async (req, res) => {
  try {
    const {
      search,
      isActive,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {
      role: "organizer",
    };

    if (isActive === "true") {
      query.isActive = true;
    }

    if (isActive === "false") {
      query.isActive = false;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const pageNumber = Math.max(parseInt(page) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit) || 20, 1), 50);
    const skip = (pageNumber - 1) * limitNumber;

    const [organizers, totalOrganizers] = await Promise.all([
      User.find(query)
        .select(ORGANIZER_SAFE_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      User.countDocuments(query),
    ]);

    const organizersWithStats = await Promise.all(
      organizers.map(async (organizer) => {
        const stats = await getOrganizerStats(organizer._id);

        return {
          ...organizer.toObject(),
          stats,
        };
      })
    );

    const totalPages = Math.ceil(totalOrganizers / limitNumber);

    res.status(200).json({
      message: "Organizers retrieved successfully",
      count: organizersWithStats.length,
      totalOrganizers,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        limit: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      },
      organizers: organizersWithStats,
    });
  } catch (error) {
    console.error("Get organizers error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// GET ORGANIZER BY ID
// ADMIN ONLY
// ======================================================

const getOrganizerById = async (req, res) => {
  try {
    const { id } = req.params;

    const organizer = await User.findById(id).select(ORGANIZER_SAFE_FIELDS);

    if (!organizer || !isOrganizerUser(organizer)) {
      return res.status(404).json({
        message: "Organizer not found",
      });
    }

    const events = await Event.find({
      organizer: organizer._id,
    })
      .select(
        "title category location startDate endDate status isPublished createdAt"
      )
      .sort({ createdAt: -1 });

    const stats = await getOrganizerStats(organizer._id);

    res.status(200).json({
      message: "Organizer retrieved successfully",
      organizer,
      stats,
      events,
    });
  } catch (error) {
    console.error("Get organizer error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid organizer ID",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// CREATE ORGANIZER
// ADMIN ONLY
// ======================================================

const createOrganizer = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "A user with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const organizer = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone?.trim() || undefined,
      role: "organizer",
      isActive: true,
      emailVerified: true,
    });

    organizer.password = undefined;

    res.status(201).json({
      message: "Organizer created successfully",
      organizer,
    });
  } catch (error) {
    console.error("Create organizer error:", error.message);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "A user with this email already exists",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// UPDATE ORGANIZER
// ADMIN ONLY
// ======================================================

const updateOrganizer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, isActive } = req.body;

    if (
      name === undefined &&
      phone === undefined &&
      isActive === undefined
    ) {
      return res.status(400).json({
        message: "At least one field is required to update",
      });
    }

    const organizer = await User.findById(id);

    if (!organizer || !isOrganizerUser(organizer)) {
      return res.status(404).json({
        message: "Organizer not found",
      });
    }

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({
          message: "Name cannot be empty",
        });
      }

      organizer.name = String(name).trim();
    }

    if (phone !== undefined) {
      organizer.phone = String(phone).trim();
    }

    if (isActive !== undefined) {
      organizer.isActive = Boolean(isActive);
    }

    await organizer.save();

    organizer.password = undefined;
    organizer.resetPasswordToken = undefined;
    organizer.resetPasswordExpires = undefined;

    res.status(200).json({
      message: "Organizer updated successfully",
      organizer,
    });
  } catch (error) {
    console.error("Update organizer error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid organizer ID",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// ACTIVATE ORGANIZER
// ADMIN ONLY
// ======================================================

const activateOrganizer = async (req, res) => {
  try {
    const { id } = req.params;

    const organizer = await User.findById(id);

    if (!organizer || !isOrganizerUser(organizer)) {
      return res.status(404).json({
        message: "Organizer not found",
      });
    }

    if (organizer.isActive) {
      return res.status(400).json({
        message: "Organizer is already active",
      });
    }

    organizer.isActive = true;
    await organizer.save();

    organizer.password = undefined;

    res.status(200).json({
      message: "Organizer activated successfully",
      organizer,
    });
  } catch (error) {
    console.error("Activate organizer error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid organizer ID",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// DEACTIVATE ORGANIZER
// ADMIN ONLY
// ======================================================

const deactivateOrganizer = async (req, res) => {
  try {
    const { id } = req.params;

    const organizer = await User.findById(id);

    if (!organizer || !isOrganizerUser(organizer)) {
      return res.status(404).json({
        message: "Organizer not found",
      });
    }

    if (!organizer.isActive) {
      return res.status(400).json({
        message: "Organizer is already deactivated",
      });
    }

    organizer.isActive = false;
    await organizer.save();

    organizer.password = undefined;

    res.status(200).json({
      message: "Organizer deactivated successfully",
      organizer,
    });
  } catch (error) {
    console.error("Deactivate organizer error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid organizer ID",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// DEMOTE ORGANIZER TO ATTENDEE
// ADMIN ONLY
// Existing events stay linked to this user id.
// ======================================================

const demoteOrganizer = async (req, res) => {
  try {
    const { id } = req.params;

    const organizer = await User.findById(id);

    if (!organizer || !isOrganizerUser(organizer)) {
      return res.status(404).json({
        message: "Organizer not found",
      });
    }

    organizer.role = "attendee";
    await organizer.save();

    organizer.password = undefined;

    res.status(200).json({
      message: "Organizer demoted to attendee successfully",
      user: organizer,
    });
  } catch (error) {
    console.error("Demote organizer error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid organizer ID",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// DELETE ORGANIZER
// ADMIN ONLY
// Blocked when the organizer still owns events.
// ======================================================

const deleteOrganizer = async (req, res) => {
  try {
    const { id } = req.params;

    const organizer = await User.findById(id);

    if (!organizer || !isOrganizerUser(organizer)) {
      return res.status(404).json({
        message: "Organizer not found",
      });
    }

    const eventCount = await Event.countDocuments({
      organizer: organizer._id,
    });

    if (eventCount > 0) {
      return res.status(400).json({
        message:
          "This organizer still owns events. Deactivate or reassign those events before deleting the account.",
        eventCount,
      });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      message: "Organizer deleted successfully",
    });
  } catch (error) {
    console.error("Delete organizer error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid organizer ID",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

export {
  getOrganizers,
  getOrganizerById,
  createOrganizer,
  updateOrganizer,
  activateOrganizer,
  deactivateOrganizer,
  demoteOrganizer,
  deleteOrganizer,
};
