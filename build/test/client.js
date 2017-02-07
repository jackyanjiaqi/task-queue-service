"use strict";
var TaskQueueService_1 = require("../TaskQueueService");
var path = require("path");
TaskQueueService_1.client
    .setListenPort(3001)
    .setServerPath(path.join(__dirname, "server/batch.js"));
var taskId = 0;
function test() {
    setTimeout(function () {
        taskId++;
        var task = {
            name: "task" + taskId,
            finishTime: Math.floor(Math.random() * 1000)
        };
        TaskQueueService_1.client.informNewTask(task, function (res) {
            if ("error" in res) {
                console.log(task.name, res['error']);
            }
            else {
                console.log(task.name, "Done!");
            }
        });
        if (taskId <= 10) {
            test();
        }
    }, 1000);
}
test();
