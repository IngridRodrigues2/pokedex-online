/* Pokédex Online - lógica principal (PokéAPI) */
const API = "https://pokeapi.co/api/v2";
const TOTAL_POKEMON = 1025;   // quantidade de Pokémon sorteados/listados
const POR_PAGINA = 24;        // itens por página na Pokédex
const CHANCE_CAPTURA = 0.7;   // 70% de chance de capturar

// Nomes dos tipos em português (chave = nome usado pela API)
const TIPOS = {
  normal: "Normal", fire: "Fogo", water: "Água", grass: "Planta", electric: "Elétrico",
  ice: "Gelo", fighting: "Lutador", poison: "Veneno", ground: "Terra", flying: "Voador",
  psychic: "Psíquico", bug: "Inseto", rock: "Pedra", ghost: "Fantasma", dragon: "Dragão",
  dark: "Sombrio", steel: "Aço", fairy: "Fada"
};

const $ = (id) => document.getElementById(id);
let offsetAtual = 0;     // posição atual da paginação
let tipoAtual = "";      // filtro de tipo ("" = todos)
let timerAviso = null;
const capturadosNaSessao = []; // temporário: será substituído pelo banco online

/* ---------- Funções auxiliares ---------- */
function urlImagem(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}
function idDaUrl(url) { return Number(url.split("/").filter(Boolean).pop()); }
function nomeBonito(nome) { return nome.charAt(0).toUpperCase() + nome.slice(1).replace(/-/g, " "); }
function numero(id) { return "#" + String(id).padStart(4, "0"); }
function sortearId() { return Math.floor(Math.random() * TOTAL_POKEMON) + 1; }

// Faz a requisição e trata erros de rede e de resposta
async function buscarJSON(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) {
    throw new Error(resposta.status === 404 ? "Pokémon não encontrado." : `Erro ${resposta.status} na API.`);
  }
  return resposta.json();
}

// Mostra mensagem de feedback (tipo: carregando, erro ou sucesso)
function mostrarAviso(texto, tipo) {
  clearTimeout(timerAviso);
  const aviso = $("aviso");
  aviso.textContent = texto;
  aviso.className = "aviso " + tipo;
  aviso.hidden = false;
  if (tipo !== "carregando") timerAviso = setTimeout(esconderAviso, 4000);
}
function esconderAviso() { $("aviso").hidden = true; }

/* ---------- Destaque (Pokémon em foco ou selvagem) ---------- */
function desenharDestaque(p, selvagem) {
  const tipos = p.types.map((t) => TIPOS[t.type.name] || t.type.name).join(" / ");
  $("destaque-titulo").textContent = selvagem ? "Um Pokémon selvagem apareceu!" : "Pokémon em destaque";
  $("destaque-corpo").innerHTML = `
    <img src="${urlImagem(p.id)}" alt="${nomeBonito(p.name)}" width="180" height="180">
    <div class="ficha">
      <h2>${nomeBonito(p.name)} <small>${numero(p.id)}</small></h2>
      <p>Tipo: ${tipos}</p>
      <p>Altura: ${p.height / 10} m</p>
      <p>Peso: ${p.weight / 10} kg</p>
      ${selvagem ? `<div class="acoes">
        <button id="btn-capturar" class="botao" type="button">Capturar</button>
        <button id="btn-fugir" class="botao" type="button">Fugir</button></div>` : ""}
    </div>`;
  if (selvagem) {
    $("btn-capturar").addEventListener("click", () => tentarCaptura(p));
    $("btn-fugir").addEventListener("click", () => {
      mostrarAviso("Você fugiu.", "sucesso");
      carregarDestaque(sortearId(), false);
    });
  }
}

async function carregarDestaque(idOuNome, selvagem) {
  mostrarAviso("Carregando Pokémon...", "carregando");
  try {
    const p = await buscarJSON(`${API}/pokemon/${encodeURIComponent(idOuNome)}`);
    desenharDestaque(p, selvagem);
    esconderAviso();
  } catch (erro) {
    mostrarAviso("Não foi possível carregar o Pokémon. " + erro.message, "erro");
  }
}

