const {model, Schema} = require("mongoose");

const PostSchema = Schema({
    user_id: {
        type: Schema.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true
    },
    attached_file: String,
    created_at: {
        type: Date,
        default: Date.now()
    },
    likes: {
        type: Schema.ObjectId,
        ref: "Like"
    },
    comments: {
        type: Schema.ObjectId,
        ref: "Comment"
    }
})

module.exports = model("Post", PostSchema, "posts");