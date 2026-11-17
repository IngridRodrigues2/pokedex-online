/* Dados dos Pokémon (lista PROVISÓRIA). Para usar os dados reais da PokéAPI, rode o script do console e cole o resultado aqui. */
const PODER_POR_ID = []; // poder de cada Pokémon: posição 0 = Pokémon nº 1 (o script do console preenche)

const LENDARIOS_IDS = [
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
// Tamanho máximo do inventário = quantidade de Lendários e Míticos
const LIMITE_INVENTARIO = LENDARIOS_IDS.length;