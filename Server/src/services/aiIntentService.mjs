// ======================================================
// AI INTENT DETECTOR
// ======================================================

const detectAIIntent = (question) => {
    const text = question
        .toLowerCase()
        .trim();

    // ==================================================
    // ANALYTICS
    // ==================================================

    if (
        text.includes("analytics") ||
        text.includes("statistics") ||
        text.includes("statistic") ||
        text.includes("total attendees") ||
        text.includes("total registrations") ||
        text.includes("total exhibitors") ||
        text.includes("how many attendees") ||
        text.includes("how many exhibitors") ||
        text.includes("booth occupancy") ||
        text.includes("occupancy") ||
        text.includes("average rating") ||
        text.includes("average ratings") ||
        text.includes("performance") ||
        text.includes("overview") ||
        text.includes("event performance") ||
        text.includes("registration statistics") ||
        text.includes("attendance statistics")
    ) {
        return "analytics";
    }

 // ==================================================
// FEEDBACK
// ==================================================

if (
    text.includes("feedback") ||
    text.includes("rating") ||
    text.includes("ratings") ||
    text.includes("review") ||
    text.includes("reviews") ||
    text.includes("feedback message") ||
    text.includes("feedback reason") ||
    text.includes("rating reason") ||
    text.includes("why did i rate") ||
    text.includes("why i rated") ||
    text.includes("low rating") ||
    text.includes("poor rating") ||

    // Website feedback
    text.includes("website feedback") ||
    text.includes("website rating") ||
    text.includes("website review") ||
    text.includes("website") && text.includes("feedback") ||
    text.includes("website") && text.includes("rating") ||
    text.includes("website") && text.includes("review") ||
    text.includes("what did i say about the website") ||
    text.includes("what did i write about the website") ||
    text.includes("what did i say about the site") ||
    text.includes("what did i write about the site") ||
    text.includes("did i leave feedback for the website") ||
    text.includes("did i leave feedback for the site") ||
    text.includes("my website feedback") ||
    text.includes("my website rating") ||
    text.includes("my website review") ||
    text.includes("website comments") ||
    text.includes("site comments") ||

    // Event feedback
    text.includes("event feedback") ||
    text.includes("event rating") ||
    text.includes("event review") ||

    // Session feedback
    text.includes("session feedback") ||
    text.includes("session rating") ||
    text.includes("session review") ||

    // Booth feedback
    text.includes("booth feedback") ||
    text.includes("booth rating") ||
    text.includes("booth review")
) {
    return "feedback";
}

    // ==================================================
    // BOOTH VISITS
    // ==================================================

    if (
        text.includes("booth visit") ||
        text.includes("booth visits") ||
        text.includes("booths i visited") ||
        text.includes("booth i visited") ||
        text.includes("visited booth") ||
        text.includes("visited booths") ||
        (
            (
                text.includes("booth") ||
                text.includes("booths")
            ) &&
            (
                text.includes("visit") ||
                text.includes("visited")
            )
        )
    ) {
        return "booth_visits";
    }

   // ==================================================
// FAVORITES
// ==================================================

if (
    text.includes("favorite") ||
    text.includes("favourite") ||
    text.includes("favorites") ||
    text.includes("favourites") ||
    text.includes("saved event") ||
    text.includes("saved events") ||
    text.includes("my saved events") ||
    text.includes("which events did i save") ||
    text.includes("what events did i save") ||
    text.includes("events i saved") ||
    text.includes("event i saved") ||
    text.includes("events that i saved") ||
    text.includes("events i've saved") ||
    text.includes("events i have saved") ||
    text.includes("what did i save") ||
    text.includes("what have i saved") ||
    text.includes("show my saved") ||
    text.includes("show saved events")
) {
    return "favorites";
}

    // ==================================================
    // SESSION
    // ==================================================

    if (
        text.includes("session") ||
        text.includes("sessions") ||
        text.includes("speaker") ||
        text.includes("speakers") ||
        text.includes("schedule") ||
        text.includes("session schedule") ||
        text.includes("session time") ||
        text.includes("session times") ||
        text.includes("session timing") ||
        text.includes("session timings") ||
        text.includes("when is the session") ||
        text.includes("what time is the session")
    ) {
        return "sessions";
    }

    // ==================================================
    // REGISTRATION
    // ==================================================

    if (
        text.includes("registered") ||
        text.includes("registration") ||
        text.includes("registrations") ||
        text.includes("ticket") ||
        text.includes("tickets") ||
        text.includes("check in") ||
        text.includes("check-in") ||
        text.includes("checked in") ||
        text.includes("attended") ||
        text.includes("attendance") ||
        text.includes("my registrations") ||
        text.includes("what did i register")
    ) {
        return "registrations";
    }

    // ==================================================
    // BOOTH
    // ==================================================

    if (
        text.includes("booth") ||
        text.includes("booths")
    ) {
        return "booths";
    }

    // ==================================================
    // EXHIBITOR
    // ==================================================

    if (
        text.includes("exhibitor") ||
        text.includes("exhibitors") ||
        text.includes("company") ||
        text.includes("companies") ||
        text.includes("business") ||
        text.includes("businesses")
    ) {
        return "exhibitor";
    }

    // ==================================================
    // EVENT
    // ==================================================

    if (
        text.includes("event") ||
        text.includes("events") ||
        text.includes("summit") ||
        text.includes("conference") ||
        text.includes("upcoming event") ||
        text.includes("upcoming events")
    ) {
        return "events";
    }

    // ==================================================
    // GENERAL
    // ==================================================

    return "general";
};

export default detectAIIntent;