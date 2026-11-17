/* Explorar - minigame de captura por cliques */
const API = "https://pokeapi.co/api/v2";
const TOTAL_POKEMON = 1025;
const DURACAO_S = 15;          // tempo máximo para capturar
const GANHO_CLIQUE = 4;        // quanto cada clique aproxima o Pokémon
const TICK_MS = 100;           // a cada 100 ms o Pokémon tenta fugir

const $ = (id) => document.getElementById(id);
let atual = null;  // Pokémon encontrado: { id, nome, poder }
let jogo = null;   // estado do minigame em andamento
let timerAviso = null;

/* ---------- Funções auxiliares ---------- */
function urlImagem(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}
function nomeBonito(nome) { return nome.charAt(0).toUpperCase() + nome.slice(1).replace(/-/g, " "); }
function sortearId() { return Math.floor(Math.random() * TOTAL_POKEMON) + 1; }
// Poder = soma dos status base (vida, ataque, defesa, etc.)
function poderDe(p) { return p.stats.reduce((soma, s) => soma + s.base_stat, 0); }

async function buscarJSON(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Erro ${resposta.status} na API.`);
  return resposta.json();
}

function mostrarAviso(texto, tipo) {
  clearTimeout(timerAviso);
  const aviso = $("aviso");
  aviso.textContent = texto;
  aviso.className = "aviso " + tipo;
  aviso.hidden = false;
  if (tipo !== "carregando") timerAviso = setTimeout(() => { aviso.hidden = true; }, 4000);
}
function esconderAviso() { $("aviso").hidden = true; }

/* ---------- Perfil (dados vêm do jogador.js) ---------- */
function desenharPerfil() {
  const lista = lerCapturados();
  $("pontos").textContent = calcularPontos();
  $("total").textContent = lista.length;
  $("aura").textContent = acharAura(auraEquipada()).nome;
  $("inventario").textContent = `${lista.length}/${LIMITE_INVENTARIO}`;
  $("moedas").textContent = lerMoedas();
  $("lista-capturados").innerHTML = lista.length === 0
    ? "<li>Nenhum ainda.</li>"
    : lista.slice(0, 6).map((c) => `<li><img src="${urlImagem(c.id)}" alt="">
        <span>${nomeBonito(c.nome)}<br>Poder ${c.poder}</span></li>`).join("");
}

/* ---------- Sorteio de Pokémon conforme a aura equipada ---------- */
async function escolherPokemonPorAura() {
  const chances = chancesAtuais();
  const donos = new Set(lerCapturados().map((c) => c.id));

  // Com a tabela completa (dados-pokemon.js): sorteia a raridade e depois um Pokémon dela
  if (tabelaDePoder().length === TOTAL_POKEMON) {
    const grupos = { comum: [], incomum: [], raro: [], epico: [], lendario: [] };
    for (let id = 1; id <= TOTAL_POKEMON; id++) {
      if (!donos.has(id)) grupos[raridadeDe(id)].push(id);
    }
    const raridade = sortearRaridade(chances, Object.keys(grupos).filter((r) => grupos[r].length > 0));
    const id = grupos[raridade][Math.floor(Math.random() * grupos[raridade].length)];
    const p = await buscarJSON(`${API}/pokemon/${id}`);
    return { p, poder: poderDe(p) };
  }

  // Sem a tabela: sorteia 10 candidatos e escolhe a raridade entre os que apareceram
  const ids = new Set();
  while (ids.size < 10) { const id = sortearId(); if (!donos.has(id)) ids.add(id); }
  const lista = await Promise.all([...ids].map((id) => buscarJSON(`${API}/pokemon/${id}`)));
  const grupos = {};
  lista.forEach((p) => {
    const poder = poderDe(p);
    const r = raridadeDe(p.id, poder);
    if (!grupos[r]) grupos[r] = [];
    grupos[r].push({ p, poder });
  });
  const raridade = sortearRaridade(chances, Object.keys(grupos));
  return grupos[raridade][Math.floor(Math.random() * grupos[raridade].length)];
}

/* ---------- Procurar um Pokémon ---------- */
async function procurar() {
  if (jogo) return; // já existe uma captura em andamento
  $("btn-procurar").disabled = true;
  mostrarAviso("Procurando Pokémon...", "carregando");
  try {
    const escolhido = await escolherPokemonPorAura();
    mostrarEncontro(escolhido.p, escolhido.poder);
    esconderAviso();
  } catch (erro) {
    mostrarAviso("Não foi possível procurar Pokémon. " + erro.message, "erro");
  } finally {
    $("btn-procurar").disabled = false;
  }
}

function mostrarEncontro(p, poder) {
  atual = { id: p.id, nome: p.name, poder };
  registrarVisto(p.id, p.name); // álbum: este Pokémon passa a ser "encontrado"
  const pontos = calcularPontos();
  const vantagem = (pontos / poder).toFixed(2);
  const rar = raridadeDe(p.id, poder);
  $("arena-corpo").innerHTML = `
    <img src="${urlImagem(p.id)}" alt="${nomeBonito(p.name)}" width="180" height="180">
    <div class="ficha">
      <h2>${nomeBonito(p.name)}</h2>
      <p>Poder: ${poder}</p>
      <p>Raridade: <span class="rar r-${rar}">${NOMES_RARIDADE[rar]}</span></p>
      <p>Seus pontos: ${pontos}</p>
      <p>Vantagem: ${vantagem}x</p>
    </div>`;
  if (poder > pontos) {
    $("controles").innerHTML = `<p class="bloqueado">Você ainda não é forte o bastante para capturar este Pokémon. Capture outros para ganhar pontos.</p>`;
  } else if (inventarioCheio()) {
    $("controles").innerHTML = `<p class="bloqueado">Inventário cheio (${LIMITE_INVENTARIO}/${LIMITE_INVENTARIO}). Solte um Pokémon fraco em <a href="meutime.html">Meu Time</a> para abrir espaço.</p>`;
  } else {
    $("controles").innerHTML = `<button id="btn-iniciar" class="botao grande" type="button">Iniciar captura</button>`;
    $("btn-iniciar").addEventListener("click", () => iniciarCaptura(pontos / poder));
  }
}

/* ---------- Minigame: clique rápido para puxar ---------- */
function iniciarCaptura(vantagem) {
  // Quanto maior a vantagem, mais devagar o Pokémon foge. O Pikachu foge um pouco mais.
  let recuo = 0.6 + 2.0 / vantagem;
  if (atual.id === 25) recuo *= 1.1;
  jogo = { proximidade: 20, restante: DURACAO_S * 1000, recuo, intervalo: null,
           ganho: GANHO_CLIQUE };

  $("controles").innerHTML = `
    <div class="barra"><div id="barra-nivel"></div></div>
    <p id="tempo"></p>
    <button id="btn-puxar" class="botao grande puxar" type="button">PUXAR!</button>`;
  $("btn-puxar").addEventListener("pointerdown", puxar);
  atualizarBarra();
  jogo.intervalo = setInterval(passarTempo, TICK_MS);
}

function puxar() {
  if (!jogo) return;
  jogo.proximidade = Math.min(100, jogo.proximidade + jogo.ganho);
  atualizarBarra();
  if (jogo.proximidade >= 100) finalizar(true);
}

function passarTempo() {
  jogo.proximidade = Math.max(0, jogo.proximidade - jogo.recuo); // o Pokémon tenta fugir
  jogo.restante -= TICK_MS;
  atualizarBarra();
  if (jogo.proximidade <= 0 || jogo.restante <= 0) finalizar(false);
}

function atualizarBarra() {
  $("barra-nivel").style.width = jogo.proximidade + "%";
  $("tempo").textContent = `Tempo: ${Math.max(0, jogo.restante / 1000).toFixed(1)} s`;
}

function finalizar(venceu) {
  clearInterval(jogo.intervalo);
  jogo = null;
  $("controles").innerHTML = "";
  if (venceu) {
    gravarCaptura(atual);
    desenharPerfil();
    mostrarAviso(`${nomeBonito(atual.nome)} capturado! +${atual.poder} pontos.`, "sucesso");
  } else {
    mostrarAviso(`${nomeBonito(atual.nome)} escapou! Procure outro.`, "erro");
  }
}

/* ---------- Eventos e inicialização ---------- */
$("btn-procurar").addEventListener("click", procurar);
// No computador, a barra de espaço também puxa
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && jogo) { e.preventDefault(); if (!e.repeat) puxar(); }
});
desenharPerfil();