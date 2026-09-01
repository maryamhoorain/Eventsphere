import {
    generateReport,
    getPreviousReports,
    downloadReport,
    deleteReport
} from "../services/reportService.mjs";

// ======================================================
// GENERATE REPORT
// ADMIN / ORGANIZER / EXHIBITOR
// ======================================================

const createReport = async (req, res) => {

    try {

        const { eventId } =
            req.params;

        const {
            reportType,
            format
        } = req.body;


        // ==========================================
        // VALIDATION
        // ==========================================

        if (!reportType) {

            return res.status(400).json({
                message:
                    "Report type is required"
            });

        }


        if (!format) {

            return res.status(400).json({
                message:
                    "Report format is required"
            });

        }


        // ==========================================
        // GENERATE REPORT
        // ==========================================

        const report =
            await generateReport({

                reportType,

                format,

                eventId,

                userId:
                    req.user._id,

                userRole:
                    req.user.role

            });


        res.status(201).json({

            message:
                "Report generated successfully",

            report

        });

    } catch (error) {

        console.error(
            "Generate report error:",
            error.message
        );


        // ==========================================
        // CLIENT ERRORS
        // ==========================================

        const clientErrors = [

            "Invalid report type",

            "Invalid report format",

            "Event not found",

            "Unable to build report sections"

        ];


        if (
            clientErrors.includes(
                error.message
            )
        ) {

            return res.status(400).json({
                message:
                    error.message
            });

        }


        res.status(500).json({
            message:
                "Server error"
        });

    }

};


// ======================================================
// GET PREVIOUS REPORTS
// ADMIN / ORGANIZER / EXHIBITOR
// ======================================================

const getReports = async (req, res) => {

    try {

        const { eventId } =
            req.params;


        const reports =
            await getPreviousReports({

                eventId,

                userId:
                    req.user._id,

                userRole:
                    req.user.role

            });


        res.status(200).json({

            count:
                reports.length,

            reports

        });

    } catch (error) {

        console.error(
            "Get reports error:",
            error.message
        );


        res.status(500).json({
            message:
                "Server error"
        });

    }

};
// ======================================================
// DOWNLOAD REPORT
// ======================================================

const downloadReportController = async (req, res) => {

    try {

        const { reportId } = req.params;

        const userId =
            req.user._id;

        const userRole =
            req.user.role;


        const report =
            await downloadReport({
                reportId,
                userId,
                userRole
            });


        // ==========================================
        // RETURN DOWNLOAD URL
        // ==========================================

        res.status(200).json({

            message:
                "Report download link generated successfully",

            report: {
                id: report._id,
                fileName: report.fileName,
                format: report.format,
                downloadUrl: report.cloudinaryUrl
            }

        });

    } catch (error) {

        console.error(
            "Download report error:",
            error.message
        );


        if (
            error.message ===
            "Report not found"
        ) {

            return res.status(404).json({
                message: "Report not found"
            });

        }


        if (
            error.message ===
            "You are not authorized to download this report"
        ) {

            return res.status(403).json({
                message:
                    "You are not authorized to download this report"
            });

        }


        res.status(500).json({
            message: "Server error"
        });

    }

};

// ======================================================
// DELETE REPORT
// ======================================================

const deleteReportController = async (req, res) => {

    try {

        const { reportId } =
            req.params;

        const report =
            await deleteReport({

                reportId,

                userId:
                    req.user._id,

                userRole:
                    req.user.role

            });


        res.status(200).json({

            message:
                "Report deleted successfully",

            report: {

                id:
                    report._id,

                fileName:
                    report.fileName

            }

        });

    } catch (error) {

        console.error(
            "Delete report error:",
            error.message
        );


        // ==========================================
        // REPORT NOT FOUND
        // ==========================================

        if (
            error.message ===
            "Report not found"
        ) {

            return res.status(404).json({

                message:
                    "Report not found"

            });

        }


        // ==========================================
        // UNAUTHORIZED
        // ==========================================

        if (
            error.message.includes(
                "not authorized"
            )
        ) {

            return res.status(403).json({

                message:
                    error.message

            });

        }


        // ==========================================
        // CLOUDINARY ERROR
        // ==========================================

        if (
            error.message ===
            "Failed to delete report from Cloudinary"
        ) {

            return res.status(500).json({

                message:
                    error.message

            });

        }


        // ==========================================
        // SERVER ERROR
        // ==========================================

        res.status(500).json({

            message:
                "Server error"

        });

    }

};

export {
    createReport,
    getReports,
    downloadReportController,
    deleteReportController
};