import Exhibitor from "../models/Exhibitor.mjs";
import User from "../models/User.mjs";

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

        // Check if application already exists
        const existingApplication = await Exhibitor.findOne({
            user: userId
        });

        if (existingApplication) {
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
        const application = await Exhibitor.create({
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

        await application.save();

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

export { applyAsExhibitor, getApplications, approveApplication , rejectApplication };