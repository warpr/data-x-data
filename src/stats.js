/*

stats.js — this file is part of DATA×DATA, a minimal web analytics system.
Copyright 2013 Kuno Woudt <kuno@frob.nl>

DATA×DATA is licensed under copyleft-next version 0.1.0, see
LICENSE.txt for more information.

*/

var fs        = require ('fs');
var http      = require ('http');
var mysql     = require ('mysql');
var path      = require ('path');
var url       = require ('url');
var useragent = require ('useragent');
var _         = require ('underscore');

_.mixin(require('underscore.string').exports());

function display_percentage (total, value) {
    return Math.round (value / total* 100).toString () + '%';
};

function display_percentages (title, rows) {
    var total = _(rows).reduce (function (memo, item) {
        return memo + item.count;
    }, 0);

    var lines = [ title + ":\n" ];

    _(rows).each (function (item) {
        lines.push (
            _(display_percentage (total, item.count)).lpad(5, ' ')
            + " \t " + item.value);
    });

    lines.push ("");
    return lines;
};

function filter_browsers (rows) {
    var filtered = {};

    _(rows).each (function (item) {
        var browser = useragent.parse (item.value);
        var browser_name = browser.family + " " + browser.major;
        if (! _(filtered[browser_name]).isNumber ())
        {
            filtered[browser_name] = 0;
        }
        filtered[browser_name] += item.count;
    });

    return _(filtered)
        .chain ()
        .map (function (count, browser_name) {
            return { count: count, value: browser_name };
        })
        .sortBy (function (item) {
            return 0 - item.count;
        })
        .value ();
};

function collate_screen_sizes (connection) {
    var query_str = 'SELECT count(screen_size) AS count, screen_size AS value '
        + 'FROM page_views '
        + 'GROUP BY screen_size ORDER BY count(screen_size) DESC';

    connection.query (query_str, function (error, rows, cols) {
        error
            ? console.log ('ERROR: ' + error)
            : console.log (display_percentages ('Screen sizes', rows).join ("\n"));
    });
};

function collate_browsers (connection) {
    var query_str = 'SELECT count(user_agent) AS count, user_agent AS value '
        + 'FROM page_views '
        + 'GROUP BY user_agent ORDER BY count(user_agent) DESC';

    connection.query (query_str, function (error, rows, cols) {
        error
            ? console.log ('ERROR: ' + error)
            : console.log (display_percentages (
                'Browsers', filter_browsers (rows)).join ("\n"));
    });
};


function main () {

    var connection = mysql.createConnection ({
        host: 'localhost',
        user: 'data_x_data',
        password: 'data_x_data',
        database: 'data_x_data'
    });

    connection.connect ();
    collate_screen_sizes (connection);
    collate_browsers (connection);

    connection.end ();
};

main ();

