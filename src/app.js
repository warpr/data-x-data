/*

app.js — this file is part of DATA×DATA, a minimal web analytics system.
Copyright 2013 Kuno Woudt <kuno@frob.nl>

DATA×DATA is licensed under copyleft-next version 0.1.0, see
LICENSE.txt for more information.

*/

var fs     = require ('fs');
var http   = require ('http');
var mysql  = require ('db-mysql');
var path   = require ('path');
var url    = require ('url');

var here = path.dirname (path.resolve (__filename));
var data_x_data_js = fs.readFileSync (
    path.join (here, 'data-x-data.js')).toString ();

function write_page_view (connection, data) {
    var columns = ['host', 'screen_size', 'user_agent'];
    var row = [ data.host, data.screen_size, data.user_agent ];

    connection.query ()
        .insert ('page_views', columns, row)
        .execute (function (error, result) {
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

function serve_script (request, response) {
    response.writeHead (200, { 'Content-Type': 'application/x-javascript' });
    response.end (data_x_data_js);
};

function serve_404 (request, response) {
    response.writeHead (404, {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
    });
    response.end('NOT FOUND');
};

function listener (connection) {
    return function (request, response) {
        var location = url.parse(request.url);
        var matches = null;

        if (location.path.match (/\.js$/))
        {
            serve_script (request, response);
        }
        else if (matches = location.path.match (/[0-9]+x[0-9]+$/))
        {
            log_page_view (request, response, connection, matches[0]);
        }
        else
        {
            serve_404 (request, response);
        }
    };
};

exports.app = function (port, hostname) {

    var db = new mysql.Database({
        hostename: 'localhost',
        user: 'data_x_data',
        password: 'data_x_data',
        database: 'data_x_data'
    });

    db.on ('error', function (error) {
        console.log ('ERROR: ', error);
    });

    db.on ('ready', function (server) {
        var connection = this;
        console.log ('Connected to mysql ' + server.version);
        console.log ('Server running at http://127.0.0.1:' + port.toString () + '/');
        http.createServer (listener (connection)).listen (port, hostname);
    });

    db.connect ();
};

exports.app(7184);
