/* Dados do jogador, compartilhados entre as páginas */
const CHAVE_CAPTURADOS = "pokedex_capturados"; 
const PONTOS_INICIAIS = 350;   // pontos iniciais: dá para capturar qualquer Pokémon Comum

function lerCapturados() {
  try { return JSON.parse(localStorage.getItem(chave(CHAVE_CAPTURADOS))) || []; }
  catch (e) { return []; }
}
function gravarCaptura(pokemon) {
  const lista = lerCapturados();
  lista.unshift({ ...pokemon, data: new Date().toISOString() });
  registrarNoAlbum(pokemon.id, pokemon.nome); // o álbum guarda para sempre
  salvar(CHAVE_CAPTURADOS, JSON.stringify(lista));
}
// Pontos = pontos iniciais + poder de todos os Pokémon que o jogador tem
function calcularPontos() {
  return PONTOS_INICIAIS + lerCapturados().reduce((soma, c) => soma + c.poder, 0);
}

// Solta (exclui) um Pokémon da coleção do jogador
function soltarCaptura(idPokemon) {
  const lista = lerCapturados().filter((c) => c.id !== idPokemon);
  salvar(CHAVE_CAPTURADOS, JSON.stringify(lista));
}
// TODO: ler a lista de amigos do Firestore. Enquanto não existe, ninguém tem amigos.
function lerAmigos() { return []; }
// TODO: transferir o Pokémon no Firestore (remove do jogador e adiciona ao amigo)
async function doarPokemon(pokemon, amigo) {
  throw new Error("A doação será ligada ao banco online.");
}

/* ---------- Álbum: Pokémon já encontrados (mesmo que tenham escapado) ---------- */
const CHAVE_VISTOS = "pokedex_vistos";
function lerVistos() {
  try { return JSON.parse(localStorage.getItem(chave(CHAVE_VISTOS))) || []; }
  catch (e) { return []; }
}
// Marca um Pokémon como encontrado: ele deixa de ser silhueta no álbum
function registrarVisto(id, nome) {
  const lista = lerVistos();
  if (lista.some((v) => v.id === id)) return;
  lista.push({ id, nome });
  salvar(CHAVE_VISTOS, JSON.stringify(lista));
}

/* ---------- Registro do álbum: Pokémon já capturados alguma vez ---------- */
const CHAVE_REGISTRO = "pokedex_registro";
function lerRegistro() {
  let guardados = [];
  try { guardados = JSON.parse(localStorage.getItem(chave(CHAVE_REGISTRO))) || []; } catch (e) { guardados = []; }
  const mapa = new Map(guardados.map((r) => [r.id, r]));
  // inclui os que o jogador tem agora (capturados antes deste registro existir)
  lerCapturados().forEach((c) => { if (!mapa.has(c.id)) mapa.set(c.id, { id: c.id, nome: c.nome }); });
  return [...mapa.values()];
}
// Soltar ou doar NÃO remove do registro: o Pokémon continua no álbum
function registrarNoAlbum(id, nome) {
  const lista = lerRegistro();
  if (lista.some((r) => r.id === id)) return;
  lista.push({ id, nome });
  salvar(CHAVE_REGISTRO, JSON.stringify(lista));
}

/* ---------- Inventário limitado (precisa do lendarios.js carregado antes) ---------- */
function inventarioCheio() { return lerCapturados().length >= LIMITE_INVENTARIO; }
function lendariosNoInventario() {
  const meus = new Set(lerCapturados().map((c) => c.id));
  return LENDARIOS_IDS.filter((id) => meus.has(id)).length;
}
// Zerar o jogo = ter todos os Lendários e Míticos no inventário ao mesmo tempo
function zerouOJogo() { return lendariosNoInventario() === LENDARIOS_IDS.length; }

/* ---------- Moedas (ganhas ao soltar Pokémon) ---------- */
const CHAVE_MOEDAS = "pokedex_moedas";
function lerMoedas() { return Number(localStorage.getItem(chave(CHAVE_MOEDAS))) || 0; }
function adicionarMoedas(quantidade) {
  salvar(CHAVE_MOEDAS, String(lerMoedas() + quantidade));
}