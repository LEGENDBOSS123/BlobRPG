import Inventory from "./Inventory.mjs";
import WebComponent from "../WebComponent.mjs";


const Hotbar = class extends Inventory {
    constructor(options) {
        super(options);
        this.selectedSlot = null;
    }

    createHTML(options){
        super.createHTML(options);
        this.html.style.width = "100%";
        this.html.style.height = "100%";
        this.modal.html.style.borderRadius = `calc(var(--border-radius-medium) + ${options.gap ?? "8px"})`;
        return this.html;
    }

    setupEventListeners() {
        super.setupEventListeners();
        for (var s_ in this.slots[0]) {
            var s = this.slots[0][s_];
            var index = Array.from(s.html.parentElement.children).indexOf(s.html);
            (function (s, index) {
                var f = function () {
                    var allSelected = document.querySelectorAll(".inventory-slot.selected");
                    s.html.classList.add("selected");
                    for (var i of allSelected) {
                        i.classList.remove("selected");
                    }
                    if (document.querySelector(".inventory-slot.selected")) {
                        this.selectedSlot = index;
                    }
                    else {
                        this.selectedSlot = null;
                    }
                }.bind(this);
                this.addEventListener("hotbar " + index + " click", s.html, "click", f);
                var x = function (e) {
                    if (e.key == (index + 1).toString()) {
                        f();
                    }
                }.bind(this);
                this.addEventListener("hotbar " + index + " keydown", document, "keydown", x);
            }.bind(this))(s, index);
        }
    }

    destroy() {
        super.destroy();
        this.selectedSlot = null;
    }
}


export default Hotbar;