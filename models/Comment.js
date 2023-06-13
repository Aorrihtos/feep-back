const {Schema, model} = require("express");

const CommentSchema = Schema({
    user_id: {
        type: Schema.ObjectId,
        ref: "User",
        required: true
    },
    post_id: {
        type: Schema.ObjectId,
        ref: "Post",
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now()
    }
});

module.exports = model("Comment", CommentSchema, "comments");