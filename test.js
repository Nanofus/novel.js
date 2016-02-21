describe('Parser', function() {
  return describe('parseItemsOrStats()', function() {
    return it('should return a correct number of items', function() {
      var items;
      items = Parser.parseItemsOrStats("sword[1]|shield[2]");
      return expect(items.count).toBe(2);
    });
  });
});
