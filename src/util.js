/*

util.js — this file is part of DATA×DATA, a minimal web analytics system.
Copyright 2013 Kuno Woudt <kuno@frob.nl>

DATA×DATA is licensed under copyleft-next version 0.3.0, see
LICENSE.txt for more information.

*/

function start_of_month (d) {
    d = d ? new Date (d.getTime ()) : new Date ();

    d.setUTCDate (1);
    d.setUTCHours (0);
    d.setUTCMinutes (0);
    d.setUTCSeconds (0);
    d.setUTCMilliseconds (0);

    return d;
};

function interval_month (d) {
    var interval = {};
    var some_date = start_of_month (d);
    interval['start'] = some_date.toISOString ();
    some_date.setUTCMonth (some_date.getUTCMonth () + 1);
    interval['end'] = some_date.toISOString ();

    return interval;
};

function last_month () {
    var m = start_of_month ();
    m.setUTCMonth (m.getUTCMonth () - 1);

    return m;
};

var months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function render_month (d) {
    return months[d.getMonth ()] + " " + d.getFullYear ().toString ();
};

module.exports.start_of_month = start_of_month;
module.exports.interval_month = interval_month;
module.exports.last_month = last_month;
module.exports.render_month = render_month;