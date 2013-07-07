/*

util.js — this file is part of DATA×DATA, a minimal web analytics system.
Copyright 2013 Kuno Woudt <kuno@frob.nl>

DATA×DATA is licensed under copyleft-next version 0.3.0, see
LICENSE.txt for more information.

*/

var _         = require ('underscore');

_.mixin(require('underscore.string').exports());

function Month(d) {
    if (typeof d === 'undefined')
    {
        this.date = new Date ();
    }
    else if (typeof d === 'string')
    {
        this.date = new Date (d + "-01");
    }
    else
    {
        this.date = new Date (d.getTime ());
    }

    this.date.setUTCDate (1);
    this.date.setUTCHours (0);
    this.date.setUTCMinutes (0);
    this.date.setUTCSeconds (0);
    this.date.setUTCMilliseconds (0);
}

Month.prototype.interval = function () {
    var end = new Date(this.date.getTime ());
    end.setUTCMonth (this.date.getUTCMonth () + 1);

    return {
        start: new Date(this.date.getTime ()),
        end: end
    };
};

Month.prototype.previous = function () {
    var ret = new Date(this.date.getTime ());
    ret.setUTCMonth (this.date.getUTCMonth () - 1);

    return new Month (ret);
};

var months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

Month.prototype.toDisplayString = function () {
    return months[this.date.getMonth ()] + " " +
        this.date.getFullYear ().toString ();
};

Month.prototype.toISOString = function () {
    return this.date.getFullYear () + "-" +
        _((this.date.getMonth () + 1).toString ()).lpad (2, '0');
};

module.exports.Month = Month;
