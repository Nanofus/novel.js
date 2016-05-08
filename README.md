# Novel.js


[![Build Status](https://travis-ci.org/Nanofus/novel.js.svg?branch=master)](https://travis-ci.org/Nanofus/novel.js) [![Dependency Status](https://david-dm.org/Nanofus/novel.js.svg)](https://david-dm.org/Nanofus/novel.js) [![devDependency Status](https://david-dm.org/Nanofus/novel.js/dev-status.svg)](https://david-dm.org/Nanofus/novel.js#info=devDependencies)
[![GitHub release](https://img.shields.io/github/release/Nanofus/novel.js.svg)](https://github.com/Nanofus/novel.js/releases/latest) [![npm version](https://badge.fury.io/js/novel-js.svg)](https://badge.fury.io/js/novel-js) [![npm](https://img.shields.io/npm/dm/novel-js.svg?maxAge=2592000)](https://www.npmjs.com/package/novel-js) [![npm](https://img.shields.io/npm/dt/novel-js.svg?maxAge=2592000)](https://www.npmjs.com/package/novel-js)

Novel.js is a versatile, lightweight JavaScript text game engine that works directly in the browser.

It is suitable for interactive fiction such as "choose your own adventure" games and other kinds of text-based entertainment. It also works well as a base for straightforward prose garnished with images and sounds. It requires only a `novel.json` file containing all the text, choices, items and so on, an `html` file to display the novel/game and optionally a stylesheet (`skin.css`), images and sounds.

Text adventures are often overlooked as something only game development beginners create, and Novel.js aims to fix this misconception. Interactive fiction combines the flexibility and possibilities that prose can offer with interactivity and reader choice – a type of entertainment I think has not yet been thoroughly explored. The popularity of visual novels demonstrates the possibilities the medium can offer!

Novel.js is written in CoffeeScript, HTML and SASS and has no dependencies (although Papa Parse is required for CSV support). It was born out of a need for a lightweight, easy-to-use but fully-featured text adventure system that could easily be embedded on a webpage. It is open source (MIT License) and free to use both commercially and non-commercially. A **[live demo](http://nanofus.github.io/novel.js/)** is available, however it covers only a small part of all functionality!

You can use [electron-noveljs-boilerplate](https://github.com/Nanofus/electron-noveljs-boilerplate) with Novel.js to create standalone desktop applications. It requires a bit more technical knowledge than Novel.js itself.

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
- An inventory system, with support for hidden items, item descriptions and multiple inventories!
- Choices can have several different outcomes with different probabilities, loads of different customization options and can be chained to prevent repetition.
- Play sound effects and looping music/ambient sound effects!
- Shorthand tags for general styling of names etc. and presets to help with recurring styles.
- Checkpoints to easily jump back and forth between scenes.
- Saving the application state as a cookie or an encoded string that is given to the player.
- Load text from text and CSV files and split `novel.json` into multiple files for easier management.
- Translation support, both directly in `novel.json` and by using external CSV files.
- Support for CSS styling, custom JavaScript and HTML tags in text.
- ... And much more ~!

## Upcoming features

These features are planned or currently in development.
- Alternative visual novel system with animations
- Markdown support
- More advanced keyboard input
- A standard settings menu
- [else] tag
- HTML5 Local Storage saving
- API

## Installation

### Non-techy installation

1. Download the [latest release .zip](https://github.com/Nanofus/novel.js/releases/latest) and extract it.
2. Upload the folder to a web server, such as Dropbox. (Opening `index.html` locally does not work, as the browser cannot load `json` files locally!)
3. Open the location in web browser. Check dev tools (usually F12) for logs.
4. Start working on `novel/novel.json`!

### Techy installation

1. `npm install novel-js`.
2. Create an `index.html` file and add ```<novel></novel>``` inside the body, or include the [customizable HTML](https://github.com/Nanofus/novel.js/blob/master/DOCUMENTATION.md#html-structure) in it. Include the Novel.js (`node_modules/novel-js/novel.min.js`) script.
3. Create the folder `novel` and a `novel.json` inside it.
4. `http-server` and open `http://localhost:8080/` or use a web server of your choice.
5. Start working on `novel.json`!

## Getting Started

Novel.js comes with a simple example app that demostrates all available features. Located in the `novel` folder, `novel.json` is easily readable and editable in your favourite text editor, so you can start working on your masterpiece right away! For a complete explanation of all the different stuff you can find in that file, please see the documentation!

## Documentation

See the separate [documentation](DOCUMENTATION.md).

## License

Novel.js is licensed under the MIT License.
Copyright © Ville Talonpoika 2016
