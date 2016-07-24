
describe('Parser', function() {
  describe('parseItems', function() {
    it('should return correct items with one item', function() {
      let items = Parser.parseItems("sword,1");
      expect(items[0][0]).to.equal('sword');
      return expect(items[0][1]).to.equal('1');
    }
    );
    it('should return correct items with multiple items', function() {
      let items = Parser.parseItems("sword,1|shield,2");
      expect(items[0][0]).to.equal('sword');
      expect(items[1][1]).to.equal('2');
      return expect(items[2]).to.equal(undefined);
    }
    );
    return it('should return correct items when list empty', function() {
      let items = Parser.parseItems("");
      return expect(items).to.equal(undefined);
    }
    );
  }
  );
  return describe('parseStatement', function() {
    it('should make correct calculations', () => expect(Parser.parseStatement("20/4-(5+2)*2")).to.equal(-9)
    );
    return it('should use items correctly', function() {
      novelData.novel.inventories[novelData.novel.currentInventory] = [];
      InventoryManager.addItems(Parser.parseItems("sword,4"));
      expect(Parser.parseStatement("20*inv.sword")).to.equal(80);
      novelData.novel.stats = [];
      InventoryManager.addItems(Parser.parseItems("villagesSaved,4|truthValue,true"));
      return expect(Parser.parseStatement("(20*inv.villagesSaved==80)==inv.truthValue")).to.equal(true);
    }
    );
  }
  );
}
);
