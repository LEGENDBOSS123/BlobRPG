import System from "../../../ECS/System.mjs";
import Acceleration from "../Components/Acceleration.mjs";
import BodyFlags from "../Components/BodyFlags.mjs";
import Mass from "../Components/Mass.mjs";
import PreviousRigidTransform from "../Components/PreviousRigidTransform.mjs";
import RigidTransform from "../Components/RigidTransform.mjs";
import SleepingState from "../Components/SleepingState.mjs";
import Velocity from "../Components/Velocity.mjs";

export default class IntegrateSystem extends System {
    update(dt){
        const entities = this.world.registry.view(RigidTransform, Velocity);

        for(const e of entities){
            const transform = e.get(RigidTransform);
            const previousTransform = e.get(PreviousRigidTransform);
            const velocity = e.get(Velocity);
            const acceleration = e.get(Acceleration);
            const mass = e.get(Mass);
            const flag = e.get(BodyFlags);
            const sleeping = e.get(SleepingState);

            if(sleeping.sleeping || flag.flag == BodyFlags.KINEMATIC || flag.flag == BodyFlags.STATIC){
                continue;
            }

            previousTransform.position.set(transform.position);
            previousTransform.rotation.set(transform.rotation);


            velocity.linear.addInPlace(acceleration.linear.scale(dt));
            velocity.angular.addInPlace(acceleration.angular.scale(dt));

            transform.position.addInPlace(velocity.linear.scale(dt));
            transform.rotation = transform.rotation.rotateByAngularVelocity(velocity.angular.scale(dt));
            
        }
    }
}