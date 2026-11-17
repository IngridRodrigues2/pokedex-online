/* Meu Time - Pokémon capturados, poder, raridade, moedas, soltar e doar */
const $ = (id) => document.getElementById(id);
let timerAviso = null;
let pokemonDoacao = null; // Pokémon escolhido para doar

function urlImagem(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}
function nomeBonito(nome) { return nome.charAt(0).toUpperCase() + nome.slice(1).replace(/-/g, " "); }

function mostrarAviso(texto, tipo) {
  clearTimeout(timerAviso);
  const aviso = $("aviso");
  aviso.textContent = texto;
  aviso.className = "aviso " + tipo;
  aviso.hidden = false;
  timerAviso = setTimeout(() => { aviso.hidden = true; }, 4000);
}

// Monta o cartão de um Pokémon, com raridade e valor em moedas
function cartaoDoPokemon(c, temAmigos) {
  const rar = raridadeDe(c.id, c.poder);
  return `<div class="carta">
    <img src="${urlImagem(c.id)}" alt="" loading="lazy">
    <span>${nomeBonito(c.nome)}</span>
    <span class="num">Poder ${c.poder}</span>
    <span class="rar r-${rar}">${NOMES_RARIDADE[rar]}</span>
    <span class="num">Vale ${MOEDAS_POR_RARIDADE[rar]} moedas</span>
    <div class="acoes">
      <button type="button" class="botao pequeno" data-acao="soltar" data-id="${c.id}">Soltar</button>
      <button type="button" class="botao pequeno" data-acao="doar" data-id="${c.id}"
        ${temAmigos ? "" : 'disabled title="Adicione amigos para poder doar"'}>Doar</button>
    </div></div>`;
}

function desenharTime() {
  const lista = lerCapturados().sort((a, b) => b.poder - a.poder); // mais fortes primeiro
  const temAmigos = lerAmigos().length > 0; // doar só é permitido para quem tem amigos
  $("pontos").textContent = calcularPontos();
  $("total").textContent = lista.length;
  $("maior").textContent = lista.length ? lista[0].poder : 0;
  $("aura").textContent = acharAura(auraEquipada()).nome;
  $("inventario").textContent = `${lista.length}/${LIMITE_INVENTARIO}`;
  $("moedas").textContent = lerMoedas();
  $("lendarios").textContent = `${lendariosNoInventario()}/${LENDARIOS_IDS.length}`;
  $("vitoria").hidden = !zerouOJogo();

  $("lista-time").innerHTML = lista.length === 0
    ? '<p class="vazio">Você ainda não capturou nenhum Pokémon. <a href="explorar.html">Vá explorar</a>!</p>'
    : lista.map((c) => cartaoDoPokemon(c, temAmigos)).join("");
}

/* ---------- Soltar (exclui e dá moedas) ---------- */
function soltar(pokemon) {
  const moedas = MOEDAS_POR_RARIDADE[raridadeDe(pokemon.id, pokemon.poder)];
  const pergunta = `Soltar ${nomeBonito(pokemon.nome)}? Você ganha ${moedas} moedas e perde ${pokemon.poder} pontos, ` +
    "mas ele continua registrado no álbum.";
  if (!confirm(pergunta)) return;
  soltarCaptura(pokemon.id);
  adicionarMoedas(moedas);
  desenharTime();
  mostrarAviso(`${nomeBonito(pokemon.nome)} foi solto. +${moedas} moedas.`, "sucesso");
}

/* ---------- Doar (somente para amigos) ---------- */
function abrirDoacao(pokemon) {
  const amigos = lerAmigos();
  if (amigos.length === 0) { mostrarAviso("Adicione amigos para poder doar.", "erro"); return; }
  pokemonDoacao = pokemon;
  $("texto-doacao").textContent = `Doar ${nomeBonito(pokemon.nome)} (poder ${pokemon.poder})? Ele sai da sua coleção.`;
  const seletor = $("amigo-select");
  seletor.innerHTML = "";
  amigos.forEach((a) => {
    const opcao = document.createElement("option"); // textContent evita injetar HTML
    opcao.value = a.id;
    opcao.textContent = a.apelido;
    seletor.appendChild(opcao);
  });
  $("dlg-doar").showModal();
}

$("form-doar").addEventListener("submit", async (e) => {
  e.preventDefault();
  const amigo = lerAmigos().find((a) => String(a.id) === $("amigo-select").value);
  $("dlg-doar").close();
  try {
    await doarPokemon(pokemonDoacao, amigo);
    desenharTime();
    mostrarAviso(`${nomeBonito(pokemonDoacao.nome)} foi doado para ${amigo.apelido}.`, "sucesso");
  } catch (erro) {
    mostrarAviso("Não foi possível doar. " + erro.message, "erro");
  }
});
$("cancelar-doacao").addEventListener("click", () => $("dlg-doar").close());

/* ---------- Eventos ---------- */
$("lista-time").addEventListener("click", (e) => {
  const botao = e.target.closest("button[data-acao]");
  if (!botao || botao.disabled) return;
  const pokemon = lerCapturados().find((c) => c.id === Number(botao.dataset.id));
  if (!pokemon) return;
  if (botao.dataset.acao === "soltar") soltar(pokemon);
  else abrirDoacao(pokemon);
});

/* ---------- Perfil: personagem e aura ---------- */
function desenharPerfil() {
  const area = $("perfil-avatar");
  area.innerHTML = "";
  area.appendChild(montarAvatar(96));
  $("perfil-nome").textContent = `${usuarioAtual()} (aura ${acharAura(auraEquipada()).nome})`;

  const escolha = $("escolha-avatar");
  escolha.innerHTML = "";
  AVATARES.forEach((personagem) => {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.title = personagem.nome;
    botao.className = personagem.id === lerAvatar() ? "escolhido" : "";
    const imagem = document.createElement("img");
    imagem.src = urlArteAvatar(personagem.id);
    imagem.alt = personagem.nome;
    botao.appendChild(imagem);
    botao.addEventListener("click", () => {
      salvarAvatar(personagem.id);
      desenharPerfil();
      atualizarAvatarBarra();
      mostrarAviso(`Personagem escolhido: ${personagem.nome}.`, "sucesso");
    });
    escolha.appendChild(botao);
  });
}

desenharTime();
desenharPerfil();