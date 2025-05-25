import Toast from "./Toast.mjs";

const ToastManager = class {
    constructor(options) {
        this.parent = null;
        this.html = null;
        
    }

    createHTML(options){
        var container = options.container;
        var width = options?.width ?? 750;
        this.parent = container;
        this.html = document.createElement("div");
        this.html.classList.add("toast-container");
        this.html.style.width = `${width}px`;
        this.parent.appendChild(this.html);

        return this.html;
    }

    createToast(options){
        var toast = new Toast(options);
        toast.createHTML();
        this.html.appendChild(toast.html);
        return toast;
    }
}

export default ToastManager;