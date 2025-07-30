import Entity from "./Entity.mjs";


class Enemy extends Entity {
    constructor(options) {
        super(options);

        this.isEnemy = true;
        this.experienceValue = options?.experienceValue ?? 50;
        this.cashValue = options?.cashValue ?? 100;
        
    }


    defeatedBy(players){
        for(const p of players){
            p.killed(this);
        }
    }

    isAlive(){
        return false;
    }
}


export default Enemy