import Inventory from "./Inventory.mjs";


const Hotbar = class extends Inventory {
    constructor(options) {
        super(options);
        this.selectedSlot = null;
    }

    setupEventListeners() {
        super.setupEventListeners();
        if (this.eventListeners.hotbar) {
            return;
        }
        this.eventListeners.hotbar = [];
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
                s.html.addEventListener("click", f);
                var x = function (e) {
                    if (e.key == (index + 1).toString()) {
                        f();
                    }
                }.bind(this);
                document.addEventListener("keydown", x);
                this.eventListeners.hotbar.push({
                    click: f,
                    keydown: x,
                    remove: function () {
                        s.html.removeEventListener("click", f);
                        document.removeEventListener("keydown", x);
                    }
                });
            }.bind(this))(s, index);
        }
    }

    destroy() {
        for (var i of this.eventListeners.hotbar) {
            i.remove();
        }
        super.destroy();
        this.selectedSlot = null;
    }
}


export default Hotbar;