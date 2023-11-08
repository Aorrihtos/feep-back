const { emailTemplate } = require("../uploads/misc/EmailTemplate");

const addDays = (days) => {
    let date = new Date(Date.now());
    date.setDate(date.getDate() + days);
    date = new Date(date.toISOString().split("T").shift());
    return date;
}

const generateConfirmationUrl = (token, username) => {
    return `${process.env.FRONT_BASEPATH}confirmation/${token}/${username}`;
}

const getConfirmationTemplate = (confirmationToken, userEmail, contactEmail, username) => {
    const url = generateConfirmationUrl(confirmationToken, username);
    const html = emailTemplate(url, contactEmail);
    const attachments = [{
        filename: 'feepMailImage.png',
        path: 'uploads/misc/feepMailImage.png',
        cid: 'feepMailImage'
    }];

    return {
        email: contactEmail,
        emailTo: userEmail,
        title: 'Feep',
        subject: 'Account confirmation',
        html,
        attachments
    }
}

module.exports = { getConfirmationTemplate, addDays }