const Post = require("../models/Post");
const fs = require("fs");
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

module.exports = {
    upload,
    remove
}