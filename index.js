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
    spriteElement.innerHTML = `<img src="${pokemonData.spriteUrl}" alt="${elementId} sprite">`;
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
            const response = await axios.get(`${POKEAPI_URL}/type/${type}`);
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
                <div>2x Damage From: ${effectiveness.double.map(type => `
                    <div>
                        <img src="assets/images/type-icons/${type}.png" alt="${type}" class="type-icon">
                        <span>${type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    </div>`).join('')}
                </div>` : ''}
            ${effectiveness.half.length ? `
                <div>0.5x Damage From: ${effectiveness.half.map(type => `
                    <div>
                        <img src="assets/images/type-icons/${type}.png" alt="${type}" class="type-icon">
                        <span>${type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    </div>`).join('')}
                </div>` : ''}
            ${effectiveness.none.length ? `
                <div>No Damage From: ${effectiveness.none.map(type => `
                    <div>
                        <img src="assets/images/type-icons/${type}.png" alt="${type}" class="type-icon">
                        <span>${type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    </div>`).join('')}
                </div>` : ''}
        </div>
    `;
}

document.getElementById('fetchPrimary').addEventListener('click', async () => {
    const primaryPokemonName = $('#primaryPokemonDropdown').val();
    const primaryPokemonData = await fetchPokemonData(primaryPokemonName);
    if (primaryPokemonData) {
        displayPokemonData(primaryPokemonData, 'primaryData', 'primarySprite');
        window.primaryPokemonData = primaryPokemonData;
    }
});

document.getElementById('fetchSecondary').addEventListener('click', async () => {
    const secondaryPokemonName = $('#secondaryPokemonDropdown').val();
    const secondaryPokemonData = await fetchPokemonData(secondaryPokemonName);
    if (secondaryPokemonData) {
        displayPokemonData(secondaryPokemonData, 'secondaryData', 'secondarySprite');
        window.secondaryPokemonData = secondaryPokemonData;
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
