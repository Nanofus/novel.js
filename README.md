# Novel.js

[![Dependency Status](https://david-dm.org/Nanofus/novel.js.svg)](https://david-dm.org/Nanofus/novel.js) [![devDependency Status](https://david-dm.org/Nanofus/novel.js/dev-status.svg)](https://david-dm.org/Nanofus/novel.js#info=devDependencies)
[![Github All Releases](https://img.shields.io/github/downloads/Nanofus/novel.js/total.svg)]() [![GitHub release](https://img.shields.io/github/release/Nanofus/novel.js.svg)]()

Novel.js is a lightweight JavaScript text adventure engine. It requires only a `game.json` file containing all the text, choices, items and so on, and optionally a `skin.css` to style the game.

Novel.js is written in CoffeeScript and SASS and uses Vue.js and jQuery.

## Installation

1. Download the repository as a .zip and extract it
2. If you have npm installed (i.e. you are a technical person)
  1. Run `npm install` in the extracted folder
  2. And then `gulp`
  3. Install a lightweight server with `npm install -g http-server`
  4. Run the server with `http-server`
  5. Open `http://localhost:8080/` and start working!
3. If you don't have npm (i.e. you have no idea what npm is)
  1. Uncomment the commented `<script>` tags in `index.html`
  2. Comment the `<script>` tags with `src="node_modules ...`
  3. Put the folder in Dropbox or similar so you can open `index.html` on a server - opening `index.html` directly does not work, as JavaScript is not allowed to load `.json` files locally in most browsers.

## Getting Started

Novel.js comes with a simple example game that demostrates all available features. `game.json` is easily readable and editable in your favourite text editor, so you can start working on your masterpiece right away! For a complete explanation of all the different stuff you can find in that file, please see the documentation!

## Documentation

