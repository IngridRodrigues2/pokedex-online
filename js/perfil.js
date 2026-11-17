/* Perfil do jogador: auras (compradas com moedas) e personagem do avatar.
   Precisa do auth.js (chave) e do jogador.js (moedas) carregados antes. */

// Chances (%) de aparecer cada raridade no Explorar, conforme a aura equipada
const AURAS = [
  { id: "nenhuma", nome: "Sem aura", preco: 0,    chances: { comum: 60, incomum: 25, raro: 10, epico: 4,  lendario: 1 } },
  { id: "bronze",  nome: "Bronze",   preco: 100,  chances: { comum: 50, incomum: 28, raro: 15, epico: 6,  lendario: 1 } },
  { id: "prata",   nome: "Prata",    preco: 400,  chances: { comum: 40, incomum: 30, raro: 20, epico: 8,  lendario: 2 } },
  { id: "ouro",    nome: "Ouro",     preco: 1500, chances: { comum: 30, incomum: 30, raro: 25, epico: 12, lendario: 3 } },
  { id: "arcoiris", nome: "Arco-íris", preco: 5000, chances: { comum: 20, incomum: 25, raro: 30, epico: 18, lendario: 7 } }
];
// Os 5 personagens que o jogador pode escolher (número do Pokémon na PokéAPI)
const AVATARES = [
  { id: 25, nome: "Pikachu" }, { id: 1, nome: "Bulbasaur" }, { id: 4, nome: "Charmander" },
  { id: 7, nome: "Squirtle" }, { id: 52, nome: "Meowth" }
];
const CHAVE_AURAS = "pokedex_auras";                
const CHAVE_AURA_EQUIPADA = "pokedex_aura_equipada";
const CHAVE_AVATAR = "pokedex_avatar";

/* ---------- Auras ---------- */
function acharAura(id) { return AURAS.find((a) => a.id === id) || AURAS[0]; }

function lerAurasCompradas() {
  let guardadas = [];
  try { guardadas = JSON.parse(localStorage.getItem(chave(CHAVE_AURAS))) || []; } catch (e) { guardadas = []; }
  return ["nenhuma", ...guardadas.filter((id) => id !== "nenhuma" && AURAS.some((a) => a.id === id))];
}
function auraEquipada() {
  const id = localStorage.getItem(chave(CHAVE_AURA_EQUIPADA));
  return lerAurasCompradas().includes(id) ? id : "nenhuma";
}
function equiparAura(id) {
  if (!lerAurasCompradas().includes(id)) throw new Error("Você ainda não tem esta aura.");
  salvar(CHAVE_AURA_EQUIPADA, id);
}
function gastarMoedas(quantidade) {
  if (lerMoedas() < quantidade) throw new Error("Moedas insuficientes.");
  adicionarMoedas(-quantidade);
}
// Compra a aura e já equipa
function comprarAura(id) {
  const aura = AURAS.find((a) => a.id === id);
  if (!aura) throw new Error("Aura inexistente.");
  const compradas = lerAurasCompradas();
  if (compradas.includes(id)) throw new Error("Você já tem esta aura.");
  gastarMoedas(aura.preco);
  salvar(CHAVE_AURAS, JSON.stringify([...compradas.filter((x) => x !== "nenhuma"), id]));
  equiparAura(id);
  return aura;
}
function chancesAtuais() { return acharAura(auraEquipada()).chances; }

// Sorteia uma raridade entre as disponíveis, respeitando as chances da aura
function sortearRaridade(chances, disponiveis) {
  const total = disponiveis.reduce((soma, r) => soma + chances[r], 0);
  let sorteio = Math.random() * total;
  for (const r of disponiveis) {
    sorteio -= chances[r];
    if (sorteio < 0) return r;
  }
  return disponiveis[disponiveis.length - 1];
}

/* ---------- Personagem do avatar ---------- */
function lerAvatar() {
  const id = Number(localStorage.getItem(chave(CHAVE_AVATAR)));
  return AVATARES.some((a) => a.id === id) ? id : AVATARES[0].id;
}
function salvarAvatar(id) {
  if (!AVATARES.some((a) => a.id === id)) throw new Error("Personagem inexistente.");
  salvar(CHAVE_AVATAR, String(id));
}
function urlArteAvatar(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

// Cria o avatar redondo, com a borda no estilo da aura (a equipada, ou a indicada)
function montarAvatar(tamanho, auraId) {
  const caixa = document.createElement("span");
  caixa.className = `avatar aura-${auraId || auraEquipada()}`;
  caixa.style.width = tamanho + "px";
  caixa.style.height = tamanho + "px";
  const imagem = document.createElement("img");
  imagem.src = urlArteAvatar(lerAvatar());
  imagem.alt = "Personagem do jogador";
  caixa.appendChild(imagem);
  return caixa;
}
// Atualiza o avatar pequeno da barra do menu
function atualizarAvatarBarra() {
  const antigo = document.querySelector(".usuario .avatar");
  if (antigo) antigo.replaceWith(montarAvatar(32));
}