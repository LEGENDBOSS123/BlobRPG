
import Component from "../../../ECS/Component.mjs";
import Vector3 from "../../Math3D/Vector3.mjs";

export default class Acceleration extends Component {
    constructor() {
        this.linear = new Vector3();
        this.angular = new Vector3();
    }
}