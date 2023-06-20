const jwtSimple = require("jwt-simple");
const moment = require("moment");
require("dotenv").config();

exports.generateToken = (user) => {
    const payload = {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin,
        created: moment().unix(),
        exp: moment().add(2, "hours").unix()
    }
    return jwtSimple.encode(payload,process.env.TOKEN_SECRET);
}