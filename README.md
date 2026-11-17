# Pokédex Online

Site feito com HTML, CSS e JavaScript puro, que usa a [PokéAPI](https://pokeapi.co/) para buscar Pokémon, explorar o mapa e capturar.

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

## Estrutura

```
├── index.html, explorar.html, meutime.html, album.html, loja.html, amigos.html, login.html
├── css/        estilos (estilo.css, explorar.css)
└── js/         lógica de cada página
    └── dados-pokemon.js   lista de lendários e limite do inventário
```

## Tecnologias

HTML5, CSS3, JavaScript, PokéAPI e GitHub Pages.

## Autor
Ingrid Rodrigues
