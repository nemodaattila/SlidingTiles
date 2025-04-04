/**
 * object containing one puzzle piece
 */
class Tile {
    /**
     * html element of the image piece
     * @type HTMLImageElement
     */
    img

    columnIndex

    rowIndex

    /**
     * saves the column and row indexes of the Tile in the puzzle
     * @param colIndex {number} index of the Tile's column
     * @param rowIndex {number} index of the Tile's row
     */
    setIndexes(colIndex, rowIndex)
    {
        this.columnIndex = colIndex
        this.rowIndex = rowIndex
    }

    /**
     * creates the image element on the puzzleDesktop
     * @param imgSrc {string} base64 string src of the image
     * @returns {Promise<void>}
     */
    async createTile(imgSrc) {
        await new Promise(resolve => {
            let img = document.createElement('img')
            img.src = imgSrc
            img.draggable = false
            img.style.zIndex = '1'
            img.style.cursor="pointer"
            this.img = img
            resolve()
        })
        JigSawPuzzle.puzzleDesktop.appendChild(this.img)
    }

    /**
     * randomizing the position of the tile on the game table
     */
    setWidth() {
        this.img.style.left = Math.floor(Math.random() * (JigSawPuzzle.puzzleDesktop.clientWidth - this.img.getBoundingClientRect().width)) + "px"
        this.img.style.top = Math.floor(Math.random() * (JigSawPuzzle.puzzleDesktop.clientHeight - this.img.getBoundingClientRect().height)) + "px"
    }

    /**
     * calculating the new position of the tile, during dragging
     * @param newCoords {[number, number]} x and y coordinates of the tile in the original/previous position
     * @param originalCoords {[number, number]} x and y coordinates of the tile in the new position
     */
    moveTile(newCoords, originalCoords) {
        let [newX, newY] = newCoords
        let [origX, origY] = originalCoords
        let clientRect = this.img.getBoundingClientRect()
        let leftPos = this.img.style.left !== '' ? this.img.style.left : clientRect.left
        let topPos = this.img.style.top !== '' ? this.img.style.top : clientRect.top
        let newLeftPos = parseInt(leftPos, 10) + ((newX - origX))
        let newTopPos = parseInt(topPos, 10) + ((newY - origY))
        newLeftPos = newLeftPos > 0 ? newLeftPos : 0
        newLeftPos = newLeftPos > (JigSawPuzzle.puzzleDesktop.clientWidth - this.img.clientWidth)
            ? (JigSawPuzzle.puzzleDesktop.clientWidth - this.img.clientWidth) : newLeftPos
        newTopPos = newTopPos > 0 ? newTopPos : 0
        newTopPos = newTopPos > (JigSawPuzzle.puzzleDesktop.clientHeight - this.img.clientHeight)
            ? (JigSawPuzzle.puzzleDesktop.clientHeight - this.img.clientHeight) : newTopPos
        this.img.style.left = newLeftPos + 'px';
        this.img.style.top = newTopPos + 'px';
    }
}