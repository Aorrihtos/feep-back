const schedule = require('node-schedule');
const User = require("../models/User");
const Post = require("../models/Post");
/*
* Checks once a day if any user didn't make any post
* and resets its multiplier rank points bonus
* */
const setBonus = schedule.scheduleJob('0 0 * * *', async function(){
    // TODO
    let date = new Date(Date.now());
    date.setDate(date.getDate()-1);
    date = date.toISOString().split("T").shift();
    console.log(date);
    const daily_post = await Post.find({user_id: users_ids})
});

/*
* Resets the rank points to 0 for all users monthly
* */
const monthlyClean = schedule.scheduleJob('0 0 1 * *', function(){
    // TODO
    console.log('PRUEBA');
});

