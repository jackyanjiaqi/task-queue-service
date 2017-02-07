#TASK-QUEUE-SERVICE

Standalone Service Component Which executes a task with bundle requests from a queue,
Dynamically quicken the procedure by queue state(waiting time and amount) and history state,
Lower average request waiting time.

________

#Usage

You can overwrite fucntion `executeBatch` or `execute` to write your own task handling code,
The former provides a bunch of tasks while the latter providing a single one,however you must end each task
with either a tqs.endTask or a tqs.interruptTask API.

##server

```
    var async = require('async');
    var server = require('task-queue-service').server;
    var tqs = new server.TaskQueueService();
    
    //the max amount of tasks execute at a time.
    tqs.setTaskPoolMax(5);
    //Wait before next handling process until pool is full or time is up.account in millisecond
    tqs.setWaitingTime(5000); 
    
    tqs.executeBatch = function(taskList){
        //Write your own flow control code like async,here simulates a random task by `setTimeout`
        async.forEachOf(taskList, function(task, i, callback){
            //模拟单个任务的耗时操作
            setTimeout(function(){
                //单个任务有一定几率出错
                //Simulate an error
                // if(Math.random()>0.7){
                //     tqs.interruptTask(task,'Single Task Error!');
                // }else{
                //     tqs.endTask(task,"success");
                // }
                tqs.endTask(task,"success");
                callback();
            },task['finishTime']);
            },function(err){}
        );
    };
    //works at port:3001
    tqs.run(3001);
```

##client

```
    var client = require('task-queue-service').client;
    var path = require('path');
    
    client
        .setListenPort(3001)
        //if set ServerPath it will try to launch a server set here and reconnect.
        .setServerPath(path.join(__dirname,"server/batch.js"));
    
    var taskId = 0;
    function test(done){
        setTimeout(function(){
            taskId++;
            //Any user defined object can be taken as a task
            var task = {
                name:"task"+taskId,
                finishTime:Math.floor(Math.random()*1000)
            };
            client.informNewTask(task,function(res){
                if("error" in res){
                    console.log(task.name,res['error']);
                }else{
                    console.log(task.name,"Done!");
                }
            });
            //测试10个项目
            if(taskId<=10){
               test(done);
            }else{
               done();
            }
        },1000);
    }
    
    test(function(){
        console.log("Ten tasks Done!");
    })

```