const User = require("../models/User");
const bc = require("bcrypt");
const path = require("path");
const fs = require("fs");
const {generateToken} = require("../services/jwt")
const {validateUser} = require("../helpers/UserHelper");

// ENV Variables
require("dotenv").config();
const SALT = parseInt(process.env.SALT);

// Register method
const register = async (req, res) =>{
    const data = req.body;
    try{
        validateUser(data);
    }catch(err){
        return res.status(400).json({
            status: "error",
            message: err.message
        });
    }
    const isRegistered = await User.findOne({$or: [
                                    {username: data.username},
                                    {email: data.email}]}).exec();
    if(isRegistered) return res.status(400).json({
        status: "error",
        message: "The username or email is already registered"
    });

    data.password = bc.hashSync(data.password, SALT);
    const newUser = new User(data);
    newUser.save()
        .then(user =>{
            return res.status(200).json({
                status: "success",
                user: cleanUser(user)
            })
        })
        .catch(err =>{
            console.log(err);
            return res.status(500).json({
                status: "error",
                user: "Internal Server Error"
            })
        });
}

// Login method
const login = (req, res) =>{
    const data = req.body;
    if(!data.username || !data.password) return res.status(400).json({
        status: "error",
        message: "No data was provided"
    });
    User.findOne({$or: [
            {username: data.username},
            {email: data.username}
        ]}).exec()
        .then(user =>{
            if(!user) return res.status(404).json({
                status: "error",
                message: "User not found"
            });
            if(!bc.compareSync(data.password, user.password)){
                return res.status(400).json({
                    status: "error",
                    message: "Invalid username or password"
                })
            }
            const token = generateToken(user);
            return res.status(200).json({
                status: "success",
                user: cleanUser(user),
                token
            })
        })
        .catch(err =>{
            console.log(err);
            return res.status(500).json({
                status: "error",
                message: "Internal Server Error"
            })
        })
}

// Delete method. Deletes logged user and all it's interactions.
// Auth required
const remove = (req, res) =>{
    const id = req.user.id;
    User.findByIdAndDelete(id).exec()
        .then(user =>{
            if(!user) return res.status(404).json({
                status: "error",
                message: "User not found"
            });
            // TODO: Remove comments, likes, posts, follows, blocks and notifications
            return res.status(200).json({
                status: "success",
                user_removed: cleanUser(user)
            });
        })
        .catch(err =>{
            console.log(err);
            return res.status(500).json({
                status: "error",
                message: "Internal Server Error"
            })
        })
}

// Retrieves the profile pic of a user.
// If no id is provided in params, it will be retrieved the logged user profile pic
// Auth required.
const getProfilePic = (req, res) =>{
    const id = req.params.id
        ? parseInt(req.params.id)
        : req.user.id;

    User.findById(id).exec()
        .then(user => {
            if(!user) return res.status(404).json({
                status: "error",
                message: "User not found"
            });
            const filePath = `./uploads/profiles/${user.profile_pic}`;
            fs.stat(filePath,(err, exists)=>{
                if(err || !exists) return res.status(404).json({
                    status: "error",
                    message: "File not found"
                });
                return res.status(200).sendFile(path.resolve(filePath));
            });
        })
        .catch(err =>{
            console.log(err);
            return res.status(500).json({
                status: "error",
                message: "Internal Server Error"
            })
        })
}

// Uploads a new profile-pic for the logged user
// Auth required
const upload = (req, res) =>{
    const id = req.user.id;
    const extension = req.file.originalname.split(".").pop();
    if(!validateExtension(extension)){
        try{
            fs.unlinkSync(req.file.path);
        } catch(err){
            console.log(err);
        } finally {
            /* Retrieve non-valid extension message and print error to continue with the server execution
            *  We must check if the file was deleted */
            return res.status(400).json({
                status: "error",
                message: `Extension ${extension} not allowed.`
            });
        }
    }
    User.findByIdAndUpdate(id, {profile_pic: req.file.filename}).exec()
        .then(user =>{
            if(!user) return res.status(404).json({
                status: "error",
                message: "User not found"
            });
            // If profile pic is distinct, we're deleting the old one
            if(user.profile_pic !== req.file.filename){
                const oldPic = `./uploads/profiles/${user.profile_pic}`;
                try{
                    fs.unlinkSync(oldPic);
                } catch(err) {
                    console.log(err);
                }
            }
            user.profile_pic = req.file.filename;
            return res.status(200).json({
                status: "success",
                user: cleanUser(user)
            })
        })
        .catch(err =>{
            console.log(err);
            return res.status(500).json({
                status: "error",
                message: "Internal Server Error"
            })
        })
}

function cleanUser(user){
    user = user.toObject();
    delete user.password;
    delete user.__v;
    return user;
}

function validateExtension(ext){
    return (ext === "jpg" || ext === "png"
        || ext === "gif" || ext === "jpeg");
}

module.exports = {
    register,
    login,
    remove,
    getProfilePic,
    upload
}