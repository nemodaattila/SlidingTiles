/**
 * creates and merges tile-groups, handles tile movement, checks if two tiles are mergeable,
 */
class PuzzleHandler {
    /**
     * array of all tiles
     * @type {Tile[]}
     */
    static allTiles = []
    /**
     * array of TileGroups
     * @type {TileGroup[]}
     */
    tileGroups = []
    /**
     * the coordinates of the click/touch at move start
     */
    originalCoords
    /**
     * the actually moved TileGroup object
     * @type {TileGroup|undefined}
     */
    movedGroup = undefined
    /**
     * count of the rows of the game
     * @type {int}
     */
    rowNum
    /**
     * count of the columns of the game
     * @type {int}
     */
    columnNum
    /**
     * the max distance of two adjacent tiles can be merged (x and y) px
     * @type {number}
     */
    tilePxDistanceBase = 30
    /**
     * the distance between the image edge and the puzzle edge on it, px (on one side)
     * @type {number}
     */
    tilePxDistance

    /**
     * returns the index of the given tile in the allTiles array
     * @param {Tile} tileToFind the searched Tile object
     * @returns {number}
     */
    static getTileIndex(tileToFind) {
        return PuzzleHandler.allTiles.findIndex(tile => tile === tileToFind)
    }

    /**
     * setting the padding of the tile image
     * @param {number} paddingDiff
     */
    setTilePxDistance(paddingDiff) {
        this.tilePxDistance = paddingDiff
    }

    /**
     * setting the games rows and columns
     * @param {int} rowNum row number
     * @param {int} colNum column number
     */
    setGameDimensions(rowNum, colNum) {
        this.rowNum = rowNum
        this.columnNum = colNum
    }

    /**
     * creates a tile-group for every tile, adds row and coulumn indexesto the created tile
     * @param {string} img base64 image source
     * @param {int} index index of image
     * @returns {Promise<Tile>}
     */
    async addGroup(img, index) {
        let group = new TileGroup();
        let tile = await group.addTile(img)
        PuzzleHandler.allTiles.push(tile)
        tile.setIndexes(index % this.columnNum, Math.floor(index / this.columnNum))
        this.tileGroups.push(group)
        this.addEventToTile(tile);
        return tile
    }

    /**
     * adds mouse/touch start, move, end events
     * @param {Tile} tile puzzle tile object
     */
    addEventToTile(tile) {
        tile.img.addEventListener('mousedown', (event) => {
            if (event.button === 0) this.startTileMove(event, tile)
        },true)
        tile.img.addEventListener('mousemove', (event) => {
            if (event.button === 0) this.moveTiles(event)
        },true)
        tile.img.addEventListener('mouseup', (event) => {
            if (event.button === 0) this.endMove(event)
        },true)
        tile.img.addEventListener('touchstart', (event) =>
            this.startTileMove(event, tile),true)
        tile.img.addEventListener('touchmove', (event) =>
            this.moveTiles(event),true)
        tile.img.addEventListener('touchend', (event) =>
            this.endMove(event),true)
    }

    /**
     * event of touchend and mouseup, checks tile merging and win condition,
     * @param {MouseEvent| TouchEvent} event
     */
    endMove(event) {
        if (!this.movedGroup) return
        this.checkIfTileIsAdjacent(event)
        if (this.tileGroups.length === 1) JigSawPuzzle.messagePopup.classList.add('won')
        this.movedGroup = undefined
    }

    /**
     *checks if there are two adjacent tiles near enough to merge at the cursor point, if there is, merge and align them
     * @param {MouseEvent| TouchEvent} event
     */
    checkIfTileIsAdjacent(event) {
        let adjacentTiles = this.searchForAdjacentTileWithMovedGroup();
        if (adjacentTiles.length === 0)
            return
        let groupsToMerge = this.searchGroupToMerge(adjacentTiles);
        let newCoords = [
            event.pageX || event.clientX || event.changedTouches[0].pageX || event.targetTouches[0].pageX,
            (event.pageY || event.clientY || event.changedTouches[0].pageY || event.targetTouches[0].pageY) - (JigSawPuzzle.puzzleDesktop.offsetTop)
        ]
        groupsToMerge.forEach(([comparedTileIndex, foundTileIndex]) => {
            this.mergeGroups(
                this.getGroupByTile(PuzzleHandler.allTiles[foundTileIndex]),
                this.getGroupByTile(PuzzleHandler.allTiles[comparedTileIndex]),
                newCoords)
        })
    }

