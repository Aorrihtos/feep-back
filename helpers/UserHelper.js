const validator = require("validator");

const validateUser = (user) =>{

    let name = user.name
        ? !validator.isEmpty(user.name)
            && validator.isLength(user.name, {min: 3, max: 15})
            && validator.isAlpha(user.name, "es-ES")
        : false;
    if(!name) throw new Error("Invalid name");

    let surname = user.surname
        ? !validator.isEmpty(user.surname)
            && validator.isLength(user.surname, {min: 3, max: 50})
        : true;
    if(!surname) throw new Error("Invalid surname");

    let username = user.username
        ? !validator.isEmpty(user.username)
                && validator.isLength(user.username, {min: 3, max: 15})
                && validator.isAlphanumeric(user.username, "es-ES")
        : false;
    if(!username) throw new Error("Invalid username");

    let password = user.password
        ? !validator.isEmpty(user.password)
            && validator.isLength(user.password, {min: 3})
        : false;
    if(!password) throw new Error("Password cannot be empty");

    let email = user.email
        ? !validator.isEmpty(user.email)
            && validator.isEmail(user.email)
        : false;
    if(!email) throw new Error("Invalid email");
}

const cleanUser = (user) => {
    user = user.toObject();
    delete user.password;
    delete user.__v;
    return user;
}

module.exports = {
    validateUser,
    cleanUser
}