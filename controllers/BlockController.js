const Block = require("../models/Block");

const add = (req, res) => {
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
            await block.deleteOne().exec();
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