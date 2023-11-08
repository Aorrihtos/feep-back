const {model, Schema} = require("mongoose");
require("dotenv").config();

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
    expirationDate: {
      type: String,
      required: false
    },
    confirmationToken: {
      type: String,
      required: false
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
        default: `${process.env.GCLOUD_STORAGE_BASEPATH}/default_profile_pic.webp`
    },
    summary: {
        type: String,
        maxlength: 20
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