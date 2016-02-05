# Novel.js

[![Dependency Status](https://david-dm.org/Nanofus/novel.js.svg)](https://david-dm.org/Nanofus/novel.js) [![devDependency Status](https://david-dm.org/Nanofus/novel.js/dev-status.svg)](https://david-dm.org/Nanofus/novel.js#info=devDependencies)
[![Github All Releases](https://img.shields.io/github/downloads/Nanofus/novel.js/total.svg)]() [![GitHub release](https://img.shields.io/github/release/Nanofus/novel.js.svg)]()

Novel.js is a lightweight JavaScript text adventure engine. It requires only a `game.json` file containing all the text, choices, items and so on, and optionally a `skin.css` to style the game.

Novel.js is written in CoffeeScript and SASS and uses Vue.js and jQuery.

## Features

- A classic text-based adventure view; text and choices.
- Conditional statements to hide or show text and choices based on different conditions, such as the items the player is carrying.
- Shorthand tags for general styling of names etc.
- An inventory system, with another hidden one to track the player's actions or other statistics.
- Choices can have several different outcomes with different probabilities.
- Support for css styling and html tags in text.

## Upcoming features

- Saving

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

### `game.json` structure

`game.json` is a JavaScript Object Notation file - a neat way to work with structured information. The top level of the structure contains the following variables:
- `gameName` - Use this to set your game's name.
- `debugMode` - True or false; when enabled, actions can be viewed by the player next to the inventory.
- `inventory` - A list of the player's items.
- `actions` - A list of things the player has done, or any other variables that should not be seen by the player.
- `scenes` - A list of the game's scenes, i.e. views, areas, different texts the player can see.

Now lets take a closer look on the lists:

#### Inventory

The player's inventory contains all the items they carry, and is visible to the player. An example inventory:

```
"inventory": [
  {"name": "sword", "count": 1},
  {"name": "sandwich", "count": 5}
]
```

This inventory contains six items of two kinds. A single item has the following attributes:
- `name` - Required. The item's name, shown in the UI.
- `count` - Required. How many items of that specific type the player carries. If it becomes 0, the item is not removed from the inventory per se, but it does not show up in the UI. This can be used to track if the player has owned that kind of items in the past.
