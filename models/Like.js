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
    created_at: {
        type: Date,
        default: Date.now()
    }
});

module.exports = model("Like", LikeSchema, "likes");