import OrganizerApplication from "../models/OrganizerApplication.mjs";
import Exhibitor from "../models/Exhibitor.mjs";
import User from "../models/User.mjs";
import sendEmail from "../utils/email.mjs";
import createNotification from "../utils/createNotification.mjs";

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

    const exhibitorApplication = await Exhibitor.findOne({
      user: userId,
      status: { $in: ["pending", "approved"] },
    }).select("status");
    if (exhibitorApplication) {
      return res.status(409).json({
        success: false,
        message: "You already requested exhibitor access. You cannot apply as an organizer until that application is rejected.",
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

    if (existingApplication && existingApplication.status !== "rejected") {
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

    const application = existingApplication
      ? await OrganizerApplication.findByIdAndUpdate(
        existingApplication._id,
        {
          $set: {
            organizationName: organizationName.trim(),
            organizationDescription: organizationDescription?.trim() || undefined,
            reason: reason.trim(),
            experience: experience?.trim() || undefined,
            website: website?.trim() || undefined,
            status: "pending",
          },
          $unset: { adminNotes: 1, reviewedBy: 1, reviewedAt: 1 },
        },
        { new: true, runValidators: true },
      )
      : await OrganizerApplication.create({
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

    // A pending request normally belongs to an attendee. An organizer role
    // is accepted here only to recover applications promoted by an older
    // approval attempt that failed before the application was saved.
    if (!["attendee", "organizer"].includes(applicant.role)) {
      return res.status(400).json({
        success: false,
        message:
          "Applicant is not eligible for organizer approval",
      });
    }

    const applicationUpdate = {
      status: "approved",
      reviewedBy: adminId,
      reviewedAt: new Date(),
    };
    if (req.body?.adminNotes) {
      applicationUpdate.adminNotes = req.body.adminNotes.trim();
    }

    // Mark the application first, then promote the user. If promotion fails,
    // restore the pending state so the two records cannot diverge.
    const updated = await OrganizerApplication.findOneAndUpdate(
      { _id: application._id, status: "pending" },
      { $set: applicationUpdate },
      { new: true, runValidators: true },
    );
    if (!updated) {
      return res.status(409).json({
        success: false,
        message: "This application was already processed",
      });
    }

    try {
      if (applicant.role !== "organizer") {
        const roleUpdate = await User.updateOne(
          { _id: applicant._id, role: "attendee" },
          { $set: { role: "organizer" } },
        );
        if (roleUpdate.modifiedCount !== 1) {
          throw new Error("Applicant role could not be updated");
        }
      }
    } catch (promotionError) {
      await OrganizerApplication.updateOne(
        { _id: updated._id, status: "approved" },
        { $set: { status: "pending" }, $unset: { reviewedBy: 1, reviewedAt: 1 } },
      );
      throw promotionError;
    }

    await createNotification({
      recipient: applicant._id,
      title: "Organizer application approved",
      message: "Your organizer application was approved. You can now create events.",
      type: "application",
    });
    try {
      await sendEmail({
        to: applicant.email,
        subject: "Your EventSphere organizer application was approved",
        text: "Your organizer application was approved. You can now create events on EventSphere.",
        html: "<p>Your organizer application was approved. You can now create events on EventSphere.</p>",
      });
    } catch (emailError) {
      console.error("Organizer approval email error:", emailError.message);
    }

    // --------------------------------------------------
    // Return updated application
    // --------------------------------------------------

    const updatedApplication =
      await OrganizerApplication.findById(
        updated._id
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
        error?.message || "Unable to approve organizer application",
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

    if (req.body?.adminNotes) {
      application.adminNotes =
        req.body.adminNotes.trim();
    }

    if (application.applicant) {
      await User.updateOne(
        { _id: application.applicant, role: "organizer" },
        { $set: { role: "attendee" } },
      );
    }

    await application.save();

    const rejectedApplicant = await User.findById(application.applicant).select("email");
    const rejectionReason = application.adminNotes || "No additional reason was provided.";
    await createNotification({
      recipient: application.applicant,
      title: "Organizer application rejected",
      message: `Your organizer application was rejected. Reason: ${rejectionReason}`,
      type: "application",
    });
    try {
      await sendEmail({
        to: rejectedApplicant?.email,
        subject: "Your EventSphere organizer application was rejected",
        text: `Your organizer application was rejected. Reason: ${rejectionReason}`,
        html: `<p>Your organizer application was rejected.</p><p><strong>Reason:</strong> ${rejectionReason}</p>`,
      });
    } catch (emailError) {
      console.error("Organizer rejection email error:", emailError.message);
    }

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