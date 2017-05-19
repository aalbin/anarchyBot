require('dotenv').load();

const schedule = require('node-schedule');
const request = require('request');
const targets = JSON.parse(process.env.targets);
const http = require('http');

var glob_next_date;

// setup callback showing next scheduled notice
var server = http.createServer(function (req, res) {
    res.writeHead(200);
    res.end(glob_next_date + '');
});
server.listen(8080);

// start scheduling loop
// if debug, send once on startup
job(!process.env.debug);

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

function getSlackForm(target) {
    return {
        form: {
            token: target.token,
            channel: target.channel,
            username: process.env.botname,
            text: process.env.message,
            link_names: true
        }
    };
}

function getNextDate() {
    var diff = Math.floor(Math.random() * 28800000) + 1000 // add between 1 second and 8:00:01 hours   // 
    var now = new Date();
    var nextDate = new Date(now.getTime() + diff);
    if (nextDate.getHours() >= 18 || nextDate.getDate() > now.getDate())
        nextDate = new Date(tomorrow().getTime() + diff);
    return nextDate;
}

function tomorrow() {
    var d = new Date();
    d.setDate(d.getDate() + 1);
    d.setUTCHours(9, 0, 0, 0);
    return d;
}