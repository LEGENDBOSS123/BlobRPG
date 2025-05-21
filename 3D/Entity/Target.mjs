
var Target = class {
    constructor(options) {
        this.followID = options?.followID ?? null;
        this.threatLevel = options?.threatLevel ?? 0;
    }
}

export default Target;