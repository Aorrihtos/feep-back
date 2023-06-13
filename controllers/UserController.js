const User = require("../models/User");
const bc = require("bcrypt");
const {generateToken} = require("../services/jwt")
const {validateUser} = require("../helpers/UserHelper");

// ENV Variables
require("dotenv").config();
const SALT = parseInt(process.env.SALT);

const register = async (req, res) =>{
    const data = req.body;
    try{
        validateUser(data);
    }catch(err){
        console.log(err)
        return res.status(400).json({
            status: "error",
            message: err.message
        });
    }
    const isRegistered = await User.findOne({$or: [
                                    {username: data.username},
                                    {email: data.email}]}).exec();
    if(isRegistered) return res.status(400).json({
        status: "error",
        message: "The username or email is already registered"
    });

    data.password = bc.hashSync(data.password, SALT);
    const newUser = new User(data);
    newUser.save()
        .then(user =>{
            return res.status(200).json({
                status: "success",
                user: cleanUser(user)
            })
        })
        .catch(err =>{
            console.log(err);
            return res.status(500).json({
                status: "error",
                user: "Internal Server Error"
            })
        });
}

const login = (req, res) =>{
    const data = req.body;
    if(!data.username || !data.password) return res.status(400).json({
        status: "error",
        message: "No data was provided"
    });
    User.findOne({$or: [
            {username: data.username},
            {email: data.username}
        ]}).exec()
        .then(user =>{
            if(!user) return res.status(404).json({
                status: "error",
                message: "User not found"
            });
            if(!bc.compareSync(data.password, user.password)){
                return res.status(400).json({
                    status: "error",
                    message: "Invalid username or password"
                })
            }
            const token = generateToken(user);
            return res.status(200).json({
                status: "success",
                user: cleanUser(user),
                token
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

function cleanUser(user){
    user = user.toObject();
    delete user.password;
    delete user.__v;
    return user;
}

module.exports = {
    register,
    login
}