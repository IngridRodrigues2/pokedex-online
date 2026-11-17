/* Álbum - todos os Pokémon; ficam em silhueta até serem encontrados */
const API = "https://pokeapi.co/api/v2";
const TOTAL_POKEMON = 1025;
// [nome da região, primeiro número, último número]
const REGIOES = [
  ["Kanto", 1, 151], ["Johto", 152, 251], ["Hoenn", 252, 386], ["Sinnoh", 387, 493],
  ["Unova", 494, 649], ["Kalos", 650, 721], ["Alola", 722, 809], ["Galar", 810, 905],
  ["Paldea", 906, 1025]
];

const $ = (id) => document.getElementById(id);
let regiaoAtual = 0;
let timerAviso = null;

/* ---------- Funções auxiliares ---------- */
function urlImagem(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}
function nomeBonito(nome) { return nome.charAt(0).toUpperCase() + nome.slice(1).replace(/-/g, " "); }
function numero(id) { return "#" + String(id).padStart(4, "0"); }

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

// Junta os Pokémon encontrados e os capturados: id -> { nome, capturado }
function mapaDescobertos() {
  const mapa = new Map();
  lerVistos().forEach((v) => mapa.set(v.id, { nome: v.nome, capturado: false }));
  lerRegistro().forEach((r) => mapa.set(r.id, { nome: r.nome, capturado: true })); // soltar ou doar não tira do álbum
  return mapa;
}

/* ---------- Desenho do álbum ---------- */
function montarMenu() {
  $("lista-regioes").innerHTML = REGIOES
    .map((r, i) => `<li><button type="button" data-regiao="${i}">${r[0]}</button></li>`).join("");
}

function desenharRegiao() {
  const [nomeRegiao, inicio, fim] = REGIOES[regiaoAtual];
  const descobertos = mapaDescobertos();
  let achadosNaRegiao = 0;
  let html = "";
  for (let id = inicio; id <= fim; id++) {
    const d = descobertos.get(id);
    if (d) {
      achadosNaRegiao++;
      html += `<button type="button" class="slot ${d.capturado ? "capturado" : ""}" data-id="${id}">
        <img src="${urlImagem(id)}" alt="${nomeBonito(d.nome)}" width="96" height="96" loading="lazy">
        <span class="num">${numero(id)}</span><span>${nomeBonito(d.nome)}</span>
        ${d.capturado ? '<span class="selo">Capturado</span>' : ""}
        ${LENDARIOS_IDS.includes(id) ? '<span class="selo">★ Lendário</span>' : ""}</button>`;
    } else {
      html += `<button type="button" class="slot escuro" data-id="${id}" aria-label="Pokémon ${numero(id)} ainda não encontrado">
        <img src="${urlImagem(id)}" alt="" width="96" height="96" loading="lazy">
        <span class="num">${numero(id)}</span><span>???</span></button>`;
    }
  }
  $("grade-album").innerHTML = html;
  $("titulo-regiao").textContent = `${nomeRegiao} (${inicio} a ${fim})`;
  $("resumo").textContent = `Nesta região: ${achadosNaRegiao} de ${fim - inicio + 1} encontrados. ` +
    `No total: ${descobertos.size} de ${TOTAL_POKEMON} encontrados, ${lerRegistro().length} capturados, ` +
    `${LENDARIOS_IDS.filter((id) => descobertos.get(id)?.capturado).length} de ${LENDARIOS_IDS.length} lendários e míticos.`;
  document.querySelectorAll("#lista-regioes button")
    .forEach((b) => b.classList.toggle("ativo", Number(b.dataset.regiao) === regiaoAtual));
}

/* ---------- Descrição do Pokémon (PokéAPI: pokemon-species) ---------- */
// Escolhe o texto em português, se existir; senão em inglês
function escolherTexto(lista, campo) {
  for (const idioma of ["pt-BR", "pt", "en"]) {
    const itens = lista.filter((i) => i.language.name === idioma);
    if (itens.length > 0) return { texto: itens[itens.length - 1][campo].replace(/[\n\f\r]/g, " "), idioma };
  }
  return { texto: "", idioma: "" };
}

async function abrirDetalhes(id, nome, capturado) {
  mostrarAviso("Carregando descrição...", "carregando");
  try {
    const especie = await buscarJSON(`${API}/pokemon-species/${id}`);
    const descricao = escolherTexto(especie.flavor_text_entries, "flavor_text");
    const genero = escolherTexto(especie.genera, "genus");
    $("det-imagem").src = urlImagem(id);
    $("det-imagem").alt = nomeBonito(nome);
    $("det-nome").textContent = `${nomeBonito(nome)} ${numero(id)}`;
    $("det-genero").textContent = genero.texto;
    $("det-status").textContent = capturado ? "Capturado" : "Encontrado, ainda não capturado";
    $("det-descricao").textContent = descricao.texto || "Sem descrição disponível.";
    $("det-idioma").textContent = descricao.idioma === "en" ? "Descrição disponível apenas em inglês." : "";
    esconderAviso();
    $("dlg-detalhe").showModal();
  } catch (erro) {
    mostrarAviso("Não foi possível carregar a descrição. " + erro.message, "erro");
  }
}

/* ---------- Eventos e inicialização ---------- */
$("lista-regioes").addEventListener("click", (e) => {
  const botao = e.target.closest("button");
  if (!botao) return;
  regiaoAtual = Number(botao.dataset.regiao);
  desenharRegiao();
});
$("grade-album").addEventListener("click", (e) => {
  const slot = e.target.closest(".slot");
  if (!slot) return;
  const id = Number(slot.dataset.id);
  const descoberto = mapaDescobertos().get(id);
  if (!descoberto) { mostrarAviso("Você ainda não encontrou este Pokémon. Vá explorar!", "erro"); return; }
  abrirDetalhes(id, descoberto.nome, descoberto.capturado);
});
$("fechar-detalhe").addEventListener("click", () => $("dlg-detalhe").close());

montarMenu();
desenharRegiao();