const POKEAPI_URL = "https://pokeapi.co/api/v2";
const TYPE_IDS = {
    "normal": 1,
    "fighting": 2,
    "flying": 3,
    "poison": 4,
    "ground": 5,
    "rock": 6,
    "bug": 7,
    "ghost": 8,
    "steel": 9,
    "fire": 10,
    "water": 11,
    "grass": 12,
    "electric": 13,
    "psychic": 14,
    "ice": 15,
    "dragon": 16,
    "dark": 17,
    "fairy": 18
};

async function fetchPokemonList() {
    try {
        const response = await axios.get(`${POKEAPI_URL}/pokemon?limit=898`);
        const pokemonList = response.data.results.map((pokemon, index) => ({
            name: pokemon.name,
            url: pokemon.url,
            id: index + 1
        }));
        populateDropdowns(pokemonList);
    } catch (error) {
        console.error('Error fetching Pokémon list:', error);
    }
}

function populateDropdowns(pokemonList) {
    const primaryDropdown = $('#primaryPokemonDropdown');
    const secondaryDropdown = $('#secondaryPokemonDropdown');

    pokemonList.forEach(pokemon => {
        const option = new Option(`${pokemon.id} - ${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}`, pokemon.name);
        primaryDropdown.append($(option).clone());
        secondaryDropdown.append($(option));
    });

    primaryDropdown.select2({
        placeholder: 'Select a Pokémon',
        allowClear: true
    });
    secondaryDropdown.select2({
        placeholder: 'Select a Pokémon',
        allowClear: true
    });
}

async function fetchPokemonData(pokemonName) {
    try {
        const response = await axios.get(`${POKEAPI_URL}/pokemon/${pokemonName.toLowerCase()}`);
        const data = response.data;
        const types = data.types.map(typeInfo => typeInfo.type.name);
        const baseStats = {};
        data.stats.forEach(statInfo => {
            let statName = statInfo.stat.name;
            let statValue = statInfo.base_stat;
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
            baseStats[statName] = statValue;
        });
        const mainAbility = data.abilities.find(abilityInfo => !abilityInfo.is_hidden).ability.name;
        const passiveAbility = data.abilities.find(abilityInfo => abilityInfo.is_hidden)?.ability.name || 'None';
        const spriteUrl = data.sprites.front_default;

        return { types, baseStats, mainAbility, passiveAbility, spriteUrl };
    } catch (error) {
        console.error(`Error fetching data for ${pokemonName}:`, error);
        alert(`Error fetching data for ${pokemonName}. Please check the name and try again.`);
        return null;
    }
}

function displayPokemonData(pokemonData, elementId, spriteElementId) {
    const element = document.getElementById(elementId);
    const spriteElement = document.getElementById(spriteElementId);
    const typeSprites = pokemonData.types.map(type => 
        `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/${TYPE_IDS[type]}.png" alt="${type}" title="${type}">`
    ).join(' ');
    element.innerHTML = `
        <h4>Types: ${typeSprites}</h4>
        <h5>Base Stats:</h5>
        <ul>
            ${Object.entries(pokemonData.baseStats).map(([key, value]) => `<li>${key}: ${value}</li>`).join('')}
        </ul>
        <h5>Main Ability: ${pokemonData.mainAbility}</h5>
        <h5>Passive Ability: ${pokemonData.passiveAbility}</h5>
    `;
    spriteElement.innerHTML = `<img src="${pokemonData.spriteUrl}" alt="${elementId} sprite">`;
}

function averageStats(primaryStats, secondaryStats) {
    let averagedStats = {};
    for (let stat in primaryStats) {
        averagedStats[stat] = Math.round((primaryStats[stat] + secondaryStats[stat]) / 2);
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
        baseStats: fusedStats,
    };

    return fusedPokemon;
}

async function typeEffectivenessChart(types) {
    const effectiveness = {
        double: new Set(),
        half: new Set(),
        none: new Set()
    };

    for (const type of types) {
        try {
            const response = await axios.get(`${POKEAPI_URL}/type/${TYPE_IDS[type]}`);
            const damageRelations = response.data.damage_relations;

            damageRelations.double_damage_from.forEach(d => effectiveness.double.add(d.name));
            damageRelations.half_damage_from.forEach(d => effectiveness.half.add(d.name));
            damageRelations.no_damage_from.forEach(d => effectiveness.none.add(d.name));
        } catch (error) {
            console.error(`Error fetching type effectiveness for ${type}:`, error);
        }
    }

    return {
        double: Array.from(effectiveness.double),
        half: Array.from(effectiveness.half),
        none: Array.from(effectiveness.none)
    };
}

function displayTypeEffectiveness(effectiveness) {
    const typeEffectivenessElement = document.getElementById('typeEffectiveness');
    typeEffectivenessElement.innerHTML = `
        <h5>Type Effectiveness:</h5>
        <div class="type-effectiveness">
            ${effectiveness.double.length ? `
                <ln>2x Damage From: ${effectiveness.double.map(type => `
                    <div>
                        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/${TYPE_IDS[type]}.png" alt="${type}">
                        
                    </div>`).join('')}
                </ln>` : ''}
            ${effectiveness.half.length ? `
                <ln>0.5x Damage From: ${effectiveness.half.map(type => `
                    <div>
                        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/${TYPE_IDS[type]}.png" alt="${type}">
                        
                    </div>`).join('')}
                </ln>` : ''}
            ${effectiveness.none.length ? `
                <ln>0x Damage From: ${effectiveness.none.map(type => `
                    <div>
                        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/${TYPE_IDS[type]}.png" alt="${type}">
                        
                    </div>`).join('')}
                </ln>` : ''}
        </div>
    `;
}

