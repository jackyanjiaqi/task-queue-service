"use strict";
var TaskQueueService_1 = require("../TaskQueueService");
var tqs = new TaskQueueService_1.server.TaskQueueService();
tqs.setTaskPoolMax(5);
tqs.setWaitingTime(2000);
var executeBatch = function (taskList) {
    return false;
};
var execute = function (task) {
    procedure1(task, function (err1) {
        if (!err1) {
            procedure2(task, function (err2) {
                if (!err2) {
                    tqs.removeTask(task);
                    task.socket.write({ success: true });
                }
            });
        }
    });
};
var procedure1 = function (task, next) {
    setTimeout(function () {
        if (Math.random() > 0.7) {
            tqs.interruptTask(task, 'Procedure1 Error!');
            next('error');
        }
        else {
            next();
        }
    }, 1000);
};
var procedure2 = function (task, next) {
    setTimeout(function () {
        if (Math.random() > 0.8) {
            tqs.interruptTask(task, 'Procedure2 Error!');
            next('error');
        }
        else {
            next(task);
        }
    }, 1000);
};
tqs.execute = execute;
tqs.run();
