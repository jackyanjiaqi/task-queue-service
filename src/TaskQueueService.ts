/// <reference path="typings/node/node.d.ts" />

/**
 * Created by jackyanjiaqi on 17/1/22.
 */
import childProcess = require('child_process');
import net = require('net');
import path = require('path');
import os = require('os');
import * as readline from 'readline';
let out = process.stdout;


export var batchMax = 'batchMax';
export var waitingTime = 'waitingTime';

export namespace server{
    export interface Task {
        id:number|string;
        uid:string;
        socket:net.Socket;
        isInterrupt?:boolean;
        isEnd?:boolean;
    }
    export class TaskQueueService{
        ASSEMBLE_PORT:number = process.env.port || 57174;
        serviceCreated:boolean = false;

        TASK_POOL_MAX:number = 5;//支持一起打包的最大数
        WAITING_TIME:number = 2000;//单个等待的最长时间2s

        timeoutFlag:any;
        isWaiting:boolean = false;//正在等待中
        isBusy:boolean = false;//正在打包中
        __TASK_QUEUE:Task[] = [];//任务队列
        __BATCHING:Task[] = [];//正在打包的组

        last_logfile:string;//apk打包服务log日志

        constructor(){
            (this.__TASK_QUEUE as any)['quick'] = {};
        }

        run(port?:number):void {
            if(port){
                this.ASSEMBLE_PORT = port;
            }
            var server = net.createServer((socket)=> {
                socket.on('data', data =>this.onServiceData(data, socket));
            });
            server.on('listening', ()=> {
                console.log('Task-Queue-Service listening in ' + this.ASSEMBLE_PORT);
            });
            try {
                server.listen(this.ASSEMBLE_PORT);
            }
            catch (e) {
                console.error("Service.run", e);
            }
            process.on('uncaughtException', function (e:NodeJS.ErrnoException) {
                console.error("未捕获的异常:", e);
                if (e.code == 'EADDRINUSE') {
                    console.error(`无法启动 service, 请检查端口 ${this.ASSEMBLE_PORT} 是否被占用。`)
                }
            });
            process.on('exit', this.onServiceEnd);
        }

        onServiceData(data, socket) {
            // if (process.env.LOG == "true") {
            //     console.log("服务端接收数据:", data.toString);
            // }
            try {
                var task:Task = <Task>JSON.parse(data);
                task.socket = socket;
                this.addQueue(task);
            } catch (error) {
                //原样返回 用于测试
                socket.write(data);
            }
        }

        onServiceEnd() {

        }

        addQueue(task:Task) {
            this.__addId(task);
            this.__TASK_QUEUE.push(task);
            this.examinNeedAssemble();
        }

        __addId(task:Task){
            if(!task.id){
                if(this.__TASK_QUEUE.length == 0){
                    task.id = 1;
                }else{
                    let last_task = this.__TASK_QUEUE[this.__TASK_QUEUE.length-1];
                    task.id = parseInt(last_task.id+"") + 1;
                }
            }else{
                if(this.isTaskInQueue(task.id)){
                    if(typeof task.id == 'string'){
                        task.id = task.id as string + 1;
                    }else{
                        task.id = task.id as number + 1;
                    }
                }
            }
            this.__TASK_QUEUE['quick'][task.id] = true;
        }

        examinNeedAssemble() {
            tipShow(`size:${this.__TASK_QUEUE.length} ${JSON.stringify(this.__TASK_QUEUE['quick'])}`);
            // console.log("isBusy:" + this.isBusy);
            // console.log("isWaiting:" + this.isWaiting);
            // console.log("queue size:" + this.__TASK_QUEUE.length);
            if (this.__TASK_QUEUE.length >= this.TASK_POOL_MAX && !this.isBusy) {
                clearTimeout(this.timeoutFlag);
                this.__executeTask();
            } else if (!this.isBusy && !this.isWaiting && this.__TASK_QUEUE.length > 0) {
                this.isWaiting = true;
                this.timeoutFlag = setTimeout(()=>this.__executeTask(), this.WAITING_TIME);
            }
        }

        __executeTask() {
            this.isWaiting = false;
            this.isBusy = true;
            var task_length = this.__TASK_QUEUE.length;
            var taskList:Task[] = this.__TASK_QUEUE.splice(
                0, task_length < this.TASK_POOL_MAX ? task_length : this.TASK_POOL_MAX);
            // if (process.env.LOG == "true") {
            //     console.log("打包准备");
            //     console.log("queue size:" + this.__TASK_QUEUE.length);
            // }
            this.__beforeBatch(taskList);
            //your task code here
            this.executeBatch(taskList);
        }