async function searchFusionCandidate(primaryStats, primaryName) {
    try {
        const response = await axios.get(`${POKEAPI_URL}/pokemon?limit=898`);
        const pokemonList = response.data.results.map((pokemon, index) => ({
            name: pokemon.name,
            url: pokemon.url,
            id: index + 1
        }));

        const primaryTotalStats = Object.values(primaryStats).reduce((a, b) => a + b, 0);
        const primaryHighestStats = Object.entries(primaryStats).sort((a, b) => b[1] - a[1]).slice(0, 2);
        const primaryLowestStat = Object.entries(primaryStats).sort((a, b) => a[1] - b[1])[0];

        const fusionCandidates = await Promise.all(pokemonList.map(async pokemon => {
            if (pokemon.name !== primaryName.toLowerCase()) {
                const data = await fetchPokemonData(pokemon.name);
                if (data) {
                    const totalStats = Object.values(data.baseStats).reduce((a, b) => a + b, 0);
                    const highestStats = Object.entries(data.baseStats).sort((a, b) => b[1] - a[1]).slice(0, 2);
                    const lowestStat = Object.entries(data.baseStats).sort((a, b) => a[1] - b[1])[0];

                    if (totalStats >= primaryTotalStats - 50) {
                        if (highestStats[0][0] === primaryHighestStats[0][0] &&
                            highestStats[1][0] === primaryHighestStats[1][0] &&
                            lowestStat[0] === primaryLowestStat[0]) {
                            return pokemon;
                        }
                    }
                }
            }
            return null;
        }));

        const filteredCandidates = fusionCandidates.filter(pokemon => pokemon !== null);

        return filteredCandidates;
    } catch (error) {
        console.error('Error searching for fusion candidates:', error);
        return [];
    }
}

function swapPokemon() {
    const temp = window.primaryPokemonData;
    window.primaryPokemonData = window.secondaryPokemonData;
    window.secondaryPokemonData = temp;

    displayPokemonData(window.primaryPokemonData, 'primaryData', 'primarySprite');
    displayPokemonData(window.secondaryPokemonData, 'secondaryData', 'secondarySprite');
}

async function fetchAndDisplayPrimaryPokemon() {
    const primaryPokemonName = $('#primaryPokemonDropdown').val();
    const primaryPokemonData = await fetchPokemonData(primaryPokemonName);
    if (primaryPokemonData) {
        displayPokemonData(primaryPokemonData, 'primaryData', 'primarySprite');
        window.primaryPokemonData = primaryPokemonData;

        const effectiveness = await typeEffectivenessChart(primaryPokemonData.types);
        displayTypeEffectiveness(effectiveness);
    }
}

async function fetchAndDisplaySecondaryPokemon() {
    const secondaryPokemonName = $('#secondaryPokemonDropdown').val();
    const secondaryPokemonData = await fetchPokemonData(secondaryPokemonName);
    if (secondaryPokemonData) {
        displayPokemonData(secondaryPokemonData, 'secondaryData', 'secondarySprite');
        window.secondaryPokemonData = secondaryPokemonData;

        const effectiveness = await typeEffectivenessChart(secondaryPokemonData.types);
        displayTypeEffectiveness(effectiveness);
    }
}

async function fuseAndDisplayPokemon() {
    if (window.primaryPokemonData && window.secondaryPokemonData) {
        const fusedPokemon = fusePokemon(window.primaryPokemonData, window.secondaryPokemonData);
        displayPokemonData(fusedPokemon, 'fusedData', 'fusedSprite');

        const effectiveness = await typeEffectivenessChart(fusedPokemon.types);
        displayTypeEffectiveness(effectiveness);
    } else {
        alert('Please fetch data for both Pokémon before fusing.');
    }
}

async function searchAndDisplayFusionCandidate() {
    if (!window.primaryPokemonData) {
        alert('Please fetch data for the primary Pokémon first.');
        return;
    }

    const primaryStats = window.primaryPokemonData.baseStats;
    const primaryName = $('#primaryPokemonDropdown').val();
    const pokemonList = await searchFusionCandidate(primaryStats, primaryName);
    if (pokemonList.length === 0) {
        alert('No fusion candidates found. Try fetching data for another primary Pokémon.');
    } else {
        const randomIndex = Math.floor(Math.random() * pokemonList.length);
        const fusionCandidateName = pokemonList[randomIndex].name;
        const fusionCandidateData = await fetchPokemonData(fusionCandidateName);
        if (fusionCandidateData) {
            displayPokemonData(fusionCandidateData, 'secondaryData', 'secondarySprite');
            window.secondaryPokemonData = fusionCandidateData;

            const effectiveness = await typeEffectivenessChart(fusionCandidateData.types);
            displayTypeEffectiveness(effectiveness);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchPokemonList();

    document.getElementById('fetchPrimary').addEventListener('click', fetchAndDisplayPrimaryPokemon);
    document.getElementById('fetchSecondary').addEventListener('click', fetchAndDisplaySecondaryPokemon);
    document.getElementById('fusePokemon').addEventListener('click', fuseAndDisplayPokemon);
    document.getElementById('swapPokemon').addEventListener('click', swapPokemon);
    document.getElementById('searchFusionCandidate').addEventListener('click', searchAndDisplayFusionCandidate);
});
