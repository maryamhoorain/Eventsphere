import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});


// ======================================================
// SEND EMAIL
// ======================================================

const sendEmail = async ({
    to,
    subject,
    text,
    html
}) => {

    await transporter.sendMail({

        from:
            `"EventSphere" <${process.env.EMAIL_USER}>`,

        to,

        subject,

        text,

        html

    });

};


export default sendEmail;