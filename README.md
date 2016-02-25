# Novel.js

[![Dependency Status](https://david-dm.org/Nanofus/novel.js.svg)](https://david-dm.org/Nanofus/novel.js) [![devDependency Status](https://david-dm.org/Nanofus/novel.js/dev-status.svg)](https://david-dm.org/Nanofus/novel.js#info=devDependencies)
[![Github All Releases](https://img.shields.io/github/downloads/Nanofus/novel.js/total.svg)]() [![GitHub release](https://img.shields.io/github/release/Nanofus/novel.js.svg)]()
[![Build Status](https://travis-ci.org/Nanofus/novel.js.svg?branch=master)](https://travis-ci.org/Nanofus/novel.js)

Novel.js is a versatile, lightweight JavaScript text game engine that works directly in the browser.

It is suitable for interactive fiction such as "choose your own adventure" games and other kinds of text-based entertainment. It also works well as a base for straightforward prose frosted with images and sounds. It requires only a `game.json` file containing all the text, choices, items and so on, an `html` file to display the game and optionally a stylesheet (`skin.css`), images and sounds.

Novel.js is written in CoffeeScript, HTML and SASS and depends only on Vue.js. It was born out of a need for a lightweight, easy-to-use but fully-featured text adventure system that could easily be embedded on a webpage. It is open source (MIT License) and free to use both commercially and non-commercially.

Contributions are welcome!

**Table of Contents**

- [Features](#features)
- [Upcoming features](#upcoming-features)
- [Installation](#installation)
	- [Non-techy installation](#non-techy-installation)
	- [Techy installation](#techy-installation)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [License](#license)

## Features

- A classic text-based adventure view; text and choices.
- Conditional statements to hide or show text and choices based on different conditions, such as the items the player is carrying, allowing for complex logic.
- Print values such as item counts or even text from other scenes.
- Scrolling text! Many ways to customize it and execute logic during scrolling to allow for voice acting, mood setting, character specific styles etc.
- An inventory system, with support for hidden items and multiple inventories!
- Choices can have several different outcomes with different probabilities, loads of different customization options and can be chained to prevent repetition.
- Play sound effects and looping music/ambient sound effects!
- Shorthand tags for general styling of names etc. and presets to help with recurring styles.
- Checkpoints to easily jump back and forth between scenes.
- Saving the game as a cookie or an encoded string that is given to the player.
- Support for CSS styling, custom JavaScript and HTML tags in text.
- ... And much more ~!

## Upcoming features

These features are planned or currently in development.
- Alternative visual novel system with animations
- A settings menu for the player
- Item descriptions
- Translation support

## Installation

### Non-techy installation

1. Download the [latest release .zip](https://github.com/Nanofus/novel.js/releases/latest) and extract it.
2. Uncomment the commented `<script>` tags in `index.html`.
3. Upload the folder to a web server, such as Dropbox. (Opening `index.html` locally does not work, as the browser cannot load `json` files locally!)
4. Open the location in web browser. Check dev tools (usually F12) for logs.
5. Start working on `game/game.json`!

### Techy installation

1. `npm install novel-js`.
2. Create an `index.html` file and include the [HTML](#html-structure) in it. Include Novel.js (`node_modules/novel-js/novel.min.js`) and Vue.js scripts.
3. Create the folder `game` and a `game.json` inside it.
4. Use a web server of your choice or use `npm install http-server` -> `http-server` -> open `http://localhost:8080/`
5. Start working on `game.json`!

## Getting Started

Novel.js comes with a simple example game that demostrates all available features. Located in the `game` folder, `game.json` is easily readable and editable in your favourite text editor, so you can start working on your masterpiece right away! For a complete explanation of all the different stuff you can find in that file, please see the documentation!

## Documentation

See the separate [documentation](DOCUMENTATION.md).

## License

Novel.js is licensed under the MIT License.
Copyright © Ville Talonpoika 2016
