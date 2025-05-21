
var Hotbar = class {
    constructor(options) {
        this.slotSize = options?.slots?.length ?? options?.slotSize ?? 9;
        this.slots = options?.slots ?? Array(this.slotSize).fill(null);
        this.hotbarItems = Array(this.slotSize).fill(null);
        this.activeSlot = options?.activeSlot ?? null;
        this.document = options.document;
        this.document.addEventListener("keydown", this._onKeyDown.bind(this));
    }

    _onKeyDown(event) {
        if (parseInt(event.key) >= 1 && parseInt(event.key) <= 9) {
            this.switchSlot(parseInt(event.key) - 1);
        }
    }

    switchSlot(activeSlot) {
        if (this.slots[this.activeSlot] != null) {
            if (this.slots[this.activeSlot].holding == true) {
                return;
            }
        }

        if (this.activeSlot == activeSlot) {
            if (this.slots[activeSlot]) {
                this.slots[activeSlot].active = false;
            }
            this.activeSlot = null;
        }
        else {
            if (this.slots[activeSlot]) {
                this.slots[activeSlot].active = true;
            }
            if (this.slots[this.activeSlot]) {
                this.slots[this.activeSlot].active = false;
            }
            this.activeSlot = activeSlot;
        }
        this.update();
    }

    addAbility(ability, slot) {
        if (!slot) {
            for (let i = 0; i < this.slotSize; i++) {
                if (this.slots[i] == null || i == this.activeSlot) {
                    slot = i + 1;
                    break;
                }
            }
        }
        slot -= 1;
        if (this.slots[slot]) {
            this.removeAbility(slot);
        }
        this.hotbarItems[slot].appendChild(ability.html);
        this.slots[slot] = ability;
    }

    removeAbility(slot) {
        if (!this.slots[slot]) {
            return;
        }
        this.hotbarItems[slot].removeChild(this.slots[slot].html);
        this.slots[slot] = null;
    }

    createHTML(options) {
        var document = this.document;
        var container = options.container;
        var aspectRatio = options.aspectRatio ?? 1;
        container.innerHTML = '';

        container.style.display = 'flex';
        container.style.justifyContent = 'space-between';
        container.style.gap = '5px';
        container.style.padding = '10px';
        container.style.border = '1px solid black';
        container.style.boxSizing = 'border-box';

        for (let i = 0; i < this.slotSize; i++) {
            const index = i;
            const hotbarItemContainer = document.createElement('div');
            hotbarItemContainer.style.flex = '1 1 0';
            hotbarItemContainer.style.display = 'flex';
            hotbarItemContainer.style.alignItems = 'center';
            hotbarItemContainer.style.justifyContent = 'center';

            const hotbarItem = document.createElement('div');
            hotbarItem.style.aspectRatio = aspectRatio.toString();
            hotbarItem.style.maxWidth = '100%';
            hotbarItem.style.maxHeight = '100%';
            hotbarItem.style.backgroundColor = 'gray';
            hotbarItem.style.position = 'absolute';
            hotbarItem.style.border = '5px solid black';
            hotbarItem.style.borderRadius = '7.5%';


            const hotbarNumber = document.createElement('div');
            hotbarNumber.style.position = 'absolute';
            hotbarNumber.style.width = '20px';
            hotbarNumber.style.height = '20px';
            hotbarNumber.style.backgroundColor = 'white';
            hotbarNumber.style.border = '1px solid black';
            hotbarNumber.style.borderRadius = '50%';
            hotbarNumber.style.display = 'flex';
            hotbarNumber.style.alignItems = 'center';
            hotbarNumber.style.justifyContent = 'center';
            hotbarNumber.style.zIndex = '1';
            hotbarNumber.innerText = (i + 1).toString();

            const updateSize = function () {
                var minWH = Math.min(hotbarItemContainer.clientWidth, hotbarItemContainer.clientHeight * aspectRatio);
                hotbarItem.style.width = minWH + 'px';
            }

            var resizeObserver = new ResizeObserver(updateSize);
            resizeObserver.observe(hotbarItemContainer);

            hotbarItemContainer.appendChild(hotbarItem);
            hotbarItem.appendChild(hotbarNumber);
            container.appendChild(hotbarItemContainer);

            hotbarItem.addEventListener("click", function () {
                this.switchSlot(index);
            }.bind(this));
            this.hotbarItems[i] = hotbarItem;
        }
    }

    update() {
        for (let i = 0; i < this.slotSize; i++) {
            this.hotbarItems[i].style.border = '5px solid gray';
            if (this.slots[i]) {
                this.slots[i].update();
            }
        }
        if (this.activeSlot != null) {
            this.hotbarItems[this.activeSlot].style.border = '5px solid lightgreen';
        }
    }
}

export default Hotbar;