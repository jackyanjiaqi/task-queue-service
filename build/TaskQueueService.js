"use strict";
var childProcess = require("child_process");
var net = require("net");
var os = require("os");
var readline = require("readline");
var out = process.stdout;
exports.batchMax = 'batchMax';
exports.waitingTime = 'waitingTime';
var server;
(function (server_1) {
    var TaskQueueService = (function () {
        function TaskQueueService() {
            this.ASSEMBLE_PORT = process.env.port || 57174;
            this.serviceCreated = false;
            this.TASK_POOL_MAX = 5;
            this.WAITING_TIME = 2000;
            this.isWaiting = false;
            this.isBusy = false;
            this.__TASK_QUEUE = [];
            this.__BATCHING = [];
            this.__TASK_QUEUE['quick'] = {};
        }
        TaskQueueService.prototype.run = function (port) {
            var _this = this;
            if (port) {
                this.ASSEMBLE_PORT = port;
            }
            var server = net.createServer(function (socket) {
                socket.on('data', function (data) { return _this.onServiceData(data, socket); });
            });
            server.on('listening', function () {
                console.log('Task-Queue-Service listening in ' + _this.ASSEMBLE_PORT);
            });
            try {
                server.listen(this.ASSEMBLE_PORT);
            }
            catch (e) {
                console.error("Service.run", e);
            }
            process.on('uncaughtException', function (e) {
                console.error("未捕获的异常:", e);
                if (e.code == 'EADDRINUSE') {
                    console.error("\u65E0\u6CD5\u542F\u52A8 service, \u8BF7\u68C0\u67E5\u7AEF\u53E3 " + this.ASSEMBLE_PORT + " \u662F\u5426\u88AB\u5360\u7528\u3002");
                }
            });
            process.on('exit', this.onServiceEnd);
        };
        TaskQueueService.prototype.onServiceData = function (data, socket) {
            try {
                var task = JSON.parse(data);
                task.socket = socket;
                this.addQueue(task);
            }
            catch (error) {
                socket.write(data);
            }
        };
        TaskQueueService.prototype.onServiceEnd = function () {
        };
        TaskQueueService.prototype.addQueue = function (task) {
            this.__addId(task);
            this.__TASK_QUEUE.push(task);
            this.examinNeedAssemble();
        };
        TaskQueueService.prototype.__addId = function (task) {
            if (!task.id) {
                if (this.__TASK_QUEUE.length == 0) {
                    task.id = 1;
                }
                else {
                    var last_task = this.__TASK_QUEUE[this.__TASK_QUEUE.length - 1];
                    task.id = parseInt(last_task.id + "") + 1;
                }
            }
            else {
                if (this.isTaskInQueue(task.id)) {
                    if (typeof task.id == 'string') {
                        task.id = task.id + 1;
                    }
                    else {
                        task.id = task.id + 1;
                    }
                }
            }
            this.__TASK_QUEUE['quick'][task.id] = true;
        };
        TaskQueueService.prototype.examinNeedAssemble = function () {
            var _this = this;
            tipShow("size:" + this.__TASK_QUEUE.length + " " + JSON.stringify(this.__TASK_QUEUE['quick']));
            if (this.__TASK_QUEUE.length >= this.TASK_POOL_MAX && !this.isBusy) {
                clearTimeout(this.timeoutFlag);
                this.__executeTask();
            }
            else if (!this.isBusy && !this.isWaiting && this.__TASK_QUEUE.length > 0) {
                this.isWaiting = true;
                this.timeoutFlag = setTimeout(function () { return _this.__executeTask(); }, this.WAITING_TIME);
            }
        };
        TaskQueueService.prototype.__executeTask = function () {
            this.isWaiting = false;
            this.isBusy = true;
            var task_length = this.__TASK_QUEUE.length;
            var taskList = this.__TASK_QUEUE.splice(0, task_length < this.TASK_POOL_MAX ? task_length : this.TASK_POOL_MAX);
            this.__beforeBatch(taskList);
            this.executeBatch(taskList);
        };
        TaskQueueService.prototype.nextBatch = function () {
            this.isBusy = false;
            this.examinNeedAssemble();
        };
        TaskQueueService.prototype.filterTask = function (task) {
            return !task.isInterrupt;
        };
        TaskQueueService.prototype.endTask = function (task, resultCode, message) {
            task.isEnd = true;
            this.__removeMark(task);
            console.log(resultCode, message);
            var data = { result: resultCode };
            if (message) {
                data['message'] = message;
            }
            task.socket.write(JSON.stringify(data));
            var batchEndFlag = this.__BATCHING.every(function (task) { return task.isInterrupt || task.isEnd; });
            if (batchEndFlag) {
                this.nextBatch();
            }
        };
        TaskQueueService.prototype.interruptTask = function (task, error) {
            if (!task.isInterrupt) {
                task.isInterrupt = true;
                console.error(error);
                task.socket.write(JSON.stringify({ error: error }));
                this.__removeMark(task);
            }
        };
        TaskQueueService.prototype.__removeMark = function (task) {
            delete this.__TASK_QUEUE['quick'][task.id];
        };
        TaskQueueService.prototype.isTaskInQueue = function (taskId) {
            return this.__TASK_QUEUE['quick'][taskId];
        };
        TaskQueueService.prototype.setTaskPoolMax = function (max) {
            this.TASK_POOL_MAX = max;
        };
        TaskQueueService.prototype.setWaitingTime = function (time) {
            this.WAITING_TIME = time;
        };
        TaskQueueService.prototype.__beforeBatch = function (taskList) {
            this.__BATCHING = taskList;
        };
        TaskQueueService.prototype.executeBatch = function (taskList) {
            var _this = this;
            taskList.forEach(function (task) {
                _this.execute(task);
            });
        };
        TaskQueueService.prototype.execute = function (task) {
            this.endTask(task, "success");
        };
        ;
        return TaskQueueService;
    }());
    server_1.TaskQueueService = TaskQueueService;
})(server = exports.server || (exports.server = {}));
var client;
(function (client_1) {
    var __serverPath = null;
    var __serverPort = 57174;
    var __serverHost = 'localhost';
    var __serviceCreated = false;
    function setServerPath(path) {
        __serverPath = path;
        return client;
    }
    client_1.setServerPath = setServerPath;
    function setListenHost(host) {
        __serverHost = host;
        return client;
    }
    client_1.setListenHost = setListenHost;
    function setListenPort(port) {
        __serverPort = port;
        return client;
    }
    client_1.setListenPort = setListenPort;
    function startTaskQueueService(serverPath) {
        __serviceCreated = true;
        var cwd = os.tmpdir();
        var executePath = serverPath ? serverPath : __serverPath;
        console.log("start service from " + executePath);
        var server_process = childProcess.exec('node "' + executePath + '"', { cwd: cwd });
        server_process.stdout.on("data", function (data) { return writeServerLogFile(data); });
        server_process.stderr.on("data", function (error) { return writeServerLogFile(error); });
        server_process.on("exit", function (code) {
            __serviceCreated = false;
            writeServerLogFile('exit code:' + code);
        });
    }
    client_1.startTaskQueueService = startTaskQueueService;
    function writeServerLogFile(data, mode) {
    }
    function informNewTask(taskBundle, callBack) {
        console.log('发起请求');
        console.log(taskBundle);
        var client = net.connect(__serverPort, __serverHost);
        client.on('connect', function () {
            console.log("客户端连接成功\nremoteIP:" + client.remoteAddress + ":" + client.remotePort + "\nlocalIP:" + client.localAddress + ":" + client.localPort + "\n");
        });
        client.on('error', function (e) {
            console.error(e);
            if (!__serviceCreated) {
                startTaskQueueService();
            }
            setTimeout(function () { return informNewTask(taskBundle, callBack); }, 2000);
        });
        if (taskBundle) {
            if (typeof taskBundle == 'string') {
                client.write(taskBundle);
            }
            else {
                client.write(JSON.stringify(taskBundle));
            }
        }
        client.on('data', function (data) {
            console.log('客户端接收数据:');
            console.log(data.toString());
            var ret;
            try {
                ret = JSON.parse(data.toString());
            }
            catch (error) {
                ret = data.toString();
            }
            if (ret.result || ret.success || ret.error) {
                client.end();
            }
            callBack && callBack(ret);
        });
        client.on('end', function () {
            console.log("客户端连接断开");
        });
        return client;
    }
    client_1.informNewTask = informNewTask;
})(client = exports.client || (exports.client = {}));
var tipShow = function (message) {
    readline.clearLine(out, 0);
    readline.cursorTo(out, 0, null);
    out.write(message);
};
