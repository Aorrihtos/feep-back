const {model, Schema} = require("mongoose");

const UserSchema = Schema({
    name: {
        type: String,
        required: true
    },
    surname: String,
    username: {
        type: String,
        required: true,
        length: {min: 3, max: 15}
    },
    password: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    profile_pic: {
        type: String,
        default: "default_profile_pic.webp"
    },
    summary: {
        type: String,
        maxlength: 25
    },
    description: {
        type: String,
        maxlength: 250
    },
    views:{
        type: Number,
        default: 0
    },
    is_admin: {
        type: Boolean,
        default: false
    }
})

module.exports= model("User", UserSchema, "users");