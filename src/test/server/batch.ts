/**
 * Created by jackyanjiaqi on 17/1/23.
 */
import {server} from '../../TaskQueueService';
import * as async from 'async';

let tqs = new server.TaskQueueService();
tqs.setTaskPoolMax(5);
tqs.setWaitingTime(5000);

tqs.executeBatch = (taskList:server.Task[])=>{
    //使用其他流程控制库书写的批处理代码
    async.forEachOf(taskList, (task:server.Task, i, callback)=> {
        //模拟单个任务的耗时操作
        setTimeout(()=>{
            //单个任务有一定几率出错
            // if(Math.random()>0.7){
            //     tqs.interruptTask(task,'Single Task Error!');
            // }else{
            //     tqs.endTask(task,"success");
            // }
            tqs.endTask(task,"success");
            callback();
        },task['finishTime']);
    },err=>{

    });
};

tqs.run(3001);


