/* Raridades dos Pokémon e moedas ao soltar (precisa do dados-pokemon.js carregado antes) */

/* Rede de segurança: se o dados-pokemon.js estiver incompleto, o site usa valores padrão e avisa na tela */
const LENDARIOS_PADRAO = [
  144, 145, 146, 150, 151,                                   // Geração 1
  243, 244, 245, 249, 250, 251,                              // Geração 2
  377, 378, 379, 380, 381, 382, 383, 384, 385, 386,          // Geração 3
  480, 481, 482, 483, 484, 485, 486, 487, 488, 490, 491, 492, 493, // Geração 4
  638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649, // Geração 5
  716, 717, 718, 719, 720, 721,                              // Geração 6
  772, 773, 785, 786, 787, 788, 789, 790, 791, 792, 800,     // Geração 7
  801, 802, 807, 808, 809,                                   // Geração 7 (míticos)
  888, 889, 890, 891, 892, 893, 894, 895, 896, 897, 898, 905, // Geração 8
  1001, 1002, 1003, 1004, 1007, 1008, 1014, 1015, 1016, 1017, 1024, 1025 // Geração 9
];
const DADOS_FALTANDO = [];
if (typeof LENDARIOS_IDS === "undefined") { globalThis.LENDARIOS_IDS = LENDARIOS_PADRAO; DADOS_FALTANDO.push("LENDARIOS_IDS"); }
if (typeof LIMITE_INVENTARIO === "undefined") { globalThis.LIMITE_INVENTARIO = LENDARIOS_IDS.length; DADOS_FALTANDO.push("LIMITE_INVENTARIO"); }
if (typeof PODER_POR_ID === "undefined") { globalThis.PODER_POR_ID = []; } // a tabela de poder é opcional
if (DADOS_FALTANDO.length > 0) {
  console.warn("js/dados-pokemon.js incompleto. Faltando: " + DADOS_FALTANDO.join(", "));
  document.addEventListener("DOMContentLoaded", () => {
    const faixa = document.createElement("div");
    faixa.className = "aviso erro";
    faixa.textContent = `Atenção: o arquivo js/dados-pokemon.js está incompleto (faltando ${DADOS_FALTANDO.join(", ")}). ` +
      "Substitua pelo arquivo original. Enquanto isso, o site usa uma lista padrão.";
    document.body.prepend(faixa);
  });
}
const NOMES_RARIDADE = { comum: "Comum", incomum: "Incomum", raro: "Raro", epico: "Épico", lendario: "Lendário" };
// Poder mínimo de cada faixa (ajustar depois de contar quantos Pokémon caem em cada uma)
const CORTES_PODER = { incomum: 350, raro: 450, epico: 530 };
// Moedas ganhas ao soltar uma cópia
const MOEDAS_POR_RARIDADE = { comum: 5, incomum: 15, raro: 40, epico: 120, lendario: 500 };

// Tabela de poder dos 1025 Pokémon (vem do dados-pokemon.js). Se o arquivo estiver desatualizado, devolve vazio.
function tabelaDePoder() { return typeof PODER_POR_ID !== "undefined" ? PODER_POR_ID : []; }

// Lendários e Míticos vêm da lista; os demais são classificados pelo poder
function raridadeDe(id, poder) {
  if (LENDARIOS_IDS.includes(id)) return "lendario";
  const p = poder ?? tabelaDePoder()[id - 1] ?? 0;
  if (p >= CORTES_PODER.epico) return "epico";
  if (p >= CORTES_PODER.raro) return "raro";
  if (p >= CORTES_PODER.incomum) return "incomum";
  return "comum";
}