/**
 * Created by jackyanjiaqi on 17/1/22.
 */
import {client} from '../TaskQueueService';
import * as path from 'path';
//每5~30s随机产生一个任务

client
    .setListenPort(3001)
    .setServerPath(path.join(__dirname,"server/batch.js"));

let taskId = 0;
function test(){
    setTimeout(()=>{
        taskId++;
        //创建一个随机在0~1000ms内完成的耗时项目
        let task = {
            name:"task"+taskId,
            finishTime:Math.floor(Math.random()*1000 as number)
        };
        client.informNewTask(task,res=>{
            if("error" in res){
                console.log(task.name,res['error']);
            }else{
                console.log(task.name,"Done!");
            }
        });
        if(taskId<=10){
            test();
        }
    },1000);
}

test();

