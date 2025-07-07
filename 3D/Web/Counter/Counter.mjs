import WebComponent from "../WebComponent.mjs";

const Counter = class extends WebComponent {
    constructor(options) {
        super(options);
        this.value = options?.value ?? 100;
        this.prefix = options?.prefix ?? "";
        this.postfix = options?.postfix ?? "";
        this.title = options?.title ?? "";
        this.html = null;
        this.titleElement = null;
        this.valueElement = null;
        this.prefixElement = null;
        this.postfixElement = null;
    }

    setContainer(container) {
        this.parent = container;
        container.appendChild(this.html);
    }


    createHTML(options) {
        const height = options?.height ?? 60;

        this.html = document.createElement("div");
        this.html.classList.add("counter-container");
        this.html.style.height = `${height}px`;

        this.titleElement = document.createElement("span");
        this.titleElement.classList.add("title");
        this.titleElement.textContent = this.title;
        this.html.appendChild(this.titleElement);

        this.prefixElement = document.createElement("span");
        this.prefixElement.classList.add("prefix");
        this.prefixElement.textContent = this.prefix;
        this.html.appendChild(this.prefixElement);

        this.counterValueElement = document.createElement("span");
        this.counterValueElement.classList.add("value");
        this.counterValueElement.textContent = this.value;
        this.html.appendChild(this.counterValueElement);

        this.postfixElement = document.createElement("span");
        this.postfixElement.classList.add("postfix");
        this.postfixElement.textContent = this.postfix;
        this.html.appendChild(this.postfixElement);

        this.setContainer(options.container);

        this.update();
    }

    update(){
        if(this.titleElement && this.titleElement.textContent != this.title){
            this.titleElement.textContent = this.title;
        }
        if(this.prefixElement && this.prefixElement.textContent != this.prefix){
            this.prefixElement.textContent = this.prefix;
        }
        if(this.counterValueElement && this.counterValueElement.textContent != this.value){
            this.counterValueElement.textContent = this.value;
        }
        if(this.postfixElement && this.postfixElement.textContent != this.postfix){
            this.postfixElement.textContent = this.postfix;
        }
    }

    destroy(){
        super.destroy();
        this.parent = null;
        this.titleElement = null;
        this.valueElement = null;
        this.prefixElement = null;
        this.postfixElement = null;
    }
}

export default Counter;