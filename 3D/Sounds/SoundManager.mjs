import GameEngineComponent from "../GameEngineComponent.mjs";

const SoundManager = class extends GameEngineComponent{
    constructor(options) {
        super(options);
        this.sounds = {};
        this.audioContext = new window.AudioContext();
        this.masterGain = this.audioContext.createGain();
        this.setVolume(1);
        this.masterGain.connect(this.audioContext.destination);
        this.assetsDirectory = options?.assetsDirectory ?? new URL('.', import.meta.url).href + "Assets/";
    }

    resolvePath(path) {
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('file://') || path.startsWith('./')) {
            return path;
        }
        return new URL(path, this.assetsDirectory).href;
    }

    async addSound(name, url) {
        const path = this.resolvePath(url);
        if (this.sounds[name]) {
            return console.warn(`Sound ${name} already exist`);
        }
        try {
            const response = await fetch(path);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            this.sounds[name] = audioBuffer;
        } catch (error) {
            console.error(`Failed to load sound ${name}:`, error);
        }
    }

    async addSounds(sounds) {
        for (const name in sounds) {
            await this.addSound(name, sounds[name]);
        }
    }

    setVolume(v = 1){
        this.masterGain.gain.value = v;
    }

    play(name, volume = 1) {
        const buffer = this.sounds[name];
        if (!buffer) {
            return;
        }
        const source = this.audioContext.createBufferSource();
        const gain = this.audioContext.createGain();
        gain.gain.value = volume;
        source.buffer = buffer;
        source.connect(gain);
        gain.connect(this.masterGain);
        source.start(0);
    }
}

export default SoundManager;