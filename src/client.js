// DATA×DATA copyright 2013 Kuno Woudt. License: copyleft-next 0.1.0 or later.
var req = new XMLHttpRequest();
req.open ("GET", document.getElementById('data-x-data').src + '/'
          + screen.width + 'x' + screen.height, false);
req.send (null);
