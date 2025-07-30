import WebComponent from "../WebComponent.mjs";

const ProgressBar = class extends WebComponent {
    constructor(options) {
        super(options);
        this.value = options?.value ?? 100;
        this.min = options?.min ?? 0;
        this.max = options?.max ?? 100;
        this.title = options?.title ?? "";
        this.useMinAsLeftText = options?.useMinAsLeftText ?? false;
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
        return (this.value - this.min) / (this.max - this.min);
    }

    set ratio(value) {
        this.value = value * (this.max - this.min) + this.min;
    }

    createHTML(options) {
        const width = options?.width ?? 750;
        const height = options?.height ?? 60;
        const color1 = options?.color1 ?? "#4CAF50";
        const color2 = options?.color2 ?? "#8BC34A";

        this.html = document.createElement("div");
        this.html.classList.add("progress-bar");
        this.html.style.width = `${width}px`;
        this.html.style.height = `${height}px`;

        this.fillElement = document.createElement("div");
        this.fillElement.classList.add("progress-bar-fill");
        this.fillElement.style.background = `linear-gradient(to right, ${color1}, ${color2})`;
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

    update() {
        const percentage = this.ratio * 100;
        if (this.fillElement && this.fillElement.style.width != `${percentage}%`) {
            this.fillElement.style.width = `${percentage}%`;
        }
        const leftText = (this.useMinAsLeftText ? this.min : this.value).toString();
        if (this.leftTextElement && this.leftTextElement.textContent != leftText) {
            this.leftTextElement.textContent = leftText;
        }
        if (this.rightTextElement && this.rightTextElement.textContent != this.max.toString()) {
            this.rightTextElement.textContent = this.max;
        }
        if (this.middleTextElement && this.middleTextElement.textContent != this.title) {
            this.middleTextElement.textContent = this.title;
        }
    }

    destroy(){
        super.destroy();
        this.parent = null;
        this.fillElement = null;
        this.leftTextElement = null;
        this.rightTextElement = null;
        this.middleTextElement = null;
    }
}

export default ProgressBar;