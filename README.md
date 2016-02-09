# Novel.js

[![Dependency Status](https://david-dm.org/Nanofus/novel.js.svg)](https://david-dm.org/Nanofus/novel.js) [![devDependency Status](https://david-dm.org/Nanofus/novel.js/dev-status.svg)](https://david-dm.org/Nanofus/novel.js#info=devDependencies)
[![Github All Releases](https://img.shields.io/github/downloads/Nanofus/novel.js/total.svg)]() [![GitHub release](https://img.shields.io/github/release/Nanofus/novel.js.svg)]()

Novel.js is a lightweight JavaScript text adventure engine. It requires only a `game.json` file containing all the text, choices, items and so on, and optionally a `skin.css` to style the game.

Novel.js is written in CoffeeScript and SASS and depends only on Vue.js.

**Table of Contents**

- [Features](#features)
- [Upcoming features](#upcoming-features)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
	- [`game.json` structure](#gamejson-structure)
		- [Inventory](#inventory)
		- [Stats](#stats)
		- [Scenes](#scenes)
		- [Choices](#choices)
		- [Settings](#sounds)
		- [Sounds](#sounds)
	- [Tags](#tags)
		- [`if` - Conditional statements](#conditional-statements)
		- [`choice` - Choice links](#choice-links)
		- [`input` - Player input](#player-input)
		- [`inv` & `stat` - Item & stat counts & values](#item--stat-counts--values)
		- [`print` - Displaying values](#displaying-values)
		- [`s` - Styling shorthands](#styling-shorthands)
	- [Formats for statements and commands](#formats-for-statements-and-commands)
		- [Format for add/remove/set and requirement commands](#format-for-addremoveset-and-requirement-commands)
		- [Format for conditional statements](#format-for-conditional-statements)
		- [Format for value statements and commands](#format-for-value-statements-and-commands)
	- [Audio](#audio)
		- [Sound effects](#sound-effects)
		- [Music](#music)
	- [Styling](#styling)
- [License](#license)

## Features

- A classic text-based adventure view; text and choices.
- Conditional statements to hide or show text and choices based on different conditions, such as the items the player is carrying.
- Shorthand tags for general styling of names etc.
- An inventory system, with another hidden one to track the player's actions or other statistics.
- Choices can have several different outcomes with different probabilities.
- Play sound effects and looping music/ambient sound effects!
- Support for css styling and html tags in text.

## Upcoming features

- Saving
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
- `stats` - A list of things the player has done, or any other variables that should not be seen by the player.
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

#### Stats

The stats list works exactly the same way as the inventory, but is not visible to the player. This allows tracking of events and statistics in the game, such as levers pulled, dragons slain, whether the player has talked to a certain character or not etc. They can be revealed to the player by setting `debugMode` to `true` in `game.json`.

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
- `addStats` - Add stats to the player's stats list upon entering the scene.
- `removeStats` - Remove stats from the player's actistatson list upon entering the scene.
- `setStats` - Sets the specified stats' counts in the player's stats list upon entering the scene. If the stat does not exist in the list, it is added.
- `setValue` - See its [own chapter](#format-for-var-and-value-manipulation-commands).
- `increaseValue` - See its [own chapter](#format-for-var-and-value-manipulation-commands).
- `decreaseValue` - See its [own chapter](#format-for-var-and-value-manipulation-commands).
- `playSound` - Play a sound with the chosen name upon entering the scene.
- `startMusic` - Start a music loop with the chosen name.
- `endMusic` - End a music loop with the chosen name.
- `choices` - Required (not enforced). A list of choices available in the scene.

#### Choices

Choices are the options the player can choose in a scene. An example is provided in the Scenes example. Choices have the following variables and parameters:
- `text` - Required in most cases. The text to show the player. Can be formatted using html or Novel.js's own tags. If not specified, the choice will not be shown but can be linked to using its name.
- `name` - Optional. Not visible, but is used when this choice is referred to from a link. Cannot contain spaces.
- `itemRequirement` - Items that the player has to have in their inventory to be able to select this choice. An unselectable choice is hidden by default, unless `showAlways` is true.
- `statsRequirement` - Stats that the player has to have in their stats list to be able to select this choice. An unselectable choice is hidden by default, unless `showAlways` is true.
- `requirement` - An advanced way to define a choice's requirements. Takes a conditional statement. An unselectable choice is hidden by default, unless `showAlways` is true.
- `alwaysShow` - Show the choice even though its requirements have not been met. The choice will be grayed out, and can not be selected. Can also be set globally in the settings.
- `addItem` - Add items to the player's inventory upon selecting this choice.
- `removeItem` - Remove items from the player's inventory upon selecting this choice.
- `setItem` - Sets the specified items' counts in the player's inventory selecting this choice. If the item does not exist in the inventory, it is added.
- `addStats` - Add stats to the player's stats list upon selecting this choice.
- `removeStats` - Remove stats from the player's stats list upon selecting this choice.
- `setStats` - Sets the specified stats' counts in the player's stats list upon selecting this choice. If the stat does not exist in the list, it is added.
- `setValue` - See its [own chapter](#format-for-var-and-value-manipulation-commands).
- `increaseValue` - See its [own chapter](#format-for-var-and-value-manipulation-commands).
- `decreaseValue` - See its [own chapter](#format-for-var-and-value-manipulation-commands).
- `playSound` - Play a sound with the chosen name upon selecting the choice.
- `startMusic` - Start a music loop with the chosen name.
- `endMusic` - End a music loop with the chosen name.
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

- `debugMode` - True or false. If true, the stats list is shown to the player the same way as the inventory.
- `alwaysShowDisabledChoices` - True or false. If true, choices with unmet requirements are always shown.
- `soundSettings`:
  - `soundVolume` - A float between 0 and 1. The volume of all sound effects.
  - `musicVolume` - A float between 0 and 1. The music's volume.
  - `defaultClickSound` - A sound's name. If specified, this sound is played when clicking any choice.

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

### Tags

Novel.js has its own set of tags that can be used to show text conditionally or style text with predefined styles. They are distinguished from normal html tags by the `[]` brackets. The tags can be used in both scene texts and choices' texts.

You can also use html tags to structure and style your texts.

#### Conditional statements

Novel.js supports conditional rendering of parts of text. This is done with the `[if]` tag (closed with `[/if]`). Inside the tag a statement is defined. If the statement returns false, the text surrounded by the tags gets hidden by css. `[if]` tags can be nested.

An example:
```
[if ((inv.sword>=5||stat.earnedTheTrustOfPeople>0)&&inv.swords!=500)]This text is shown only if you have more than five swords in your inventory or you have earned the people's trust and you must not have exactly 500 swords![/if]
```
More information about conditional statements [here](#format-for-conditional-statements).

#### Choice links

You can embed a choice as a link into a scene's text using the `[choice name]` tag. The target choice is referred to with the `name` value. The link is closed with `[/choice]`. An example:

```
There is a [choice pickastick]stick[/choice] on the ground.
```

#### Player input

You can embed a text input field into a scene's text (choice text not recommended) by using the `[input]` tag. The input field's value is bound to a stat, and the value can be printed by printing the stat's value. Changes to the input fields are checked every time a choice is selected. Example:
```html
<p>What is your name?</p>
<p>[input playerName]</p>
<p>Hello, [stat.playerName]!</p>
```
HTML tags are stripped from the input before it is saved.

#### Item & stat counts & values

You can display the player's items' and stats' counts by using the item's or stat's name prefixed with `inv.` (items) or `stat.` (stats) inside the `[]` brackets. An example:
```
You have [inv.sword] sword[if (inv.sword!=1)]s[/if].
```

#### Displaying values

In addition to the simple item & stat count tag, you can display any value in `game.json` or any result of an expression or the truth value of an equation or an inequation by using a `[print]` tag. Prefix any `.json` values with `var.`, stats with `stat.` and inventory items with `inv.`.  If you display another scene's text or choices, those texts will have their tags parsed immediately. Be careful not to display a text within itself. An example that prints another scene's choice's text:
```
[print var.scenes,1,choices,2,parsedText]
```
A calculation's result:
```
The amount of swords you have is [print 25/5*inv.sword] times five divided by twenty-five.
```
A truth value:
```
That you have over 24 swords is obviously [print inv.sword>24].
```
See [Formats for statements and commands](#formats-for-statements-and-commands) for all possible values you can display.

#### Styling shorthands

- `[s1]` through `[s99]` - Shorthand for adding a `<span class="highlight-X">` tag, where `X` is the number. Behaves like a normal `<span>` tag. Some of the highlights are predefined in `style.css`, and can be overridden in `skin.css`. Can be closed with `[/s]`.

### Formats for statements and commands

#### Format for add/remove/set and requirement commands

The parameters that remove, add or set items and stats or check for requirements take the following format. You can list any amount of items or stats with one command by separating them with `|`.

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

#### Format for conditional statements

Conditional statements allow for all kinds of complex logic, and can be used in requirements and `[if]` statements. An example:
```
[if ((inv.sword>=5||stat.earnedTheTrustOfPeople>0)&&inv.swords!=500)]This text is shown only if you have more than five swords in your inventory or you have earned the people's trust and you must not have exactly 500 swords![/if]
```

The above example shows how the statements can be used; Items must be prefixed with `inv.` and stats with `stat.`. Items and stats return their counts and values. `var.` is also available for `game.json` variables. The supported operators are `==`, `!=`, `<`, `<=`, `>` and `>=`. You may also use math operators `+`, `-`, `/` and `*`. Operators `||` (OR) and `&&` (AND) and parentheses `()` can also be used.

If different logic operators follow each other without parentheses in between, `||` operator is parsed before `&&`. This means that `condition1&&condition2||condition3` is parsed as `condition1&&(condition2||condition3)`.

If you do string comparation, you can use `==` and `!=` to compare them. To use a string as the equation's other side, it doesn't need any special notation, because everything that cannot be parsed is assumed to be a string. Simply write `var.gameName!=testGame`, for example.

#### Format for value statements and commands

Commands `setValue`, `increaseValue` and `decreaseValue` allow you to edit any value that is defined in `game.json`. Keep in mind that this is extremely error-prone and the changes cannot be undone without resetting the game.

The format:
```
objectName,id,objectName,id,objectName...
```

If the path contains arrays, give the path to that array as the first parameter, then the array index as the next parameter, and then the path inside that object as the third parameter and so forth. An example that picks a choice from another scene:
```
scenes,1,choices,2,parsedText
```

### Audio

Sounds and music the game uses are located in the `game/sounds` folder, and they have to be defined in `game.json`. More information [here](#sounds).

All music's and sounds' volume is dependent on the `musicVolume` and `soundVolume` attributes of `settings.soundSettings`.

#### Sound effects

You can play sound effects by using the `playSound` command and giving it the sound's name.

#### Music

Music works a bit differently in Novel.js than sound effects do; music is started by using a `startMusic` command with the music's name. The music file with the chosen name loops until stopped by the `stopMusic` command, even if the scene is changed. This way you can have both looping ambient sound effects and looping music. Example:
```json
{
  "name": "dragon",
	"startMusic": "battleMusic",
  "text": "<p>You wander across a [s1]dragon[/s]. What do you do?</p>",
  "choices": [
    {
      "text": "Fight it!",
      "itemRequirement": "sword[1]",
      "nextScene": "hitDragon"
    },
    {
      "text": "Run away!",
			"stopMusic": "battleMusic",
      "nextScene": "road"
    }
  ]
}
```
You should not play multiple instances of the same music at once, because it will not stop correctly.

### Styling

The `css` folder contains a file named `skin.css`. Styles in `skin.css` override the default styles from `style.css`.

## License

Novel.js is licensed under the MIT License.
© Ville Talonpoika 2016
