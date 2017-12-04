const cluster = require('cluster');
//InitialiseServer is a function that returns the server object, through http.createServer(app);
module.exports = (initialiseServer) => {
    let envs = process.env;
    if ((envs.NODE_ENV === 'production' || envs.ENABLE_WORKERS == 'true') && cluster.isMaster) {
        var numWorkers = require('os').cpus().length;
        let workersOnRestart = {};
        for (var i = 0; i < numWorkers; i++) {
            var worker = cluster.fork();
            workerSetUp(worker);
        }

        cluster.on('online', function (worker) {

        });

        cluster.on('exit', function (worker, code, signal) {
            let newWorker = cluster.fork();
            workerSetUp(newWorker);
        });

        function workerSetUp(worker) {
            worker.on('message', function (mes) {
                let { type } = mes;
                if (type == 'SIGUSR1_COMPLETED') {
                    let this_worker = this;
                    delete workersOnRestart[this_worker.id];
                    if (Object.keys(workersOnRestart).length > 0) {
                        Object.keys(workersOnRestart).forEach((key, index) => {
                            if (index == 0) {
                                workersOnRestart[key].send({ type: 'SIGUSR1' });
                            }
                        })
                    }
                }
            });
        }

        process.on('SIGUSR1', () => {
            workersOnRestart = {};
            Object.keys(cluster.workers).forEach((key, index) => {
                let { id } = cluster.workers[key];
                workersOnRestart[id] = cluster.workers[key];
                if (index == 0) {
                    cluster.workers[key].send({ type: 'SIGUSR1' });
                }
            });
        });

    } else {
        let { worker } = cluster;
        if (typeof initialiseServer !== 'function') {
            throw new Error('InitialiseServer is not a function');
        }
        let server = initialiseServer();
        if (server == null) {
            throw new Error('Seems like server instance is not returned');
        }
        process.on('uncaughtException', function (err) {
            process.exit(1);
        });
        process.on('message', (message) => {
            let { type } = message;
            if (type == 'SIGUSR1') {
                /*server.getConnections(function (error, count) {
                    console.log('Server connection count while closing', count);
                });*/
                console.log('Shutting down server at ', new Date());
                server.close(() => {
                    setTimeout(() => {
                        worker.send({ type: 'SIGUSR1_COMPLETED' });
                        process.exit(0);
                    }, 1000);
                });
            }
        });
    }
}