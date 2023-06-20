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
    email: {
        type: String,
        required: true
    },
    profile_pic: {
        type: String,
        default: "default_profile_pic.jpg"
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