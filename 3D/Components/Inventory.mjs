import GameEngineComponent from "../GameEngineComponent.mjs";

class Inventory extends GameEngineComponent {
    constructor(options) {
        super(options);
        this.columns = options?.columns ?? 8;
        this.rows = options?.rows ?? 4;
        this.size = this.columns * this.rows;
        this.items = new Array(this.size).fill(null);
        this.inventoryUI = options?.inventoryUI ?? null;
        this.selectedIndex = -1;
    }

    onQuantityUpdate(index) {
        this.onItemUpdated(index);
    }

    onItemUpdated(index) {
        this.inventoryUI?.updateItem(index);
    }

    addItem(item) {
        let remainingQuantity = item.quantity;
        const indexes = [];
        for (let i = 0; i < this.items.length; i++) {
            const currentItem = this.items[i];
            if (currentItem == null) {
                remainingQuantity = 0;
                indexes.push(i);
                break;
            }
            else if (currentItem.canStackWith(item)) {
                const more = currentItem.maxStack - currentItem.quantity;
                if (more <= 0) {
                    continue;
                }
                if (more >= remainingQuantity) {
                    remainingQuantity = 0;
                    indexes.push(i);
                    break;
                }
                else {
                    remainingQuantity -= more;
                    indexes.push(i);
                }
            }
            if (remainingQuantity == 0) {
                break;
            }
        }
        if (remainingQuantity > 0) {
            return false;
        }
        remainingQuantity = item.quantity;

        for (let index of indexes) {
            const currentItem = this.items[index];
            if (currentItem == null) {
                this.items[index] = item.clone();
                this.onItemUpdated(index);
                return true;
            }
            else {
                const more = currentItem.maxStack - currentItem.quantity;
                if (more >= remainingQuantity) {
                    currentItem.quantity += remainingQuantity;
                    this.onQuantityUpdate(index);
                    return true;
                }
                else {
                    remainingQuantity -= more;
                    currentItem.quantity = currentItem.maxStack;
                    this.onQuantityUpdate(index);
                }

            }
        }
        return true;
    }

    swapOrStackItems(myIndex, otherInventory, otherIndex) {
        const myItem = this.items[myIndex];
        const otherItem = otherInventory.items[otherIndex];
        let swap = true;
        if (myItem && otherItem) {
            if (myItem.canStackWith(otherItem)) {
                const more = myItem.maxStack - myItem.quantity;
                if (more > 0) {
                    swap = false;
                    if (otherItem.quantity <= more) {
                        myItem.quantity += otherItem.quantity;
                        otherInventory.items[otherIndex] = null;
                    }
                    else {
                        myItem.quantity = myItem.maxStack;
                        otherItem.quantity -= more;
                    }
                } 
            }
        }

        if (swap) {
            const temp = this.items[myIndex];
            this.items[myIndex] = otherInventory.items[otherIndex];
            otherInventory.items[otherIndex] = temp;
        }

        this.onItemUpdated(myIndex);
        otherInventory.onItemUpdated(otherIndex);

    }

    select(i){
        if(this.selectedIndex == i){
            this.selectedIndex = -1;
        }
        else{
            this.selectedIndex = i;
        }
        this.updateSelectedIndex();
    }


    updateSelectedIndex(selectedIndex = this.selectedIndex){
        this.selectedIndex = selectedIndex;
        this.inventoryUI?.updateSelectedIndex(selectedIndex);
    }

    getSelectedItem(){
        if(this.selectedIndex == -1 || this.items[this.selectedIndex] == null){
            return null;
        }
        return this.items[this.selectedIndex];
    }
}

export default Inventory;