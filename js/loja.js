/* Loja de auras: comprar com moedas e equipar */
const $ = (id) => document.getElementById(id);
let timerAviso = null;

function mostrarAviso(texto, tipo) {
  clearTimeout(timerAviso);
  const aviso = $("aviso");
  aviso.textContent = texto;
  aviso.className = "aviso " + tipo;
  aviso.hidden = false;
  timerAviso = setTimeout(() => { aviso.hidden = true; }, 4000);
}

function textoChances(c) {
  return `Comum ${c.comum}%, Incomum ${c.incomum}%, Raro ${c.raro}%, Épico ${c.epico}%, Lendário ${c.lendario}%`;
}

function criarElemento(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto) el.textContent = texto;
  return el;
}

function desenharLoja() {
  const moedas = lerMoedas();
  const compradas = lerAurasCompradas();
  const equipada = auraEquipada();
  $("moedas").textContent = moedas;
  $("aura-atual").textContent = acharAura(equipada).nome;

  const lista = $("lista-auras");
  lista.innerHTML = "";
  AURAS.forEach((aura) => {
    const cartao = criarElemento("div", "carta-aura");
    const area = criarElemento("div", "perfil-avatar");
    area.appendChild(montarAvatar(72, aura.id)); // prévia da borda desta aura
    cartao.appendChild(area);
    cartao.appendChild(criarElemento("h4", "", aura.nome));
    cartao.appendChild(criarElemento("p", "pequeno", textoChances(aura.chances)));

    const botao = criarElemento("button", "botao pequeno");
    botao.type = "button";
    botao.dataset.id = aura.id;
    if (aura.id === equipada) {
      botao.textContent = "Equipada";
      botao.disabled = true;
    } else if (compradas.includes(aura.id)) {
      botao.textContent = "Equipar";
      botao.dataset.acao = "equipar";
    } else {
      botao.textContent = `Comprar (${aura.preco} moedas)`;
      botao.dataset.acao = "comprar";
      if (moedas < aura.preco) botao.disabled = true;
    }
    cartao.appendChild(botao);
    if (botao.disabled && aura.id !== equipada) {
      cartao.appendChild(criarElemento("p", "pequeno", `Faltam ${aura.preco - moedas} moedas.`));
    }
    lista.appendChild(cartao);
  });
}

$("lista-auras").addEventListener("click", (e) => {
  const botao = e.target.closest("button[data-acao]");
  if (!botao || botao.disabled) return;
  try {
    if (botao.dataset.acao === "comprar") {
      const aura = comprarAura(botao.dataset.id);
      mostrarAviso(`Aura ${aura.nome} comprada e equipada!`, "sucesso");
    } else {
      equiparAura(botao.dataset.id);
      mostrarAviso(`Aura ${acharAura(botao.dataset.id).nome} equipada.`, "sucesso");
    }
  } catch (erro) {
    mostrarAviso(erro.message, "erro");
  }
  desenharLoja();
  atualizarAvatarBarra();
});

desenharLoja();