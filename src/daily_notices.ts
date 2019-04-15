//@ts-check

import Http = require('http');
import Https = require('https');
import Fs = require('fs');
import Path = require('path');
import NeDB = require("nedb");
//import Sqlite3 = require("better-sqlite3");

//const dbConn = new Sqlite3("./db/notices.db",{fileMustExist:true});
const dbConn = new NeDB({filename:"./db/notices.db",autoload:true});
// cleanup database every 30 minutes... 1000ms * 60s * 30m
dbConn.persistence.setAutocompactionInterval(1000 * 60 * 30);

/*
dbConn.insert({ _id: "__autoid__", value: -1 });

dbConn.insert({
    noticeId: 0,
    title: "NoticeOne",
    message: "Hello",
    author: "Me",
    beginDate: new Date(),
    endDate: new Date(),
    groups: "5,6,7,8,9,10,",
    meta: "event"
});
*/
/*

TODO
- Clean up error handling tree.
    - Use ErrorCodes from UTIL
    - Limit number of try/catches

*/

namespace DBUtil {

    export async function search (conn: NeDB, query: any) {
        return new Promise(function executor(resolve, reject){
            conn.find(query, function (err:any, docs:any){
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });
    }

}

namespace Util {

    //export type ErrorCode = "400" | "403" | "404" | "500";

    export enum ErrorKind {
        HTTP_400,
        HTTP_403,
        HTTP_404,
        HTTP_500
    }

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

    export function begins (root: string, filepath: string) {
        return filepath.startsWith(root);
    }

    export async function read (filename: string): Promise<Buffer> {
        return new Promise(function executor(resolve: (value: Buffer)=>void, reject: (reason: ErrorKind)=>void){
            Fs.readFile(filename, function onRead(err, data){
                if (err) {
                    if (err.code === "ENOENT") {
                        reject(ErrorKind.HTTP_404);
                    } else {
                        reject(ErrorKind.HTTP_500);
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

    export interface I_NoticeDocument {
        noticeID: number;
        title: string;
        message: string;
        author: string;
        beginDate: string;
        endDate: string;
        groups: string;
        meta: string;
    }

    export async function serveMain (request: Http.IncomingMessage, response: Http.ServerResponse) {
        // Check to see if userid cookie set, then check to see if it is stored in credentials.
        return;
    }

    export async function serveWebGet (request: Http.IncomingMessage, response: Http.ServerResponse) {
        try {
            if (!request.url){
                throw Util.ErrorKind.HTTP_500;
            }
            let file = await Util.read("."+request.url);
            let extension = Path.extname(request.url);
            response.writeHead(200, {"Content-Type": (Util.MIME[extension] || Util.MIME[".txt"])});
            response.end(file);
        } catch (e) {
            throw e;
        }
        return;
    }

    export async function replyErrorPage (code: Util.ErrorKind, response: Http.ServerResponse) {
        try {
            switch (code) {
                case Util.ErrorKind.HTTP_400:
                    response.writeHead(400,{"Content-Type":"text/html"});
                    response.end(await Util.read("./web_app/400.html"));
                    break;
                case Util.ErrorKind.HTTP_403:
                    response.writeHead(403,{"Content-Type":"text/html"});
                    response.end(await Util.read("./web_app/403.html"));
                    break;
                case Util.ErrorKind.HTTP_404:
                    response.writeHead(404,{"Content-Type":"text/html"});
                    response.end(await Util.read("./web_app/404.html"));
                    break;
                default:
                    response.writeHead(404,{"Content-Type":"text/html"});
                    response.end(await Util.read("./web_app/404.html"));
                    break;
            }
        } catch (e) {
            console.log("[Daily Notices][Web Service]\n", "FATAL ERROR");
            response.writeHead(500,{"Content-Type":"text/plain"});
            response.end("If you're seeing this, something really went wrong on the server.");
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
        if (splitUrl.length < 1) throw Util.ErrorKind.HTTP_400;

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
                throw Util.ErrorKind.HTTP_400;
            }
            try {
                new Date(urlQuery["begin"]);
                new Date(urlQuery["end"]);
            } catch {
                throw Util.ErrorKind.HTTP_400;
            }

            let yearRegexStatement = groups.map(function forValue(v){
                return v+","
            }).join("|");
            let output = await DBUtil.search(dbConn, {
                groups: new RegExp('('+String(yearRegexStatement)+')'),
                beginDate: { $lte: new Date(urlQuery["begin"]) },
                endDate: { $gte: new Date(urlQuery["end"]) }
            });
            replyJson(JSON.stringify({"notices":output}), response);
            return;
        }
        
    }
    
    // Used through HTTP POST
    export async function apiAdd (request: Http.IncomingMessage, response: Http.ServerResponse) {
        request.url = request.url || "";
        // need to verify identity
        if (request.method === "POST") {

        } else {
            throw Util.ErrorKind.HTTP_400;
        }
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

    try {
        // API Handler
        if (Util.begins("/api/", request.url)) {
            if (Util.begins("/api/get", request.url)) {
                await Notices.apiGet(request, response);
            } else if (Util.begins("/api/add", request.url)) {
                await Notices.apiGet(request, response);
            } else if (Util.begins("/api/update", request.url)) {
                // need to verify identity
            } else if (Util.begins("/api/delete", request.url)) {
                // need to verify identity
            } else {
                throw Util.ErrorKind.HTTP_400;
            }
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
        throw Util.ErrorKind.HTTP_404;

    } catch (e) {
        await Notices.replyErrorPage(e, response);
    }
    return;
});

server.listen(8080, "0.0.0.0", function onReady () {
    console.log("[Daily Notices][WebService] Listening on Port:",8080);
});