/* ---------- Explorar e capturar ---------- */
function explorar() { carregarDestaque(sortearId(), true); $("inicio").scrollIntoView(); }

// (a gravação no banco online é feita por salvar(), em auth.js)
async function salvarCaptura(p) {
  capturadosNaSessao.unshift({ id: p.id, nome: p.name });
  desenharCapturados();
}

async function tentarCaptura(p) {
  if (Math.random() < CHANCE_CAPTURA) {
    await salvarCaptura(p);
    mostrarAviso(`${nomeBonito(p.name)} foi capturado!`, "sucesso");
    carregarDestaque(sortearId(), false);
  } else {
    mostrarAviso(`${nomeBonito(p.name)} escapou! Tente de novo.`, "erro");
  }
}

function desenharCapturados() {
  const lista = lerCapturados();
  if (lista.length === 0) return;
  $("capturados").innerHTML = lista.slice(0, 6)
    .map((c) => `<img src="${urlImagem(c.id)}" alt="${nomeBonito(c.nome)}" title="${nomeBonito(c.nome)} (poder ${c.poder})">`)
    .join("");
}

/* ---------- Pokédex (grade com filtro e paginação) ---------- */
function desenharGrade(lista) {
  const html = lista.map((p) => {
    const id = idDaUrl(p.url);
    return `<button class="carta" type="button" data-id="${id}">
      <img src="${urlImagem(id)}" alt="" loading="lazy">
      <span class="num">${numero(id)}</span><span>${nomeBonito(p.name)}</span></button>`;
  }).join("");
  $("grade").insertAdjacentHTML("beforeend", html);
}

async function carregarLista(reiniciar) {
  if (reiniciar) { offsetAtual = 0; $("grade").innerHTML = ""; }
  mostrarAviso("Carregando Pokédex...", "carregando");
  try {
    let lista;
    if (tipoAtual) {
      const dados = await buscarJSON(`${API}/type/${tipoAtual}`);
      lista = dados.pokemon.map((x) => x.pokemon)
        .filter((p) => idDaUrl(p.url) <= TOTAL_POKEMON)
        .slice(offsetAtual, offsetAtual + POR_PAGINA);
    } else {
      const dados = await buscarJSON(`${API}/pokemon?limit=${POR_PAGINA}&offset=${offsetAtual}`);
      lista = dados.results;
    }
    desenharGrade(lista);
    offsetAtual += POR_PAGINA;
    $("mais").hidden = lista.length < POR_PAGINA;
    esconderAviso();
  } catch (erro) {
    mostrarAviso("Não foi possível carregar a lista. " + erro.message, "erro");
  }
}

/* ---------- Menu de tipos ---------- */
function montarMenuTipos() {
  const itens = [["", "Todos"], ...Object.entries(TIPOS)];
  $("lista-tipos").innerHTML = itens
    .map(([chave, nome]) => `<li><button type="button" data-tipo="${chave}">${nome}</button></li>`)
    .join("");
}

function trocarTipo(tipo) {
  tipoAtual = tipo;
  document.querySelectorAll("#lista-tipos button")
    .forEach((b) => b.classList.toggle("ativo", b.dataset.tipo === tipo));
  $("titulo-grade").textContent = tipo ? `Pokédex: ${TIPOS[tipo]}` : "Pokédex";
  carregarLista(true);
}

/* ---------- Eventos e inicialização ---------- */
$("lista-tipos").addEventListener("click", (e) => {
  const botao = e.target.closest("button");
  if (botao) trocarTipo(botao.dataset.tipo);
});
$("grade").addEventListener("click", (e) => {
  const carta = e.target.closest(".carta");
  if (carta) { carregarDestaque(carta.dataset.id, false); $("inicio").scrollIntoView(); }
});
$("form-busca").addEventListener("submit", (e) => {
  e.preventDefault();
  carregarDestaque($("campo-busca").value.trim().toLowerCase(), false);
});
$("btn-explorar").addEventListener("click", () => { window.location.href = "explorar.html"; });
$("mais").addEventListener("click", () => carregarLista(false));

montarMenuTipos();
desenharCapturados();
trocarTipo("");
carregarDestaque(sortearId(), false);
