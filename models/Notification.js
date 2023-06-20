const {Schema, model} = require("mongoose");

const NotificationSchema = Schema({
    user_id: {
        type: Schema.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now()
    },
    read: {
        type: Boolean,
        default: false
    }
});

module.exports = model("Notification", NotificationSchema, "notifications");