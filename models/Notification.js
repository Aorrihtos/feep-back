const {Schema, model} = require("mongoose");

const NotificationSchema = Schema({
    loggedId: {
        type: Schema.ObjectId,
        ref: "User",
        required: true
    },
    loggedUsername: String,
    userProfilePic: String,
    event: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    text: String,
    destinyUser: {
        type: Schema.ObjectId,
        ref: "User",
        required: true
    },
    idPost: {
        type: Schema.ObjectId,
        ref: "Post"
    },
    idComment: {
        type: Schema.ObjectId,
        ref: "Comment"
    },
    link: String,
    created_at: Date,
    is_sent: {
        type: Boolean,
        default: false
    }
});

module.exports = model("Notification", NotificationSchema, "notifications");