const {Schema, model} = require("mongoose");

const BlockSchema = Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    blocked_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now()
    }
});

module.exports = model("Block", BlockSchema, "blocks");