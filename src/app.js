/*

app.js — this file is part of DATA×DATA, a minimal web analytics system.
Copyright 2013 Kuno Woudt <kuno@frob.nl>

DATA×DATA is licensed under copyleft-next version 0.1.0, see
LICENSE.txt for more information.

*/

var fs     = require ('fs');
var http   = require ('http');
var mysql  = require ('mysql');
var path   = require ('path');
var url    = require ('url');

var here = path.dirname (path.resolve (__filename));
var client_js = fs.readFileSync (
    path.join (here, 'client.js')).toString ();
var demo_html = fs.readFileSync (
    path.join (here, 'demo.html')).toString ();

function write_page_view (connection, data) {
    var row = [ data.host, data.screen_size, data.user_agent ];

    var query_str = 'INSERT INTO page_views (host, screen_size, user_agent) '
        + 'VALUES (?, ?, ?)';

    connection.query (query_str, row, function (error, result) {
        if (error) {
            console.log ('ERROR: ' + error);
        }
    });
};

function log_page_view (request, response, connection, size) {
    write_page_view (connection, {
        host: request.headers.host,
        screen_size: size,
        user_agent: request.headers['user-agent']
    });

    response.writeHead (204, {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
    });
    response.end('');
};

function listener (connection) {
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
            log_page_view (request, response, connection, matches[0]);
        }
        else if (location.path.match (/demo\/?$/))
        {
            response.writeHead (200, { 'Content-Type': 'text/html' });
            response.end (demo_html);
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

function handle_database_disconnect (connection) {
    connection.on ('error', function(err) {
        if (!err.fatal) {
            return;
        }

        if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
            throw err;
        }

        console.log ('Re-connecting lost connection: ' + err.stack);

        connection = mysql.createConnection (connection.config);
        handle_database_disconnect (connection);
        connection.connect ();
    });
};

exports.app = function (port, hostname) {

    var connection = mysql.createConnection ({
        host: 'localhost',
        user: 'data_x_data',
        password: 'data_x_data',
        database: 'data_x_data'
    });

    handle_database_disconnect (connection);

    console.log ('Server running at http://127.0.0.1:' + port.toString () + '/');
    http.createServer (listener (connection)).listen (port, hostname);

};

exports.app(7184);
