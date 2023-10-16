const {Schema, model} = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2")

const CommentSchema = Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    post_id: {
        type: Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },
    content: {
        type: String,
        required: true,
        maxLength: 250
    },
    created_at: {
        type: Date,
        default: Date.now()
    }
});

module.exports = model("Comment", CommentSchema, "comments");