const {Schema, model} = require("mongoose");

const LikeSchema = Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    post_id: {
        type: Schema.Types.ObjectId,
        ref: "Post"
    },
    comment_id: {
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    created_at: {
        type: Date,
        required: true
    }
});

module.exports = model("Like", LikeSchema, "likes");