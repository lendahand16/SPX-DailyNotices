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

TODO
- Good, Clear Namespaces.
*/

namespace DBUtil {

    export function initNoticesDB (conn: NeDB) {
        conn.insert({ _id: "__autoid__", value: -1 });
        /*dbConn.insert({
            noticeId: 0,
            title: "Notice Title",
            message: "Message Content",
            author: "A Very Good Author Indeed",
            beginDate: new Date("2019-04-15T00:00:00.000Z"),
            endDate: new Date("2019-04-15T00:00:00.000Z"),
            groups: "5,6,7,8,9,10,",
            meta: "event"
        });*/
    }
    //initNoticesDB(dbConn);

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

    export async function searchOne (conn: NeDB, query: any) {
        return new Promise(function executor(resolve, reject){
            conn.findOne(query, function (err:any, doc:any){
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(doc);
                }
            });
        });
    }

    export async function insertNotice(conn: NeDB, notice: Notices.I_NoticeDocument) {
        return new Promise(async function executor(resolve: ()=>void, reject: ()=>void){
            let autoIDDoc = await searchOne(conn, { _id: "__autoid__" });
            let newID: number = (autoIDDoc as any)["value"]+1;
            conn.update({ _id: "__autoid__" }, {$set:{value:newID}}, {}, function(err, count, upset){
                notice.noticeID = newID;
                conn.insert(notice);
                if (err) {
                    reject();
                } else {
                    resolve();
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

    export interface I_RequestVars {
        method: string;
        get: { [key: string]: string };
        post: string;
        contentType: string;
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
    export function readQuery (str: string): { [key: string]: string } {
        let params = str.split("&").map(v=>{return v.split("=")});
        let obj: {[key: string]:string} = {};
        for (let key of params) {
            if (key.length > 1) {
                obj[key[0]] = decodeURIComponent(key[1]);
            } else {
                obj[key[0]] = "";
            }
        }
        return obj;
    }

    // Relies on knowing that the request has post before being called.
    // Read in an HTTP POST object to json format.
    export async function readPosted (request: Http.IncomingMessage): Promise<string> {
        return new Promise(function executor(resolve: (postBody: string)=>void, reject: (code: ErrorKind)=>void){
            let postBody = "";
            request.on("data", function onData(chunk){
                postBody += String(chunk);
            });
            request.on("end", function onEnd(){
                resolve(postBody);
            });
            request.on("error", (err)=>{
                reject(ErrorKind.HTTP_500);
            })
            return;
        });
    }

    export async function getRequestVars (request: Http.IncomingMessage): Promise<I_RequestVars> {
        request.url = request.url || "";
        let output: I_RequestVars = {
            "method": request.method || "",
            "get": {},
            "post": "",
            "contentType": request.headers["content-type"] || ""
        };
        let splitUrl = request.url.split("?");
        // If > 1 then it has a valid query ending
        if (splitUrl.length > 1) {
            output.get = readQuery(splitUrl[1]);
        }
        if (request.method === "POST") {
            output.post = await readPosted(request);
        }
        return output;
    }

}

namespace Notices {

    export interface I_NoticeDocument {
        noticeID: number;
        title: string;
        message: string;
        author: string;
        beginDate: Date;
        endDate: Date;
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
        return;
    }

    // Used throught HTTP GET
    // ISO8601 Params are URIComponent Encoded
    // http://server:PORT/api/get?begin=ISO8601&end=ISO8601
    export async function apiGet (requestVars: Util.I_RequestVars, response: Http.ServerResponse) {
        if (requestVars.method !== "GET") throw Util.ErrorKind.HTTP_400;
        if (requestVars.get["begin"] !== undefined && requestVars.get["end"] !== undefined) {

            try {
                // Validate that these are real dates, error thrown if not. If Error, Goto Catch.
                new Date(requestVars.get["begin"]);
                new Date(requestVars.get["end"]);
            } catch {
                // Throw Bad Request Error
                throw Util.ErrorKind.HTTP_400;
            }

            let output = await DBUtil.search(dbConn, {
                "beginDate": { $lte: new Date(requestVars.get["begin"]) },
                "endDate": { $gte: new Date(requestVars.get["end"]) }
            });
            delete (output as any)["_id"];
            replyJson(JSON.stringify({"notices":output}), response);
        } else {
            throw Util.ErrorKind.HTTP_400;
        }
        return;
    }
    
    // Used through HTTP POST
    export async function apiAdd (requestVars: Util.I_RequestVars, response: Http.ServerResponse) {
        // need to verify identity
        // need to reply with a success/failure code
        //if (requestVars.method !== "POST") throw Util.ErrorKind.HTTP_400;
        DBUtil.insertNotice(dbConn, {
            "noticeID": 0,
            "title": "Notice Title",
            "message": "Message Content",
            "author": "Mr Teacher",
            "beginDate": new Date(1555372800000),
            "endDate": new Date(1555372800000),
            "groups": "5,6,7,8,9,",
            "meta": ""
        });
        response.writeHead(200);
        response.end();
        return;
    }

    // Used through HTTP POST
    export async function apiUpdate (requestVars: Util.I_RequestVars, response: Http.ServerResponse) {
        return;
    }

    // Used through HTTP POST
    export async function apiDelete (requestVars: Util.I_RequestVars, response: Http.ServerResponse) {
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
            let requestVars = await Util.getRequestVars(request);
            if (Util.begins("/api/get", request.url)) {
                await Notices.apiGet(requestVars, response);
            } else if (Util.begins("/api/add", request.url)) {
                await Notices.apiAdd(requestVars, response);
            } else if (Util.begins("/api/update", request.url)) {
                await Notices.apiUpdate(requestVars, response);
            } else if (Util.begins("/api/delete", request.url)) {
                await Notices.apiDelete(requestVars, response);
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
