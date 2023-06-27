const Rank = require("../models/Rank");
const Follow = require("../models/Follow");
require("dotenv").config();
require("mongoose-pagination");

// ENV Variables
const limit = process.env.LIMIT_RANK

const getRank = (req, res) =>{
    Rank.find()
        .select("-_id -multiplier -reclaimed -__v")
        .populate("user_id", "-password -is_admin -__v -email")
        .sort("-points")
        .limit(limit)
        .then(async rank =>{
            for await (let item of rank){
                let index = rank.indexOf(item);
                item = item.toObject();
                item.followers = await Follow.find({followed_id: item.user_id._id}).count();
                rank[index] = item;
            }
            return res.status(200).json({
                status: "success",
                rank
            });
        })
        .catch(err =>{
            console.log(err);
            return res.status(500).json({
                status: "error",
                message: "Internal server error"
            })
        })
}

module.exports = {
    getRank
}