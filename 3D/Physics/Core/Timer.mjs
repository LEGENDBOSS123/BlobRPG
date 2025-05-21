
class Timer {
    constructor() {
        this.totalTime = 0;
        this.lastTime = null;
        this.running = true;
        this.offscreen = false;
        this.stopQueue = new Set();
        this.schedules = new Set();
        document.addEventListener("visibilitychange",function(){
            this.handleVisibility();
        }.bind(this));
    }
    
    step() {
        if(this.lastTime == null){
            this.lastTime = performance.now();
        }
        if (this.isRunning()) {
            var now = performance.now();
            this.totalTime += now - this.lastTime;
            this.lastTime = now;
        }
        else{
            this.lastTime = performance.now();
        }
        for(var job of this.schedules){
            job.step(this.totalTime);
        }
    }
    
    isRunning(){
        return this.running && (this.stopQueue.size == 0) && !this.offscreen;
    }

    schedule(job) {
        job.setTimer(this);
        if(job.isStop){
            this.stopQueue.add(job);
        }
        this.schedules.add(job);
    }

    pause(){
        this.running = false;
    }

    play(){
        this.running = true;
    }
    
    handleVisibility() {
        if (document.hidden) {
            this.offscreen = true;
        } else {
            this.offscreen = false;
            this.lastTime = performance.now();
        }
    }
    
    getTime() {
        return this.totalTime;
    }
    
    static Stop = class {
        constructor(duration) {
            this.duration = duration;
            this.timer = null;
            this.isStop = true;
        }

        setTimer(timer){
            this.timer = timer;
            setTimeout(function(){
                this.timer.stopQueue.delete(this);
                this.timer.schedules.delete(this);
            }.bind(this), this.duration)
        }
    }

    static Interval = class {
        constructor(duration, job) {
            this.duration = duration;
            this.job = job;
            this.timer = null;
            this.startTime = null;
            this.isInterval = true;
        }

        setTimer(timer){
            this.timer = timer;
            this.startTime = this.timer.getTime();
        }

        step(){
            var timeAccumulated = this.timer.getTime() - this.startTime;
            while(timeAccumulated > 0){
                this.startTime += this.duration;
                timeAccumulated -= this.duration;
                this.job?.();
            }
        }

        getLerpAmount(){
            return (this.timer.getTime() - this.startTime)/this.duration + 1;
        }
    }
}


// var a = new Timer();

// var interv = new Timer.Interval(500, function(){console.log(performance.now())});
// a.schedule(interv);
// var anim = function(){
//     a.step();
//     requestAnimationFrame(anim);
// }

// anim();

export default Timer;