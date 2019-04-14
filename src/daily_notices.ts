//@ts-check

import Http = require('http');
import Https = require('https');
import FS = require('fs');
import Path = require('path');
import Sqlite3 = require("sqlite3");


const server = Http.createServer(async function (request, response) {

    if (request.method === "GET") {
        
    }

});

server.listen(8080, "0.0.0.0", function onReady () {
    console.log("[Daily Notices][WebService] Listening on Port:",8080);
});