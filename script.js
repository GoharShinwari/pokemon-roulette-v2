const pokeAPIURL = 'https://pokeapi.co/api/v2/pokemon/';
const rouletteBox = document.getElementById('roulette-boxes');
const spinButton = document.getElementById('spinButton');
const resultElement = document.getElementById('result');
const boxCount = 7;
const winningBox = 3;

// must add all BL but just raise them to the next tier
// UUBL -> OU
// add megas (i think maybe just stones would b better)
let pokemonData = [];
let tiers = {
    "LC": 0.30, "ZU": 0.25, "PU": 0.15, "NU": 0.12, "RU": 0.06,
    "UU": 0.04, "OU": 0.03, "Ubers": 0.02, "AG": 0.001
};

function isShiny() {
    return Math.random() < 1 / 512;
}

async function fetchPokemonNamesForTier(tier) {
    try {
        const response = await fetch(`data/${tier}.json`);
        const data = await response.json();
        return data[tier] || [];
    } catch {
        return [];
    }
}

async function fetchPokemon(identifier, tier, forceShiny = false) {
    try {
        const response = await fetch(`${pokeAPIURL}${identifier}`);
        const data = await response.json();
        const shiny = forceShiny || isShiny();
        return {
            name: capitalizeFirstLetter(data.name),
            sprite: shiny ? (data.sprites.front_shiny || data.sprites.front_default) : data.sprites.front_default,
            isShiny: shiny,
            tier: tier
        };
    } catch {
        return {
            name: 'Pikachu',
            sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
            isShiny: false,
            tier: 'LC'
        };
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

async function initializeRoulette() {
    pokemonData = Array(boxCount).fill(null);

    for (let i = 0; i < boxCount; i++) {
        const tierData = selectPokemonTier();
        const pokemonNames = await fetchPokemonNamesForTier(tierData.tier);
        if (pokemonNames.length === 0) {
            tierData.tier = 'LC';
        }
        const randomPokemonName = pokemonNames[Math.floor(Math.random() * pokemonNames.length)];
        const pokemon = await fetchPokemon(randomPokemonName, tierData.tier);
        pokemonData[i] = pokemon;
    }

    renderBoxes();
}

async function fetchPokemonId(name) {
    try {
        const response = await fetch(`${pokeAPIURL}${name.toLowerCase()}`);
        const data = await response.json();
        return data.id;
    } catch {
        return 25;
    }
}

function renderBoxes() {
    rouletteBox.innerHTML = pokemonData.map((pokemon) => `
        <div class="roulette-box" data-tier="${pokemon.tier}">
            <img src="${pokemon.sprite}" alt="${pokemon.name}">
            <div class="pokemon-tier">${pokemon.tier}</div>
        </div>
    `).join('');
}

async function spin() {
    spinButton.disabled = true;
    resultElement.textContent = '';

    for (let i = 0; i < 20; i++) {
        const newPokemon = await fetchPokemonForSpin();
        pokemonData.push(newPokemon);
        pokemonData.shift();
        renderBoxes();
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    const winningPokemon = pokemonData[winningBox];
    resultElement.innerHTML = `
        You won a ${winningPokemon.isShiny ? 'SHINY ' : ''}
        ${winningPokemon.name.toUpperCase()} 
        (${winningPokemon.tier} Tier)!
    `;
    spinButton.disabled = false;
}

async function fetchPokemonForSpin() {
    const tierData = selectPokemonTier();
    const pokemonNames = await fetchPokemonNamesForTier(tierData.tier);
    if (pokemonNames.length === 0) {
        tierData.tier = 'LC';
    }
    const randomPokemonName = pokemonNames[Math.floor(Math.random() * pokemonNames.length)];
    const pokemon = await fetchPokemon(randomPokemonName, tierData.tier);
    return pokemon;
}

function selectPokemonTier() {
    const random = Math.random();
    let cumulative = 0;
    for (const tier in tiers) {
        cumulative += tiers[tier];
        if (random <= cumulative) {
            return { tier };
        }
    }
    return { tier: 'LC' };
}

spinButton.addEventListener('click', spin);
initializeRoulette();
