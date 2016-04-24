
describe 'Parser', ->
  describe 'parseItems', ->
    it 'should return correct items with one item', ->
      items = Parser.parseItems("sword,1")
      expect(items[0][0]).to.equal('sword')
      expect(items[0][1]).to.equal('1')
    it 'should return correct items with multiple items', ->
      items = Parser.parseItems("sword,1|shield,2")
      expect(items[0][0]).to.equal('sword')
      expect(items[1][1]).to.equal('2')
      expect(items[2]).to.equal(undefined)
    it 'should return correct items when list empty', ->
      items = Parser.parseItems("")
      expect(items).to.equal(undefined)
  describe 'parseStatement', ->
    it 'should make correct calculations', ->
      expect(Parser.parseStatement("20/4-(5+2)*2")).to.equal(-9)
    it 'should use items correctly', ->
      novelData.novel.inventories[novelData.novel.currentInventory] = []
      InventoryManager.addItems(Parser.parseItems("sword,4"))
      expect(Parser.parseStatement("20*inv.sword")).to.equal(80)
      novelData.novel.stats = []
      InventoryManager.addItems(Parser.parseItems("villagesSaved,4|truthValue,true"))
      expect(Parser.parseStatement("(20*inv.villagesSaved==80)==inv.truthValue")).to.equal(true)
