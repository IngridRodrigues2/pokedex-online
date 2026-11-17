/* Tela de login: entrar e criar conta */
const $ = (id) => document.getElementById(id);
let modo = "entrar"; // "entrar" ou "cadastrar"

function mostrarAviso(texto, tipo) {
  const aviso = $("aviso");
  aviso.textContent = texto;
  aviso.className = "aviso " + tipo;
  aviso.hidden = false;
}

function trocarModo(novoModo) {
  modo = novoModo;
  const entrando = modo === "entrar";
  $("aba-entrar").classList.toggle("ativo", entrando);
  $("aba-cadastrar").classList.toggle("ativo", !entrando);
  $("linha-confirmar").hidden = entrando;
  $("btn-enviar").textContent = entrando ? "Entrar" : "Criar conta";
  $("campo-senha").autocomplete = entrando ? "current-password" : "new-password";
  $("dica").textContent = entrando ? "" : "Nome: 3 a 20 caracteres (letras, números ou _). Senha: de 8 a 64 caracteres.";
  $("aviso").hidden = true;
}

$("aba-entrar").addEventListener("click", () => trocarModo("entrar"));
$("aba-cadastrar").addEventListener("click", () => trocarModo("cadastrar"));

$("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = $("campo-nome").value.trim();
  const senha = $("campo-senha").value;
  if (modo === "cadastrar" && senha !== $("campo-confirmar").value) {
    mostrarAviso("As senhas não são iguais.", "erro");
    return;
  }
  $("btn-enviar").disabled = true;
  mostrarAviso(modo === "entrar" ? "Entrando..." : "Criando conta...", "carregando");
  try {
    if (modo === "entrar") await entrar(nome, senha);
    else await cadastrar(nome, senha);
    location.href = "index.html";
  } catch (erro) {
    mostrarAviso(erro.message, "erro");
    $("btn-enviar").disabled = false;
  }
});

$("aviso-modo").textContent = MODO_LOCAL
  ? "Modo de teste: as contas ficam só neste navegador e não oferecem segurança real."
  : "";