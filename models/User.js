const {model, Schema} = require("mongoose");

const UserSchema = Schema({
    username: {
        type: String,
        required: true,
        length: {min: 3, max: 15}
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    followers: {
        type: Schema.ObjectId,
        ref: "User"
    },
    following: {
        type: Schema.ObjectId,
        ref: "User"
    },
    posts: {
        type: Schema.ObjectId,
        ref: "Post"
    },
    reward_points:{
        type: Number,
        default: 0
    },
    blocked_users: {
        type: Schema.ObjectId,
        ref: "User"
    },
    is_admin: {
        type: Boolean,
        default: false
    }
})

module.exports= model("User", UserSchema, "users");