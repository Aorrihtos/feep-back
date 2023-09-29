module.exports.emailTemplate = (url, contactEmail) => `<!DOCTYPE html>
    <html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
        <head>
            <title></title>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        </head>
        <body>
            <p>Thank you for creating your Feep account!</p>
            <p>Please click the following link to confirm your account or it will be deleted autimatically within 30 days.</p>
            <p>If you didn't create this account, please contact us at ${contactEmail}.</p>
            <a href="${url}"> <img src="cid:feepMailImage" alt="${url}" width="500" height="250"/> </a>
        </body>
    </html>
`