        nextBatch(){
            this.isBusy = false;
            this.examinNeedAssemble();
        }

        filterTask(task:Task) {
            return !task.isInterrupt
        }

        endTask(task:Task,resultCode:number|string,message?:string){
            task.isEnd = true;
            this.__removeMark(task);
            console.log(resultCode,message);
            let data = {result:resultCode};
            if(message){
                data['message']=message;
            }
            task.socket.write(JSON.stringify(data));

            let batchEndFlag = this.__BATCHING.every(task=>task.isInterrupt||task.isEnd);
            if(batchEndFlag){
                this.nextBatch();
            }
        }

        interruptTask(task:Task, error:string) {
            if (!task.isInterrupt) {
                //后续对task的操作都不会执行
                task.isInterrupt = true;
                console.error(error);
                task.socket.write(JSON.stringify({error: error}));
                //task.socket.end();
                this.__removeMark(task);
            }
        }

        //移除项目采用异步函数
        __removeMark(task:Task) {
            //暂时用同步函数代替
            delete this.__TASK_QUEUE['quick'][task.id];
        }

        isTaskInQueue(taskId:number|string):boolean {
            return this.__TASK_QUEUE['quick'][taskId];
        }

        setTaskPoolMax(max:number) {
            this.TASK_POOL_MAX = max;
        }

        setWaitingTime(time:number) {
            this.WAITING_TIME = time;
        }

        __beforeBatch(taskList:Task[]){
            this.__BATCHING = taskList;
        }

        executeBatch(taskList:Task[]):void{
            taskList.forEach((task:Task)=>{
                this.execute(task);
            });
        }

        execute(task:Task):void{
            //用户自己实现逻辑]
            this.endTask(task,"success");
        };
    }
}

export namespace client{
    var __serverPath = null;
    var __serverPort:number = 57174;
    var __serverHost:string = 'localhost';
    var __serviceCreated:boolean = false;

    export function setServerPath(path:string){
        __serverPath = path;
        return client;
    }

    export function setListenHost(host:string){
        __serverHost = host;
        return client;
    }

    export function setListenPort(port:number){
        __serverPort = port;
        return client;
    }

    //子进程开启队列服务
    export function startTaskQueueService(serverPath?:string) {
        __serviceCreated = true;
        var cwd = os.tmpdir();
        var executePath = serverPath?serverPath:__serverPath;
        // if (process.env.LOG == "true") {
        console.log("start service from " + executePath);
        // }
        var server_process = childProcess.exec(
            'node "' + executePath + '"',
            {cwd: cwd});
        server_process.stdout.on("data", data => writeServerLogFile(data));
        server_process.stderr.on("data", error => writeServerLogFile(error));
        server_process.on("exit", code => {
            __serviceCreated = false;
            writeServerLogFile('exit code:' + code);
        });
    }

    function writeServerLogFile(data, mode?:string) {
        // console.log(data);
    }

    export function informNewTask(taskBundle:string|Object, callBack?:(ret:Object)=>void):net.Socket {
        console.log('发起请求');
        console.log(taskBundle);
        var client = net.connect(__serverPort,__serverHost);
        client.on('connect', function () {
            console.log("客户端连接成功\nremoteIP:" + client.remoteAddress + ":" + client.remotePort + "\nlocalIP:" + client.localAddress + ":" + client.localPort + "\n");
        });
        client.on('error', function (e) {
            console.error(e);
            if (!__serviceCreated) {
                startTaskQueueService();
            }
            setTimeout(() => informNewTask(taskBundle, callBack), 2000);
        });
        //发送消息
        if (taskBundle) {
            if (typeof taskBundle == 'string') {
                client.write(taskBundle);
            } else {
                client.write(JSON.stringify(taskBundle));
            }
        }
        //接收消息
        client.on('data', data=> {
            console.log('客户端接收数据:');
            console.log(data.toString());
            var ret;
            try {
                ret = JSON.parse(data.toString());
            } catch (error) {
                ret = data.toString();
            }
            if(ret.result || ret.success || ret.error){
                client.end();
            }
            callBack && callBack(ret);
        });
        client.on('end', ()=> {
            console.log("客户端连接断开")
        });
        return client;
    }
}

/**
 * 显示实时信息
 * @param message
 */
let tipShow = (message)=>{
    readline.clearLine(out,0);
    readline.cursorTo(out,0,null);
    out.write(message);
};


