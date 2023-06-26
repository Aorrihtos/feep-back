const Like = require("../models/Like");

const like = (req,res) => {
    const data = {
        user_id: req.user.id,
        post_id: req.params.postId
    }
    const like = new Like(data);
    like.save().then(like =>{
        return res.status(200).json({
            status: "success",
            like
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

const unlike = (req, res) =>{
    const data = {
        user_id: req.user.id,
        post_id: req.params.postId
    }
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
    like,
    unlike
}