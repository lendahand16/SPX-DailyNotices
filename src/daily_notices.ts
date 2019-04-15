//@ts-check

import Http = require('http');
import Https = require('https');
import Fs = require('fs');
import Path = require('path');
import Sqlite3 = require("better-sqlite3");

const dbConn = new Sqlite3("./db/notices.db",{fileMustExist:true});

/*

TODO
- Clean up error handling tree.
    - Use ErrorCodes from UTIL
    - Limit number of try/catches

*/

namespace DBUtil {

    //const db = new Sqlite3("./db/notices.db", {
    //    fileMustExist: true
    //});

    //const noticeList = db.prepare("SELECT * FROM notices WHERE (groups LIKE '%'||?||'%');").all('5');
    //console.log(noticeList);

/*

CREATE TABLE notices (
    noticeID  INTEGER PRIMARY KEY AUTOINCREMENT
                      UNIQUE
                      NOT NULL,
    title     TEXT,
    message   TEXT,
    author    TEXT,
    beginDate TEXT,
    endDate   TEXT,
    groups    TEXT,
    meta      TEXT
);


SELECT * FROM notices WHERE (groups LIKE '%YEARGROUP%' [OR groups LIKE '%YEARGROUP%']);

*/
}

namespace Util {

    export type ErrorCode = "400" | "403" | "404" | "500";

    interface I_MIME {
        [extension: string]: string;
    }
    export const MIME: I_MIME = {
        ".css":  "text/css",
        ".html": "text/html",
        ".json": "application/json",
        ".png":  "image/png",
        ".svg":  "image/svg+xml",
        ".ttf":  "font/ttf",
        ".txt":  "text/plain",
        ".woff": "font/woff"
    }
    
    /*
    export interface I_RequestData {
        get?: {
            [key: string]: string;
        };
        post?: {
            [key: string]: string;
        };
    }*/

    export function begins (root: string, filepath: string) {
        return filepath.startsWith(root);
    }

    export async function read (filename: string): Promise<Buffer> {
        return new Promise(function executor(resolve: (value: Buffer)=>void, reject: (reason: ErrorCode)=>void){
            Fs.readFile(filename, function onRead(err, data){
                if (err) {
                    if (err.code === "ENOENT") {
                        reject("404");
                    } else {
                        reject("500");
                    }
                    return;
                } else {
                    resolve(data);
                    return;
                }
            });
        });
    }

    // Read an HTTP GET Url Query String and turn into an object.
    export function readQuery (str: string) {
        let params = str.split("&").map(v=>{return v.split("=")});
        let obj: {[key: string]:string} = {};
        for (let key of params) {
            if (key.length > 1) {
                obj[key[0]] = key[1];
            } else {
                obj[key[0]] = "";
            }
        }
        return obj;
    }

    // Read in an HTTP POST object to json format.
    export async function readPosted (request: Http.IncomingMessage): Promise<string> {
        return new Promise(function executor(resolve: (postBody: string)=>void, reject: ()=>void){
            let postBody = '';
            if (request.method === "POST") {
                request.on("data", function onData(chunk){
                    postBody += String(chunk);
                });
                request.on("end", function onEnd(){
                    resolve(postBody);
                });
            } else {
                resolve("");
            }
            return;
        });
    }

}

namespace Notices {

    export async function serveMain (request: Http.IncomingMessage, response: Http.ServerResponse) {
        // Check to see if userid cookie set, then check to see if it is stored in credentials.
        return;
    }

    export async function serveWebGet (request: Http.IncomingMessage, response: Http.ServerResponse) {
        try {
            if (!request.url){
                await replyErrorPage("500", response);
                return;
            }
            let file = await Util.read("."+request.url);
            let extension = Path.extname(request.url);
            response.writeHead(200, {"Content-Type": (Util.MIME[extension] || Util.MIME[".txt"])});
            response.end(file);
        } catch (e) {
            await replyErrorPage("404", response);
        }
        return;
    }

    export async function replyErrorPage (code: Util.ErrorCode, response: Http.ServerResponse) {
        if (code === "400") {
            try {
                let file = await Util.read("./web_app/400.html");
                response.writeHead(400,{"Content-Type":"text/html"});
                response.end(file);
            } catch (e) {
                await replyErrorPage("500", response);
            }
        } else if (code === "403") {
            try {
                let file = await Util.read("./web_app/403.html");
                response.writeHead(403,{"Content-Type":"text/html"});
                response.end(file);
            } catch (e) {
                await replyErrorPage("500", response);
            }
        } else if (code === "404") {
            try {
                let file = await Util.read("./web_app/404.html");
                response.writeHead(404,{"Content-Type":"text/html"});
                response.end(file);
            } catch (e) {
                await replyErrorPage("500", response);
            }
        } else {
            try {
                let file = await Util.read("./web_app/500.html");
                response.writeHead(500,{"Content-Type":"text/html"});
                response.end(file);
            } catch (e) {
                console.log("[Daily Notices][Web Service]\n",e);
                response.writeHead(500,{"Content-Type":"text/plain"});
                response.end("If you're seeing this, something really went wrong on the server.");
            }
        }
        return;
    }

