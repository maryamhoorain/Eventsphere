import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell
} from "docx";


// ==========================================
// GENERATE WORD REPORT
// ==========================================

const generateWordReport = async ({
    title,
    event,
    sections = []
}) => {

    const children = [];


    // ==========================================
    // TITLE
    // ==========================================

    children.push(
        new Paragraph({
            text: "EventSphere",
            heading: HeadingLevel.TITLE
        })
    );


    children.push(
        new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1
        })
    );


    // ==========================================
    // EVENT INFORMATION
    // ==========================================

    if (event?.title) {

        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "Event: ",
                        bold: true
                    }),
                    new TextRun(
                        event.title
                    )
                ]
            })
        );

    }


    if (event?.category) {

        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "Category: ",
                        bold: true
                    }),
                    new TextRun(
                        event.category
                    )
                ]
            })
        );

    }


    if (event?.location) {

        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "Location: ",
                        bold: true
                    }),
                    new TextRun(
                        event.location
                    )
                ]
            })
        );

    }


    // ==========================================
    // SECTIONS
    // ==========================================

    sections.forEach((section) => {

        children.push(
            new Paragraph({
                text: section.title,
                heading: HeadingLevel.HEADING_2
            })
        );


        // ------------------------------------------
        // SIMPLE DATA
        // ------------------------------------------

        if (
            section.data &&
            typeof section.data === "object"
        ) {

            Object.entries(section.data)
                .forEach(([key, value]) => {

                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text:
                                        `${formatLabel(key)}: `,
                                    bold: true
                                }),
                                new TextRun(
                                    formatValue(value)
                                )
                            ]
                        })
                    );

                });

        }


        // ------------------------------------------
        // ROW DATA
        // ------------------------------------------

        if (
            section.rows &&
            Array.isArray(section.rows) &&
            section.rows.length > 0
        ) {

            const keys =
                Object.keys(
                    section.rows[0]
                );


            const tableRows = [];


            // Header
            tableRows.push(
                new TableRow({
                    children:
                        keys.map(key =>
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text:
                                                    formatLabel(key),
                                                bold: true
                                            })
                                        ]
                                    })
                                ]
                            })
                        )
                })
            );


            // Data
            section.rows.forEach((row) => {

                tableRows.push(
                    new TableRow({
                        children:
                            keys.map(key =>
                                new TableCell({
                                    children: [
                                        new Paragraph(
                                            formatValue(
                                                row[key]
                                            )
                                        )
                                    ]
                                })
                            )
                    })
                );

            });


            children.push(
                new Table({
                    rows: tableRows
                })
            );

        }

    });


    // ==========================================
    // GENERATE BUFFER
    // ==========================================

    return await Packer.toBuffer(
        new Document({
            sections: [
                {
                    children
                }
            ]
        })
    );

};


// ==========================================
// FORMAT LABEL
// ==========================================

const formatLabel = (value) => {

    return String(value)
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, char =>
            char.toUpperCase()
        )
        .trim();

};


// ==========================================
// FORMAT VALUE
// ==========================================

const formatValue = (value) => {

    if (value === null || value === undefined) {
        return "N/A";
    }

    if (Array.isArray(value)) {
        return value
            .map(item => formatValue(item))
            .join(", ");
    }

    if (
        typeof value === "object" &&
        !(value instanceof Date)
    ) {
        return JSON.stringify(value);
    }

    return String(value);

};


export default generateWordReport;