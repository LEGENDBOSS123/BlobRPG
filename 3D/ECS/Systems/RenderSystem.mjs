import System from "../System.mjs";
import Renderable from "../Components/Renderable.mjs";
import Transform from "../Components/Transform.mjs";

export class RenderSystem extends System {
    update() {
        for (const e of this.world.registry.view(Transform, Renderable)) {
            const { mesh } = e.get(Renderable);
            const { pos, rot, scale } = e.get(Transform);
            mesh.position.set(pos);
            mesh.quaternion.set(rot);
            mesh.scale.set(scale);
        }
    }
}