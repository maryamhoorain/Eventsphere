import Event from "../models/Event.mjs";
import uploadToCloudinary from "../utils/uploadToCloudinary.mjs";

const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location,
      startDate,
      endDate,
      registrationDeadline,
      capacity,
      tags,
    } = req.body;

    if (!title || !description || !category || !startDate || !endDate) {
      return res.status(400).json({
        message:
          "Title, description, category, start date and end date are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return res.status(400).json({
        message: "End date must be after start date",
      });
    }

    if (registrationDeadline && new Date(registrationDeadline) > start) {
      return res.status(400).json({
        message: "Registration deadline must be before the event starts",
      });
    }

    let bannerImage = null;

    // Upload image if provided
    if (req.file) {
      const uploadedImage = await uploadToCloudinary(req.file.buffer);

      bannerImage = uploadedImage.secure_url;
    }
    let eventTags = tags;

    if (typeof tags === "string") {
      eventTags = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    }

    const event = await Event.create({
      title,
      description,
      category,
      organizer: req.user._id,
      location,
      startDate: start,
      endDate: end,
      registrationDeadline,
      bannerImage,
      capacity,
      tags,
      status: "draft",
      isPublished: false,
    });

    res.status(201).json({
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    console.error("Create event error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getAllEvents = async (req, res) => {
    try {
        const {
            search,
            category,
            city,
            upcoming,
            sort = "date",
            page = 1,
            limit = 10
        } = req.query;

        const query = {
            status: "published",
            isPublished: true
        };

        // ==============================
        // SEARCH
        // ==============================

        if (search) {
            query.$or = [
                {
                    title: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    description: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    category: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    tags: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ];
        }

        // ==============================
        // CATEGORY
        // ==============================

        if (category) {
            query.category = {
                $regex: `^${category}$`,
                $options: "i"
            };
        }

        // ==============================
        // CITY
        // ==============================

        if (city) {
            query["location.city"] = {
                $regex: `^${city}$`,
                $options: "i"
            };
        }

        // ==============================
        // UPCOMING EVENTS
        // ==============================

        if (upcoming === "true") {
            query.startDate = {
                $gte: new Date()
            };
        }

        // ==============================
        // PAGINATION
        // ==============================

        const pageNumber = Math.max(
            parseInt(page) || 1,
            1
        );

        const limitNumber = Math.min(
            Math.max(parseInt(limit) || 10, 1),
            50
        );

        const skip =
            (pageNumber - 1) * limitNumber;

        // ==============================
        // SORTING
        // ==============================

        let sortOption = {};

        switch (sort) {

            case "latest":
                sortOption = {
                    createdAt: -1
                };
                break;

            case "oldest":
                sortOption = {
                    createdAt: 1
                };
                break;

            case "date":
            default:
                sortOption = {
                    startDate: 1
                };
                break;
        }

        // ==============================
        // FETCH EVENTS
        // ==============================

        const [events, totalEvents] =
            await Promise.all([
                Event.find(query)
                    .populate(
                        "organizer",
                        "name email"
                    )
                    .sort(sortOption)
                    .skip(skip)
                    .limit(limitNumber),

                Event.countDocuments(query)
            ]);

        const totalPages =
            Math.ceil(
                totalEvents / limitNumber
            );

        res.status(200).json({

            count: events.length,

            totalEvents,

            pagination: {
                currentPage: pageNumber,
                totalPages,
                limit: limitNumber,
                hasNextPage:
                    pageNumber < totalPages,
                hasPreviousPage:
                    pageNumber > 1
            },

            events
        });

    } catch (error) {

        console.error(
            "Get events error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findOne({
      _id: id,
      status: "published",
      isPublished: true,
    }).populate("organizer", "name email");

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    res.status(200).json({
      event,
    });
  } catch (error) {
    console.error("Get event error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const publishEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    if (event.status !== "draft") {
      return res.status(400).json({
        message: "Only draft events can be published",
      });
    }

    event.status = "published";
    event.isPublished = true;

    await event.save();

    res.status(200).json({
      message: "Event published successfully",
      event,
    });
  } catch (error) {
    console.error("Publish event error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // Only the event organizer can update it
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized to update this event",
      });
    }

    const {
      title,
      description,
      category,
      location,
      startDate,
      endDate,
      registrationDeadline,
      bannerImage,
      capacity,
      tags,
    } = req.body;

    // Validate dates if they are being updated
    const newStartDate = startDate ? new Date(startDate) : event.startDate;

    const newEndDate = endDate ? new Date(endDate) : event.endDate;

    if (newEndDate <= newStartDate) {
      return res.status(400).json({
        message: "End date must be after start date",
      });
    }

    if (registrationDeadline && new Date(registrationDeadline) > newStartDate) {
      return res.status(400).json({
        message: "Registration deadline must be before the event starts",
      });
    }

    // Update only provided fields
    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (category !== undefined) event.category = category;
    if (location !== undefined) event.location = location;
    if (startDate !== undefined) event.startDate = startDate;
    if (endDate !== undefined) event.endDate = endDate;

    if (registrationDeadline !== undefined) {
      event.registrationDeadline = registrationDeadline;
    }

    if (bannerImage !== undefined) {
      event.bannerImage = bannerImage;
    }

    if (capacity !== undefined) {
      event.capacity = capacity;
    }

    if (tags !== undefined) {
      event.tags = tags;
    }

    await event.save();

    res.status(200).json({
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    console.error("Update event error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // Only the event organizer can delete it
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized to delete this event",
      });
    }

    await Event.findByIdAndDelete(id);

    res.status(200).json({
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Delete event error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};
export {
  createEvent,
  getAllEvents,
  getEventById,
  publishEvent,
  updateEvent,
  deleteEvent,
};
