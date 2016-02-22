  describe 'Parser', ->
    describe 'parseItemsOrStats()', ->
      it 'should return correct items', ->
        items = parser.parseItemsOrStats("sword[1]|shield[2]")
        expect(items[0][0]).to.equal('sword')
        expect(items[1][1]).to.equal(3)
        expect(items[2]).to.equal(undefined)
      it 'should return correct items when list empty', ->
        items = parser.parseItemsOrStats("")
        expect(items).to.equal(undefined)
