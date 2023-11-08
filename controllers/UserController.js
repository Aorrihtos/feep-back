const User = require("../models/User");
const Follow = require("../models/Follow");
const Post = require("../models/Post");
const Like = require("../models/Like");
const Comment = require("../models/Comment");
const Block = require("../models/Block");
const Rank = require("../models/Rank");
const Notification = require("../models/Notification");
const bc = require("bcrypt");
const sharp = require("sharp");
const {Storage} = require("@google-cloud/storage");
const {generateToken} = require("../services/jwt")
const {validateUser, cleanUser} = require("../helpers/UserHelper");
const {sendEmail} = require("../services/smpt");
const { getConfirmationTemplate, addDays } = require("../services/confirmationService");
require("mongoose-pagination");

// ENV Variables
require("dotenv").config();
const SALT = parseInt(process.env.SALT);
const ITEMS_PER_PAGE = parseInt(process.env.ITEMS_PER_PAGE);
const GCLOUD_STORAGE_BASEPATH = process.env.GCLOUD_STORAGE_BASEPATH;

//Initialize storage
const storage = new Storage({keyFile: '../database/key-cloud.json'});

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

    let confirmationToken = Math.random().toString(36).slice(2, 7);
    data.password = bc.hashSync(data.password, SALT);
    data.confirmationToken = confirmationToken;
    data.expirationDate = addDays(30);

    const newUser = new User(data);

    // Generar url de confirmación -> Enviar mail con url de confirmación
    try {
        let emailData = getConfirmationTemplate(confirmationToken, data.email, "sergioferrerept@gmail.com", data.username);
        sendEmail(emailData);
    } catch (e) {
        console.error(e); return;
    }

    newUser.save()
        .then(async user =>{
            // We also create his register in rank collection
            const rank = new Rank({user_id: user._id});
            await rank.save();
            const token = generateToken(user);
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

//Confirmation method
const confirm = (req, res) => {
    //has to read the req url, check the code, match code with saved token for the user, if it matches it removes the deletion from the account
    const data = req.body;
    const token = req.params.token;

    if (!data.username || !token) return res.status(400).json({
        status: "error",
        message: "Something went wrong"
    });
    console.log(data.username);
    console.log(token);
    User.findOneAndUpdate(
        {username: data.username, confirmationToken: token},
        {expirationDate: null, confirmationToken: null},
        {new: true}
    ).then(userUpdated =>{
            if(!userUpdated) return res.status(404).json({
               status: "error",
               message: "Invalid confirmation token"
            });
            return res.status(200).json({
                status: "success",
                userUpdated,
                token: generateToken(userUpdated)
            });
    })
    .catch(err => {
        console.log(err);
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error, please, try again later"
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
            {username: data.username, expirationDate: null, confirmationToken: null},
            {email: data.username, expirationDate: null, confirmationToken: null}
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
        .then(async user => {
            if(!user) return res.status(404).json({
                status: "error",
                message: "User not found"
            });
            return res.status(200).json(user.profile_pic);
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
    //TODO: PORFAVOR SERGIO ARREGLA QUE NO SE CAMBIE EL NOMBRE EN LA BASE DE DATOS SI SE PRODUCE UN ERROR

    const id = req.user.id;
    const extension = req.file.originalname.split(".").pop();
    if(!validateExtension(extension)){
        /* Retrieve non-valid extension message and print error to continue with the server execution
        *  We must check if the file was deleted */
        return res.status(400).json({
            status: "error",
            message: `Extension ${extension} not allowed.`
        });
    }

    //Naming the new image
    const ref = `${req.user.username}-${req.file.originalname}.webp`;
    const urlToImage = `${GCLOUD_STORAGE_BASEPATH}/${ref}`;
    User.findByIdAndUpdate(id, {profile_pic: urlToImage}).exec()
        .then(async user =>{
            if(!user) return res.status(404).json({
                status: "error",
                message: "User not found"
            });
            // If profile pic is distinct, we're deleting the old one
            if(user.profile_pic !== urlToImage && user.profile_pic !== process.env.DEFAULT_PROFILE_PIC){
                const oldPicName = user.profile_pic.substring(36);
                console.log(oldPicName)
                storage.bucket('feep').file(oldPicName).delete()
                    .then(() => console.log(`Droped ${user.profile_pic} from cloud storage`));
            }

            // Optimizing the img
            const {buffer} = req.file;
            const fileToUpload = await sharp(buffer)
                .resize(800, null, {kernel: "nearest"})
                .webp({quality:20})
                .toBuffer();

            // Upload to GCLOUD Storage
            await storage.bucket('feep').file(ref).save(fileToUpload);

            return res.status(200).json({
                status: "success",
                user: cleanUser(user),
                profile_pic: `${GCLOUD_STORAGE_BASEPATH}/${ref}`
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
    const blocked = await Block.find({$or: [
        {user_id: userId, blocked_id: req.user.id},
        {user_id: req.user.id, blocked_id:userId}]}).exec();

    if(blocked.length > 0){
        const message = blocked.findIndex(b => b.blocked_id == req.user.id) >= 0
            ? "You have been blocked by this user"
            : "You have blocked this user";

        return res.status(403).json({
            status: "error",
            message
        });
    }

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
    const search = req.query.user.toLowerCase();
    const page = req.query.page
        ? parseInt(req.query.page)
        : 1;
    User.find({$or:[
            {username: {$regex: '.*' + search + '.*', $options: 'i'}},
            {name: {$regex: '.*' + search + '.*', $options: 'i'}},
            {surname: {$regex: '.*' + search + '.*', $options: 'i'}}
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
    if(data.summary > 20 || data.description > 250)
        return res.status(400).json({
            status: "error",
            message: "Summary or description are overpassing the maximum characters"
        });
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

const getNotifications = (req, res)=>{
    const id = req.user.id;
    let page = parseInt(req.query.page) || 1;
    Notification.find({$and: [{destinyUser: id},{loggedId: {$ne: id}}]})
        .select("loggedUsername userProfilePic event title text link created_at")
        .sort("-created_at")
        .paginate(page, ITEMS_PER_PAGE)
        .then(async notifications =>{
            const total_items = await Notification.find({destinyUser: id, loggedId: {$ne: id}}).count();
            return res.status(200).json({
                status: "success",
                notifications,
                pagination: {
                    page,
                    total_pages: Math.ceil(total_items / ITEMS_PER_PAGE),
                    total_items,
                    items_per_page: ITEMS_PER_PAGE
                }
            });
        })
        .catch(err => {
            console.log(err);
            return res.status(500).json({
                status: "error",
                message: "Internal Server Error"
            });
        }
    );
}

function validateExtension(ext){
    ext = ext.toLowerCase();
    return (ext === "jpg" || ext === "png"
        || ext === "gif" || ext === "jpeg" || ext === 'webp');
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
    comments_liked,
    getNotifications,
    confirm
}