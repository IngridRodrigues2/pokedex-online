# Pokédex Online

Site feito com HTML, CSS e JavaScript puro, que usa a [PokéAPI](https://pokeapi.co/) para buscar Pokémon, explorar o mapa e capturar.

🔗 **Acesse:**  https://ingridrodrigues2.github.io/pokedex-online/

## Funcionalidades

- **Pokédex** (`index.html`): busca por nome ou número e lista de Pokémon.
- **Explorar** (`explorar.html`): encontre Pokémon selvagens e tente capturar.
- **Meu Time** (`meutime.html`): veja o inventário e solte Pokémon para ganhar moedas.
- **Álbum** (`album.html`): acompanhe os Pokémon descobertos e capturados, incluindo lendários e míticos.
- **Loja** (`loja.html`): compre auras para o avatar.
- **Amigos** (`amigos.html`): amigos e grupos.
- **Login** (`login.html`): entrada do jogador.

## Como rodar localmente

Não precisa instalar nada. Abra o `index.html` no navegador, ou rode um servidor local na pasta:

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Banco de dados online (Firebase)

- **Authentication** (e-mail e senha): o nome de usuário vira o e-mail interno `nome@pokedex.local`.
- **Firestore**: cada jogador tem um documento em `jogadores/{uid}` com capturas, álbum, moedas, auras e avatar.
- **Segurança**: as regras em `firestore.rules` permitem que cada jogador leia e escreva apenas o próprio documento.
- A configuração do projeto fica em `js/firebase-config.js`. As chaves do Firebase para web são públicas por design; quem protege os dados são as regras.

## Estrutura

```
├── index.html, explorar.html, meutime.html, album.html, loja.html, amigos.html, login.html
├── css/        estilos (estilo.css, explorar.css)
├── firestore.rules   regras de segurança do Firestore
└── js/         lógica de cada página
    ├── firebase-config.js   configuração do Firebase
    └── dados-pokemon.js     lista de lendários e limite do inventário
```

## Tecnologias

HTML5, CSS3, JavaScript, PokéAPI, Firebase (Authentication e Firestore) e GitHub Pages.

## Autor

Ingrid Rodrigues
