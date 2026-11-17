/* Login por nome de usuário e senha.
   Com o Firebase configurado (js/firebase-config.js), as contas ficam no Firebase Authentication e o progresso
   do jogador no Firestore. Se a configuração estiver vazia, o site roda em MODO DE TESTE LOCAL: as contas
   ficam só neste navegador (senha guardada como hash), o que NÃO é segurança de verdade. */
const MODO_LOCAL = typeof FIREBASE_CONFIG === "undefined" || !FIREBASE_CONFIG.apiKey;
const CHAVE_USUARIOS = "pokedex_usuarios";
const CHAVE_SESSAO = "pokedex_sessao";
const CHAVES_ANTIGAS = ["pokedex_capturados", "pokedex_vistos", "pokedex_registro", "pokedex_moedas"];
// Tudo o que é guardado por jogador (e enviado ao Firestore)
const CHAVES_DADOS = ["pokedex_capturados", "pokedex_vistos", "pokedex_registro", "pokedex_moedas",
                      "pokedex_auras", "pokedex_aura_equipada", "pokedex_avatar"];
const DOMINIO_EMAIL = "pokedex.local"; // o Firebase entra por e-mail: o nome vira nome@pokedex.local

let fbAuth = null, fbDb = null, authPronta = Promise.resolve(null);
if (!MODO_LOCAL) {
  firebase.initializeApp(FIREBASE_CONFIG);
  fbAuth = firebase.auth();
  fbDb = firebase.firestore();
  // resolve quando o Firebase termina de restaurar a sessão guardada no navegador
  authPronta = new Promise((resolver) => {
    const parar = fbAuth.onAuthStateChanged((u) => { parar(); resolver(u); });
  });
}

/* ---------- Sessão ---------- */
function usuarioAtual() {
  try {
    const sessao = JSON.parse(localStorage.getItem(CHAVE_SESSAO));
    return sessao && sessao.nome ? sessao.nome : null;
  } catch (e) { return null; }
}
// Cada jogador tem as suas próprias chaves de dados (ex.: pokedex_capturados::ash)
function chave(base) {
  const nome = usuarioAtual();
  return nome ? `${base}::${nome.toLowerCase()}` : base;
}

/* ---------- Validação ---------- */
function validarNome(nome) { return /^[A-Za-z0-9_]{3,20}$/.test(nome); }
function validarSenha(senha) { return typeof senha === "string" && senha.length >= 8 && senha.length <= 64; }

/* ---------- Hash da senha (PBKDF2 + sal aleatório) ---------- */
function bytesParaBase64(bytes) { return btoa(String.fromCharCode(...bytes)); }
function base64ParaBytes(texto) { return Uint8Array.from(atob(texto), (c) => c.charCodeAt(0)); }

async function gerarHash(senha, salBase64) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(senha), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: base64ParaBytes(salBase64), iterations: 100000, hash: "SHA-256" }, material, 256);
  return bytesParaBase64(new Uint8Array(bits));
}

function lerUsuarios() {
  try { return JSON.parse(localStorage.getItem(CHAVE_USUARIOS)) || {}; }
  catch (e) { return {}; }
}

// A primeira conta criada herda os dados que existiam antes do login
function adotarDadosAntigos(nome) {
  CHAVES_ANTIGAS.forEach((base) => {
    const valor = localStorage.getItem(base);
    if (valor !== null) {
      localStorage.setItem(`${base}::${nome.toLowerCase()}`, valor);
      localStorage.removeItem(base);
    }
  });
}

/* ---------- Nuvem (Firestore): jogadores/{uid} guarda o nome e os dados do jogador ---------- */
function emailDoNome(nome) { return `${nome.trim().toLowerCase()}@${DOMINIO_EMAIL}`; }

// Grava no navegador e envia para o Firestore (use no lugar de localStorage.setItem)
function salvar(base, valor) {
  localStorage.setItem(chave(base), valor);
  enviarParaNuvem();
}

async function enviarParaNuvem() {
  if (MODO_LOCAL) return;
  const usuario = await authPronta.then(() => fbAuth.currentUser);
  if (!usuario || !usuarioAtual()) return;
  const dados = {};
  CHAVES_DADOS.forEach((base) => {
    const valor = localStorage.getItem(chave(base));
    if (valor !== null) dados[base] = valor;
  });
  try { await fbDb.collection("jogadores").doc(usuario.uid).set({ nome: usuarioAtual(), dados }, { merge: true }); }
  catch (erro) { console.warn("Não foi possível salvar na nuvem:", erro); }
}

