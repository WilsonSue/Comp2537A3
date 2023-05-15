const PAGE_SIZE = 10;
let currentPage = 1;
let pokemons = [];
let filteredPokemons = [];
let selectedTypes = new Set();

const updateTypeFilters = () => {
  filteredPokemons = pokemons.filter((pokemon) => {
    if (selectedTypes.size === 0) return true;
    let hasAllSelectedTypes = true;
    for (let type of selectedTypes) {
      if (!pokemon.types.includes(type)) {
        hasAllSelectedTypes = false;
        break;
      }
    }
    return hasAllSelectedTypes;
  });
};

const createTypeFilterCheckboxes = () => {
  const types = [
    "normal",
    "fighting",
    "flying",
    "poison",
    "ground",
    "rock",
    "bug",
    "ghost",
    "steel",
    "fire",
    "water",
    "grass",
    "electric",
    "psychic",
    "ice",
    "dragon",
    "dark",
    "fairy",
    "unknown",
    "shadow",
  ];

  types.forEach((type) => {
    $("#typeFilters").append(`
      <div class="form-check">
        <input class="form-check-input" type="checkbox" value="${type}" id="${type}">
        <label class="form-check-label" for="${type}">
          ${type}
        </label>
      </div>
    `);
  });
};

const updateCountText = (start, end, total) => {
  $("#countText").text(`Showing ${start} to ${end} of ${total} Pokémon`);
};

const updatePaginationDiv = (currentPage, numPages) => {
  $("#pagination").empty();

  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(numPages, currentPage + 2);

  if (currentPage > 1) {
    $("#pagination").append(`
    <button class="btn btn-primary page ml-1" id="prevButton" value="${
      currentPage - 1
    }">Previous</button>
    `);
  }

  for (let i = startPage; i <= endPage; i++) {
    $("#pagination").append(`
    <button class="btn btn-primary page ml-1 numberedButtons ${
      i === currentPage ? "active" : ""
    }" value="${i}">${i}</button>
    `);
  }

  if (currentPage < numPages) {
    $("#pagination").append(`
    <button class="btn btn-primary page ml-1" id="nextButton" value="${
      currentPage + 1
    }">Next</button>
    `);
  }
};

const paginate = async (currentPage, PAGE_SIZE, pokemons) => {
  selected_pokemons = pokemons.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  $("#pokeCards").empty();
  selected_pokemons.forEach(async (pokemon) => {
    const res = await axios.get(pokemon.url);
    $("#pokeCards").append(`
      <div class="pokeCard card" pokeName=${res.data.name}   >
        <h3>${res.data.name.toUpperCase()}</h3> 
        <img src="${res.data.sprites.front_default}" alt="${res.data.name}"/>
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#pokeModal">
          More
        </button>
        </div>  
        `);
  });
};

const setup = async () => {
  // test out poke api using axios here

  $("#pokeCards").empty();
  let response = await axios.get(
    "https://pokeapi.co/api/v2/pokemon?offset=0&limit=810"
  );
  pokemons = response.data.results.map((pokemon) => {
    return {
      ...pokemon,
      types: [], // add an empty types array for now
    };
  });

  await Promise.all(
    pokemons.map(async (pokemon) => {
      const res = await axios.get(pokemon.url);
      pokemon.types = res.data.types.map((type) => type.type.name);
    })
  );

  paginate(currentPage, PAGE_SIZE, pokemons);
  const numPages = Math.ceil(pokemons.length / PAGE_SIZE);
  updatePaginationDiv(currentPage, numPages);

  // Display count text
  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = currentPage * PAGE_SIZE;
  updateCountText(start, end, pokemons.length);

  // pop up modal when clicking on a pokemon card
  // add event listener to each pokemon card
  $("body").on("click", ".pokeCard", async function (e) {
    const pokemonName = $(this).attr("pokeName");
    // console.log("pokemonName: ", pokemonName);
    const res = await axios.get(
      `https://pokeapi.co/api/v2/pokemon/${pokemonName}`
    );
    // console.log("res.data: ", res.data);
    const types = res.data.types.map((type) => type.type.name);
    // console.log("types: ", types);
    $(".modal-body").html(`
        <div style="width:200px">
        <img src="${
          res.data.sprites.other["official-artwork"].front_default
        }" alt="${res.data.name}"/>
        <div>
        <h3>Abilities</h3>
        <ul>
        ${res.data.abilities
          .map((ability) => `<li>${ability.ability.name}</li>`)
          .join("")}
        </ul>
        </div>

        <div>
        <h3>Stats</h3>
        <ul>
        ${res.data.stats
          .map((stat) => `<li>${stat.stat.name}: ${stat.base_stat}</li>`)
          .join("")}
        </ul>

        </div>

        </div>
          <h3>Types</h3>
          <ul>
          ${types.map((type) => `<li>${type}</li>`).join("")}
          </ul>
      
        `);
    $(".modal-title").html(`
        <h2>${res.data.name.toUpperCase()}</h2>
        <h5>${res.data.id}</h5>
        `);
  });

  $("body").on("click", ".numberedButtons", async function (e) {
    currentPage = Number(e.target.value);
    paginate(currentPage, PAGE_SIZE, pokemons);

    //update pagination buttons
    updatePaginationDiv(currentPage, numPages);

    // Update count text
    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = currentPage * PAGE_SIZE;
    updateCountText(start, end, pokemons.length);
  });

  $("body").on("click", "#nextButton, #prevButton", async function (e) {
    currentPage = Number(e.target.value);
    paginate(currentPage, PAGE_SIZE, pokemons);

    // Update pagination buttons
    updatePaginationDiv(currentPage, numPages);
  });

  $("body").on("change", ".form-check-input", function (e) {
    const type = e.target.value;
    if (e.target.checked) {
      selectedTypes.add(type);
    } else {
      selectedTypes.delete(type);
    }

    updateTypeFilters();
    paginate(currentPage, PAGE_SIZE, filteredPokemons);
    const numPages = Math.ceil(filteredPokemons.length / PAGE_SIZE);
    updatePaginationDiv(currentPage, numPages);
    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = currentPage * PAGE_SIZE;
    updateCountText(start, end, filteredPokemons.length);
  });

  createTypeFilterCheckboxes();
};

$(document).ready(setup);
