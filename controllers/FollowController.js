const Follow = require("../models/Follow");
const {cleanUser} = require("../helpers/UserHelper");

const follow = async (req, res) => {
    const follow = new Follow({
        user_id: req.user.id,
        followed_id: req.params.userId
    });
    // Check if we already follow the user
    const exist = await Follow.findOne({
        user_id: follow.user_id,
        followed_id: follow.followed_id
    });
    if(exist) return res.status(400).json({
        status: "error",
        message: "You already are following the user"
    })
    // Save the new follow
    follow.save()
        .then(async follow =>{
            //const followDetailed = await follow.populate("user_id followed_id");
            //followDetailed.user_id = cleanUser(followDetailed.user_id);
            //followDetailed.followed_id = cleanUser(followDetailed.followed_id);
            return res.status(200).json({
                status: "success",
                follow
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

const unfollow = (req, res) =>{
    const userId = req.user.id;
    const unfollowedId = req.params.userId;
    Follow.findOneAndDelete({user_id: userId, followed_id: unfollowedId}).exec()
        .then(follow =>{
            if(!follow) return res.status(404).json({
                status: "error",
                message: "Follow not found"
            });
            return res.status(200).json({
                status: "success",
                follow_deleted: follow
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
    follow,
    unfollow
}