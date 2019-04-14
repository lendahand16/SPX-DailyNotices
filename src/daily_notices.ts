//@ts-check

import Http = require('http');
import Https = require('https');
import Fs = require('fs');
import Path = require('path');
import Sqlite3 = require("sqlite3");

const CONFIG: { [key: string]: any } = {
    "get": {
        "/":                            "./web/notices-view.html",
        "/css/spx.css":                 "./web/css/spx.css",
        "/css/notices.css":             "./web/css/notices.css",
        "/img/crest-gold.svg":          "./web/img/crest-gold.svg",
        "/img/link-portal.png":         "./web/img/link-portal.png",
        "/img/link-crest.png":          "./web/img/link-crest.png",
        "/font/opensans-regular.ttf":   "./web/font/opensans-regular.ttf",
        "/font/ptserif-regular.ttf":    "./web/font/ptserif-regular.ttf",
        "/font/adelle-eb.woff":         "./web/font/adelle-eb.woff"
    },
    "mime": {
        ".css": "text/css",
        ".html": "text/html",
        ".json": "application/json",
        ".png": "image/png",
        ".svg": "image/svg+xml",
        ".ttf": "font/ttf",
        ".woff": "font/woff"
    }
};

namespace Notices {

    function apiGet () {

    }
    
    function apiAdd () {

    }

    function apiUpdate () {

    }

    function apiDelete () {

    }
}

const server = Http.createServer(function (request, response) {

    if (request.method === "GET" && request.url) {
        //let filepath = "./web" + request.url;
        let filepath = CONFIG["get"][request.url];
        if (!filepath) {
            response.writeHead(500,{
                "Content-Type": "text/plain"
            });
            response.end("500: Internal Server Error");
            return;
        }
        Fs.readFile(filepath, function onRead(error, data){
            if (error) {
                //console.log(error);
                response.writeHead(500,{
                    "Content-Type": "text/plain"
                });
                response.end("500: Internal Server Error");
            } else {
                let extname = String(Path.extname(filepath)).toLowerCase();
                //console.log(extname);
                let contentType = CONFIG["mime"][extname] || 'text/plain';
                response.writeHead(200,{
                    "Content-Type": contentType
                });
                response.end(data);
            }
        });
    }

});

server.listen(8080, "0.0.0.0", function onReady () {
    console.log("[Daily Notices][WebService] Listening on Port:",8080);
});