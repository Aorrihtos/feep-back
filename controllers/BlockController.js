const Block = require("../models/Block");

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
        .then(block => {
            return res.status(200).json({
                status: "success",
                block
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
    const id = req.params.id;
    Block.findById(id).exec()
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