const Notification = require('../models/Notification')
const readNotifications = (req,res) =>{
    const userId = req.user.id;
    Notification.find({destinyUser: userId, is_read: false})
        .updateMany({is_read: true})
        .then(notif => {
            return res.status(204).json({})
        })
        .catch(err => {
            return res.status(500).json({
                status: "error",
                message: "Internal Server Error"
            })
        })
}

module.exports = {
    readNotifications
}