const schedule = require('node-schedule');

/*
* Checks once a day if any user didn't make any post
* and resets its multiplier rank points bonus
* */
const setBonus = schedule.scheduleJob('0 0 * * *', function(){
    // TODO
    console.log('The answer to life, the universe, and everything!');
});

/*
* Resets the rank points to 0 for all users monthly
* */
const monthlyClean = schedule.scheduleJob('0 0 1 * *', function(){
    // TODO
    console.log('PRUEBA');
});

