const {Schema, model} = require("mongoose");

const FollowSchema = Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    followed_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now()
    }
});

module.exports = model("Follow", FollowSchema, "follows");