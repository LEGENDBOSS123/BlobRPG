import WebComponent from "../WebComponent.mjs";

const ProgressBar = class extends WebComponent {
    constructor(options) {
        super(options);
        this.value = options?.value ?? 100;
        this.max = options?.max ?? 100;
        this.title = options?.title ?? "";
        this.html = null;
        this.leftTextElement = null;
        this.rightTextElement = null;
        this.middleTextElement = null;
        this.fillElement = null;
    }

    setContainer(container) {
        this.parent = container;
        container.appendChild(this.html);
    }

    get ratio() {
        return this.value / this.max;
    }

    set ratio(value) {
        this.value = value * this.max;
    }

    createHTML(options) {
        const width = options?.width ?? 750;
        const height = options?.height ?? 60;

        this.html = document.createElement("div");
        this.html.classList.add("progress-bar");
        this.html.style.width = `${width}px`;
        this.html.style.height = `${height}px`;

        this.fillElement = document.createElement("div");
        this.fillElement.classList.add("progress-bar-fill");
        this.html.appendChild(this.fillElement);

        this.leftTextElement = document.createElement("span");
        this.leftTextElement.classList.add("progress-bar-text", "progress-bar-text-left");
        this.html.appendChild(this.leftTextElement);

        this.rightTextElement = document.createElement("span");
        this.rightTextElement.classList.add("progress-bar-text", "progress-bar-text-right");
        this.html.appendChild(this.rightTextElement);

        this.middleTextElement = document.createElement("span");
        this.middleTextElement.classList.add("progress-bar-text", "progress-bar-text-middle");
        this.html.appendChild(this.middleTextElement);

        this.setContainer(options.container);

        this.update();
    }

    update(){
        if(this.fillElement){
            const percentage = this.ratio * 100;
            this.fillElement.style.width = `${percentage}%`;
        }
        if(this.leftTextElement){
            this.leftTextElement.textContent = this.value;
        }
        if(this.rightTextElement){
            this.rightTextElement.textContent = this.max;
        }
        if(this.middleTextElement){
            this.middleTextElement.textContent = this.title;
        }
    }
}

export default ProgressBar;