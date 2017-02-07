/// <reference path="../src/typings/node/node.d.ts" />
import net = require('net');
export declare var batchMax: string;
export declare var waitingTime: string;
export declare namespace server {
    interface Task {
        id: number | string;
        uid: string;
        socket: net.Socket;
        isInterrupt?: boolean;
        isEnd?: boolean;
    }
    class TaskQueueService {
        ASSEMBLE_PORT: number;
        serviceCreated: boolean;
        TASK_POOL_MAX: number;
        WAITING_TIME: number;
        timeoutFlag: any;
        isWaiting: boolean;
        isBusy: boolean;
        __TASK_QUEUE: Task[];
        __BATCHING: Task[];
        last_logfile: string;
        constructor();
        run(port?: number): void;
        onServiceData(data: any, socket: any): void;
        onServiceEnd(): void;
        addQueue(task: Task): void;
        __addId(task: Task): void;
        examinNeedAssemble(): void;
        __executeTask(): void;
        nextBatch(): void;
        filterTask(task: Task): boolean;
        endTask(task: Task, resultCode: number | string, message?: string): void;
        interruptTask(task: Task, error: string): void;
        __removeMark(task: Task): void;
        isTaskInQueue(taskId: number | string): boolean;
        setTaskPoolMax(max: number): void;
        setWaitingTime(time: number): void;
        __beforeBatch(taskList: Task[]): void;
        executeBatch(taskList: Task[]): void;
        execute(task: Task): void;
    }
}
export declare namespace client {
    function setServerPath(path: string): typeof client;
    function setListenHost(host: string): typeof client;
    function setListenPort(port: number): typeof client;
    function startTaskQueueService(serverPath?: string): void;
    function informNewTask(taskBundle: string | Object, callBack?: (ret: Object) => void): net.Socket;
}
