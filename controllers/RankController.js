const Rank = require("../models/Rank");
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
        .then(rank =>{
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