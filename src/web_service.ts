//@ts-check

import Http = require("http");
import ChildProcess = require("child_process");

async function WebHandler (request=Http.IncomingMessage.prototype, response=Http.ServerResponse.prototype) {

    return new Promise((resolve,reject)=>{
        let output = "";
        // Create a child process to run the notices handler and backend.
        const dn = ChildProcess.spawn('bin/deno-0.3.7.exe',["src/WebHandler.ts"]);
        // Ceate an event listener for when data is received.
        dn.stdout.on("data",function(data){
            output += String(data);
        });
        
        // Ceate an event listener for when data has finished being sent.
        dn.stdout.on("close",function(){
            resolve(output);
        });
        // This will kill the process after 2000 milliseconds to prevent overloading the system.
        setTimeout(function(){dn.kill();reject("timeout")}, 2000);
    });
}

const server = Http.createServer(async function (request, response) {
    
    try {
        let reply = await WebHandler(request, response);
        response.writeHead(200,{
            "Content-Type": "text/html"
        });
        response.end(reply);
    } catch (e) {
        let reply = await WebHandler(request, response);
        response.writeHead(500,{
            "Content-Type": "text/html"
        });
        response.end("Internal Server Error");
    }

});

server.listen(8080, "0.0.0.0", function onListen () {
    console.log("[Daily Notices][WebService] Listening on Port:",8080);
});
