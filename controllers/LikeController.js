const Like = require("../models/Like");

const likePost = (req,res) => {
    const post_id = req.params.postId;
    const data = {
        user_id: req.user.id,
        post_id
    };
    const likeToSave = new Like({...data, created_at: Date.now()});
    // Check if like is already saved
    Like.findOne(data)
        .then(exist => {
            if(exist) return res.status(400).json({
                status: "error",
                message: "Like already stored"
            });

            likeToSave.save()
                .then(like =>{
                    return res.status(200).json({
                        status: "success",
                        like
                    });
                })
                .catch(err =>{
                    console.log(err);
                    return res.status(500).json({
                        status: "error",
                        message: "Internal Server Error"
                    })
                });
        })
        .catch(err => {
            return res.status(500).json({
                status: "error",
                message: "Internal Server Error"
            })
        });
}

const likeComment = (req,res) => {
    const comment_id = req.params.commentId;
    const data = {
        user_id: req.user.id,
        comment_id
    };
    const likeToSave = new Like({...data, created_at: Date.now()});

    // Check if like is already stored
    Like.findOne(data)
        .then(exist => {
            if(exist) return res.status(400).json({
                status: "error",
                message: "Like already stored"
            });

            likeToSave.save().then(like =>{
                return res.status(200).json({
                    status: "success",
                    like
                });
            })
            .catch(err =>{
                console.log(err);
                return res.status(500).json({
                    status: "error",
                    message: "Internal Server Error"
                })
            });
        })
        .catch(err => {
            return res.status(500).json({
                status: "error",
                message: "Internal Server Error"
            })
        });
}

const unlikePost = (req, res) =>{
    const post_id = req.params.postId;
    const data = {
        user_id: req.user.id,
        post_id
    };
    Like.findOne(data).exec()
        .then(async like => {
            if(!like || like.user_id != req.user.id){
                return res.status(404).json({
                    status: "error",
                    message: "Like not found"
                });
            }
            await like.deleteOne();
            return res.status(200).json({
                status: "success",
                like_deleted: like
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

const unlikeComment = (req, res) =>{
    const comment_id = req.params.commentId;
    const data = {
        user_id: req.user.id,
        comment_id
    };
    Like.findOne(data).exec()
        .then(async like => {
            if(!like || like.user_id != req.user.id){
                return res.status(404).json({
                    status: "error",
                    message: "Like not found"
                });
            }
            await like.deleteOne();
            return res.status(200).json({
                status: "success",
                like_deleted: like
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

module.exports = {
    likePost,
    likeComment,
    unlikePost,
    unlikeComment
}