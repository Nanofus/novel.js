
describe 'InventoryManager', ->
  describe 'editItems', ->
    it 'should add item correctly', ->
      novelData.novel.inventories[novelData.novel.currentInventory] = []
      InventoryManager.addItems(Parser.parseItems("sword,1"))
      expect(novelData.novel.inventories[novelData.novel.currentInventory][0].name).to.equal('sword')
      expect(novelData.novel.inventories[novelData.novel.currentInventory][0].value).to.equal(1)
    it 'should add multiple same items correctly', ->
      novelData.novel.inventories[novelData.novel.currentInventory] = []
      InventoryManager.addItems(Parser.parseItems("sword,1|sword,2"))
      expect(novelData.novel.inventories[novelData.novel.currentInventory][0].name).to.equal('sword')
      expect(novelData.novel.inventories[novelData.novel.currentInventory][0].value).to.equal(3)
    it 'should add multiple different items correctly', ->
      novelData.novel.inventories[novelData.novel.currentInventory] = []
      InventoryManager.addItems(Parser.parseItems("sword,1|shield,2"))
      expect(novelData.novel.inventories[novelData.novel.currentInventory][0].name).to.equal('sword')
      expect(novelData.novel.inventories[novelData.novel.currentInventory][0].value).to.equal(1)
      expect(novelData.novel.inventories[novelData.novel.currentInventory][1].name).to.equal('shield')
      expect(novelData.novel.inventories[novelData.novel.currentInventory][1].value).to.equal(2)
    it 'should set item correctly when item already exists', ->
      novelData.novel.inventories[novelData.novel.currentInventory] = []
      InventoryManager.addItems(Parser.parseItems("sword,1"))
      InventoryManager.setItems(Parser.parseItems("sword,2"))
      expect(novelData.novel.inventories[novelData.novel.currentInventory][0].name).to.equal('sword')
      expect(novelData.novel.inventories[novelData.novel.currentInventory][0].value).to.equal(2)
    it 'should set item correctly when item does not already exist', ->
      novelData.novel.inventories[novelData.novel.currentInventory] = []
      InventoryManager.setItems(Parser.parseItems("sword,2"))
      expect(novelData.novel.inventories[novelData.novel.currentInventory][0].name).to.equal('sword')
      expect(novelData.novel.inventories[novelData.novel.currentInventory][0].value).to.equal(2)
    it 'should set multiple same items correctly', ->
      novelData.novel.inventories[novelData.novel.currentInventory] = []
      InventoryManager.addItems(Parser.parseItems("sword,1"))
      InventoryManager.setItems(Parser.parseItems("sword,1|sword,2"))
      expect(novelData.novel.inventories[novelData.novel.currentInventory][0].name).to.equal('sword')
      expect(novelData.novel.inventories[novelData.novel.currentInventory][0].value).to.equal(2)
    it 'should set multiple different items correctly', ->
      novelData.novel.inventories[novelData.novel.currentInventory] = []
      InventoryManager.addItems(Parser.parseItems("sword,5|shield,10"))
      InventoryManager.setItems(Parser.parseItems("sword,1|shield,2"))
      expect(novelData.novel.inventories[novelData.novel.currentInventory][0].name).to.equal('sword')
      expect(novelData.novel.inventories[novelData.novel.currentInventory][0].value).to.equal(1)
      expect(novelData.novel.inventories[novelData.novel.currentInventory][1].name).to.equal('shield')
      expect(novelData.novel.inventories[novelData.novel.currentInventory][1].value).to.equal(2)
    it 'should remove item correctly when item already exists', ->
      novelData.novel.inventories[novelData.novel.currentInventory] = []
      InventoryManager.addItems(Parser.parseItems("sword,1"))
      InventoryManager.removeItems(Parser.parseItems("sword,2"))
      expect(novelData.novel.inventories[novelData.novel.currentInventory][0].name).to.equal('sword')
      expect(novelData.novel.inventories[novelData.novel.currentInventory][0].value).to.equal(0)
    it 'should remove item correctly when item does not already exist', ->
      novelData.novel.inventories[novelData.novel.currentInventory] = []
      InventoryManager.removeItems(Parser.parseItems("sword,2"))
      expect(novelData.novel.inventories[novelData.novel.currentInventory][0]).to.equal(undefined)
    it 'should remove multiple same items correctly', ->
      novelData.novel.inventories[novelData.novel.currentInventory] = []
      InventoryManager.addItems(Parser.parseItems("sword,5"))
      InventoryManager.removeItems(Parser.parseItems("sword,1|sword,2"))
      expect(novelData.novel.inventories[novelData.novel.currentInventory][0].name).to.equal('sword')
      expect(novelData.novel.inventories[novelData.novel.currentInventory][0].value).to.equal(2)
    it 'should remove multiple different items correctly', ->
      novelData.novel.inventories[novelData.novel.currentInventory] = []
      InventoryManager.addItems(Parser.parseItems("sword,5|shield,10"))
      InventoryManager.removeItems(Parser.parseItems("sword,1|shield,2"))
      expect(novelData.novel.inventories[novelData.novel.currentInventory][0].name).to.equal('sword')
      expect(novelData.novel.inventories[novelData.novel.currentInventory][0].value).to.equal(4)
      expect(novelData.novel.inventories[novelData.novel.currentInventory][1].name).to.equal('shield')
      expect(novelData.novel.inventories[novelData.novel.currentInventory][1].value).to.equal(8)
  describe 'checkRequirements', ->
    it 'should check one item requirement correctly', ->
      novelData.novel.inventories[novelData.novel.currentInventory] = []
      InventoryManager.addItems(Parser.parseItems("sword,5"))
      expect(InventoryManager.checkRequirements([["sword",5]])).to.equal(true)
      expect(InventoryManager.checkRequirements([["sword",5]])).to.equal(true)
      expect(InventoryManager.checkRequirements([["sword",6]])).to.equal(false)
    it 'should check multiple item requirements correctly', ->
      novelData.novel.inventories[novelData.novel.currentInventory] = []
      InventoryManager.addItems(Parser.parseItems("sword,5"))
      expect(InventoryManager.checkRequirements([["sword",5],["shield",3]])).to.equal(false)
      InventoryManager.addItems(Parser.parseItems("shield,3"))
      expect(InventoryManager.checkRequirements([["sword",5],["shield",3]])).to.equal(true)
      expect(InventoryManager.checkRequirements([["sword",6],["shield",4]])).to.equal(false)
      expect(InventoryManager.checkRequirements([["sword",10],["shield",10]])).to.equal(false)
      expect(InventoryManager.checkRequirements([["sword",5],["shield",10]])).to.equal(false)
      expect(InventoryManager.checkRequirements([["sword",10],["shield",3]])).to.equal(false)
  describe 'setValue', ->
    it 'should set a value in root correctly', ->
      InventoryManager.setValue("name","name")
      expect(novelData.novel.name).to.equal("name")
    it 'should set a value in a child path correctly', ->
      InventoryManager.setValue("settings.soundSettings.soundVolume",0.2)
      expect(novelData.novel.settings.soundSettings.soundVolume).to.equal(0.2)
