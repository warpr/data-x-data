/*

config.js — this file is part of DATA×DATA, a minimal web analytics system.
Copyright 2013 Kuno Woudt <kuno@frob.nl>

DATA×DATA is licensed under copyleft-next version 0.3.0, see
LICENSE.txt for more information.

*/

var fs        = require ('fs');
var IniReader = require ('inireader').IniReader;
var path      = require ('path');
var _         = require ('underscore');

var root = path.dirname (path.dirname (path.resolve (__filename)));
var loaded = {
    defaults: read_ini (path.join (root, 'etc', 'default.ini')),
    local: read_ini (path.join (root, 'etc', 'local.ini'))
};

function read_ini (filename) {
    var ini = new IniReader ()

    try {
        ini.load (filename);
        return ini.getBlock ();
    }
    catch (e) {
        if (e.code == 'ENOENT') {
            return {};  /* local.ini does not exist. */
        }
        throw e;
    }
};

exports.read = function (section) {
    return _.extend ({},
        loaded.defaults[section] ? loaded.defaults[section] : {},
        loaded.local[section] ? loaded.local[section] : {})
};

