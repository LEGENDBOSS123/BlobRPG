
import Vector3 from "../../Physics/Math3D/Vector3.mjs";
import Quaternion from "../../Physics/Math3D/Quaternion.mjs";

export default class Transform {
    constructor(position, rotation, scale) {
        this.position = Vector3.from(position);
        this.rotation = Quaternion.from(rotation);
        this.scale = Vector3.from(scale);
    }
}