const POKEAPI_URL = "https://pokeapi.co/api/v2";

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
    }
}

function displayPokemonData(pokemonData, elementId, spriteElementId) {
    const element = document.getElementById(elementId);
    const spriteElement = document.getElementById(spriteElementId);
    const typeIcons = pokemonData.types.map(type => `<img src="assets/images/type-icons/${type}.png" alt="${type}" class="type-icon">`).join(' ');
    element.innerHTML = `
        <h4>Types: ${typeIcons}</h4>
        <h5>Base Stats:</h5>
        <ul>
            ${Object.entries(pokemonData.baseStats).map(([key, value]) => `<li>${key}: ${value}</li>`).join('')}
        </ul>
        <h5>Main Ability: ${pokemonData.mainAbility}</h5>
        <h5>Passive Ability: ${pokemonData.passiveAbility}</h5>
    `;
    spriteElement.innerHTML = `<img src="${pokemonData.spriteUrl}" alt="${elementId} sprite" class="sprite">`;
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
        baseStats: fusedStats,
        spriteUrl: primary.spriteUrl
    };

    return fusedPokemon;
}

async function typeEffectivenessChart(types) {
    const typeChart = {
        normal: { weakTo: ['fighting'], resistantTo: [], immuneTo: ['ghost'] },
        fighting: { weakTo: ['flying', 'psychic', 'fairy'], resistantTo: ['rock', 'bug', 'dark'], immuneTo: [] },
        flying: { weakTo: ['rock', 'electric', 'ice'], resistantTo: ['fighting', 'bug', 'grass'], immuneTo: ['ground'] },
        poison: { weakTo: ['ground', 'psychic'], resistantTo: ['fighting', 'poison', 'bug', 'grass', 'fairy'], immuneTo: [] },
        ground: { weakTo: ['water', 'grass', 'ice'], resistantTo: ['poison', 'rock'], immuneTo: ['electric'] },
        rock: { weakTo: ['fighting', 'ground', 'steel', 'water', 'grass'], resistantTo: ['normal', 'flying', 'poison', 'fire'], immuneTo: [] },
        bug: { weakTo: ['flying', 'rock', 'fire'], resistantTo: ['fighting', 'ground', 'grass'], immuneTo: [] },
        ghost: { weakTo: ['ghost', 'dark'], resistantTo: ['poison', 'bug'], immuneTo: ['normal', 'fighting'] },
        steel: { weakTo: ['fighting', 'ground', 'fire'], resistantTo: ['normal', 'flying', 'rock', 'bug', 'steel', 'grass', 'psychic', 'ice', 'dragon', 'fairy'], immuneTo: ['poison'] },
        fire: { weakTo: ['ground', 'rock', 'water'], resistantTo: ['bug', 'steel', 'fire', 'grass', 'ice', 'fairy'], immuneTo: [] },
        water: { weakTo: ['grass', 'electric'], resistantTo: ['steel', 'fire', 'water', 'ice'], immuneTo: [] },
        grass: { weakTo: ['flying', 'poison', 'bug', 'fire', 'ice'], resistantTo: ['ground', 'water', 'grass', 'electric'], immuneTo: [] },
        electric: { weakTo: ['ground'], resistantTo: ['flying', 'steel', 'electric'], immuneTo: [] },
        psychic: { weakTo: ['bug', 'ghost', 'dark'], resistantTo: ['fighting', 'psychic'], immuneTo: [] },
        ice: { weakTo: ['fighting', 'rock', 'steel', 'fire'], resistantTo: ['ice'], immuneTo: [] },
        dragon: { weakTo: ['ice', 'dragon', 'fairy'], resistantTo: ['fire', 'water', 'grass', 'electric'], immuneTo: [] },
        dark: { weakTo: ['fighting', 'bug', 'fairy'], resistantTo: ['ghost', 'dark'], immuneTo: ['psychic'] },
        fairy: { weakTo: ['poison', 'steel'], resistantTo: ['fighting', 'bug', 'dark'], immuneTo: ['dragon'] },
    };

    let weaknesses = new Set();
    let resistances = new Set();
    let immunities = new Set();

    types.forEach(type => {
        const { weakTo, resistantTo, immuneTo } = typeChart[type];
        weakTo.forEach(weak => weaknesses.add(weak));
        resistantTo.forEach(resist => resistances.add(resist));
        immuneTo.forEach(immune => immunities.add(immune));
    });

    // Remove resistances that are also in weaknesses
    resistances.forEach(resist => {
        if (weaknesses.has(resist)) {
            weaknesses.delete(resist);
            resistances.delete(resist);
        }
    });

    // Remove weaknesses that are also in immunities
    immunities.forEach(immune => {
        if (weaknesses.has(immune)) {
            weaknesses.delete(immune);
        }
    });

    return {
        weaknesses: Array.from(weaknesses),
        resistances: Array.from(resistances),
        immunities: Array.from(immunities)
    };
}

