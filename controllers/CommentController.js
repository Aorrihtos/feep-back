const Comment = require("../models/Comment");

const send = (req, res) => {
    const post_id = req.params.postId;
    const data = req.body;
    if(!data.content) return res.status(400).json({
        status: "error",
        message: "No data was provided"
    });

    const comment = new Comment({
        user_id: req.user.id,
        post_id,
        content: req.body.content,
        created_at: Date.now()
    });
    comment.save()
        .then(async comment => {
            const detailed = await comment.populate("user_id", {_id: 1, username: 1, profile_pic: 1})
            return res.status(200).json({
                status: "success",
                comment: detailed
            });
        })
        .catch(err => {
            console.log(err);
            return res.status(500).json({
                status: "error",
                message: "Internal Server Error"
            })
        })
}

const remove = (req, res) =>{
    const id = req.params.id;
    Comment.findById(id).exec()
        .then(async comment => {
            if(!comment || req.user.id != comment.user_id){
                return res.status(404).json({
                    status: "error",
                    message: "Comment not found"
                });
            }
            try{
                await comment.deleteOne();
            } catch(err){
                console.log(err);
                return res.status(500).json({
                    status: "error",
                    message: "Internal Server Error"
                });
            }
            return res.status(200).json({
                status: "success",
                comment_deleted: comment
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

module.exports = {
    send,
    remove
}