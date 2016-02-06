# Novel.js

[![Dependency Status](https://david-dm.org/Nanofus/novel.js.svg)](https://david-dm.org/Nanofus/novel.js) [![devDependency Status](https://david-dm.org/Nanofus/novel.js/dev-status.svg)](https://david-dm.org/Nanofus/novel.js#info=devDependencies)
[![Github All Releases](https://img.shields.io/github/downloads/Nanofus/novel.js/total.svg)]() [![GitHub release](https://img.shields.io/github/release/Nanofus/novel.js.svg)]()

Novel.js is a lightweight JavaScript text adventure engine. It requires only a `game.json` file containing all the text, choices, items and so on, and optionally a `skin.css` to style the game.

Novel.js is written in CoffeeScript and SASS and uses Vue.js and jQuery.

**Table of Contents**

- [Features](#features)
- [Upcoming features](#upcoming-features)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
	- [game.json structure](#gamejson-structure)
		- [Inventory](#inventory)
		- [Actions](#actions)
		- [Scenes](#scenes)
		- [Choices](#choices)
		- [Settings](#sounds)
		- [Sounds](#sounds)
	- [Format for add/remove/set and requirement commands](#format-for-addremoveset-and-requirement-commands)
	- [Tags](#tags)
		- [Conditional statements](#conditional-statements)
		- [Item & action counts](#item--action-counts)
		- [Styling shorthands](#styling-shorthands)
	- [Styling](#styling)
- [License](#license)

## Features

- A classic text-based adventure view; text and choices.
- Conditional statements to hide or show text and choices based on different conditions, such as the items the player is carrying.
- Shorthand tags for general styling of names etc.
- An inventory system, with another hidden one to track the player's actions or other statistics.
- Choices can have several different outcomes with different probabilities.
- Play sound effects!
- Support for css styling and html tags in text.

## Upcoming features

- Saving
- A music system and support for looping sounds
- Alternative visual novel system
- A settings menu for the player
- Translation support

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

Novel.js comes with a simple example game that demostrates all available features. Located in the `game` folder, `game.json` is easily readable and editable in your favourite text editor, so you can start working on your masterpiece right away! For a complete explanation of all the different stuff you can find in that file, please see the documentation!

## Documentation

### `game.json` structure

`game.json` is a JavaScript Object Notation file - a neat way to work with structured information. The top level of the structure contains the following variables:
- `gameName` - Use this to set your game's name.
- `inventory` - A list of the player's items.
- `actions` - A list of things the player has done, or any other variables that should not be seen by the player.
- `scenes` - A list of the game's scenes, i.e. views, areas, different texts the player can see.
- `settings` - Settings to edit, can also be made visible to the player.
- `sounds` - A list of the game's sound effects.

Now lets take a closer look on the lists:

#### Inventory

The player's inventory contains all the items they carry, and is visible to the player. The items do not have to be pre-defined; you can add items by any name from anywhere. The inventory in `game.json` describes the player's starting items. An example inventory:

```json
"inventory": [
  {"name": "sword", "count": 1},
  {"name": "sandwich", "count": 5}
]
```

This inventory contains six items of two kinds. A single item has the following attributes:
- `name` - Required. The item's name. Cannot contain spaces.
- `count` - Required. How many items of that specific type the player carries. If it becomes 0, the item is not removed from the inventory per se, but it does not show up in the UI. This can be used to track if the player has owned that kind of items in the past.
- `displayName` - The item's display name. Can contain spaces. If omitted, `name` is used instead.

#### Actions

The actions list works exactly the same way as the inventory, but is not visible to the player. This allows tracking of events and statistics in the game, such as levers pulled, dragons slain, whether the player has talked to a certain character or not etc. They can be revealed to the player by setting `debugMode` to `true` in `game.json`.

#### Scenes

Scenes are the most important of the things defined in `game.json`, as the entire game itself consists of a group of scenes with choices connecting them. An example scene:

```json
{
  "name": "dragon",
  "text": "<p>You wander across a [s1]dragon[/s]. What do you do?</p>",
  "choices": [
    {
      "text": "Fight it! (or, randomly, run away!!)",
      "itemRequirement": "sword[1]",
      "nextScene": "hitDragon[0.5]|missDragon[0.3]|road[0.2]"
    },
    {
      "text": "Run away!",
      "nextScene": "road"
    }
  ]
}
```

A scene object can contain the following variables and parameters:
- `name` - Required. The scene's name. Not visible to the user, used internally to navigate between scenes.
- `text` - Required (not enforced). The scene's text. Can be formatted using html and Novel.js's own tags. For texts longer than one paragraph you should use `<p></p>` tags to separate the text into clean paragraphs. If you find it inconvenient to fit all the text on one json line, you can also add `text-1`, `text-2`... below it, those get appended to `text` when the game is started.
- `style` - The scene's style. Adds a html class that can be styled in `skin.css` to give different looks to different scenes.
- `addItem` - Add items to the player's inventory upon entering the scene.
- `removeItem` - Remove items from the player's inventory upon entering the scene.
- `setItem` - Sets the specified items' counts in the player's inventory upon entering the scene. If the item does not exist in the inventory, it is added.
- `addAction` - Add actions to the player's action list upon entering the scene.
- `removeAction` - Remove actions from the player's action list upon entering the scene.
- `setAction` - Sets the specified actions' counts in the player's action list upon entering the scene. If the action does not exist in the actions list, it is added.
- `playSound` - Play a sound with the chosen name upon entering the scene.
- `choices` - Required (not enforced). A list of choices available in the scene.

#### Choices

Choices are the options the player can choose in a scene. An example is provided in the Scenes example. Choices have the following variables and parameters:
- `text` - Required. The text to show the player. Can be formatted using html or Novel.js's own tags.
- `itemRequirement` - Items that the player has to have in their inventory to be able to select this choice. An unselectable choice is hidden by default, unless `showAlways` is true.
- `actionRequirement` - Actions that the player has to have in their action list to be able to select this choice. An unselectable choice is hidden by default, unless `showAlways` is true.
- `alwaysShow` - Show the choice even though its requirements have not been met. The choice will be grayed out, and can not be selected. Can also be set globally in the settings.
- `addItem` - Add items to the player's inventory upon selecting this choice.
- `removeItem` - Remove items from the player's inventory upon selecting this choice.
- `setItem` - Sets the specified items' counts in the player's inventory selecting this choice. If the item does not exist in the inventory, it is added.
- `addAction` - Add actions to the player's action list upon selecting this choice.
- `removeAction` - Remove actions from the player's action list upon selecting this choice.
- `setAction` - Sets the specified actions' counts in the player's action list upon selecting this choice. If the action does not exist in the actions list, it is added.
- `playSound` - Play a sound with the chosen name upon selecting the choice.
- `nextScene` - The scene into which the player moves if they select this choice. If omitted, the scene does not change. Supports multiple outcomes, as different probabilities can be set for different scenes. Takes the following format:
```
sceneOne[probability]|sceneTwo[probability]|sceneThree[probability]
```
You can list any amount of scenes by separating them with `|`. All of the probabilities have to add up to exactly `1`. An example:
```
hitEnemySuccess[0.5]|hitEnemyFail[0.5]
```
In this example, the player has a 50% chance to hit and a 50% chance to miss the enemy.

#### Settings

The settings object contains general settings for the game:

- `debugMode` - True or false. If true, the actions list is shown to the player the same way as the inventory.
- `soundVolume` - A float between 0 and 1. The volume of all sound effects.
- `musicVolume` - A float between 0 and 1. The music's volume.
- `defaultClickSound` - A sound's name. If specified, this sound is played when clicking any choice.
- `alwaysShowDisabledChoices` - True or false. If true, choices with unmet requirements are always shown.

#### Sounds

The sounds object contains sounds used by the game. The sounds must be placed in the `sounds` folder inside the `game` folder. An example sound array:
```json
"sounds": [
  {"name": "click", "file": "click.wav"},
  {"name": "scream", "file": "wilhelm.wav"}
]
```
A single sound has the following attributes:
- `name` - The name is used when playing the sound with `playSound`.
- `file` - The file name.

### Format for add/remove/set and requirement commands

The parameters that remove, add or set items and actions or check for requirements take the following format. You can list any amount of items or actions with one command by separating them with `|`.

When adding or setting items, you can optionally define a `displayName` that may contain spaces, though this is not required (and not supported outside adding or setting items).

You can also define an optional `probability`, a float between 0 and 1 that defines the operation's success chance. Probability must always be defined before `displayName`.

The format:
```
itemOne[count,probability,displayName]|itemTwo[count,probability,displayName]|itemThree[count,probability,displayName]
```
An example:
```
"addItem": "sword[1]|shield[1,Magical Shield]|stone[2,0.5]|largestone[1,0.2,Large Stone]"
```
This adds one sword and one shield named "Magical Shield" to the player's inventory. With a 50% chance, the player also gains two stones, and with a 20% probability they gain a large stone.

### Tags

Novel.js has its own set of tags that can be used to show text conditionally or style text with predefined styles. They are distinguished from normal html tags by the `[]` brackets. The tags can be used in both scene texts and choices' texts.

You can also use html tags to structure and style your texts.

#### Conditional statements

Novel.js supports conditional rendering of parts of text. This is done with the `[if]` tag (closed with `[/if]`). Inside the tag a statement is defined. The statement should always be surrounded by `()` brackets. If the statement returns false, the text surrounded by the tags gets hidden by css.

An example:
```
[if ((inv.sword>=5||act.earnedTheTrustOfPeople>0)&&inv.swords!=500)]This text is shown only if you have more than five swords in your inventory or you have earned the people's trust and you must not have exactly 500 swords![/if]
```
The above example shows how the statements can be used; Items must be prefixed with `inv.` and actions with `act.`. The item's or action's name is followed by an operator. The supported operators are `==`, `!=`, `<`, `<=`, `>` and `>=`. On the right side of the operator is the item's or action's `count`.

Operators `||` (OR) and `&&` (AND) and parentheses `()` can also be used. If different operators follow each other without parentheses in between, `||` operator is parsed before `&&`. This means that `(condition1&&condition2||condition3)` is parsed as `(condition1&&(condition2||condition3))`.

#### Item & action counts

You can display the player's items' and actions' counts by using the item's or action's name prefixed with `inv.` (items) or `act.` (actions) inside the `[]` brackets. An example:
```
You have [inv.sword] sword[if (inv.sword!=1)]s[/if].
```

#### Styling shorthands

- `[s1]` through `[s99]` - Shorthand for adding a `<span class="highlight-X">` tag, where `X` is the number. Behaves like a normal `<span>` tag. Some of the highlights are predefined in `style.css`, and can be overridden in `skin.css`. Can be closed with `[/s]`.

### Styling

The `css` folder contains a file named `skin.css`. Styles in `skin.css` override the default styles from `style.css`.

## License

Novel.js is licensed under the MIT License.
© Ville Talonpoika 2016