// Traz os dados do Firestore para o navegador. Devolve o nome com as maiúsculas originais.
async function baixarDaNuvem(nomeDigitado) {
  const usuario = fbAuth.currentUser;
  const doc = await fbDb.collection("jogadores").doc(usuario.uid).get();
  const nome = (doc.exists && doc.data().nome) || nomeDigitado;
  const dados = (doc.exists && doc.data().dados) || {};
  CHAVES_DADOS.forEach((base) => {
    if (dados[base] !== undefined) localStorage.setItem(`${base}::${nome.toLowerCase()}`, dados[base]);
  });
  return nome;
}

function mensagemDeErroFirebase(erro) {
  switch (erro.code) {
    case "auth/email-already-in-use": return "Esse nome de usuário já existe.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-login-credentials": return "Usuário ou senha incorretos.";
    case "auth/too-many-requests": return "Muitas tentativas. Aguarde um pouco e tente de novo.";
    case "auth/network-request-failed": return "Sem conexão com a internet.";
    case "auth/operation-not-allowed": return "O login por e-mail e senha não está ativado no Firebase.";
    default: return "Não foi possível concluir (" + (erro.code || erro.message) + ").";
  }
}

/* ---------- Ações ---------- */
async function cadastrar(nome, senha) {
  if (!validarNome(nome)) throw new Error("O nome deve ter de 3 a 20 caracteres: letras, números ou _.");
  if (!validarSenha(senha)) throw new Error("A senha deve ter de 8 a 64 caracteres.");
  if (!MODO_LOCAL) {
    try { await fbAuth.createUserWithEmailAndPassword(emailDoNome(nome), senha); }
    catch (erro) { throw new Error(mensagemDeErroFirebase(erro)); }
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ nome }));
    await enviarParaNuvem(); // cria o documento do jogador
    return;
  }
  const usuarios = lerUsuarios();
  const id = nome.toLowerCase();
  if (usuarios[id]) throw new Error("Esse nome de usuário já existe.");
  const sal = bytesParaBase64(crypto.getRandomValues(new Uint8Array(16)));
  const primeiraConta = Object.keys(usuarios).length === 0;
  usuarios[id] = { nome, sal, hash: await gerarHash(senha, sal) };
  localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(usuarios));
  if (primeiraConta) adotarDadosAntigos(nome);
  localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ nome }));
}

async function entrar(nome, senha) {
  if (!MODO_LOCAL) {
    let nomeFinal;
    try {
      await fbAuth.signInWithEmailAndPassword(emailDoNome(nome), senha);
      nomeFinal = await baixarDaNuvem(nome.trim());
    } catch (erro) { throw new Error(mensagemDeErroFirebase(erro)); }
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ nome: nomeFinal }));
    return;
  }
  const usuario = lerUsuarios()[nome.trim().toLowerCase()];
  const hash = usuario ? await gerarHash(senha, usuario.sal) : null;
  if (!usuario || hash !== usuario.hash) throw new Error("Usuário ou senha incorretos.");
  localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ nome: usuario.nome }));
}

async function sair() {
  if (!MODO_LOCAL) {
    await enviarParaNuvem(); // garante que nada fica para trás
    CHAVES_DADOS.forEach((base) => localStorage.removeItem(chave(base))); // não deixa dados em computador compartilhado
    try { await fbAuth.signOut(); } catch (e) { /* segue para a tela de login */ }
  }
  localStorage.removeItem(CHAVE_SESSAO);
  location.href = "login.html";
}

/* ---------- Proteção das páginas e barra do usuário ---------- */
function exigirLogin() {
  const naTelaDeLogin = location.pathname.endsWith("login.html");
  if (!usuarioAtual() && !naTelaDeLogin) location.replace("login.html");
  else if (usuarioAtual() && naTelaDeLogin) location.replace("index.html");
  else if (!MODO_LOCAL && usuarioAtual() && !naTelaDeLogin) {
    // se o Firebase perdeu a sessão (ex.: expirou), volta para o login
    authPronta.then((u) => { if (!u) { localStorage.removeItem(CHAVE_SESSAO); location.replace("login.html"); } });
  }
}

function montarBarraUsuario() {
  const menu = document.querySelector(".abas");
  const nome = usuarioAtual();
  if (!menu || !nome) return;
  const caixa = document.createElement("span");
  caixa.className = "usuario";
  caixa.textContent = `Jogador: ${nome} `; // textContent evita injetar HTML
  if (typeof montarAvatar === "function") caixa.prepend(montarAvatar(32)); // foto com a borda da aura
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao pequeno";
  botao.textContent = "Sair";
  botao.addEventListener("click", sair);
  caixa.appendChild(botao);
  menu.appendChild(caixa);
}

exigirLogin();
if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", montarBarraUsuario);