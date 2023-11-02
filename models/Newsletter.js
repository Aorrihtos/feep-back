const {Schema, model} = require("mongoose");

const Newsletter = Schema({
    userId: Schema.Types.ObjectId,
    endpoint: String,
    expirationTime: Number,
    keys: {
        p256dh: String,
        auth: String,
    }
})

module.exports = model("Newsletter", Newsletter, "newsletters")