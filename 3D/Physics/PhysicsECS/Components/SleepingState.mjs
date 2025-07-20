
export default class SleepingState{
    constructor(sleeping = false, sleepCounter = 0, maxSleepCounter = 0, isSleepy = false) {
        this.sleeping = sleeping;
        this.sleepCounter = sleepCounter;
        this.maxSleepCounter = maxSleepCounter;
        this.isSleepy = isSleepy;
    }
}