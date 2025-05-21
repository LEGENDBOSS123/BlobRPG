var ParticleSystem = class {
    constructor(options){
        this.particles = new Set();
        this.timer = options?.timer ?? null;
        this.gameEngine = options?.gameEngine ?? null;
        this.maxParticles = options?.maxParticles ?? 64;
    }

    addParticle(particle){
        if(this.particles.size > this.maxParticles){
            return;
        }
        particle.startTime = this.timer.getTime();
        particle.setMeshAndAddToScene(null, this.gameEngine);
        this.particles.add(particle);
    }

    removeParticle(particle){
        this.particles.delete(particle);
    }

    update(){
        for(var p of this.particles){
            var dt = this.timer.getTime() - p.startTime;
            if(dt > p.duration){
                p.removed();
                this.removeParticle(p);
                continue;
            }
            p.update(this.timer.getTime() - p.startTime);
        }
    }
}

export default ParticleSystem;