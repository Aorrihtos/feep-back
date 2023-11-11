const nodemailer = require("nodemailer");
require("dotenv").config();

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    port: 465,               // true for 465, false for other ports
    host: "smtp.gmail.com",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    secure: true,
});

const sendEmail = (data)=>{
    const mailData = {
        from: data.email, // sender address
        to: data.emailTo || 'feepsocial@gmail.com', // list of receivers
        sender: data.email,
        replyTo: data.email,
        title: data.title,
        subject: data.subject,
        text: data.text,
        html: data.html,
        attachments: data.attachments
    };
    transporter.sendMail(mailData, function (err, info) {
        if(err) {
            console.log(err);
            throw new Error("Error sending the mail, please, try again later");
        }
    });
}

module.exports = {sendEmail};