function displayTypeEffectiveness(effectiveness) {
    const { weaknesses, resistances, immunities } = effectiveness;
    const typeEffectivenessElement = document.getElementById('typeEffectiveness');
    typeEffectivenessElement.innerHTML = `
        <div class="type-effectiveness">
            <div>
                <h4>Weak to:</h4>
                ${weaknesses.map(type => `<img src="assets/images/type-icons/${type}.png" alt="${type}" class="type-icon">`).join(' ')}
            </div>
            <div>
                <h4>Resistant to:</h4>
                ${resistances.map(type => `<img src="assets/images/type-icons/${type}.png" alt="${type}" class="type-icon">`).join(' ')}
            </div>
            <div>
                <h4>Immune to:</h4>
                ${immunities.map(type => `<img src="assets/images/type-icons/${type}.png" alt="${type}" class="type-icon">`).join(' ')}
            </div>
        </div>
    `;
}

document.getElementById('fetchPrimary').addEventListener('click', async () => {
    const primaryPokemonName = $('#primaryPokemonDropdown').val();
    if (primaryPokemonName) {
        window.primaryPokemonData = await fetchPokemonData(primaryPokemonName);
        displayPokemonData(window.primaryPokemonData, 'primaryData', 'primarySprite');
    } else {
        alert('Please select a primary Pokémon.');
    }
});

document.getElementById('fetchSecondary').addEventListener('click', async () => {
    const secondaryPokemonName = $('#secondaryPokemonDropdown').val();
    if (secondaryPokemonName) {
        window.secondaryPokemonData = await fetchPokemonData(secondaryPokemonName);
        displayPokemonData(window.secondaryPokemonData, 'secondaryData', 'secondarySprite');
    } else {
        alert('Please select a secondary Pokémon.');
    }
});

document.getElementById('swapPokemon').addEventListener('click', () => {
    const primaryPokemonName = $('#primaryPokemonDropdown').val();
    const secondaryPokemonName = $('#secondaryPokemonDropdown').val();

    $('#primaryPokemonDropdown').val(secondaryPokemonName).trigger('change');
    $('#secondaryPokemonDropdown').val(primaryPokemonName).trigger('change');

    const tempData = window.primaryPokemonData;
    window.primaryPokemonData = window.secondaryPokemonData;
    window.secondaryPokemonData = tempData;

    if (window.primaryPokemonData) {
        displayPokemonData(window.primaryPokemonData, 'primaryData', 'primarySprite');
    }
    if (window.secondaryPokemonData) {
        displayPokemonData(window.secondaryPokemonData, 'secondaryData', 'secondarySprite');
    }
});

document.getElementById('searchFusionCandidate').addEventListener('click', async () => {
    const primaryPokemonName = $('#primaryPokemonDropdown').val();
    const secondaryPokemonName = $('#secondaryPokemonDropdown').val();

    if (primaryPokemonName && secondaryPokemonName) {
        const primaryPokemonData = window.primaryPokemonData || await fetchPokemonData(primaryPokemonName);
        const secondaryPokemonData = window.secondaryPokemonData || await fetchPokemonData(secondaryPokemonName);

        const fusionCandidate = fusePokemon(primaryPokemonData, secondaryPokemonData);
        displayPokemonData(fusionCandidate, 'fusedData', 'fusedSprite');
    } else {
        alert('Please fetch both primary and secondary Pokémon data before searching for a fusion candidate.');
    }
});

document.getElementById('fusePokemon').addEventListener('click', async () => {
    if (window.primaryPokemonData && window.secondaryPokemonData) {
        const fusedPokemon = fusePokemon(window.primaryPokemonData, window.secondaryPokemonData);
        displayPokemonData(fusedPokemon, 'fusedData', 'fusedSprite');
        const effectiveness = await typeEffectivenessChart(fusedPokemon.types);
        displayTypeEffectiveness(effectiveness);
    } else {
        alert('Please fetch both primary and secondary Pokémon data before fusing.');
    }
});

$(document).ready(fetchPokemonList);
