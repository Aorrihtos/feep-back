const {Schema, model} = require("express");

const LikeSchema = Schema({
    user_id: {
        type: Schema.ObjectId,
        ref: "User"
    },
    post_id: {
        type: Schema.ObjectId,
        ref: "Post"
    },
    created_at: {
        type: Date,
        default: Date.now()
    }
});

module.exports = model("Like", LikeSchema, "likes");