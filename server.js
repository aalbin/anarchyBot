require('dotenv').load({ path: __dirname + '/.env' });

const schedule = require('node-schedule');
const request = require('request');
const targets = JSON.parse(process.env.anarki_targets);
const http = require('http');

var glob_next_date;

// setup callback showing next scheduled notice
var server = http.createServer(function (req, res) {
    res.writeHead(200);
    res.end(glob_next_date + '');
});
server.listen(1337);

// start scheduling loop
// if debug, send once on startup
job(!process.env.anarki_debug);

function job(skipSend) {
    console.log(skipSend);
    if (!skipSend) {
        targets.forEach(function (target) {
            request.post('https://slack.com/api/chat.postMessage', getSlackForm(target), function (e, r, b) {
                if (!e && b && JSON.parse(b).ok) {
                    console.log(`message successfully sent to [${target.channel},${target.token}] at ${new Date()}`);
                }
                else {
                    console.error(e);
                    if (b && b.error)
                        console.error(b.error);
                }
            });
        }, this);
    }

    var nextDate = getNextDate();
    glob_next_date = nextDate;
    console.log('scheduling next event at ' + nextDate);
    schedule.scheduleJob(nextDate, () => job());
}

function getSlackForm(target, date) {
    return {
        form: {
            token: target.token,
            channel: target.channel,
            username: process.env.anarki_botname,
            text: new Date().getDay() == 5 ? process.env.anarki_fridaymessage : process.env.anarki_message,
            link_names: true
        }
    };
}

function getNextDate() {
    var diff = Math.floor(Math.random() * 28800000) // add between 0 seconds and 8 hours
    var nextDate = new Date(tomorrow().getTime() + diff);
    return nextDate;
}

function tomorrow() {
    var d = new Date();
    d.setDate(d.getDate() + (d.getDay() == 5 ? 3 : 1));   // skip weekends
    d.setHours(9, 0, 0, 0);
    return d;
}