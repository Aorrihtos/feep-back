const Post = require("../models/Post");
const Like =  require("../models/Like");
const Comment =  require("../models/Comment");
const Block = require("../models/Block");
require("mongoose-pagination");
require("dotenv").config();
const fs = require("fs");

// ENV Variables
const ITEMS_PER_PAGE = process.env.ITEMS_PER_PAGE;

const upload = (req, res) =>{
    const userId = req.user.id;
    const data = req.body;
    if(!data.content) return res.status(400).json({
        status: "error",
        message: "No content was provided"
    });
    const attached_file = req.file
        ? req.file.filename
        : null;
    const post = new Post({user_id: userId, content: data.content, attached_file});
    post.save().then(post =>{
        return res.status(200).json({
            status: "success",
            post
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

const remove = async (req, res) =>{
    const id = req.params.id;
    // Check if the logged user is the publisher of the post to delete
    const publisher = await Post.findOne({_id: id, user_id: req.user.id}).exec();
    if(!publisher) return res.status(400).json({
        status: "error",
        message: "Post not found"
    })
    Post.findByIdAndDelete(id).exec()
        .then(post =>{
            if(post.attached_file != null){
                const path = "./uploads/posts/" + post.attached_file;
                try {
                    fs.unlinkSync(path);
                }catch (err){
                    console.log(err);
                }
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
        .populate("user_id", "-password -is_admin -__v -views")
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
            return res.status(200).json({
                status: "success",
                post,
                likes,
                comments,
                pagination: {
                    page,
                    total_pages: Math.ceil(total_items/ITEMS_PER_PAGE),
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

module.exports = {
    upload,
    remove,
    detail
}