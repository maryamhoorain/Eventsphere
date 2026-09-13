import OrganizerApplication from "../models/OrganizerApplication.mjs";
import User from "../models/User.mjs";

// ======================================================
// SUBMIT ORGANIZER APPLICATION
// ======================================================

const submitOrganizerApplication = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication information is missing",
      });
    }

    // --------------------------------------------------
    // Get authenticated user
    // --------------------------------------------------

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // --------------------------------------------------
    // Only attendees can apply
    // --------------------------------------------------

    if (user.role !== "attendee") {
      return res.status(403).json({
        success: false,
        message:
          "Only attendees can apply to become organizers",
      });
    }

    // --------------------------------------------------
    // Get application data
    // --------------------------------------------------

    const {
      organizationName,
      organizationDescription,
      reason,
      experience,
      website,
    } = req.body;

    // --------------------------------------------------
    // Validate required fields
    // --------------------------------------------------

    if (
      !organizationName ||
      typeof organizationName !== "string" ||
      !organizationName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required",
      });
    }

    if (
      !reason ||
      typeof reason !== "string" ||
      !reason.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Reason for becoming an organizer is required",
      });
    }

    // --------------------------------------------------
    // Check whether application already exists
    // --------------------------------------------------

    const existingApplication =
      await OrganizerApplication.findOne({
        applicant: userId,
      });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message:
          "You have already submitted an organizer application",
        data: {
          application: existingApplication,
        },
      });
    }

    // --------------------------------------------------
    // Create application
    // --------------------------------------------------

    const application =
      await OrganizerApplication.create({
        applicant: userId,
        organizationName:
          organizationName.trim(),
        organizationDescription:
          organizationDescription?.trim() || undefined,
        reason: reason.trim(),
        experience:
          experience?.trim() || undefined,
        website:
          website?.trim() || undefined,
      });

    // --------------------------------------------------
    // Populate applicant information
    // --------------------------------------------------

    const populatedApplication =
      await OrganizerApplication.findById(
        application._id
      ).populate(
        "applicant",
        "name email phone profileImage role"
      );

    return res.status(201).json({
      success: true,
      message:
        "Organizer application submitted successfully",
      data: {
        application: populatedApplication,
      },
    });
  } catch (error) {
    console.error(
      "Submit organizer application error:",
      error
    );

    // Handle duplicate applicant index
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "You have already submitted an organizer application",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to submit organizer application",
    });
  }
};

// ======================================================
// GET MY ORGANIZER APPLICATION
// ======================================================

const getMyOrganizerApplication = async (
  req,
  res
) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication information is missing",
      });
    }

    const application =
      await OrganizerApplication.findOne({
        applicant: userId,
      })
        .populate(
          "applicant",
          "name email phone profileImage role"
        )
        .populate(
          "reviewedBy",
          "name email role"
        )
        .lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        message:
          "No organizer application found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Organizer application retrieved successfully",
      data: {
        application,
      },
    });
  } catch (error) {
    console.error(
      "Get my organizer application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve organizer application",
    });
  }
};

// ======================================================
// GET ALL ORGANIZER APPLICATIONS
// ADMIN ONLY
// ======================================================

const getOrganizerApplications = async (
  req,
  res
) => {
  try {
    const {
      status,
    } = req.query;

    const filter = {};

    // --------------------------------------------------
    // Optional status filter
    // --------------------------------------------------

    if (status) {
      const allowedStatuses = [
        "pending",
        "approved",
        "rejected",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid application status",
        });
      }

      filter.status = status;
    }

    const applications =
      await OrganizerApplication.find(filter)
        .populate(
          "applicant",
          "name email phone profileImage role createdAt"
        )
        .populate(
          "reviewedBy",
          "name email role"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      message:
        "Organizer applications retrieved successfully",
      data: {
        applications,
        count: applications.length,
      },
    });
  } catch (error) {
    console.error(
      "Get organizer applications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve organizer applications",
    });
  }
};

// ======================================================
// GET SINGLE ORGANIZER APPLICATION
// ADMIN ONLY
// ======================================================

