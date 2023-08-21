const User = require("../models/User");
const Follow = require("../models/Follow");
const Post = require("../models/Post");
const Like = require("../models/Like");
const Comment = require("../models/Comment");
const Block = require("../models/Block");
const Rank = require("../models/Rank");
const bc = require("bcrypt");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const {generateToken} = require("../services/jwt")
const {validateUser, cleanUser} = require("../helpers/UserHelper");
const {sendEmail} = require("../services/smpt");
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
        .then(async user =>{
            // We also create his register in rank collection
            const rank = new Rank({user_id: user._id});
            await rank.save();
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
                return res.status(404).json({
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
            // Removing all the user stuff
            await Promise.all([
                Comment.find({user_id: id}).deleteMany().exec(),
                Like.find({user_id: id}).deleteMany().exec(),
                Post.find({user_id: id}).deleteMany().exec(),
                Follow.find({user_id: id}).deleteMany().exec(),
                Follow.find({followed_id: id}).deleteMany().exec(),
                Block.find({user_id: id}).deleteMany().exec(),
                Block.find({blocked_id: id}).deleteMany().exec(),
                Rank.findOneAndDelete({user_id: id}).exec()
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
        ? req.params.id
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
        }
        /* Retrieve non-valid extension message and print error to continue with the server execution
        *  We must check if the file was deleted */
        return res.status(400).json({
            status: "error",
            message: `Extension ${extension} not allowed.`
        });
    }
    //Naming the new image
    const ref = `${req.user.username}-${req.file.originalname}.webp`;
    User.findByIdAndUpdate(id, {profile_pic: ref}).exec()
        .then(async user =>{
            if(!user) return res.status(404).json({
                status: "error",
                message: "User not found"
            });
            // If profile pic is distinct, we're deleting the old one
            if(user.profile_pic !== ref
                && user.profile_pic !== "default_profile_pic.webp"){
                const oldPic = `./uploads/profiles/${user.profile_pic}`;
                try{
                    fs.unlinkSync(oldPic);
                } catch(err) {
                    console.log(err);npm
                }
            }
            user.profile_pic = req.file.filename;

            // Optimizing the img
            const {buffer} = req.file;
            await sharp(buffer)
                .webp({quality:20})
                .toFile("./uploads/profiles/" + ref);

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
                message: "User not found"
            });
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
                    .select("-email -is_admin")
                    .exec();

            }
            let [followers, following, rank_points] = await Promise.all([
                Follow.find({followed_id: userId}).count(),
                Follow.find({user_id: userId}).count(),
                Rank.findOne({user_id: userId}).distinct("points").exec()
            ]);
            rank_points = rank_points.shift();
            return res.status(200).json({
                status: "success",
                user: {
                    data: cleanUser(user),
                    follow_counter: {
                        followers,
                        following
                    },
                    points: rank_points
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
        .populate("followed_id", "-email -is_admin")
        .sort({created_at: "descending"})
        .paginate(page, ITEMS_PER_PAGE)
        .then(async follows =>{
            const total_items = await Follow.find({user_id: userId}).count().exec();
            if(total_items > 0 ){
                follows = follows.map(f => cleanUser(f.followed_id))
                for await (let item of follows){
                    let index = follows.indexOf(item);
                    [item.points, item.followers] = await Promise.all([
                        Rank.findOne({user_id: item._id}).distinct("points").exec(),
                        Follow.find({followed_id: item._id}).count()
                    ]);
                    item.points = item.points.shift();
                    follows[index] = item;
                }
            }
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
        .populate("user_id", "-email")
        .sort({created_at: "descending"})
        .paginate(page, ITEMS_PER_PAGE)
        .then(async follows =>{
            const total_items = await Follow.find({followed_id: userId}).count().exec();
            if(total_items > 0 ){
                follows = follows.map(f => cleanUser(f.user_id))
                for await (let item of follows){
                    let index = follows.indexOf(item);
                    [item.points, item.followers] = await Promise.all([
                        Rank.findOne({user_id: item._id}).distinct("points").exec(),
                        Follow.find({followed_id: item._id}).count()
                    ]);
                    item.points = item.points.shift();
                    follows[index] = item;
                }
            }
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
        .select("-__v")
        .populate("user_id", "-password -__v -views -is_admin -email")
        .sort("-created_at")
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
                    items_per_page: parseInt(ITEMS_PER_PAGE)
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

const blocked = (req, res) =>{
    const id = req.user.id;
    const page = req.query.page
        ? parseInt(req.query.page)
        : 1;
    Block.find({user_id: id})
        .select("-user_id -__v")
        .populate("blocked_id", "-user_id -__v -password -is_admin -email")
        .sort("-created_at")
        .paginate(page, ITEMS_PER_PAGE)
        .then(async blocks =>{
            for await (let item of blocks){
                let index = blocks.indexOf(item);
                item = item.toObject();
                [item.points, item.followers] = await Promise.all([
                    Rank.findOne({user_id: item.blocked_id._id}).distinct("points"),
                    Follow.find({followed_id: item.blocked_id._id}).count()
                ]);
                item.points = item.points.shift();
                blocks[index] = item;
            }
            const total = await Block.find({user_id: id}).count();
            return res.status(200).json({
                status: "success",
                blocked: blocks,
                pagination: {
                    page,
                    total_pages: Math.ceil(total / ITEMS_PER_PAGE),
                    total_items: total,
                    items_per_page: parseInt(ITEMS_PER_PAGE)
                }
            })
        })
        .catch(err => {
            console.log(err);
            return res.status(500).json({
                status: "error",
                message: "Internal Server Error"
            })
        })
}

const feed = async (req, res) =>{
    const id = req.user.id;
    const page = req.query.page
        ? parseInt(req.query.page)
        : 1;
    const blocked_ids = (await Block.find({user_id: id}).exec()).map(b => b.blocked_id)
    const follow_ids = (await Follow.find({user_id: id, followed_id: {$nin: blocked_ids}}).exec())
        .map(f => f.followed_id);

    Post.find({user_id: follow_ids})
        .select("-__v")
        .populate("user_id", "-password -email -is_admin -__v -views")
        .sort("-created_at")
        .paginate(page, ITEMS_PER_PAGE)
        .then(async feed =>{

            for (const post of feed) {
                const index = feed.indexOf(post);
                let [like_counter, comment_counter] = await Promise.all([
                    Like.find({post_id: post._id}).count(),
                    Comment.find({post_id: post._id}).count()
                ]);
                feed[index] = post.toObject();
                feed[index].likes = like_counter;
                feed[index].comments = comment_counter;
            }

            const total_items = await Post.find({user_id: follow_ids}).count();
            const total_pages = Math.ceil(total_items/ITEMS_PER_PAGE);
            return res.status(200).json({
                status: "success",
                feed,
                pagination: {
                    page,
                    total_pages,
                    total_items,
                    items_per_page: ITEMS_PER_PAGE
                }
            })
        })
        .catch(err => {
            console.log(err);
            return res.status(500).json({
                status: "error",
                message: "Internal Server Error"
            });
        })
}

const searcher = (req, res)=>{
    const search = req.query.user;
    const page = req.query.page
        ? parseInt(req.query.page)
        : 1;
    User.find({$or:[
            {username: {$regex: '.*' + search + '.*'}},
            {name: {$regex: '.*' + search + '.*'}},
            {surname: {$regex: '.*' + search + '.*'}}
        ], $and: [{_id: {$ne: req.user.id}}]})
        .select("-password -email -is_admin -__v")
        .sort("-views created_at")
        .paginate(page, ITEMS_PER_PAGE)
        .then(async users =>{
            for await (let user of users){
                let index = users.indexOf(user);
                user = user.toObject();
                [user.points, user.followers] = await Promise.all([
                    Rank.findOne({user_id: user._id}).distinct("points"),
                    Follow.find({followed_id: user._id}).count()
                ]);
                user.points = user.points.shift();
                users[index] = user;
            }
            const total_items = await User.find({$or:[
                    {username: {$regex: '.*' + search + '.*'}},
                    {name: {$regex: '.*' + search + '.*'}},
                    {surname: {$regex: '.*' + search + '.*'}}
                ], $and: [{_id: {$ne: req.user.id}}]}).count();
            const total_pages = Math.ceil(total_items/ITEMS_PER_PAGE);
            return res.status(200).json({
                status: "success",
                users,
                pagination: {
                    page,
                    total_pages,
                    total_items,
                    items_per_page: ITEMS_PER_PAGE
                }
            });
        })
        .catch(err =>{
            console.log(err);
            return res.status(500).json({
                status: "error",
                message: "Internal Server Error"
            });
        })
}

const contact = (req,res)=>{
    const data = req.body;
    if(!data) return res.status(400).json({
        status: "error",
        message: "No data was provided"
    });
    try{
        sendEmail(data);
        return res.status(200).json({
            status: "success",
            message: "Mail sended!"
        });
    } catch (err){
        return res.status(500).json({
            status: "error",
            message: err.message
        })
    }
}

const description = (req, res) =>{
    const id = req.user.id;
    const data = req.body;
    User.findByIdAndUpdate(id, data, {new: true})
        .then(user => {
            if(!user) return res.status(404).json({
                status: "error",
                message: "User not found"
            });
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

const posts_liked = (req, res)=> {
    const id = req.user.id;
    Like.find({user_id: id}).distinct('post_id')
        .then(likes => {
            return res.status(200).json({
                status: 'success',
                liked_posts: likes
            });
        })
        .catch(err => {
            console.log(err);
            return res.status(500).json({
                status: 'error',
                message: "Internal Server Error"
            })
        })
}

const comments_liked = (req, res)=> {
    const id = req.user.id;
    Like.find({user_id: id}).distinct('comment_id')
        .then(likes => {
            return res.status(200).json({
                status: 'success',
                liked_comments: likes
            });
        })
        .catch(err => {
            console.log(err);
            return res.status(500).json({
                status: 'error',
                message: "Internal Server Error"
            })
        })
}

function validateExtension(ext){
    ext = ext.toLowerCase();
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
    getPosts,
    blocked,
    feed,
    searcher,
    contact,
    description,
    posts_liked,
    comments_liked
}