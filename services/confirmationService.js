const { emailTemplate } = require("../uploads/misc/EmailTemplate");
const User = require('../models/User');
const schedule = require('node-schedule');

const addDays = (days) => {
    let date = new Date(Date.now());
    date.setDate(date.getDate() + days);
    date = date.toISOString().split("T").shift();
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

const eraseUnactivatedAccounts = schedule.scheduleJob('0 0 * * *', ()=>{
    const date = new Date(Date.now());
    const today = date.toISOString().split("T").shift();
    User.deleteMany({expirationDate: today}).then(deleted =>{
        console.log("Number of deleted accounts: " + deleted.deletedCount);
    });
});



module.exports = { getConfirmationTemplate, addDays }