const getOrganizerApplicationById = async (
  req,
  res
) => {
  try {
    const {
      id,
    } = req.params;

    const application =
      await OrganizerApplication.findById(id)
        .populate(
          "applicant",
          "name email phone profileImage role createdAt"
        )
        .populate(
          "reviewedBy",
          "name email role"
        )
        .lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        message:
          "Organizer application not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Organizer application retrieved successfully",
      data: {
        application,
      },
    });
  } catch (error) {
    console.error(
      "Get organizer application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve organizer application",
    });
  }
};

// ======================================================
// APPROVE ORGANIZER APPLICATION
// ADMIN ONLY
// ======================================================

const approveOrganizerApplication = async (
  req,
  res
) => {
  try {
    const adminId =
      req.user?._id ||
      req.user?.id;

    const {
      id,
    } = req.params;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message:
          "User authentication information is missing",
      });
    }

    // --------------------------------------------------
    // Find application
    // --------------------------------------------------

    const application =
      await OrganizerApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message:
          "Organizer application not found",
      });
    }

    // --------------------------------------------------
    // Prevent processing an already processed request
    // --------------------------------------------------

    if (application.status !== "pending") {
      return res.status(400).json({
        success: false,
        message:
          `This application has already been ${application.status}`,
      });
    }

    // --------------------------------------------------
    // Find applicant
    // --------------------------------------------------

    const applicant =
      await User.findById(
        application.applicant
      );

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message:
          "Applicant user not found",
      });
    }

    // --------------------------------------------------
    // Make sure applicant is still an attendee
    // --------------------------------------------------

    if (applicant.role !== "attendee") {
      return res.status(400).json({
        success: false,
        message:
          "Applicant is no longer an attendee",
      });
    }

    // --------------------------------------------------
    // Update user role
    // --------------------------------------------------

    applicant.role = "organizer";

    await applicant.save();

    // --------------------------------------------------
    // Update application
    // --------------------------------------------------

    application.status = "approved";
    application.reviewedBy = adminId;
    application.reviewedAt = new Date();

    if (req.body.adminNotes) {
      application.adminNotes =
        req.body.adminNotes.trim();
    }

    await application.save();

    // --------------------------------------------------
    // Return updated application
    // --------------------------------------------------

    const updatedApplication =
      await OrganizerApplication.findById(
        application._id
      )
        .populate(
          "applicant",
          "name email phone profileImage role"
        )
        .populate(
          "reviewedBy",
          "name email role"
        )
        .lean();

    return res.status(200).json({
      success: true,
      message:
        "Organizer application approved successfully",
      data: {
        application: updatedApplication,
      },
    });
  } catch (error) {
    console.error(
      "Approve organizer application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to approve organizer application",
    });
  }
};

// ======================================================
// REJECT ORGANIZER APPLICATION
// ADMIN ONLY
// ======================================================

const rejectOrganizerApplication = async (
  req,
  res
) => {
  try {
    const adminId =
      req.user?._id ||
      req.user?.id;

    const {
      id,
    } = req.params;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message:
          "User authentication information is missing",
      });
    }

    const application =
      await OrganizerApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message:
          "Organizer application not found",
      });
    }

    // --------------------------------------------------
    // Only pending applications can be rejected
    // --------------------------------------------------

    if (application.status !== "pending") {
      return res.status(400).json({
        success: false,
        message:
          `This application has already been ${application.status}`,
      });
    }

    // --------------------------------------------------
    // Update application
    // --------------------------------------------------

    application.status = "rejected";
    application.reviewedBy = adminId;
    application.reviewedAt = new Date();

    if (req.body.adminNotes) {
      application.adminNotes =
        req.body.adminNotes.trim();
    }

    await application.save();

    // --------------------------------------------------
    // Return updated application
    // --------------------------------------------------

    const updatedApplication =
      await OrganizerApplication.findById(
        application._id
      )
        .populate(
          "applicant",
          "name email phone profileImage role"
        )
        .populate(
          "reviewedBy",
          "name email role"
        )
        .lean();

    return res.status(200).json({
      success: true,
      message:
        "Organizer application rejected successfully",
      data: {
        application: updatedApplication,
      },
    });
  } catch (error) {
    console.error(
      "Reject organizer application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to reject organizer application",
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================

export {
  submitOrganizerApplication,
  getMyOrganizerApplication,
  getOrganizerApplications,
  getOrganizerApplicationById,
  approveOrganizerApplication,
  rejectOrganizerApplication,
};