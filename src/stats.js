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
    var interval = date.interval ();
    var deferred = when.defer ();

    var query = db.query (
        'SELECT x, y, SUM(sum) AS visits FROM page_views ' +
            'WHERE interval_start >= $1 AND interval_end <= $2 '+
            'GROUP BY x, y ' +
            'ORDER BY x DESC, y DESC',
        [ interval.start, interval.end ]);

    query.on ('error', console.error);

    var results = { data: [], total_visits: 0 };
    query.on ('row', function (row) {
        results.data.push (row);
        /* FIXME: for some reason visits is returned as string instead of int. */
        row.visits = parseInt (row.visits, 10);
        results.total_visits += row.visits;
    });

    query.on ('end', function () {
        deferred.resolve (results);
    });

    return deferred.promise;
};

function render_screen_sizes (data) {
    return _(data.data).filter (function (row) {
        /* do not display visitors which do not have a screen. */
        if (row.x === 0 || row.y === 0)
            return false;

        /* do not display results with less than 0.5% visits. */
        return (row.visits / data.total_visits * 100) > 0.5;
    }).map (function (row) {
        var size = _(row.x).lpad (6, ' ') + "x" + _(row.y).rpad (6, ' ');
        var visits = _(row.visits.toString ()).lpad (5, ' ');
        var percentage = display_percentage (data.total_visits, row.visits);

        return '          ' + size + '    visits:' + visits + ', ' + percentage;
    });
};

function render_browsers (data) {
    var browsers = _(data.data).keys ();
    browsers.sort ();

    var flattened = [];
    _(browsers).each (function (browser) {
        _(data.data[browser]).each (function (item) {
            flattened.push (_(item).extend ({ browser: browser }));
        });
    });

    return _(flattened).filter (function (item) {
        var percentage = item.visits / data.total_visits * 100;

        /* only display commonly used browsers. */
        if (percentage < 0.5)
        {
            return false;
        }

        /* do not display common bots. */
        return item.browser !== 'Googlebot' && item.browser !== 'BingPreview';
    }).map (function (item) {
        var visits = _(item.visits.toString ()).lpad (5, ' ');
        var percentage = display_percentage (data.total_visits, item.visits);

        return _(item.browser + ' ' + item.version.toString ()).lpad (21, ' ') +
            '      visits:' + visits + ', ' + percentage;
    });
};

function collate_user_agents (db, date) {
    var interval = date.interval ();
    var deferred = when.defer ();

    var query = db.query (
        'SELECT user_agent, SUM(sum) AS visits FROM page_views ' +
            'WHERE interval_start >= $1 AND interval_end <= $2 ' +
            'GROUP BY user_agent ',
        [ interval.start, interval.end ]);

    query.on ('error', console.error);

    var results = { data: {}, total_visits: 0 };
    query.on ('row', function (row) {
        /* FIXME: for some reason visits is returned as string instead of int. */
        row.visits = parseInt (row.visits, 10);

        var browser = useragent.parse (row.user_agent);
        var name = browser.family;
        var version = browser.major;

        results.data[name] = results.data[name] || {};
        results.data[name][version] = results.data[name][version] || { version: parseInt (version, 10) };
        results.data[name][version].visits = row.visits;

        results.total_visits += row.visits;
    });

    query.on ('end', function () {

        _(results.data).each (function (versions, browser) {
            results.data[browser] = _(versions).chain ()
                .map (function (obj, key) {
                    return obj;
                })
                .sortBy (function (obj) { return obj.version; })
                .reverse ()
                .value ();
        });

        deferred.resolve (results);
    });

    return deferred.promise;
};

/*
function display_month (pool, d) {
    var deferred = when.defer ();

    console.log ("\n" + d.toDisplayString () + "\n");
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
*/

function or_better (list) {
    var visits = 0;
    return _(list).map (function (obj, idx) {
        visits += obj.visits;
        return _({}).extend (obj, { visits: visits });
    });
};

function or_wider (data) {
    data.or_better = or_better (data.data);

    return data;
};

function or_newer (data) {

    data.or_better = {};

    _(data.data).each (function (versions, browser) {
        data.or_better[browser] = or_better (versions);
    });

    return data;
};

function gather_stats (pool, d) {
    var deferred = when.defer ();
    var gather_screen_sizes = collate_screen_sizes (pool, d);
    var gather_browser_versions = collate_user_agents (pool, d);

    when.all ([ gather_screen_sizes, gather_browser_versions ]).then (
        function (data) {
            var result = {};
            result[d.toISOString ()] = {
                "screens": or_wider (data[0]),
                "browsers": or_newer (data[1])
            }
            deferred.resolve (result);
        });

    return deferred.promise;
}

function display_month (month_str, data) {
    console.log (new util.Month (month_str).toDisplayString () + ":\n");

    _(render_screen_sizes (data.screens)).each (function (line) {
        console.log (line);
    });

    console.log ("");

    _(render_browsers (data.browsers)).each (function (line) {
        console.log (line);
    });

    console.log ("");
};

function help () {
    console.log ("Usage node stats.js [OPTION]");
    console.log ("");
    console.log ("  --json    Generate json instead of human-readable output");
}

function main (argv) {

    var help = _(argv).contains ('--help');
    if (help)
    {
        return help ();
    }

    var json = _(argv).contains ('--json');
    var pool = anyDB.createPool (config.read ('database').url);

    var n = 3; /* last N months. */
    var data = {};
    var promises = [];
    var current_month = new util.Month ();

    while (n-- > 0)
    {
        promises.push (gather_stats (pool, current_month).then (
            function (results) {
                _(data).extend (results);
            }));

        current_month = current_month.previous ();
    }

    when.settle (promises).then (function () {
        pool.close ();

        if (json)
        {
            console.log (JSON.stringify (data, null, 2));
        }
        else
        {
            var months = _(data).keys ();
            months.sort ();

            _(months).each (function (month) {
                display_month (month, data[month]);
            });
        }
    });
};

main (process.argv);

