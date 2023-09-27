const generateConfirmationUrl = (front_url, token) => {
    console.log(front_url);
    let url = `${front_url}${env.API_BASEPATH}/confirmation/${token}`;

    return url
}

const confirmationTemplate = (url, contactEmail) => {
    const text = `
        Thank you for creating your Feep account!
    
        Please click the following link to confirm your account or it will be deleted autimatically within 30 days.
        If you didn't create this account, please contact us at ${contactEmail}
    
        Link: ${url}
    `
    return {
        from: '',
        to: '',
        sender: '',
        replyTo: '',
        title: '',
        subject: '',
        text: ''
    }
}

module.exports = { generateConfirmationUrl, confirmationTemplate }




