const User = require("../models/User");
const Follow = require("../models/Follow");
const Post = require("../models/Post");
const Like = require("../models/Like");
const Comment = require("../models/Comment");
const Block = require("../models/Block")
const bc = require("bcrypt");
const path = require("path");
const fs = require("fs");
const {generateToken} = require("../services/jwt")
const {validateUser, cleanUser} = require("../helpers/UserHelper");
require("mongoose-pagination");

// ENV Variables
require("dotenv").config();
const SALT = parseInt(process.env.SALT);
const ITEMS_PER_PAGE = parseInt(process.env.ITEMS_PER_PAGE);

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
        .then(async user =>{
            if(!user) return res.status(404).json({
                status: "error",
                message: "User not found"
            });
            // TODO: Remove blocks and notifications
            await Promise.all([
                Comment.find({user_id: user._id}).deleteMany().exec(),
                Like.find({user_id: user._id}).deleteMany().exec(),
                Post.find({user_id: user._id}).deleteMany().exec(),
                Follow.find({user_id: user._id}).deleteMany().exec(),
                Follow.find({followed_id: user._id}).deleteMany().exec(),
            ])
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

// Update logged user info.
// Auth required
const update = (req, res) =>{
    const data = req.body;
    const id = req.user.id;
    if(data.password){
        data.password = bc.hashSync(data.password, SALT);
    }
    User.findByIdAndUpdate(id, data, {new: true}).exec()
        .then(user =>{
            if(!user) return res.status(404).json({
                status: "error",
                message: "Internal Server Error"
            });
            return res.status(200).json({
                status: "success",
                user
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

// Get detail user by id. If id was not provided, the returned user will be the logged one.
// Auth required
const detail = (req, res) =>{
    const userId = req.params.id
        ? req.params.id
        : req.user.id;
    User.findById(userId).exec()
        .then(async user => {
            if(!user) return res.status(404).json({
                status: "error",
                message: "User not found"
            });
            /* If the user is distinct from the logged one,
            * we check if its in block list, if none,
            * we increase its views counter*/
            if(req.params.id && req.params.id !== req.user.id){
                // Check if is in block list
                const blocked = await Block.findOne({user_id: userId, blocked_id: req.user.id}).exec();
                if(blocked) return res.status(403).json({
                    status: "error",
                    message: "You have been blocked by this user"
                });
                // Increase view counter
                let views = ++user.views;
                user = await User.findByIdAndUpdate(userId, {views}, {new: true})
                    .exec();
            }
            const followers = await Follow.find({followed_id: userId}).count();
            const following = await Follow.find({user_id: userId}).count();
            return res.status(200).json({
                status: "success",
                user: {
                    data: cleanUser(user),
                    follow_counter: {
                        followers,
                        following
                    }
                }
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

// Get followings of the user id in params. If id was not provided, the returned followings
// belongs to the logged user. Auth required. Paginated.
const following = (req, res) =>{
    const userId = req.params.id
        ? parseInt(req.params.id)
        : req.user.id;
    const page = req.query.page
        ? parseInt(req.query.page)
        : 1;

    Follow.find({user_id: userId})
        .populate("user_id followed_id")
        .sort({created_at: "descending"})
        .paginate(page, ITEMS_PER_PAGE)
        .then(async follows =>{
            const total_items = await Follow.find({user_id: userId}).count().exec();
            if(total_items > 0 ) follows = follows.map(f => cleanUser(f.followed_id))
            return res.status(200).json({
                status: "success",
                following: follows,
                pagination: {
                    page,
                    total_pages: Math.ceil(total_items / ITEMS_PER_PAGE),
                    total_items,
                    items_per_page: ITEMS_PER_PAGE
                }
            })
        })
        .catch(err =>{
            console.log(err);
            return res.status(500).json({
                status: "error",
                message: "Internal Server Error"
            })
        });
}

// Get followers of the user id in params. If id was not provided, the returned followers
// belongs to the logged user. Auth required. Paginated.
const followers = (req, res) =>{
    const userId = req.params.id
        ? parseInt(req.params.id)
        : req.user.id;
    const page = req.query.page
        ? parseInt(req.query.page)
        : 1;

    Follow.find({followed_id: userId})
        .populate("user_id followed_id")
        .sort({created_at: "descending"})
        .paginate(page, ITEMS_PER_PAGE)
        .then(async follows =>{
            const total_items = await Follow.find({followed_id: userId}).count().exec();
            if(total_items > 0 ) follows = follows.map(f => cleanUser(f.user_id))
            return res.status(200).json({
                status: "success",
                followers: follows,
                pagination: {
                    page,
                    total_pages: Math.ceil(total_items / ITEMS_PER_PAGE),
                    total_items,
                    items_per_page: ITEMS_PER_PAGE
                }
            })
        })
        .catch(err =>{
            console.log(err);
            return res.status(500).json({
                status: "error",
                message: "Internal Server Error"
            })
        });
}

const getPosts = async (req, res) =>{
    const userId = req.params.id
        ? req.params.id
        : req.user.id;
    const page = req.query.page
        ? parseInt(req.query.page)
        : 1;

    // Check if is in block list
    const blocked = await Block.findOne({user_id: userId, blocked_id: req.user.id}).exec();
    if(blocked) return res.status(403).json({
        status: "error",
        message: "You have been blocked by this user"
    });

    Post.find({user_id: userId})
        .sort("created_at")
        .paginate(page, ITEMS_PER_PAGE)
        .then(async posts =>{
            const total_items = await Post.find({user_id: userId}).count();
            const total_pages = Math.ceil(total_items / ITEMS_PER_PAGE);
            // Gets the likes and comment counter for each post
            for (const post of posts) {
                const index = posts.indexOf(post);
                let [like_counter, comment_counter] = await Promise.all([
                    Like.find({post_id: post._id}).count(),
                    Comment.find({post_id: post._id}).count()
                ]);
                posts[index] = post.toObject();
                posts[index].likes = like_counter;
                posts[index].comments = comment_counter;
            }
            return res.status(200).json({
                status: "success",
                posts,
                pagination: {
                    page,
                    total_pages,
                    total_items,
                    items_per_page: ITEMS_PER_PAGE
                }
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

function validateExtension(ext){
    return (ext === "jpg" || ext === "png"
        || ext === "gif" || ext === "jpeg");
}

module.exports = {
    register,
    login,
    remove,
    getProfilePic,
    upload,
    update,
    following,
    followers,
    detail,
    getPosts
}