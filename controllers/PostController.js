const Post = require("../models/Post");
const Like =  require("../models/Like");
const Comment =  require("../models/Comment");
const Block = require("../models/Block");
const Rank = require("../models/Rank");
require("mongoose-pagination");
require("dotenv").config();
const fs = require("fs");
const User = require("../models/User");
const path = require("path");

const sharp = require("sharp");
const {Storage} = require("@google-cloud/storage");


//Initialize Storage
const storage = new Storage({keyFile: '../database/key-cloud.json'});

// ENV Variables
const ITEMS_PER_PAGE = process.env.ITEMS_PER_PAGE;

const upload = async (req, res) =>{
    const userId = req.user.id;
    const data = req.body;
    let attached_file = req.file
        ? `${req.user.id}-${Date.now()}-${req.file.originalname}`
        : null;
    if((!data.content && !attached_file) || data.content.length > 500)
        return res.status(400).json({
            status: "error",
            message: "No content was provided or content too long. Maximum 500 characters"
        });
    if(attached_file){
        const ext = req.file.originalname.split(".").pop();
        if(!validateExtension(ext))
            return res.status(400).json({
                status: "error",
                message: `Extension ${ext} not allowed`
            });

        // Optimizing the img
        const {buffer} = req.file;
        const fileToUpload = await sharp(buffer)
            .resize(1280, null, {kernel: "nearest"})
            .webp({quality:20})
            .toBuffer();

        // Upload to GCLOUD Storage
        await storage.bucket('feep').file(attached_file).save(fileToUpload);
        attached_file = `${process.env.GCLOUD_STORAGE_BASEPATH}/${attached_file}`;
        console.log(attached_file);
    }
    const post = new Post({user_id: userId, content: data.content, attached_file, created_at: Date.now()});
    post.save().then(async post =>{
        let json = {
            status: "success",
            post
        }
        // Check if first post to give rank bonus points
        const firstPost = await Rank.updateOne({user_id: userId}, {reclaimed: true}).exec();
        if(firstPost.modifiedCount > 0){
            const rank = await Rank.findOne({user_id: userId});
            const reward = Math.round((process.env.POINTS * rank.multiplier));
            const update = await Rank.findOneAndUpdate({user_id: userId}, {
                points: (rank.points + reward), // Updating the points
                multiplier: parseFloat(rank.multiplier) + (Math.random()*0.3+0.1) // Increasing the multiplier
            }, {new: true});
            json.reward = reward;
            json.actual_points = update.points;
        }
        return res.status(200).json({json})
    })
    .catch(err =>{
        console.log(err);
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error"
        })
    })
}

const remove = async (req, res) =>{
    const id = req.params.id;
    // Check if the logged user is the publisher of the post to delete
    const publisher = await Post.findOne({_id: id, user_id: req.user.id}).exec();
    if(!publisher) return res.status(400).json({
        status: "error",
        message: "Post not found / You're not the author of the post"
    })
    Post.findByIdAndDelete(id).exec()
        .then(post =>{
            if(post.attached_file != null){
                const img = post.attached_file.substring(36);
                storage.bucket('feep').file(img).delete()
                    .then(() => console.log(`Droped ${img} from gcloud storage`))
            }
            return res.status(200).json({
                status: "success",
                post_deleted: post
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

const detail = (req, res) => {
    const id = req.params.id;
    const page = req.query.page
        ? parseInt(req.query.page)
        : 1;
    Post.findById(id)
        .select("-__v")
        .populate("user_id", "-password -is_admin -__v -views -email")
        .exec()
        .then(async post =>{
            if(!post) return res.status(404).json({
                status: "error",
                message: "Post not found"
            });
            const blocked_array = (await Block.find({user_id: req.user.id})
                .select({blocked_id: 1, _id: 0})
                .exec()).map(object => object.blocked_id);
            const [likes, comments, total_items] = await Promise.all([
                Like.find({post_id: post._id}).count(),
                Comment.find({post_id: post._id, user_id: {$nin: blocked_array}})
                    .select("-post_id -__v")
                    .sort("-created_at")
                    .paginate(page, ITEMS_PER_PAGE)
                    .populate("user_id", "username profile_pic")
                    .exec(),
                Comment.find({post_id: post._id, user_id: {$nin: blocked_array}}).count()
            ]);
            for await (let item of comments){
                const index = comments.indexOf(item);
                item = item.toObject();
                item.likes = await Like.find({comment_id: item._id}).count();
                comments[index] = item;
            }
            return res.status(200).json({
                status: "success",
                post,
                likes,
                comments,
                pagination: {
                    page,
                    total_pages: Math.ceil(total_items/ITEMS_PER_PAGE),
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

const getComments = (req, res) => {
    const id = req.params.id;
    const page = parseInt(req.query.page) || 1;

    Comment.find({post_id: id})
        .select("-__v")
        .sort("-created_at")
        .paginate(page, ITEMS_PER_PAGE)
        .populate("user_id", "_id username profile_pic")
        .then(async comments => {

            const total_items = await Comment.find({post_id: id}).count();
            for await (let c of comments){
                const index = comments.indexOf(c);
                c = c.toObject();
                c.likes = await Like.find({comment_id: c._id}).count();
                comments[index] = c;
            }
            return res.status(200).json({
                status: "success",
                comments,
                pagination: {
                    page,
                    total_pages: Math.ceil(total_items/ITEMS_PER_PAGE),
                    total_items,
                    items_per_page: parseInt(ITEMS_PER_PAGE)
                }
            });
        })
        .catch(err =>{
            return res.status(500).json({
                status: "error",
                message: "Internal Server Error"
            });
        })
}

const image = (req, res) => {
    const id = req.params.id;
    Post.findById(id).exec()
        .then(post => {
            if(!post) return res.status(404).json({
                status: "error",
                message: "Post not found"
            });
            const filePath = `./uploads/posts/${post.attached_file}`;
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

function validateExtension(ext){
    ext = ext.toLowerCase();
    return (ext === "jpg" || ext === "png"
        || ext === "gif" || ext === "jpeg" || ext === 'webp');
}

module.exports = {
    upload,
    remove,
    detail,
    image,
    getComments
}