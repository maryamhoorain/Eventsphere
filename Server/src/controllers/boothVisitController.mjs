import BoothVisit from "../models/BoothVisit.mjs";
import Booth from "../models/Booth.mjs";
import Registration from "../models/Registration.mjs";
import ExhibitorParticipation from "../models/ExhibitorParticipation.mjs";


// ==========================================
// RECORD BOOTH VISIT
// EXHIBITOR
// ==========================================

const recordBoothVisit = async (req, res) => {
    try {

        const { boothId } = req.params;
        const { ticketCode } = req.body;

        // ==========================================
        // VALIDATE TICKET CODE
        // ==========================================

        if (!ticketCode) {
            return res.status(400).json({
                message: "Ticket code is required"
            });
        }


        // ==========================================
        // FIND BOOTH
        // ==========================================

        const booth = await Booth.findById(boothId);

        if (!booth) {
            return res.status(404).json({
                message: "Booth not found"
            });
        }


        // ==========================================
        // BOOTH MUST BE ASSIGNED
        // ==========================================

        if (!booth.exhibitor) {
            return res.status(400).json({
                message: "This booth is not assigned to an exhibitor"
            });
        }


        // ==========================================
        // VERIFY LOGGED-IN EXHIBITOR
        // OWNS THIS BOOTH
        // ==========================================

        if (
            booth.exhibitor.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                message:
                    "You are not authorized to record visits for this booth"
            });
        }


        // ==========================================
        // FIND ATTENDEE REGISTRATION
        // ==========================================

        const registration =
            await Registration.findOne({
                ticketCode
            }).populate(
                "attendee",
                "name email phone"
            );


        if (!registration) {
            return res.status(404).json({
                message: "Invalid ticket code"
            });
        }


        // ==========================================
        // VERIFY REGISTRATION EVENT
        // ==========================================

        if (
            registration.event.toString() !==
            booth.event.toString()
        ) {
            return res.status(400).json({
                message:
                    "This ticket is not registered for this event"
            });
        }


        // ==========================================
        // CHECK REGISTRATION STATUS
        // ==========================================

        if (registration.status === "cancelled") {
            return res.status(400).json({
                message:
                    "Cancelled registration cannot visit booths"
            });
        }


        // ==========================================
        // CHECK DUPLICATE VISIT
        // ==========================================

        const existingVisit =
            await BoothVisit.findOne({
                booth: booth._id,
                event: booth.event,
                attendee: registration.attendee._id
            });


        if (existingVisit) {
            return res.status(400).json({
                message:
                    "This attendee has already visited this booth",
                visit: existingVisit
            });
        }


        // ==========================================
        // CREATE BOOTH VISIT
        // ==========================================

        const boothVisit =
            await BoothVisit.create({
                booth: booth._id,
                event: booth.event,
                attendee: registration.attendee._id
            });


        // ==========================================
        // POPULATE RESPONSE
        // ==========================================

        const populatedVisit =
            await BoothVisit.findById(
                boothVisit._id
            )
                .populate(
                    "attendee",
                    "name email phone"
                )
                .populate(
                    "booth",
                    "boothNumber size location price status"
                )
                .populate(
                    "event",
                    "title category startDate endDate"
                );


        res.status(201).json({

            message:
                "Booth visit recorded successfully",

            visit:
                populatedVisit
        });

    } catch (error) {

        console.error(
            "Record booth visit error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// GET MY BOOTH VISITS
// ATTENDEE
// ==========================================

const getMyBoothVisits = async (req, res) => {
    try {

        const visits =
            await BoothVisit.find({
                attendee: req.user._id
            })
                .populate(
                    "booth",
                    "boothNumber size location price status"
                )
                .populate(
                    "event",
                    "title category location startDate endDate bannerImage"
                )
                .sort({
                    visitedAt: -1
                });


        res.status(200).json({

            count:
                visits.length,

            visits
        });

    } catch (error) {

        console.error(
            "Get my booth visits error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// GET BOOTH VISIT BY ID
// ATTENDEE
// ==========================================

const getBoothVisitById = async (req, res) => {
    try {

        const { id } = req.params;


        const visit =
            await BoothVisit.findOne({
                _id: id,
                attendee: req.user._id
            })
                .populate(
                    "booth",
                    "boothNumber size location price status"
                )
                .populate(
                    "event",
                    "title category location startDate endDate bannerImage"
                );


        if (!visit) {
            return res.status(404).json({
                message: "Booth visit not found"
            });
        }


        res.status(200).json({
            visit
        });

    } catch (error) {

        console.error(
            "Get booth visit error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


export {
    recordBoothVisit,
    getMyBoothVisits,
    getBoothVisitById
};