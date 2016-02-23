
describe 'InventoryManager', ->
  describe 'editItems', ->
    it 'should add item correctly', ->
      data.game.inventory = []
      inventoryManager.editItems(parser.parseItems("sword,1"),"add")
      expect(data.game.inventory[0].name).to.equal('sword')
      expect(data.game.inventory[0].value).to.equal(1)
    it 'should add multiple same items correctly', ->
      data.game.inventory = []
      inventoryManager.editItems(parser.parseItems("sword,1|sword,2"),"add")
      expect(data.game.inventory[0].name).to.equal('sword')
      expect(data.game.inventory[0].value).to.equal(3)
    it 'should add multiple different items correctly', ->
      data.game.inventory = []
      inventoryManager.editItems(parser.parseItems("sword,1|shield,2"),"add")
      expect(data.game.inventory[0].name).to.equal('sword')
      expect(data.game.inventory[0].value).to.equal(1)
      expect(data.game.inventory[1].name).to.equal('shield')
      expect(data.game.inventory[1].value).to.equal(2)
    it 'should set item correctly when item already exists', ->
      data.game.inventory = []
      inventoryManager.editItems(parser.parseItems("sword,1"),"add")
      inventoryManager.editItems(parser.parseItems("sword,2"),"set")
      expect(data.game.inventory[0].name).to.equal('sword')
      expect(data.game.inventory[0].value).to.equal(2)
    it 'should set item correctly when item does not already exist', ->
      data.game.inventory = []
      inventoryManager.editItems(parser.parseItems("sword,2"),"set")
      expect(data.game.inventory[0].name).to.equal('sword')
      expect(data.game.inventory[0].value).to.equal(2)
    it 'should set multiple same items correctly', ->
      data.game.inventory = []
      inventoryManager.editItems(parser.parseItems("sword,1"),"add")
      inventoryManager.editItems(parser.parseItems("sword,1|sword,2"),"set")
      expect(data.game.inventory[0].name).to.equal('sword')
      expect(data.game.inventory[0].value).to.equal(2)
    it 'should set multiple different items correctly', ->
      data.game.inventory = []
      inventoryManager.editItems(parser.parseItems("sword,5|shield,10"),"add")
      inventoryManager.editItems(parser.parseItems("sword,1|shield,2"),"set")
      expect(data.game.inventory[0].name).to.equal('sword')
      expect(data.game.inventory[0].value).to.equal(1)
      expect(data.game.inventory[1].name).to.equal('shield')
      expect(data.game.inventory[1].value).to.equal(2)
    it 'should remove item correctly when item already exists', ->
      data.game.inventory = []
      inventoryManager.editItems(parser.parseItems("sword,1"),"add")
      inventoryManager.editItems(parser.parseItems("sword,2"),"remove")
      expect(data.game.inventory[0].name).to.equal('sword')
      expect(data.game.inventory[0].value).to.equal(0)
    it 'should remove item correctly when item does not already exist', ->
      data.game.inventory = []
      inventoryManager.editItems(parser.parseItems("sword,2"),"remove")
      expect(data.game.inventory[0]).to.equal(undefined)
    it 'should remove multiple same items correctly', ->
      data.game.inventory = []
      inventoryManager.editItems(parser.parseItems("sword,5"),"add")
      inventoryManager.editItems(parser.parseItems("sword,1|sword,2"),"remove")
      expect(data.game.inventory[0].name).to.equal('sword')
      expect(data.game.inventory[0].value).to.equal(2)
    it 'should remove multiple different items correctly', ->
      data.game.inventory = []
      inventoryManager.editItems(parser.parseItems("sword,5|shield,10"),"add")
      inventoryManager.editItems(parser.parseItems("sword,1|shield,2"),"remove")
      expect(data.game.inventory[0].name).to.equal('sword')
      expect(data.game.inventory[0].value).to.equal(4)
      expect(data.game.inventory[1].name).to.equal('shield')
      expect(data.game.inventory[1].value).to.equal(8)