    /**
     * collect adjacent groups if they are mergeable, depending on merge direction
     * @param {[Tile,Tile,string]} adjacentTiles - foundTile, comparedTile, mergeDirection
     * @returns {Set<any>}
     */
    searchGroupToMerge(adjacentTiles) {
        let groupsToMerge = new Set()
        adjacentTiles.forEach(([foundTile, comparedTile, passDirection]) => {
            let comparedTileIndex = PuzzleHandler.getTileIndex(comparedTile)
            let foundTileIndex = PuzzleHandler.getTileIndex(foundTile)
            if (passDirection === 'right') {
                if (foundTileIndex === comparedTileIndex + 1 && foundTileIndex % this.columnNum !== 0) {
                    PuzzleHandler.allTiles[foundTileIndex].img.style.left =
                        (parseInt(PuzzleHandler.allTiles[comparedTileIndex].img.style.left) +
                            PuzzleHandler.allTiles[comparedTileIndex].img.getBoundingClientRect().width) -
                        this.tilePxDistance * 2 + "px"
                    groupsToMerge.add([comparedTileIndex, foundTileIndex])
                }
            } else if (passDirection === 'left') {
                if (foundTileIndex === comparedTileIndex - 1 && foundTileIndex % this.columnNum !== this.columnNum - 1) {
                    PuzzleHandler.allTiles[foundTileIndex].img.style.left =
                        (parseInt(PuzzleHandler.allTiles[comparedTileIndex].img.style.left) -
                            PuzzleHandler.allTiles[comparedTileIndex].img.getBoundingClientRect().width) +
                        this.tilePxDistance * 2 + "px"
                    groupsToMerge.add([comparedTileIndex, foundTileIndex])
                }
            } else if (passDirection === 'down') {
                if (foundTileIndex === comparedTileIndex + this.columnNum) {
                    PuzzleHandler.allTiles[foundTileIndex].img.style.top =
                        (parseInt(PuzzleHandler.allTiles[comparedTileIndex].img.style.top) +
                            PuzzleHandler.allTiles[comparedTileIndex].img.getBoundingClientRect().height) -
                        this.tilePxDistance * 2 + "px"
                    groupsToMerge.add([comparedTileIndex, foundTileIndex])
                }
            } else if (passDirection === 'up') {
                if (foundTileIndex === comparedTileIndex - this.columnNum) {
                    PuzzleHandler.allTiles[foundTileIndex].img.style.top =
                        (parseInt(PuzzleHandler.allTiles[comparedTileIndex].img.style.top) -
                            PuzzleHandler.allTiles[comparedTileIndex].img.getBoundingClientRect().height) +
                        this.tilePxDistance * 2 + "px"
                    groupsToMerge.add([comparedTileIndex, foundTileIndex])
                }
            }
        })
        return groupsToMerge;
    }

    /**
     * collect all tiles witch are close enough to merge with the tiles of the moved tile-group
     * @returns {*[]}
     */
    searchForAdjacentTileWithMovedGroup() {
        let adjacentTiles = []
        this.movedGroup.tiles.forEach(movedTile =>
            PuzzleHandler.allTiles.forEach(tile => {
                if (tile === movedTile || this.getGroupByTile(tile) === this.getGroupByTile(movedTile))
                    return false
                if (Math.abs((tile.img.getBoundingClientRect().left + tile.img.getBoundingClientRect().width - this.tilePxDistance) - movedTile.img.getBoundingClientRect().left - this.tilePxDistance) < this.tilePxDistanceBase &&
                    Math.abs(tile.img.getBoundingClientRect().top - movedTile.img.getBoundingClientRect().top) < this.tilePxDistanceBase
                ) {
                    adjacentTiles.push([movedTile, tile, "right"])
                    return true
                } else if (Math.abs((movedTile.img.getBoundingClientRect().left + movedTile.img.getBoundingClientRect().width - this.tilePxDistance) - tile.img.getBoundingClientRect().left - this.tilePxDistance) < this.tilePxDistanceBase &&
                    Math.abs(movedTile.img.getBoundingClientRect().top - tile.img.getBoundingClientRect().top) < this.tilePxDistanceBase
                ) {
                    adjacentTiles.push([movedTile, tile, "left"])
                    return true
                } else if (Math.abs((tile.img.getBoundingClientRect().top + tile.img.getBoundingClientRect().height - this.tilePxDistance) - movedTile.img.getBoundingClientRect().top - this.tilePxDistance) < this.tilePxDistanceBase &&
                    Math.abs(tile.img.getBoundingClientRect().left - movedTile.img.getBoundingClientRect().left) < this.tilePxDistanceBase
                ) {
                    adjacentTiles.push([movedTile, tile, "down"])
                    return true
                } else if (Math.abs((movedTile.img.getBoundingClientRect().top + movedTile.img.getBoundingClientRect().height - this.tilePxDistance) - tile.img.getBoundingClientRect().top - this.tilePxDistance) < this.tilePxDistanceBase &&
                    Math.abs(movedTile.img.getBoundingClientRect().left - tile.img.getBoundingClientRect().left) < this.tilePxDistanceBase
                ) {
                    adjacentTiles.push([movedTile, tile, "up"])
                    return true
                }
                return false
            })
        )
        return adjacentTiles
    }

