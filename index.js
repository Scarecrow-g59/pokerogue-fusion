const axios = require('axios');

class Pokemon {
    constructor(name) {
        this.name = name;
    }

    async fetchData() {
        try {
            const url = `https://pokeapi.co/api/v2/pokemon/${this.name.toLowerCase()}`;
            const { data } = await axios.get(url);

            // Get Types
            this.types = data.types.map(typeInfo => typeInfo.type.name);

            // Get Base Stats
            this.baseStats = {};
            data.stats.forEach(statInfo => {
                let statName = statInfo.stat.name;
                let statValue = statInfo.base_stat;
                // Convert stat names to match your desired format
                switch (statName) {
                    case 'hp':
                        statName = 'HP';
                        break;
                    case 'attack':
                        statName = 'Attack';
                        break;
                    case 'defense':
                        statName = 'Defense';
                        break;
                    case 'special-attack':
                        statName = 'SpAtk';
                        break;
                    case 'special-defense':
                        statName = 'SpDef';
                        break;
                    case 'speed':
                        statName = 'Speed';
                        break;
                }
                this.baseStats[statName] = statValue;
            });

            // Get Abilities
            this.mainAbility = data.abilities.find(abilityInfo => !abilityInfo.is_hidden).ability.name;
            this.passiveAbility = data.abilities.find(abilityInfo => abilityInfo.is_hidden)?.ability.name || 'None';

            // Example defaults for other properties
            this.level = 50;
            this.IVs = { HP: 15, Attack: 15, Defense: 15, SpAtk: 15, SpDef: 15, Speed: 15 };
            this.nature = 'Modest';
            this.luck = 1;

            console.log(`${this.name} fetched:`, this);

        } catch (error) {
            console.error(`Error fetching data for ${this.name}:`, error);
        }
    }
}

function averageStats(primaryStats, secondaryStats) {
    let averagedStats = {};
    for (let stat in primaryStats) {
        averagedStats[stat] = (primaryStats[stat] + secondaryStats[stat]) / 2;
    }
    return averagedStats;
}

function fusePokemon(primary, secondary) {
    let fusedTypes = [primary.types[0]];
    if (secondary.types[1] && secondary.types[1] !== primary.types[0]) {
        fusedTypes.push(secondary.types[1]);
    } else if (secondary.types[0] !== primary.types[0]) {
        fusedTypes.push(secondary.types[0]);
    }

    let fusedStats = averageStats(primary.baseStats, secondary.baseStats);

    let fusedPokemon = {
        types: fusedTypes,
        mainAbility: secondary.mainAbility,
        passiveAbility: primary.passiveAbility,
        level: primary.level,
        IVs: primary.IVs,
        nature: primary.nature,
        luck: primary.luck + secondary.luck,
        baseStats: fusedStats,
    };

    return fusedPokemon;
}

// Example usage
(async () => {
    let charizard = new Pokemon("Charizard");
    let houndoom = new Pokemon("Houndoom");

    await charizard.fetchData();
    await houndoom.fetchData();

    let fusedPokemon = fusePokemon(charizard, houndoom);
    console.log('Fused Pokemon:', fusedPokemon);
})();
