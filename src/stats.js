/*

stats.js — this file is part of DATA×DATA, a minimal web analytics system.
Copyright 2013 Kuno Woudt <kuno@frob.nl>

DATA×DATA is licensed under copyleft-next version 0.3.0, see
LICENSE.txt for more information.

*/

var config    = require ('./config');
var util      = require ('./util');
var fs        = require ('fs');
var http      = require ('http');
var anyDB     = require ('any-db');
var path      = require ('path');
var url       = require ('url');
var useragent = require ('useragent');
var when      = require ('when');
var _         = require ('underscore');

_.mixin(require('underscore.string').exports());

function display_percentage (total, value) {
    return _(Math.round (value / total * 100).toString ()).lpad (3, ' ') + '%';
};

function collate_screen_sizes (db, date) {
    var interval = util.interval_month (date);
    var deferred = when.defer ();

    var query = db.query (
        'SELECT x, y, SUM(sum) AS visits FROM page_views ' +
            'WHERE interval_start >= $1 AND interval_end <= $2 '+
            'GROUP BY x, y ' +
            'ORDER BY x DESC, y DESC',
        [ interval.start, interval.end ]);

    query.on ('error', console.error);

    var results = { rows: [], total_visits: 0 };
    query.on ('row', function (row) {
        results.rows.push (row);
        /* FIXME: for some reason visits is returned as string instead of int. */
        row.visits = parseInt (row.visits, 10);
        results.total_visits += row.visits;
    });

    query.on ('end', function (rows) {
        deferred.resolve (results);
    });

    return deferred.promise;
};

function render_screen_sizes (data) {
    return _(data.rows).map (function (row) {
        var size = _(row.x).lpad (6, ' ') + "x" + _(row.y).rpad (6, ' ');
        var visits = _(row.visits.toString ()).lpad (5, ' ');
        var percentage = display_percentage (data.total_visits, row.visits);

        return '          ' + size + '    visits:' + visits + ', ' + percentage;
    });
};

function render_browsers (data) {
    var browsers = _(data.browsers).keys ();
    browsers.sort ();

    return _(browsers).map (function (key) {
        var visits = _(data.browsers[key].toString ()).lpad (5, ' ');
        var percentage = display_percentage (data.total_visits, data.browsers[key]);

        return _(key).lpad (21, ' ') + '      visits:' + visits + ', ' + percentage;
    });
};

function collate_user_agents (db, date) {
    var interval = util.interval_month (date);
    var deferred = when.defer ();

    var query = db.query (
        'SELECT user_agent, SUM(sum) AS visits FROM page_views ' +
            'WHERE interval_start >= $1 AND interval_end <= $2 ' +
            'GROUP BY user_agent ',
        [ interval.start, interval.end ]);

    query.on ('error', console.error);

    var results = { browsers: {}, total_visits: 0 };
    query.on ('row', function (row) {
        var browser = useragent.parse (row.user_agent);
        var browser_name = browser.family + " " + browser.major;
        row.visits = parseInt (row.visits, 10);

        if (! _(results.browsers).has (browser_name))
        {
            results.browsers[browser_name] = row.visits;
        }
        else
        {
            results.browsers[browser_name] += row.visits;
        }

        /* FIXME: for some reason visits is returned as string instead of int. */
        results.total_visits += row.visits;
    });

    query.on ('end', function (rows) {
        deferred.resolve (results);
    });

    return deferred.promise;
};


function display_month (pool, d) {
    var deferred = when.defer ();

    console.log ("\n" + util.render_month (d) + "\n");
    var print_screen_sizes = collate_screen_sizes (pool, d).then (
        function (results) {
            _(render_screen_sizes (results)).each (function (line) {
                console.log (line);
            });
            console.log ("");

            var print_browser_versions = collate_user_agents (pool, d).then (
                function (results) {
                    _(render_browsers (results)).each (function (line) {
                        console.log (line);
                    });
                    console.log ("");
                    deferred.resolve ();
                });
        });


    return deferred.promise;
};


function main () {

    var pool = anyDB.createPool (config.read ('database').url);

    /* output stats for a complete month (so last month). */
    last_month = util.last_month ();

    /* output stats for the running month (incomplete). */
    current_month = util.start_of_month ();

    display_month (pool, last_month).then (function () {
        display_month (pool, current_month).then (function () {
            pool.close ();
        });
    });
};

main ();

