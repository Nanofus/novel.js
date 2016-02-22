var expect, should;

expect = chai.expect;

should = chai.should();

describe('Tests', function() {
  beforeEach(function() {
    var data, gameArea, gameManager, gamePath, inputManager, inventory, parser, scene, sound, textPrinter, ui, util;
    data = {
      game: null,
      choices: null,
      debugMode: false,
      printedText: "",
      parsedJavascriptCommands: [],
      music: []
    };
    gamePath = './game';
    gameManager = new GameManager;
    inputManager = new InputManager;
    inventory = new Inventory;
    parser = new Parser;
    scene = new Scene;
    sound = new Sound;
    textPrinter = new TextPrinter;
    ui = new UI;
    util = new Util;
    return gameArea = new Vue({
      el: '#game-area',
      data: data,
      methods: {
        requirementsFilled: function(choice) {
          return scene.requirementsFilled(choice);
        },
        textSkipEnabled: function(choice) {
          return data.game.currentScene.skipEnabled && data.game.settings.skipButtonShown;
        },
        itemsOverZero: function(item) {
          var i, j, len, ref;
          ref = this.game.inventory;
          for (j = 0, len = ref.length; j < len; j++) {
            i = ref[j];
            if (i.name === item.name) {
              if (i.count > 0) {
                return true;
              }
            }
          }
          return false;
        },
        selectChoice: function(choice) {
          return scene.selectChoice(choice);
        }
      }
    });
  });
  return describe('Parser', function() {
    return describe('parseItemsOrStats()', function() {
      it('should return correct items', function() {
        var items;
        items = parser.parseItemsOrStats("sword[1]|shield[2]");
        expect(items[0][0]).to.equal('sword');
        expect(items[1][1]).to.equal(3);
        return expect(items[2]).to.equal(void 0);
      });
      return it('should return correct items when list empty', function() {
        var items;
        items = parser.parseItemsOrStats("");
        return expect(items).to.equal(void 0);
      });
    });
  });
});
