# Documentation

**Table of Contents**

- [HTML structure](#html-structure)
- [`game.json` structure](#gamejson-structure)
	- [Inventories](#inventories)
	- [Scenes](#scenes)
	- [Choices](#choices)
	- [Settings](#settings)
	- [Sounds](#sounds)
- [Tags](#tags)
	- [`if` - Conditional statements](#conditional-statements)
	- [`choice` - Choice links](#choice-links)
	- [`input` - Player input](#player-input)
	- [`inv` - Item counts & values](#item-counts--values)
	- [`print` - Displaying values](#displaying-values)
	- [`exec` - Executing JavaScript while text scrolls](#executing-javascript-while-text-scrolls)
	- [`speed` - Setting text scrolling speed](#setting-text-scrolling-speed)
	- [`pause` - Pausing text scrolling](#pausing-text-scrolling)
	- [`scrollSound` - Setting text scrolling sound](#setting-text-scrolling-sound)
	- [`sound` - Playing sounds while text scrolls](#playing-sounds-while-text-scrolls)
	- [`music` - Playing music while text scrolls](#playing-music-while-text-scrolls)
	- [`stopMusic` - Stopping music while text scrolls](#stopping-music-while-text-scrolls)
	- [`p` - Tag and string presets](#tag-and-string-presets)
	- [`s` - Styling shorthands](#styling-shorthands)
- [Formats for statements and commands](#formats-for-statements-and-commands)
	- [Format for add/remove/set and requirement commands](#format-for-addremoveset-and-requirement-commands)
	- [Format for probabilities](#format-for-probabilities)
	- [Format for conditional statements and calculations](#format-for-conditional-statements-and-calculations)
	- [Format for value statements and commands](#format-for-value-statements-and-commands)
- [Audio](#audio)
	- [Sound effects](#sound-effects)
	- [Music](#music)
- [Styling](#styling)
- [Checkpoints](#checkpoints)
- [Saving](#saving)
	- [Cookie](#cookie)
	- [Text](#text)

## HTML structure

Novel.js needs some HTML on the webpage to run properly. You can use this code or some variant of it:
```html
<div id="game-area">
	<div class="style-area {{ game.currentScene.style }}">
		<div id="notification-wrapper">
			<div id="save-notification" class="notification">
				<p>Copy and save this text:</p>
				<p><textarea name="save-text" readonly></textarea></p>
				<p><button type="button" onclick="ui.closeSaveNotification()">Close</button><button type="button" id="copy-button">Copy</button></p>
			</div>
			<div id="load-notification" class="notification">
				<p>Paste your saved game here:</p>
				<p><textarea name="load-text"></textarea></p>
				<p><button type="button" onclick="ui.closeLoadNotification(false)">Close</button><button type="button" onclick="ui.closeLoadNotification(true)">Load</button></p>
			</div>
		</div>
		<div class="text-and-choices-area">
			<div class="text-area">
				{{{ printedText }}}
			</div>
			<button v-show="textSkipEnabled()" type="button" id="skip-button" onclick="textPrinter.complete()">Skip</button>
			<button type="button" id="continue-button" onclick="textPrinter.unpause()">Continue</button>
			<div class="choices">
				<ul class="choice-list">
					<div v-for="choice in game.parsedChoices">
						<li v-if="requirementsFilled(choice)" class="choice">
							<a href="#" v-on:click="selectChoice(choice)">{{{ choice.parsedText }}}</a>
						</li>
						<div v-if="choice.alwaysShow">
							<li v-if="!requirementsFilled(choice)">
								{{{ choice.parsedText }}}
							</li>
						</div>
					</div>
				</ul>
			</div>
		</div>
		<div v-if="!inventoryHidden" class="inventory">
			<h5>Inventory:</h5>
			<ul class="item-list">
				<li v-for="item in game.inventories[game.currentInventory]" class="inventory-item" v-if="itemsOverZeroAndNotHidden(item)">
					{{{ item.displayName }}} - {{{ item.value }}}
				</li>
			</ul>
		</div>
		<div v-if="game.settings.debugMode" class="stats">
			<h5>Stats:</h5>
			<ul class="item-list">
				<li v-for="item in game.inventories[game.currentInventory]" class="inventory-item" v-if="itemsOverZeroAndAreHidden(item)">
					{{{ item.displayName }}} - {{{ item.value }}}
				</li>
			</ul>
		</div>
		<div v-if="game.settings.showSaveButtons" class="save-buttons">
			<button type="button" id="save-button" onclick="gameManager.saveGame()">Save</button>
			<button type="button" id="load-button" onclick="ui.showLoadNotification()">Load</button>
		</div>
	</div>
</div>
```

## `game.json` structure

`game.json` is a JavaScript Object Notation file - a neat way to work with structured information. The top level of the structure contains the following variables:
- `gameName` - Use this to set your game's name.
- `version` - The game's version number.
- `inventories` - A list of lists of the player's items and other variables.
- `scenes` - A list of the game's scenes, i.e. views, areas, different texts the player can see.
- `presets` - Pre-defined strings that can contain tags and be embedded in scenes and choices. See [definition](#tag-and-string-presets)
- `settings` - Settings to edit, some of which can also be made visible to the player.
- `sounds` - A list of the game's sound effects.

Now lets take a closer look on the lists:

### Inventories

`game.json` contains a list of inventories which are lists of items. The lists initially defined in the file are the player's starting items. The player can use only one inventory at once, and it might not even be necessary to ever use more than one inventory. The default inventory's index is `0`.

The player's inventory contains all the items they carry, and is visible to the player. The items do not have to be pre-defined; you can add items by any name from anywhere. However, you should predefine all the inventories your game uses in your `game.json`, otherwise Vue does not recognize them and the inventory view does not work. If some of the inventories should be empty at the beginning, you can simply define them as empty arrays (`[]`).

A single example inventory:

```json
"inventories": [
	[
  {"name": "sword", "value": 1},
  {"name": "sandwich", "value": 5},
	{"name": "playerName", "value": "Bob", "hidden": true},
	{"name": "dragonsSlain", "value": 5, "hidden": true}
	]
]
```

This inventory contains six items of two kinds. A single item has the following attributes:
- `name` - Required. The item's name. Cannot contain spaces.
- `value` - Required. How many items of that specific type the player carries. If it becomes 0, the item is not removed from the inventory per se, but it does not show up in the UI. This can be used to track if the player has owned that kind of items in the past.
- `displayName` - The item's display name. Can contain spaces. If omitted, `name` is used instead.
- `hidden` - If true, the value is hidden and not shown in the inventory. This can be used to track the player's actions (whether they have to talked to someone or not, etc.). Can be shown to the player by setting `debugMode` to true.

### Scenes

Scenes are the most important of the things defined in `game.json`, as the entire game itself consists of a group of scenes with choices connecting them.

The scene the game loads upon startup is the first defined scene.

An example scene:

```json
{
  "name": "dragon",
  "text": "<p>You wander across a [s1]dragon[/s]. What do you do?</p>",
  "choices": [
    {
      "text": "Fight it! (or, randomly, run away!!)",
      "itemRequirement": "sword,1",
      "nextScene": "hitDragon,0.5|missDragon,0.3|road,0.2"
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
- `text` - Required (not enforced). The scene's text. Can be formatted using html and Novel.js's own tags. The text can be a simple string, or an array of strings. If it is an array, each of the array items gets surrounded by paragraph tags (`<p></p>`). This makes formatting long text easier.
- `style` - The scene's style. Adds a html class that can be styled in `skin.css` to give different looks to different scenes.
- `inventoryHidden` - If defined and set to true, the inventory is not shown in this scene.
- `changeInventory` - Change the current inventory. Takes an index. The default inventory is `0`. This is parsed before any other item-related commands, so they affect the new inventory.
- `addItem` - Add items to the player's inventory upon entering the scene.
- `removeItem` - Remove items from the player's inventory upon entering the scene.
- `setItem` - Sets the specified items' counts in the player's inventory upon entering the scene. If the item does not exist in the inventory, it is added.
- `setValue` - See its [own chapter](#format-for-value-statements-and-commands).
- `increaseValue` - See its [own chapter](#format-for-value-statements-and-commands).
- `decreaseValue` - See its [own chapter](#format-for-value-statements-and-commands).
- `scrollSpeed` - Override the scene's text scrolling speed.
- `skipEnabled` - Override the player's ability to skip the scene's text.
- `playSound` - Play a sound with the chosen name upon entering the scene.
- `startMusic` - Start a music loop with the chosen name.
- `endMusic` - End a music loop with the chosen name.
- `executeJs` - JavaScript to be executed when the scene is loaded. You can access the game data through the `data.game` object.
- `saveGame` - Saves the game in the way defined in `settings.saveMode` upon entering the scene. Value can be anything, works as long as it is defined.
- `loadGame` - Loads the game in the way defined in `settings.saveMode` upon entering the scene. Value can be anything, works as long as it is defined.
- `saveCheckpoint` - Save this scene as a checkpoint with the chosen name. See [Checkpoints](#checkpoints).
- `loadCheckpoint` - Load a checkpoint with the chosen name. See [Checkpoints](#checkpoints).
- `choices` - Required (not enforced). A list of choices available in the scene.

### Choices

Choices are the options the player can choose in a scene. An example is provided in the Scenes example. Choices can have the following variables and parameters:
- `text` - Required in most cases. The text to show the player. Can be formatted using html or Novel.js's own tags. If not specified, the choice will not be shown but can be linked to using its name.
- `name` - Optional. Not visible, but is used when this choice is referred to from a link. Cannot contain spaces. If set to `"Continue"`, this selection is selected by default when skipping text.
- `itemRequirement` - Items that the player has to have in their inventory to be able to select this choice. An unselectable choice is hidden by default, unless `alwaysShow` is true.
- `requirement` - An advanced way to define a choice's requirements. Takes a conditional statement. An unselectable choice is hidden by default, unless `alwaysShow` is true.
- `alwaysShow` - Show the choice even though its requirements have not been met. The choice will be grayed out, and can not be selected. Can also be set globally in the settings.
- `changeInventory` - Change the current inventory. Takes an index. The default inventory is `0`. This is parsed before any other item-related commands, so they affect the new inventory.
- `addItem` - Add items to the player's inventory upon selecting this choice.
- `removeItem` - Remove items from the player's inventory upon selecting this choice.
- `setItem` - Sets the specified items' value in the player's inventory selecting this choice. If the item does not exist in the inventory, it is added.
- `setValue` - See its [own chapter](#format-for-value-statements-and-commands).
- `increaseValue` - See its [own chapter](#format-for-value-statements-and-commands).
- `decreaseValue` - See its [own chapter](#format-for-value-statements-and-commands).
- `playSound` - Play a sound with the chosen name upon selecting the choice. Overrides the default click sound.
- `startMusic` - Start a music loop with the chosen name.
- `endMusic` - End a music loop with the chosen name.
- `executeJs` - JavaScript to be executed when the choice is selected. You can access the game data through the `data.game` object.
- `saveGame` - Saves the game in the way defined in `settings.saveMode` upon selecting the choice. Value can be anything, works as long as it is defined.
- `loadGame` - Loads the game in the way defined in `settings.saveMode` upon selecting the choice. Value can be anything, works as long as it is defined.
- `saveCheckpoint` - Save this scene as a checkpoint with the chosen name. See [Checkpoints](#checkpoints).
- `loadCheckpoint` - Load a checkpoint with the chosen name. See [Checkpoints](#checkpoints).
- `nextChoice` - Redirect to another choice after handling this choice. Cannot be used in the same choice with `nextScene`. Supports multiple outcomes, as different probabilities can be set for different choices. See the format for [probabilities](#format-for-probabilities).
- `nextScene` - The scene into which the player moves if they select this choice. If omitted, the scene does not change. Supports multiple outcomes, as different probabilities can be set for different scenes. See the format for [probabilities](#format-for-probabilities).

### Settings

The settings object contains settings for the game. All of the settings values should always be defined, unless otherwise stated; see the example game for default values.

- `debugMode` - True or false. If true, the hidden items list is shown to the player the same way as the regular inventory.
- `alwaysShowDisabledChoices` - True or false. If true, choices with unmet requirements are always shown.
- `saveMode` - `text` or `cookie`. See [Saving](#saving).
- `showSaveButtons` - True or false. If true, the saving and loading buttons are shown, otherwise they are hidden.
- `floatPrecision` - How many significant digits printed floats should have, used to prevent JavaScript's handling of floats from causing strange values.
- `scrollSettings`:
	- `defaultScrollSpeed` - The default speed (letter interval in ms) at which text scrolls. If set to 0, all text appears instantly.
	- `textSkipEnabled` - True or false. If disabled, text can't be skipped.
	- `skipButtonShown` - True or false. If enabled, a skip button is shown. If disabled, no button is shown.
	- `skipWithKeyboard` - True or false. If enabled, the player can skip text by pressing space or enter. Does not work with `fastScrollWithKeyboard`.
	- `continueWithKeyboard` - True or false. If enabled, the player can choose the default choice (with `name` set to `"Continue"`) by pressing space or enter.
	- `fastScrollWithKeyboard` - True or false. If enabled, the player can make text scroll faster by pressing space or enter. Does not work with `skipWithKeyboard`.
	- `fastScrollSpeedMultiplier` - The multiplier by which the scrolling speed is multiplied when fast scrolling.
	- `tickFreqThreshold` - A value that defines how often the scrolling sound plays; if the letter interval is smaller than this, the sound is played on every third character. If it is smaller than two times this, it is played on every second character. Otherwise, on every character.
- `soundSettings`:
  - `soundVolume` - A float between 0 and 1. The volume of all sound effects.
  - `musicVolume` - A float between 0 and 1. The music's volume.
  - `defaultClickSound` - A sound's name. If defined, this sound is played when clicking any choice.
  - `defaultScrollSound` - A sound's name. The default scrolling sound. If not defined, no sound is played.

### Sounds

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

## Tags

Novel.js has its own set of tags that can be used to show text conditionally or style text with predefined styles. They are distinguished from normal html tags by the `[]` brackets. The tags can be used in both scene texts and choices' texts.

If you want to use `[]` in your text without them getting parsed, prefix them with `/`: `/[` and `/]`.

You can also use html tags to structure and style your texts.

### Conditional statements

Novel.js supports conditional rendering of parts of text. This is done with the `[if]` tag (closed with `[/if]`). Inside the tag a statement is defined. If the statement returns false, the text surrounded by the tags gets hidden by css. `[if]` tags can be nested.

An example:
```
[if ((inv.sword>=5||inv.earnedTheTrustOfPeople>0)&&inv.swords!=500)]This text is shown only if you have more than five swords in your inventory or you have earned the people's trust and you must not have exactly 500 swords![/if]
```
More information about conditional statements [here](#format-for-conditional-statements-and-calculations).

### Choice links

You can embed a choice as a link into a scene's text using the `[choice name]` tag. The target choice is referred to with the `name` value. The link is closed with `[/choice]`. An example:

```
There is a [choice pickastick]stick[/choice] on the ground.
```

### Player input

You can embed a text input field into a scene's text (choice text not recommended) by using the `[input]` tag. The input field's value is bound to an inventory item, and the value can be printed by printing the item's value. Changes to the input fields are checked every time a choice is selected or the input field loses focus. Example:
```html
<p>What is your name?</p>
<p>[input playerName]</p>
<p>Hello, [inv.playerName]!</p>
```
HTML tags are stripped from the input before it is saved.

### Item counts & values

You can display the player's items' counts and values by using the item's name prefixed with `inv.` inside the `[]` brackets. An example:
```
You have [inv.sword] sword[if (inv.sword!=1)]s[/if].
```

### Displaying values

In addition to the simple item value tag, you can display any value in `game.json` or any result of an expression or the truth value of an equation or an inequation by using a `[print]` tag. Prefix any `.json` values with `var.` and inventory items with `inv.`.  If you display another scene's text or choices, those texts will have their tags parsed immediately. Be careful not to display a text within itself. An example that prints another scene's choice's text:
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

### Executing JavaScript while text scrolls

You can run JavaScript while the text scrolls by using the `[exec x]` tag, where x is JavaScript code, such as a function call. For example, `[exec console.log(\"Hello world! The game's name is \" + data.game.gameName)]`. The code is executed with JavaScript's `eval()` function. You can access the game's data through the `data.game` object. If the tag is inside an if-statement that returns false, so that it is not shown, the tag is ignored. If the text scrolling is skipped, these are buffered and will be executed at the end.

### Setting text scrolling speed

You can override the text's default scrolling speed by using the tag `[speed x]`, where x is the tick interval in milliseconds. The default value is defined in [settings](#settings). If the tag is inside an if-statement that returns false, so that it is not shown, the tag is ignored. Can be restored to default with `[/speed]`.

### Pausing text scrolling

You can pause the scrolling text by using the `[pause]` tag. It can take two different parameters; if you use `[pause input]`, the game waits until the player has pressed the skip button or the appearing continue symbol. If you use `[pause x]` where x is a number, such as `[pause 50]`, the game waits for that amount of "ticks". One tick is equal to the interval between letters, so the length of a tick varies based on the text scrolling speed. This way the pauses are also affected by fast scrolling.

### Setting text scrolling sound

You can override the text's default scrolling sound by using the tag `[scrollSound x]`, where x is the sound's name. If x is `"none"`, no sound is played. The default value is defined in [settings](#settings). Can be restored to default with `[/scrollSound]`.

### Playing sounds while text scrolls

You can play a sound at any point of the text's scrolling with the tag `[sound x]`, where x is the sound's name. If the text scrolling is skipped, these are buffered and will be played all at once at the end.

### Playing music while text scrolls

You can start a song at any point of the text's scrolling with the tag `[music x]`, where x is the song's name. If the text scrolling is skipped, these are buffered and will be started all at once at the end.

### Stopping music while text scrolls

You can stop a song at any point of the text's scrolling with the tag `[stopMusic x]`, where x is the song's name. If the text scrolling is skipped, these are buffered and will be stopped all at once at the end.

### Tag and string presets

If you frequently use the same tags and strings in multiple scenes, you can pre-define them as presets that can be used with the `[p]` tag. An example:
```json
"tagPresets": [
	{
		"name": "dragon",
		"start": "[s2][speed 400][scrollSound scream]",
		"end": "[/scrollSound][/speed][/s]"
	}
],
```
Usage:
```
You wander across a [s1]dragon[/s]. [p dragon]ROAAARRRRRRRR[/p dragon], it says.
```

This means the value of `start` can be embedded into a scene or a choice with the `[p name]` tag, where `name` is the preset's name. The `end` value can be embedded by using `[/p name]`. The use of the end tag is not required - it is allowed to use only the start tag.

### Styling shorthands

- `[s1]` through `[s99]` - Shorthand for adding a `<span class="highlight-X">` tag, where `X` is the number. Behaves like a normal `<span>` tag. Some of the highlights are predefined in `style.css`, and can be overridden in `skin.css`. Can be closed with `[/s]`.

## Formats for statements and commands

### Format for add/remove/set and requirement commands

The parameters that remove, add or set items or check for requirements take the following format. You can list any amount of items or with one command by separating them with `|`.

You can optionally define a `displayName` that may contain spaces, though this is not required (and not supported outside adding or setting items).

You can also define an optional `probability`, a float between 0 and 1 that defines the operation's success chance. Probability must always be defined before `displayName`.

If you want the item to be hidden, add an exclamation mark `!` before its name.

The format:
```
itemOne,count,probability,displayName|itemTwo,count,probability,displayName|itemThree,count,probability,displayName
```
An example:
```
"addItem": "sword,1|shield,1,Magical Shield|stone,inv.stone,0.5|largestone,1,0.2,Large Stone|!dragonsSlain,1"
```
This adds one sword and one shield named "Magical Shield" to the player's inventory. With a 50% chance, the player also doubles their supply of stones, and with a 20% probability they gain a large stone. Their hidden slain dragons counter also increases by 1. The item counts support mathematical operations and reading item and value counts when prefixed with `inv.` and `var.` respectively.

### Format for probabilities

Some commands allow you to define probabilities for different outcomes. Takes the following format:
```
option,probability|option,probability|option,probability
```
You can list any amount of options by separating them with `|`. All of the probabilities have to add up to exactly `1`. An example for a choice's `nextScene`:
```
hitEnemySuccess,0.5|hitEnemyFail,0.5
```
In this example, the player has a 50% chance to hit (go to hit scene) and a 50% chance to miss the enemy (go to miss scene).

### Format for conditional statements and calculations

Conditional statements and calculations allow for all kinds of complex logic, and can be used in requirements, item adding/removing and `[if]` statements. An example:
```
[if ((inv.sword>=5||inv.earnedTheTrustOfPeople>0)&&inv.swords!=500)]This text is shown only if you have more than five swords in your inventory or you have earned the people's trust and you must not have exactly 500 swords![/if]
```

The above example shows how the statements can be used; Item values must be prefixed with `inv.`. `var.` is also available for `game.json` variables. The supported operators are `==`, `!=`, `<`, `<=`, `>` and `>=`. You may also use math operators `+`, `-`, `/` and `*`. Operators `||` (OR) and `&&` (AND) and parentheses `()` can also be used.

You can use random values by using the prefix `rand.`, followed by the starting value (inclusive), the end value (exclusive) and the number of decimals. For example, `rand.0,20,5` returns a random value between 0 and 20 with 5 decimals. Leaving out the decimal number or setting it as `0` produces a rounded integer. Because of how the strings are parsed, negative values should not be prefixed with `-`, `minus` should be used instead. The following produces an integer between -5 and 5: `rand.minus5,5`

If you do string comparation, you can use `==` and `!=` to compare them. To use a string as the equation's other side, it doesn't need any special notation, because everything that cannot be parsed as anything else is assumed to be a string. Simply write `var.gameName!=testGame`, for example.

### Format for value statements and commands

Commands `setValue`, `increaseValue` and `decreaseValue` allow you to edit any value that is defined in `game.json`. Keep in mind that this is extremely error-prone and the changes cannot be undone without resetting the game.

The format:
```
objectName,id,objectName,id,objectName...
```

If the path contains arrays, give the path to that array as the first parameter, then the array index as the next parameter, and then the path inside that object as the third parameter and so forth. An example that picks a choice from another scene:
```
scenes,1,choices,2,parsedText
```

## Audio

Sounds and music the game uses are located in the `game/sounds` folder, and they have to be defined in `game.json`. More information [here](#sounds).

All music's and sounds' volume is dependent on the `musicVolume` and `soundVolume` attributes of `settings.soundSettings`.

You can also use an inline tag.

### Sound effects

You can play sound effects by using the `playSound` command and giving it the sound's name.

You can also use an inline tag.

### Music

Music works a bit differently in Novel.js than sound effects do; music is started by using a `startMusic` command with the music's name. The music file with the chosen name loops until stopped by the `stopMusic` command, even if the scene is changed. This way you can have both looping ambient sound effects and looping music. Example:
```json
{
  "name": "dragon",
  "startMusic": "battleMusic",
  "text": "<p>You wander across a [s1]dragon[/s]. What do you do?</p>",
  "choices": [
    {
      "text": "Fight it!",
      "itemRequirement": "sword,1",
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

You can also use an inline tag.

## Styling

The `css` folder contains a file named `skin.css`. Styles in `skin.css` override the default styles from `style.css`.

## Checkpoints

By using the `saveCheckpoint` and `loadCheckpoint` commands in scenes or choices it is possible to "tag" scenes so that they can easily be returned to later. This is useful when, for example, creating a menu with a "continue game" button. Both commands take a name for the checkpoint as a parameter. The checkpoint objects are saved to `data.game.checkpoints`, so they are saved when the game is saved. The objects have two values: `name`, which is the checkpoint's name used in the commands, and `scene`, the name of the scene it refers to.

Checkpoints do not affect the player's items or other values. Use saving and loading to return those to a previous state.

## Saving

Novel.js has currently two ways to allow the player to save and load their game. This is controlled by the `settings.saveMode` value, which can be either `cookie` or `text`. Saving is done by clicking the "Save" and "Load" buttons in the game window, or by using the `saveGame` and `loadGame` commands. The buttons can be hidden by setting `settings.showSaveButtons` to false.

If the game's name does not match the loaded data's game name, an error is thrown and loading is cancelled. If the save version does not match the game's version, a warning is thrown.

### Cookie

The first way to save a game is to use the browser's cookies. If you use this option, make sure you have the required legal notifications in your game. The game is saved as a cookie named `gameData`, and contains the `game.json` file Base64 encoded. The cookie has an expiration time of 365 days by default. There can currently be only a single saved game. Note that cookies might not work when testing the game on `localhost` in some browsers.

### Text

The second way is to save the `game.json` file as a Base64 encoded string, that is then shown to the player and prompted to be copied. The "Load" button then shows a text field that allows the player to paste in their saved game data.
