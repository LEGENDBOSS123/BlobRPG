import Vector3 from "../Math3D/Vector3.mjs";
import Hitbox3 from "../Broadphase/Hitbox3.mjs";


const MARGIN = 0.2;
const MARGIN_VECTOR = new Vector3(MARGIN, MARGIN, MARGIN);
const Node = class {
    constructor() {
        this.parent = null;
        this.children = [];
        this.hitbox = new Hitbox3();
        this.id = null;
    }

    isLeaf() {
        return this.children.length === 0;
    }
}


const DBVH = class {
    constructor() {
        this.root = null;
        this.nodes = new Map();
    }

    /**
     * Adds a hitbox to the DBVH.
     * @param {Hitbox3} hitbox The hitbox to add.
     * @param {*} id The unique identifier for the hitbox.
     */
    addHitbox(hitbox, id) {
        if (this.nodes.has(id)) {
            if (this.nodes.get(id).hitbox.contains(hitbox)) {
                return;
            }
            this.removeHitbox(id);
        }

        const newNode = new Node();
        newNode.hitbox = hitbox.extend(MARGIN_VECTOR);
        newNode.id = id;
        this.nodes.set(id, newNode);

        if (!this.root) {
            this.root = newNode;
            return;
        }

        let bestNode = this.findBestNodeForInsertion(newNode);
        this.insertNode(newNode, bestNode);
    }

    /**
     * Finds the best node in the tree to insert a new node.
     * @param {Node} newNode The node to be inserted.
     * @returns {Node} The best node to insert under.
     */
    findBestNodeForInsertion(newNode) {
        let currentNode = this.root;

        while (!currentNode.isLeaf()) {
            let bestChild = null;
            let bestCost = Infinity;

            for (const child of currentNode.children) {
                const mergedHitbox = child.hitbox.copy();
                mergedHitbox.merge(newNode.hitbox);
                const cost = mergedHitbox.getSurfaceArea();

                if (cost < bestCost) {
                    bestCost = cost;
                    bestChild = child;
                }
            }
            currentNode = bestChild;
        }
        return currentNode;
    }

    /**
     * Inserts a new node into the tree under a specified parent.
     * @param {Node} newNode The new node to insert.
     * @param {Node} siblingNode The node that will become the new node's sibling.
     */
    insertNode(newNode, siblingNode) {
        const oldParent = siblingNode.parent;
        const newParent = new Node();
        newParent.parent = oldParent;
        newParent.hitbox = siblingNode.hitbox.copy();
        newParent.hitbox.merge(newNode.hitbox);
        newParent.children.push(siblingNode, newNode);
        siblingNode.parent = newParent;
        newNode.parent = newParent;

        if (oldParent) {
            const index = oldParent.children.indexOf(siblingNode);
            oldParent.children.splice(index, 1, newParent);
        } else {
            this.root = newParent;
        }

        this.updateAncestors(newParent.parent);
    }


    /**
     * Removes a hitbox from the DBVH.
     * @param {*} id The unique identifier of the hitbox to remove.
     */
    removeHitbox(id) {
        const nodeToRemove = this.nodes.get(id);
        if (!nodeToRemove) {
            return;
        }

        this.nodes.delete(id);
        this.removeNode(nodeToRemove);
    }

    /**
     * Removes a node from the tree.
     * @param {Node} nodeToRemove The node to remove.
     */
    removeNode(nodeToRemove) {
        const parent = nodeToRemove.parent;

        if (!parent) {
            this.root = null;
            return;
        }

        const sibling = parent.children.find(child => child !== nodeToRemove);
        const grandparent = parent.parent;

        if (grandparent) {
            const parentIndex = grandparent.children.indexOf(parent);
            grandparent.children.splice(parentIndex, 1, sibling);
            sibling.parent = grandparent;
            this.updateAncestors(grandparent);
        } else {
            this.root = sibling;
            sibling.parent = null;
        }
    }


    /**
     * Updates the hitboxes of all ancestors of a node.
     * @param {Node} node The starting node.
     */
    updateAncestors(node) {
        while (node) {
            const child1 = node.children[0];
            const child2 = node.children[1];

            node.hitbox = child1.hitbox.copy();
            if (child2) {
                node.hitbox.merge(child2.hitbox);
            }

            node = node.parent;
        }
    }

    /**
     * Queries the DBVH for potential collisions with a given hitbox.
     * @param {*} id The id of the hitbox to query with.
     * @param {function} func The callback function to execute for each potential collision.
     */
    query(id, func) {
        const queryNode = this.nodes.get(id);
        if (!queryNode) {
            return;
        }

        const queryHitbox = queryNode.hitbox;
        const stack = [this.root];

        while (stack.length > 0) {
            const node = stack.pop();

            if (!node || !queryHitbox.intersects(node.hitbox)) {
                continue;
            }

            if (node.isLeaf()) {
                if (node.id !== id) {
                    func(node.id);
                }
            } else {
                stack.push(...node.children);
            }
        }

    }
}


export default DBVH;