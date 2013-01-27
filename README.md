
DATA×DATA
=========

Hello!

You're reading the README.md of DATA×DATA, a minimal web analytics
system.

Most web analytics systems are designed to track users, or more
specifically to track conversion rates in a sales funnel. If you're
not operating an e-commerce site the information tracked by analytics
software is often not relevant or useful. However, as a developer you
still want to know a few bits of information so you can tailor your
website or web application to your audience.

DATA×DATA currently writes a log entry for each page view, and these
entries contain two things (per site):

1. Screen resolution
2. User agent string

This is the information I want to know as a web developer when I add
features or otherwise make changes to an existing site.


Cookielaw
---------

Even though DATA×DATA does not use cookies, and does not log
personally identifiable information, it may still be subject to the
so-called cookie law.

Using any form of first-party or third-party analytics may require
informed consent from your users if your target audience includes
citizens of EU member states which have implemented the e-Privacy
directive 2009/136/EC.


License
-------

Copyright 2013  Kuno Woudt

DATA×DATA is licensed under copyleft-next version 0.1.0, see
LICENSE.txt for more information.


Download
--------

    site:   https://frob.nl/DATA×DATA
    code:   https://gitorious.org/data-x-data/data-x-data


Install
-------

DATA×DATA is written in javascript, the server-side code needs nodejs.
The client-side code runs in the browser.  Install the dependencies
with npm:

    npm install

DATA×DATA uses a database to store page views.  Currently only MySQL
is supported, support for writing this data to files, syslog or to
other databases may be added in the future (patches welcome!).

To create the database, connect to mysql as an admin user and source
the included database.sql file:

    mysql> source install/database.sql

This will create a 'data_x_data' database and user.


Usage
-----

You can run the server using nodejs:

    node src/app.js

The server will serve the client script on any url ending in .js, and
will log a page view on any url ending in a screen resolution (e.g.
1280x768).  It is suggested to configure your web front-end to only
route requests for e.g. /data-x-data to the DATA×DATA nodejs server (a
sample nginx configuration is included as etc/nginx.conf.sample).

On each web page you want to log page views for embed the following
script element:

    <script id="data-x-data" src="/data-x-data.js"></script>

The id="data-x-data" attribute is required, the src attribute can be
anything which you've routed to the nodejs server, as long as it ends
in '.js'.

A sample web page is included as src/demo.html, you can view that at
http://localhost:7184/demo/ when the server is running.


Reports
-------

Currently there are no fancy graphs or reports.  A quick stats script
is included as src/stats.js, run it like this:

    node src/stats.js


TODO
----

1. Add unittests
2. (fixed)
3. Add a commandline argument which allows listening on a different ip/port.
4. Double-check "useragent" database, IE10 is reported as IE7 in some situations.
