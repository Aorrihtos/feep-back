const {model, Schema} = require("mongoose");

const PostSchema = Schema({
    user_id: {
        type: Schema.Types.ObjectId,
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
    }
})

module.exports = model("Post", PostSchema, "posts");