const Notification = require('../models/Notification')

const markOneAsRead = (req,res) =>{
    const id = req.params.id;
    Notification.findByIdAndUpdate({_id: id}, {is_read: true})
        .then(() =>{
            return res.status(204).json({});
        })
        .catch(err =>{
            console.log(err);
            return res.status(500).json({
                status: "error",
                message: "Internal Server Error"
            })
        })
}
const readAllNotifications = (req,res) =>{
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
    readAllNotifications,
    markOneAsRead
}