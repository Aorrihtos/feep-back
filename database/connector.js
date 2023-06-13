const {mongoose} = require("mongoose");
require("dotenv").config();

exports.connection = async () =>{
    try{
        await mongoose.connect(process.env.DB_CONNECTION_STRING);
    } catch(err){
        console.log(err);
        throw new Error("Cannot connect to Database");
    }
}

