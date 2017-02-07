/**
 * Created by jackyanjiaqi on 17/1/22.
 */
import {server} from '../../TaskQueueService';

let tqs = new server.TaskQueueService();
tqs.setTaskPoolMax(5);
tqs.setWaitingTime(2000);

tqs.execute = (task:server.Task)=>{
    procedure1(task,err1=>{
        if(!err1){
            procedure2(task,err2=>{
                if(!err2){
                    tqs.endTask(task,0,"All done!");
                }
            })
        }
    });
};

let procedure1 = (task:server.Task,next:Function)=>{
    setTimeout(()=>{
        //有一定几率出错
        if(Math.random()>0.7){
            tqs.interruptTask(task,'Procedure1 Error!');
            next('error');
        }else{
            next();
        }
    },1000);
};

let procedure2 = (task:server.Task,next:Function)=>{
    setTimeout(()=>{
        //有一定几率出错
        if(Math.random()>0.8){
            tqs.interruptTask(task,'Procedure2 Error!');
            next('error');
        }else{
            next();
        }
    },1000);
};

tqs.run();