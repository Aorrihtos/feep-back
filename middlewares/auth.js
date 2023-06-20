const jwtSimple = require("jwt-simple");
const moment = require("moment");
require("dotenv").config();

const auth = (req,res,next) =>{
    if(!req.headers.authorization) return res.status(403).json({
        status: "error",
        message: "No authorization token was provided"
    });
    const token = req.headers.authorization.replace(/['"]+/g, "");
    try{
        const payload = jwtSimple.decode(token, process.env.TOKEN_SECRET);
        if(payload.exp <= moment().unix()) return res.status(400).json({
            status: "error",
            message: "Token expired"
        });
        req.user = payload;
        next();
    } catch(err){
        console.log(err);
        return res.status(400).json({
            status: "error",
            message: "Invalid token"
        })
    }
}

module.exports = auth;