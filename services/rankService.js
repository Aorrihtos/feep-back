const schedule = require('node-schedule');
const Post = require("../models/Post");
const Rank = require("../models/Rank");

/*
* Checks once a day if any user didn't make any post
* and resets its multiplier rank points bonus
* */
const setBonus = schedule.scheduleJob('0 0 * * *', async function(){
    let date = new Date(Date.now());
    date.setDate(date.getDate()-1);
    date = new Date(date.toISOString().split("T").shift());
    const daily_post = await Post.find({created_at: {$gte: date}}).distinct("user_id").exec();
    try{
        const resets = await Rank.updateMany({user_id: {$nin: daily_post}},{multiplier: 1.0});
        console.log(`Number of users resetted: ${resets.modifiedCount}`);
        await Rank.updateMany(null, {reclaimed: false});
    } catch(err){
        throw new Error(err);
    }

    // Calculates the bonus points for today
    process.env.POINTS = Math.round(Math.random()*300);
    console.log(`Bonus points for ${new Date(Date.now())}: ${process.env.POINTS}`);
});

/*
* Resets the rank points to 0 for all users monthly
* */
const monthlyClean = schedule.scheduleJob('0 0 1 * *', async function(){
    try {
        await Rank.updateMany(null, {multiplier: 1.0, points: 0});
        console.log("Ranks and points restored to init values")
    } catch(err){
        throw new Error(err);
    }
});