    /**
     * merges two tile-groups together, align new tiles in dimension, deletes merged tile-group
     * @param {TileGroup} mergeGroupInto tile group merged into
     * @param {TileGroup} mergeGroupWhat tile group witch merged
     * @param {[number,number]} newCoords coordinates of the cursor at touchend
     */
    mergeGroups(mergeGroupInto, mergeGroupWhat, newCoords) {
        if (mergeGroupInto === mergeGroupWhat)
            return
        mergeGroupInto.mergeInto(mergeGroupWhat)
        mergeGroupInto.moveTiles(newCoords, this.originalCoords, this.tilePxDistance * 2)
        mergeGroupWhat.moveTiles(newCoords, this.originalCoords, this.tilePxDistance * 2)
        this.tileGroups.splice(this.tileGroups.indexOf(mergeGroupWhat), 1)
        this.setZIndex(mergeGroupInto);
    }

    /**
     * moves the moved tile group while clicked, replaces cursor coords
     * @param {MouseEvent| TouchEvent} event
     */
    moveTiles(event) {
        if (!this.movedGroup) return
        let newCoords = [
            event.pageX || event.clientX || event.targetTouches[0].pageX,
            (event.pageY || event.clientY || event.targetTouches[0].pageY) - (JigSawPuzzle.puzzleDesktop.offsetTop)
        ]
        this.movedGroup.moveTiles(newCoords, this.originalCoords, this.tilePxDistance * 2)
        this.originalCoords = newCoords;
    }

    /**
     * starts moving tile group, saves cursor coordinates
     * @param {MouseEvent| TouchEvent} event
     * @param {Tile} tile
     */
    startTileMove(event, tile) {
        this.originalCoords = [
            event.pageX || event.clientX || event.targetTouches[0].pageX,
            (event.pageY || event.clientY || event.targetTouches[0].pageY) - (JigSawPuzzle.puzzleDesktop.offsetTop)
        ]
        tile = this.searchClickedTile()
        if (!tile) return
        this.movedGroup = this.getGroupByTile(tile)
        this.setZIndex(this.movedGroup);
    }

    /**
     * searches clicked tile, when tile stack on each other, because they have an invisible padding, which not counts
     * as clicked
     * @returns {Tile|null} the uppermost clickable tile or null
     */
    searchClickedTile() {
        let tilesByClick = PuzzleHandler.allTiles.filter(tile => {
            let targetTileDimensions = tile.img.getBoundingClientRect()
            if (this.originalCoords[0] > targetTileDimensions.left + this.tilePxDistance &&
                this.originalCoords[0] < targetTileDimensions.right - this.tilePxDistance
                && this.originalCoords[1] > parseInt(tile.img.style.top) + this.tilePxDistance
                && this.originalCoords[1] < parseInt(tile.img.style.top) + targetTileDimensions.height - this.tilePxDistance
            ) return tile
        })
        tilesByClick.sort((t1, t2) => parseInt(t1.img.style.zIndex) < parseInt(t2.img.style.zIndex) ? 1 : -1)
        return tilesByClick.length > 0 ? tilesByClick[0] : null
    }

    /**
     * sets the tiles' z-index  of the given group to max
     * @param {TileGroup} clickedGroup
     */
    setZIndex(clickedGroup) {
        this.tileGroups.forEach((group) => group.setZIndex(clickedGroup === group))
    }

    /**
     * returns the TileGroup in witch the tile belongs
     * @param {Tile} tile
     * @returns {TileGroup}
     */
    getGroupByTile(tile) {
        return this.tileGroups.find(group => group.hasTile(tile))
    }
}