    function replyJson (text: string, response: Http.ServerResponse) {
        response.writeHead(200,{"Content-Type": Util.MIME[".json"]});
        response.end(text);
    }

    // Used throught HTTP POST
    export async function apiGet (request: Http.IncomingMessage, response: Http.ServerResponse) {
        request.url = request.url || "";
        let splitUrl = request.url.split("?");
        if (splitUrl.length > 1) {
            let urlQuery = Util.readQuery(decodeURIComponent(splitUrl[1]));
            if (urlQuery["begin"] && urlQuery["end"] && urlQuery["groups"]) {
                // CHECK GROUPS
                let groups = urlQuery["groups"].split(",");
                groups = groups.filter(function meetRule(v){
                    return ['5','6','7','8','9','10','11','12','staff'].includes(v);
                });
                // CHANGE TO THROW ERROR AND CATCH IN MAIN PROGRAM
                // Validate that GROUPS was formed correctly.
                if (groups.length < 1) {
                    await Notices.replyErrorPage("400", response);
                    return;
                }
                //console.log("[API:GET/groups]", groups);
                //console.log("[API:GET/begin]", new Date(urlQuery["begin"]));
                //console.log("[API:GET/end]", new Date(urlQuery["end"]));
                // CHECK BEGIN - ISO8601
                // FORM DATE FROM INPUT, DONT CARE IF MALFORMED
                try {
                    new Date(urlQuery["begin"]);
                    new Date(urlQuery["end"]);
                } catch {
                    // EXCEPT
                }
                // CHECK END - ISO8601
                // FORM DATE FROM INPUT, DONT CARE IF MALFORMED
                // DATABASE QUERY
                // Filter out bad data, also used to see if request was valid.

                // Generate the like statement to search for the notices 
                // where the url group is included
                // yNy used to ensure uniqueness
                let yearLikeStatement = groups.map(function forValue(v){
                    return "groups LIKE '%y'||?||'y%'"
                }).join(" OR ");
                let finalQuery = "SELECT * FROM notices WHERE ("+yearLikeStatement+");";
                let res = dbConn.prepare(finalQuery).all(...groups);
                let output = {"notices": res};
                await replyJson(JSON.stringify(output), response);
                return;
            }
        }
        await Notices.replyErrorPage("400", response);
        return;
    }
    
    // Used through HTTP POST
    export async function apiAdd (request: Http.IncomingMessage, response: Http.ServerResponse) {
        request.url = request.url || "";
        return;
    }

    // Used through HTTP POST
    export async function apiUpdate (request: Http.IncomingMessage, response: Http.ServerResponse) {
        request.url = request.url || "";
        return;
    }

    // Used through HTTP POST
    export async function apiDelete (request: Http.IncomingMessage, response: Http.ServerResponse) {
        request.url = request.url || "";
        return;
    }
}

// Main Program

const server = Http.createServer(async function (request, response) {

    // For TypeScript, Remove the undefined value so its always a value
    request.url = request.url || "";

    // API Handler
    if (Util.begins("/api/", request.url)) {
        if (Util.begins("/api/get", request.url)) {
            await Notices.apiGet(request, response);
            return;
        } else if (Util.begins("/api/add", request.url)) {
            // need to verify identity
        } else if (Util.begins("/api/update", request.url)) {
            // need to verify identity
        } else if (Util.begins("/api/delete", request.url)) {
            // need to verify identity
        }
        await Notices.replyErrorPage("400", response);
        return;
    }

    // Web Resource Handler
    if (Util.begins("/web/", request.url)) {
        await Notices.serveWebGet(request, response);
        return;
    }

    // Homepage Handler, Used to allow SSO (single sign on)
    if (request.url === "/") {
        // todo: use Notice.serveMain(); to allow for SSO
        //temp
        request.url = "/web_app/notices-view.html";
        await Notices.serveWebGet(request, response);
        return;
    }

    // Default Handler, Reply Not Found (Forbidden doesn't make sense unless it exists and its too harsh sounding)
    await Notices.replyErrorPage("404", response);
    return;

});

server.listen(8080, "0.0.0.0", function onReady () {
    console.log("[Daily Notices][WebService] Listening on Port:",8080);
});
