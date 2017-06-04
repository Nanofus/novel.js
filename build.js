var concat = require('concat-files');

concat([
  'src/Init.js',
  'src/InputManager.js',
  'src/InventoryManager.js',
  'src/LanguageManager.js',
  'src/NovelManager.js',
  'src/Parser.js',
  'src/SceneManager.js',
  'src/SoundManager.js',
  'src/TextPrinter.js',
  'src/UI.js',
  'src/Util.js',
  'src/Start.js'
], 'novel.js', function(err) {
  if (err) throw err
  console.log('done');
});
