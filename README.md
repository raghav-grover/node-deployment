# node-deployment 
Node deployment is a simplistic approach to using Node clusters and Master-worker configuration to enable ***zero down time deployments***.

  - Closes the worker processes one by one and giving a timeout of 1 sec as a grace to HTTP server before it can close down on listening to new connections and thus complete/serve the existing connections.

It one by one replaces the new workers against the old ones(carrying the outdated code) and thus at the last all the new workers have the latest code.

Warning- ```This implementation while guaranteeing zero down time, at one point of time you may have two different pieces of code running```

## Getting Started

To install: `npm install node-deployment`

## Usage
To use you may need to need to modify some of your existing code and wrap in into a function and then pass into handler as given below:

To create a general implementation, pass the following in the function which returns a server object:
```javascript
let handler = require('node-deployment');

let initialiseServer = () => {
    var http = require('http');
    //You can either pass the function or Express instance in the create server instance
    let server = http.createServer((req, res) => {
        res.write('Hello client,wassup ?');
        res.end();
    });
    let port = 6971;
    server.listen(port);
    server.on('error', (error) => { console.log(error) });
    server.on('listening', () => { console.log(server.address()) });
    server.on('close', () => {
        console.log('Server is getting closed at ', new Date());
    });
    //Return server so that it can be used further by the handler, to close listening and give a grace time of 1 sec.
    return server;
}

//Now just pass the initialiseServer into the handler and let it do the magic for you :)
handler(initialiseServer);
```
Now when deploying code, just find the process id of the master process using:
```javascript
ps aux|grep -i 'your custom filter using file name (may be)'
```
After having the master process id, just run the following command in the terminal,
```javascript
kill -s SIGUSR1 <MASTER_PROCESS_ID>
```
This will send a user defined signal to the master process and it will initiate a restart of all workers one by one.
```SIGUSR1``` is a user defined signal that can be given to a process.
```javascript
 let envs = process.env;
```
Please make sure to have production mode on as ```envs.NODE_ENV==='production'``` or ```envs.ENABLE_WORKERS == 'true'``` should return true.

## Acknowledgements
  - Hat tip to anyone who uses and contributes to the code....