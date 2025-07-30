class Experience {

    static baseExperience = 100;

    constructor(options) {

        this.level = 1;
        this.exactLevel = 1;
        this.experienceToLevelUp = 100;
        this.experience = options?.experience ?? 0;

        this.updateExperience(this.experience);
    }

    updateExperience(experience) {
        this.experience = experience;
        this.exactLevel = Math.sqrt(experience / Experience.baseExperience) + 1;
        this.level = Math.floor(this.exactLevel);
        const nextLevelExperience = this.level * this.level * Experience.baseExperience;
        this.experienceToLevelUp = nextLevelExperience - experience;
    }

    gain(experience) {
        this.updateExperience(this.experience + experience);
    }
}


export default Experience;