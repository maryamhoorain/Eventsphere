import Exhibitor from "../models/Exhibitor.mjs";
import User from "../models/User.mjs";
import OrganizerApplication from "../models/OrganizerApplication.mjs";
import sendEmail from "../utils/email.mjs";
import createNotification from "../utils/createNotification.mjs";

const applyAsExhibitor = async (req, res) => {
    try {
        const userId = req.user._id;

        const {
            companyName,
            description,
            industry,
            website,
            contactEmail,
            contactPhone,
            logo
        } = req.body;

        // Make sure user is an attendee
        if (req.user.role !== "attendee") {
            return res.status(403).json({
                message: "Only attendees can apply to become exhibitors"
            });
        }

        const organizerApplication = await OrganizerApplication.findOne({
            applicant: userId,
            status: { $in: ["pending", "approved"] },
        }).select("status");
        if (organizerApplication) {
            return res.status(409).json({
                message: "You already requested organizer access. You cannot apply as an exhibitor until that application is rejected.",
            });
        }

        // Check if application already exists
        const existingApplication = await Exhibitor.findOne({
            user: userId
        });

        if (existingApplication && existingApplication.status !== "rejected") {
            return res.status(400).json({
                message: "You have already submitted an exhibitor application"
            });
        }

        // Validate required fields
        if (
            !companyName ||
            !description ||
            !industry ||
            !contactEmail ||
            !contactPhone
        ) {
            return res.status(400).json({
                message:
                    "Company name, description, industry, contact email and contact phone are required"
            });
        }

        // Create application
        const application = existingApplication
            ? await Exhibitor.findByIdAndUpdate(
                existingApplication._id,
                {
                    $set: {
                        companyName,
                        description,
                        industry,
                        website,
                        contactEmail,
                        contactPhone,
                        logo,
                        status: "pending",
                    },
                    $unset: { adminNotes: 1 },
                },
                { new: true, runValidators: true },
            )
            : await Exhibitor.create({
                user: userId,
                companyName,
                description,
                industry,
                website,
                contactEmail,
                contactPhone,
                logo,
                status: "pending"
            });

        res.status(201).json({
            message: "Exhibitor application submitted successfully",
            application
        });

    } catch (error) {
        console.error(
            "Exhibitor application error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};
const getApplications = async (req, res) => {
    try {
        const applications = await Exhibitor.find()
            .populate("user", "name email phone role")
            .sort({ createdAt: -1 });

        res.status(200).json({
            applications
        });

    } catch (error) {
        console.error(
            "Get exhibitor applications error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};
const getMyApplication = async (req, res) => {
    try {
        const application = await Exhibitor.findOne({ user: req.user._id })
            .populate("user", "name email phone role");
        return res.status(200).json({ application });
    } catch (error) {
        console.error("Get my exhibitor application error:", error.message);
        return res.status(500).json({ message: "Unable to retrieve exhibitor application" });
    }
};
const approveApplication = async (req, res) => {
    try {
        const { id } = req.params;

        const application = await Exhibitor.findById(id);

        if (!application) {
            return res.status(404).json({
                message: "Exhibitor application not found"
            });
        }

        if (application.status === "approved") {
            return res.status(400).json({
                message: "Application is already approved"
            });
        }

        // Update application status
        application.status = "approved";
        await application.save();

        // Update user's role
        const user = await User.findById(application.user);

        if (!user) {
            return res.status(404).json({
                message: "User associated with application not found"
            });
        }

        user.role = "exhibitor";
        await user.save();
        await createNotification({
            recipient: user._id,
            title: "Exhibitor application approved",
            message: "Your exhibitor application was approved.",
            type: "application",
        });
        try {
            await sendEmail({
                to: user.email,
                subject: "Your EventSphere exhibitor application was approved",
                text: "Your exhibitor application was approved. You can now use exhibitor features on EventSphere.",
                html: "<p>Your exhibitor application was approved. You can now use exhibitor features on EventSphere.</p>",
            });
        } catch (emailError) {
            console.error("Exhibitor approval email error:", emailError.message);
        }

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

        const application = await Exhibitor.findById(id);

        if (!application) {
            return res.status(404).json({
                message: "Exhibitor application not found"
            });
        }

        if (application.status === "rejected") {
            return res.status(400).json({
                message: "Application is already rejected"
            });
        }

        application.status = "rejected";
        application.adminNotes = req.body.adminNotes?.trim() || "";

        await application.save();
        const user = await User.findById(application.user).select("email");
        const reason = application.adminNotes || "No additional reason was provided.";
        await createNotification({
            recipient: application.user,
            title: "Exhibitor application rejected",
            message: `Your exhibitor application was rejected. Reason: ${reason}`,
            type: "application",
        });
        try {
            await sendEmail({
                to: user?.email,
                subject: "Your EventSphere exhibitor application was rejected",
                text: `Your exhibitor application was rejected. Reason: ${reason}`,
                html: `<p>Your exhibitor application was rejected.</p><p><strong>Reason:</strong> ${reason}</p>`,
            });
        } catch (emailError) {
            console.error("Exhibitor rejection email error:", emailError.message);
        }

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

export { applyAsExhibitor, getApplications, getMyApplication, approveApplication , rejectApplication };