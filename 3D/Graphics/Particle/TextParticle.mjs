import Particle from "./Particle.mjs";

var TextParticle = class extends Particle{
    constructor(options) {
        super(options);
        this.text = options?.text ?? "";
    }

    updateCanvas(time) {
        if(this.createdCanvasTexture){
            return;
        }
        var canvas = this.canvas.canvas;
        var ctx = this.canvas.ctx;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = this.color;
        ctx.font = '32px Arial';
        ctx.lineWidth = 2;
        ctx.strokeStyle = this.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(this.text, canvas.width / 2, canvas.height / 2);
        ctx.fillText(this.text, canvas.width / 2, canvas.height / 2);
        this.texture.needsUpdate = true;
        this.createdCanvasTexture = true;
    }
}


export default TextParticle;