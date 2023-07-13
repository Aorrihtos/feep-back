const Block = require("../models/Block");
const Follow = require("../models/Follow");
const Rank = require("../models/Rank");

const add = async (req, res) => {
    // Checks if block already exists
    const exists = await Block.findOne({
        user_id: req.user.id,
        blocked_id: req.params.blockedId
    }).exec();
    if(exists) return res.status(400).json({
        status: "error",
        message: "You already have blocked this user"
    })

    // Builds the new block and persists
    const data = {
        user_id: req.user.id,
        blocked_id: req.params.blockedId
    }
    const block = new Block(data);
    block.save()
        .then(async block => {
            // Deletes the following if it exists
            await Follow.findOne({user_id: data.user_id, followed_id: data.blocked_id}).deleteOne();

            let [blockDetailed, followers, points] = await Promise.all([
                block.populate("blocked_id", "-email -password -__v -is_admin"),
                Follow.find({followed_id: block.blocked_id}).count(),
                Rank.find({user_id: block.blocked_id}).distinct("points")
            ])
            blockDetailed = blockDetailed.toObject();
            blockDetailed.blocked_id.followers = followers;
            blockDetailed.blocked_id.points = points.shift();
            return res.status(200).json({
                status: "success",
                block: blockDetailed
            });
        })
        .catch(err => {
            console.log(err);
            return res.status(500).json({
                status: "error",
                message: "Internal Server Error"
            });
        })
}

const pardon = (req, res) => {
    const blocked_id = req.params.id;
    const user_id = req.user.id;
    Block.findOne({user_id, blocked_id}).exec()
        .then(async block => {
            if(!block || block.user_id != req.user.id) return res.status(404).json({
                status: "error",
                message: "Block not found"
            });
            await block.deleteOne();
            return res.status(200).json({
                status: "success",
                block_deleted: block
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
    add,
    pardon
}