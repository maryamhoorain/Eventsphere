import ExcelJS from "exceljs";


// ==========================================
// GENERATE EXCEL REPORT
// ==========================================

const generateExcelReport = async ({
    title,
    event,
    sections = []
}) => {

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "EventSphere";
    workbook.created = new Date();


    const worksheet =
        workbook.addWorksheet("Report");


    // ==========================================
    // TITLE
    // ==========================================

    worksheet.mergeCells("A1:D1");

    const titleCell =
        worksheet.getCell("A1");

    titleCell.value =
        `EventSphere - ${title}`;

    titleCell.font = {
        bold: true,
        size: 18
    };


    // ==========================================
    // EVENT INFORMATION
    // ==========================================

    let currentRow = 3;

    worksheet.getCell(
        `A${currentRow}`
    ).value = "Event";

    worksheet.getCell(
        `B${currentRow}`
    ).value = event?.title || "N/A";

    currentRow++;


    if (event?.category) {

        worksheet.getCell(
            `A${currentRow}`
        ).value = "Category";

        worksheet.getCell(
            `B${currentRow}`
        ).value = event.category;

        currentRow++;

    }


    if (event?.location) {

        worksheet.getCell(
            `A${currentRow}`
        ).value = "Location";

        worksheet.getCell(
            `B${currentRow}`
        ).value = event.location;

        currentRow++;

    }


    currentRow += 2;


    // ==========================================
    // SECTIONS
    // ==========================================

    sections.forEach((section) => {

        worksheet.mergeCells(
            `A${currentRow}:D${currentRow}`
        );

        const sectionCell =
            worksheet.getCell(`A${currentRow}`);

        sectionCell.value =
            section.title;

        sectionCell.font = {
            bold: true,
            size: 14
        };

        currentRow++;


        // ------------------------------------------
        // SIMPLE DATA
        // ------------------------------------------

        if (
            section.data &&
            typeof section.data === "object"
        ) {

            worksheet.getRow(
                currentRow
            ).values = [
                "Metric",
                "Value"
            ];

            worksheet.getRow(
                currentRow
            ).font = {
                bold: true
            };

            currentRow++;


            Object.entries(section.data)
                .forEach(([key, value]) => {

                    worksheet.getRow(
                        currentRow
                    ).values = [
                        formatLabel(key),
                        formatValue(value)
                    ];

                    currentRow++;

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

            worksheet.getRow(
                currentRow
            ).values = keys.map(
                key => formatLabel(key)
            );

            worksheet.getRow(
                currentRow
            ).font = {
                bold: true
            };

            currentRow++;


            section.rows.forEach((row) => {

                worksheet.getRow(
                    currentRow
                ).values =
                    keys.map(
                        key => formatValue(row[key])
                    );

                currentRow++;

            });

        }


        currentRow += 2;

    });


    // ==========================================
    // COLUMN WIDTH
    // ==========================================

    worksheet.columns.forEach((column) => {

        let maxLength = 10;

        column.eachCell(
            {
                includeEmpty: false
            },
            (cell) => {

                const length =
                    String(cell.value || "").length;

                if (length > maxLength) {
                    maxLength = length;
                }

            }
        );

        column.width =
            Math.min(maxLength + 2, 50);

    });


    return await workbook.xlsx.writeBuffer();

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

    return value;

};


export default generateExcelReport;