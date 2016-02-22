  describe 'Parser', ->
    describe 'parseItemsOrStats()', ->
      it 'should return a correct number of items', ->
        items = Parser.parseItemsOrStats("sword[1]|shield[2]")
        expect(items.count).toBe(2)
