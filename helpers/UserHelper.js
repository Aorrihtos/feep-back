const validator = require("validator");

const validateUser = (user) =>{
    let username = user.username
        ? !validator.isEmpty(user.username)
                && validator.isLength(user.username, {min: 3, max: 15})
                && validator.isAlphanumeric(user.username, "es-ES")
        : false;
    if(!username) throw new Error("Invalid username");

    let password = user.password
        ? !validator.isEmpty(user.password)
        : false;
    if(!password) throw new Error("Password cannot be empty");

    let email = user.email
        ? !validator.isEmpty(user.email)
            && validator.isEmail(user.email)
        : false;
    if(!email) throw new Error("Invalid email");
}

module.exports = {
    validateUser
}