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
    }
});

module.exports = model("Block", BlockSchema, "blocks");