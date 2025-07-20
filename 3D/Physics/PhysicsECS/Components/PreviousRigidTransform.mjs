import Vector3 from "../../Math3D/Vector3.mjs";
import Quaternion from "../../Math3D/Quaternion.mjs";

export default class PreviousRigidTransform {
    constructor(position, rotation) {
        this.position = Vector3.from(position);
        this.rotation = Quaternion.from(rotation);
    }
}