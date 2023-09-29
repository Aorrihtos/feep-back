const { emailTemplate } = require("../uploads/misc/EmailTemplate");

const generateConfirmationUrl = (token) => {
    return `${process.env.FRONT_BASEPATH}confirmation/${token}`;
}

const getConfirmationTemplate = (confirmationToken, userEmail, contactEmail) => {
    const url = generateConfirmationUrl(confirmationToken);
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

module.exports = { getConfirmationTemplate }




