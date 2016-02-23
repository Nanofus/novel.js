
describe 'InventoryManager', ->
  describe 'editItemsOrStats', ->
    it 'should add item correctly', ->
      data.game.inventory = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("sword,1"),"add",true)
      expect(data.game.inventory[0].name).to.equal('sword')
      expect(data.game.inventory[0].count).to.equal(1)
    it 'should add multiple same items correctly', ->
      data.game.inventory = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("sword,1|sword,2"),"add",true)
      expect(data.game.inventory[0].name).to.equal('sword')
      expect(data.game.inventory[0].count).to.equal(3)
    it 'should add multiple different items correctly', ->
      data.game.inventory = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("sword,1|shield,2"),"add",true)
      expect(data.game.inventory[0].name).to.equal('sword')
      expect(data.game.inventory[0].count).to.equal(1)
      expect(data.game.inventory[1].name).to.equal('shield')
      expect(data.game.inventory[1].count).to.equal(2)
    it 'should set item correctly when item already exists', ->
      data.game.inventory = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("sword,1"),"add",true)
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("sword,2"),"set",true)
      expect(data.game.inventory[0].name).to.equal('sword')
      expect(data.game.inventory[0].count).to.equal(2)
    it 'should set item correctly when item does not already exist', ->
      data.game.inventory = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("sword,2"),"set",true)
      expect(data.game.inventory[0].name).to.equal('sword')
      expect(data.game.inventory[0].count).to.equal(2)
    it 'should set multiple same items correctly', ->
      data.game.inventory = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("sword,1"),"add",true)
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("sword,1|sword,2"),"set",true)
      expect(data.game.inventory[0].name).to.equal('sword')
      expect(data.game.inventory[0].count).to.equal(2)
    it 'should set multiple different items correctly', ->
      data.game.inventory = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("sword,5|shield,10"),"add",true)
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("sword,1|shield,2"),"set",true)
      expect(data.game.inventory[0].name).to.equal('sword')
      expect(data.game.inventory[0].count).to.equal(1)
      expect(data.game.inventory[1].name).to.equal('shield')
      expect(data.game.inventory[1].count).to.equal(2)
    it 'should remove item correctly when item already exists', ->
      data.game.inventory = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("sword,1"),"add",true)
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("sword,2"),"remove",true)
      expect(data.game.inventory[0].name).to.equal('sword')
      expect(data.game.inventory[0].count).to.equal(0)
    it 'should remove item correctly when item does not already exist', ->
      data.game.inventory = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("sword,2"),"remove",true)
      expect(data.game.inventory[0]).to.equal(undefined)
    it 'should remove multiple same items correctly', ->
      data.game.inventory = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("sword,5"),"add",true)
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("sword,1|sword,2"),"remove",true)
      expect(data.game.inventory[0].name).to.equal('sword')
      expect(data.game.inventory[0].count).to.equal(2)
    it 'should remove multiple different items correctly', ->
      data.game.inventory = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("sword,5|shield,10"),"add",true)
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("sword,1|shield,2"),"remove",true)
      expect(data.game.inventory[0].name).to.equal('sword')
      expect(data.game.inventory[0].count).to.equal(4)
      expect(data.game.inventory[1].name).to.equal('shield')
      expect(data.game.inventory[1].count).to.equal(8)
    it 'should add stats correctly', ->
      data.game.stats = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("dragonsKilled,5"),"add",false)
      expect(data.game.stats[0].name).to.equal('dragonsKilled')
      expect(data.game.stats[0].value).to.equal(5)
    it 'should add multiple same stats correctly', ->
      data.game.stats = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("villagesSaved,1|villagesSaved,2"),"add",false)
      expect(data.game.stats[0].name).to.equal('villagesSaved')
      expect(data.game.stats[0].value).to.equal(3)
    it 'should add multiple different stats correctly', ->
      data.game.stats = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("villagesSaved,1|dragonsKilled,2"),"add",false)
      expect(data.game.stats[0].name).to.equal('villagesSaved')
      expect(data.game.stats[0].value).to.equal(1)
      expect(data.game.stats[1].name).to.equal('dragonsKilled')
      expect(data.game.stats[1].value).to.equal(2)
    it 'should set stats correctly when stat already exists', ->
      data.game.stats = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("villagesSaved,1"),"add",false)
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("villagesSaved,2"),"set",false)
      expect(data.game.stats[0].name).to.equal('villagesSaved')
      expect(data.game.stats[0].value).to.equal(2)
    it 'should set stats correctly when stat does not already exist', ->
      data.game.stats = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("villagesSaved,2"),"set",false)
      expect(data.game.stats[0].name).to.equal('villagesSaved')
      expect(data.game.stats[0].value).to.equal(2)
    it 'should set multiple same stats correctly', ->
      data.game.stats = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("villagesSaved,1"),"add",false)
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("villagesSaved,1|villagesSaved,2"),"set",false)
      expect(data.game.stats[0].name).to.equal('villagesSaved')
      expect(data.game.stats[0].value).to.equal(2)
    it 'should set multiple different stats correctly', ->
      data.game.stats = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("villagesSaved,5|dragonsKilled,10"),"add",false)
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("villagesSaved,1|dragonsKilled,2"),"set",false)
      expect(data.game.stats[0].name).to.equal('villagesSaved')
      expect(data.game.stats[0].value).to.equal(1)
      expect(data.game.stats[1].name).to.equal('dragonsKilled')
      expect(data.game.stats[1].value).to.equal(2)
    it 'should remove item correctly when item already exists', ->
      data.game.stats = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("villagesSaved,1"),"add",false)
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("villagesSaved,2"),"remove",false)
      expect(data.game.stats[0].name).to.equal('villagesSaved')
      expect(data.game.stats[0].value).to.equal(0)
    it 'should remove stats correctly when stat does not already exist', ->
      data.game.stats = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("villagesSaved,2"),"remove",false)
      expect(data.game.stats[0]).to.equal(undefined)
    it 'should remove multiple same stats correctly', ->
      data.game.stats = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("villagesSaved,5"),"add",false)
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("villagesSaved,1|villagesSaved,2"),"remove",false)
      expect(data.game.stats[0].name).to.equal('villagesSaved')
      expect(data.game.stats[0].value).to.equal(2)
    it 'should remove multiple different stats correctly', ->
      data.game.stats = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("villagesSaved,5|dragonsKilled,10"),"add",false)
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("villagesSaved,1|dragonsKilled,2"),"remove",false)
      expect(data.game.stats[0].name).to.equal('villagesSaved')
      expect(data.game.stats[0].value).to.equal(4)
      expect(data.game.stats[1].name).to.equal('dragonsKilled')
      expect(data.game.stats[1].value).to.equal(8)
