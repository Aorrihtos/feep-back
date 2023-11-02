const Newsletter = require("../models/Newsletter");
const User = require("../models/User");
const addSubscription = (req, res) =>{
    const userId = req.user.id;
    const subscription = req.body.subscription;
    if(!subscription) return res.status(400).json({
        status: "error",
        message: "No subscription was provided"
    });

    const subsWithUserId = {userId, ...subscription};
    console.log(subsWithUserId);

    const subToSave = new Newsletter(subsWithUserId);
    subToSave.save()
        .then(newsletter => {
            return res.status(200).json({
                status: "success",
                newsletter
            });
        })
        .catch(err => {
          return res.status(500).json({
              status: "error",
              message: "Internal Server Error"
          })  ;
        })
}

module.exports = {
    addSubscription
}