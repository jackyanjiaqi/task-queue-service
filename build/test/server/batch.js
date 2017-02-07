"use strict";
var TaskQueueService_1 = require("../../TaskQueueService");
var async = require("async");
var tqs = new TaskQueueService_1.server.TaskQueueService();
tqs.setTaskPoolMax(5);
tqs.setWaitingTime(5000);
tqs.executeBatch = function (taskList) {
    async.forEachOf(taskList, function (task, i, callback) {
        setTimeout(function () {
            tqs.endTask(task, "success");
            callback();
        }, task['finishTime']);
    }, function (err) {
    });
};
tqs.run(3001);
