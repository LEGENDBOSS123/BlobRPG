import Matrix3 from "../../Math3D/Matrix3.mjs";

export default class Mass {
    constructor(mass = 1, inertia = Matrix3.identity()) {
        
        this.mass = mass;
        this.inverseMass = 1 / mass;

        this.inertia = inertia;
        this.inverseInertia = inertia.invert();
    }
}