/*

app.js — this file is part of DATA×DATA, a minimal web analytics system.
Copyright 2013 Kuno Woudt <kuno@frob.nl>

DATA×DATA is licensed under copyleft-next version 0.3.0, see
LICENSE.txt for more information.

*/

var config    = require ('./config');
var util      = require ('./util');
var stats     = require ('./stats');
var fs        = require ('fs');
var http      = require ('http');
var anyDB     = require ('any-db');
var path      = require ('path');
var url       = require ('url');

var here = path.dirname (path.resolve (__filename));
var client_js = fs.readFileSync (
    path.join (here, 'client.js')).toString ();
var demo_html = fs.readFileSync (
    path.join (here, 'demo.html')).toString ();
var demo_html = fs.readFileSync (
    path.join (here, 'stats.html')).toString ();

function write_page_view (db, data) {
    var x = null;
    var y = null;

    var parts = data.screen_size.split ('x');

    if (Boolean (parts[1]))
    {
        x = parseInt (parts[0], 10);
        y = parseInt (parts[1], 10);
    }

    var interval = new util.Month ().interval ();

    var query = db.query (
            "WITH counted AS (" +
            "    UPDATE page_views" +
            "       SET sum=sum+1" +
            "     WHERE host=$1" +
            "       AND user_agent=$2" +
            "       AND x=$3" +
            "       AND y=$4" +
            "       AND interval_start=$5" +
            "       AND interval_end=$6" +
            " RETURNING *" +
            ")" +
            "INSERT INTO page_views (" +
            "     host, user_agent, x, y, interval_start, interval_end)" +
            "(" +
            "    SELECT $1, $2, $3, $4, $5, $6" +
            "    WHERE NOT EXISTS (SELECT 1 FROM counted)" +
            ");",
        [ data.host, data.user_agent, x, y, interval.start, interval.end ]
    );

    query.on ('error', console.error);
};

function log_page_view (request, response, db, size) {
    write_page_view (db, {
        host: request.headers.host,
        screen_size: size,
        user_agent: request.headers['user-agent']
    });

    /* Respond immediatly, don't wait for the database to be done. */
    response.writeHead (204, {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
    });
    response.end('');
};

function listener (db) {
    return function (request, response) {
        var location = url.parse(request.url);
        var matches = null;

        if (location.path.match (/\.js$/))
        {
            response.writeHead (200, { 'Content-Type': 'application/x-javascript' });
            response.end (client_js);
        }
        else if (matches = location.path.match (/[0-9]+x[0-9]+$/))
        {
            log_page_view (request, response, db, matches[0]);
        }
        else if (location.path.match (/\/demo\/?$/))
        {
            response.writeHead (200, { 'Content-Type': 'text/html' });
            response.end (demo_html);
        }
        else if (location.path.match (/\/stats\/?$/))
        {
            response.writeHead (200, { 'Content-Type': 'text/html' });
            response.end (stats_html);
        }
        else if (location.path.match (/\/data.json$/))
        {
            stats.gather_all_stats (db, 3).then (function (data) {
                response.writeHead (200, { 'Content-Type': 'application/json' });
                response.end (JSON.stringify (data, null, 2));
            });
        }
        else
        {
            response.writeHead (404, {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*',
            });
            response.end('NOT FOUND');
        }
    };
};

exports.app = function (port, hostname) {

    var options = config.read ('server');
    var pool = anyDB.createPool (config.read ('database').url);

    console.log ('Server running at http://' + options.host +
                 ':' + options.port + '/');
    http.createServer (listener (pool)).listen (options.port, options.host);
};

exports.app();
