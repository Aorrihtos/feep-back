const {Schema, model} = require("mongoose");

const RankSchema = Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    multiplier: {
        type: Schema.Types.Decimal128,
        default: 1.0
    },
    points: {
        type: Number,
        default: 0
    },
    reclaimed: {
        type: Boolean,
        default: false
    }
});

module.exports = model("Rank", RankSchema, "ranks");