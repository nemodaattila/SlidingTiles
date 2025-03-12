class SlidingTiles {
    /**
     * html element of the sample image
     * @type {HTMLImageElement}
     */
    fullPhotoImg = document.getElementById('fullPhoto')
    /**
     * path or name of the selected image
     * @type {string}
     */
    imgPath
    /**
     * Canvas for creating the image tiles
     * @type {HTMLCanvasElement}
     */
    canvas = document.getElementById("imgCutter")
    /**
     * array of image sources (base64String), created by the canvas
     * @type {string[]}
     */
    tileImageSource = []
    /**
     * Html DOM Table, which contains the game
     * @type {HTMLTableElement}
     */
    puzzleTable = document.getElementById("puzzleTable")
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
     * count of all tiles in the game, counted from zero (rows*columns) -1
     * @type {int}
     */
    tileNum
    /**
     * contains the images' indexes in the shuffled game - on dimensional
     * @type {int[]}
     */
    indexArray = [];
    /**
     * the index of the empty tile (counted in a one-dimensional array)
     * @type {int}
     */
    emptyIndexPosition
    /**
     * the base64String source string of the empty tile
     * @type {string}
     */
    emptyTileSrc
    /**
     * array of the image tiles of the game
     * @type {HTMLImageElement[]}
     */
    tileImages = []
    /**
     * Input button for switching the played image
     * @type {HTMLInputElement}
     */
    imageSwitcher = document.getElementById("imageSwitcher")
    /**
     * container for the game messages like (win or lose)
     * @type {HTMLDivElement}
     */
    messagePopup = document.getElementById("messagePopup")
    /**
     * the reduced size the image and puzzle will be displayed , for responsive design
     * if the gameContainer's clientWidth > 1000 : (clientWidth - 100) / 2;
     * else clientWidth - 100;
     * @type {number}
     */
    reducedImageSize
    /**
     * the game's parent DOM container
     * @type {HTMLDivElement}
     */
    gameContainer = document.getElementById("gameContainer")
    /**
     * unique stylesheet dynamically added depending the tile size and the move direction,
     * contains the tile move animations
     * @type {CSSStyleSheet}
     */
    uniqueStyleSheet
    /**
     * x and y coordinates of the screen when touched
     * @type {[number, number]}
     */
    touchChange

    /**
     * lower limit of cols and columns
     */
    lowerNumberLimit = 2

    /**
     * upper limit of cols and columns
     */
    upperNumberLimit = 10

    constructor() {
        this.addButtonMoveEvent();
        this.addTouchEvents()
        this.countGameInterfaceWidth();
        this.addImageSwitcherClickEvent()
        this.addDOMEvents();
        this.addInputLimiter();
    }

    /**
     * when the row or column input is bigger than the upper limit or smaller than the lower limit it is set to the given limit
     */
    addInputLimiter() {
        document.getElementById("rowNumInput").addEventListener('change', () => {
                let inputValue = parseInt(document.getElementById("rowNumInput").value)
                if (inputValue < this.lowerNumberLimit)
                    document.getElementById("rowNumInput").value = this.lowerNumberLimit;
                if (inputValue > this.upperNumberLimit)
                    document.getElementById("rowNumInput").value = this.upperNumberLimit;
            }
        )
        document.getElementById("colNumInput").addEventListener('change', () => {
                let inputValue = parseInt(document.getElementById("colNumInput").value)
                if (inputValue < this.lowerNumberLimit)
                    document.getElementById("colNumInput").value = this.lowerNumberLimit;
                if (inputValue > this.upperNumberLimit)
                    document.getElementById("colNumInput").value = this.upperNumberLimit;
            }
        )
    }

    /**
     * adds events to these html elements:
     * fakeImageChanger => if clicked, acts like the image switcher is clicked,
     * helpButton => display help popup,
     * helpPopup, (not button) when clicked on help popup while it's shown, hides it
     */
    addDOMEvents() {
        document.getElementById("fakeImageChanger").addEventListener("click", () =>
            this.imageSwitcher.click())
        document.getElementById("helpButton").addEventListener("click", () =>
            document.getElementById("helpPopup").classList.add("initial"))
        document.getElementById("helpPopup").addEventListener("click", () =>
            document.getElementById("helpPopup").classList.remove("initial"))
        this.canvas.addEventListener("click", (event) => event.preventDefault());
    }

    /**
     * counts the photo's and the puzzle's width
     * if the gameContainer's clientWidth > 1000 : (clientWidth - 100) / 2;
     * else clientWidth - 100;
     */
    countGameInterfaceWidth() {
        this.reducedImageSize = this.gameContainer.clientWidth > 1000 ? (this.gameContainer.clientWidth - 100) / 2 : this.gameContainer.clientWidth - 100
    }

    /**
     * adds event on WASD buttons => move tile
     */
    addButtonMoveEvent() {
        document.addEventListener('keyup', async event => {
            if (["w", "s", "a", "d"].findIndex(key => key === event.key) !== -1)
                await this.onKeyPressed(event.key)
        });
    }

    /**
     * adds touchstart and touch move events, => moving tiles with finger-touch
     */
    addTouchEvents() {
        this.puzzleTable.addEventListener('touchstart', (event) =>
            this.touchChange = [event.changedTouches[0].pageX, event.changedTouches[0].pageY])
        this.puzzleTable.addEventListener('touchend', (event) => {
            this.touchChange = [this.touchChange[0] - event.changedTouches[0].pageX,
                this.touchChange[1] - event.changedTouches[0].pageY]
            if (Math.abs(this.touchChange[0]) > Math.abs(this.touchChange[1])) {
                if (Math.abs(this.touchChange[0]) > 110)
                    this.onKeyPressed(this.touchChange[0] > 0 ? 'd' : 'a')
            } else {
                if (Math.abs(this.touchChange[1]) > 110)
                    this.onKeyPressed(this.touchChange[1] > 0 ? 's' : 'w')
            }
        })
    }

    /**
     * replaces the sources image of the game, regenerates the tiles and starts a new game
     * @param {string} imgPath image oath
     * @returns {Promise<void>}
     */
    async replacePuzzleImage(imgPath) {
        this.imgPath = imgPath
        await this.loadImg()
        await this.reSizeImage()
        this.startNewGame(true)
    }

    /**
     * starting the new game, checking if row/column number or image changed, if true recreate tiles,
     * setting default parameters, recreating puzzle, shuffling tiles
     * @param {boolean} imageChanged had the image changed
     */
    startNewGame(imageChanged = false) {
        let rowNum = parseInt(document.getElementById("rowNumInput").value)
        let colNum = parseInt(document.getElementById("colNumInput").value)
        let paramChange = (imageChanged || (colNum !== this.columnNum) || (rowNum !== this.rowNum))
        document.getElementById('messagePopup').classList.remove('won')
        this.rowNum = rowNum
        this.columnNum = colNum
        this.tileNum = this.rowNum * this.columnNum - 1
        this.emptyIndexPosition = this.tileNum
        this.indexArray = []
        if (paramChange)
            this.createTileImages()
        this.createTable()
        this.randomisePuzzleTileIndexes()
        this.createImages()
    }

    /**
     * randomizes/shuffles indexes for the table, ergo which image goes to which tile
     */
    randomisePuzzleTileIndexes() {
        let tempArray = [];
        for (let i = 0; i < this.tileNum; i++)
            tempArray.push(i);
        let randNum, index
        let i = 0;
        while (tempArray.length) {
            randNum = Math.floor(Math.random() * tempArray.length)
            index = tempArray.splice(randNum, 1)[0]
            this.indexArray.push(index);
            i++
        }
        this.indexArray.push(this.tileNum);
    }

    /**
     * create the game tile images, adding into the tds, based on randomised tile indexes,
     * adds click event on tiles
     */
    createImages() {
        let tds = this.puzzleTable.querySelectorAll("td")
        let img
        this.tileImages = []
        this.indexArray.forEach((index, key) => {
            img = document.createElement('img')
            img.src = this.tileImageSource[index]
            img.draggable = false
            img.addEventListener("click", () => this.switchTiles(key))
            this.tileImages.push(img)
            tds[key].appendChild(img)
        })
    }


    /**
     * resets unique animation stylesheet to empty
     * if switchable, switches the clicked and the empty tile, adds animation,
     * checks win condition
     * @param {number} tileIndex
     * @returns {Promise<void>}
     */
    async switchTiles(tileIndex) {
        this.removeUniqueAnimationStyle();
        if (!this.checkNeighbourIsEmpty(tileIndex))
            return
        this.tileImages[this.emptyIndexPosition].src = this.tileImages[tileIndex].src;
        this.tileImages[tileIndex].src = this.emptyTileSrc;
        this.indexArray[this.emptyIndexPosition] = this.indexArray[tileIndex]
        this.indexArray[tileIndex] = this.tileNum;
        await this.addSlideAnimation(tileIndex, this.emptyIndexPosition)
        this.emptyIndexPosition = tileIndex;
        this.checkIfWon();
    }

    /**
     * removes unique animation stylesheet
     */
    removeUniqueAnimationStyle() {
        this.tileImages.map(image => image.classList.remove('moved'))
        this.uniqueStyleSheet = new CSSStyleSheet()
        document.adoptedStyleSheets = [this.uniqueStyleSheet];
    }

    /**
     * adds unique animation, according to tiles dimensions and move directions
     * @param movedTileIndex index of the clicked/moved tile
     * @param emptyTileIndex index of the empty tile
     * @returns {Promise<unknown>}
     */
    async addSlideAnimation(movedTileIndex, emptyTileIndex) {
        return new Promise((resolve) => {
            if (movedTileIndex === emptyTileIndex - this.columnNum)
                this.uniqueStyleSheet.replaceSync(
                    '@keyframes slide-in {\n' +
                    '      100% { transform: translateY(0%); }\n' +
                    '    0% { transform: translateY(' + (-(this.tileImages[movedTileIndex].height + 1) + "px") + ');}\n' +
                    '}\n' +
                    '\n' +
                    '@-webkit-keyframes slide-in {\n' +
                    '      100% { transform: translateY(0%); }\n' +
                    '    0% { transform: translateY(' + (-(this.tileImages[movedTileIndex].height + 1) + "px") + '); }\n' +
                    '}' +
                    ".moved {" +
                    "top: -1px;z-index:100;" +
                    "animation: slide-in 0.25s forwards;" +
                    '        -webkit-animation: slide-in 0.25s forwards;}'
                )
            if (movedTileIndex === emptyTileIndex + this.columnNum)
                this.uniqueStyleSheet.replaceSync(
                    '@keyframes slide-in {\n' +
                    '      100% { transform: translateY(0%); }\n' +
                    '    0% { transform: translateY(' + ((this.tileImages[movedTileIndex].height + 1) + "px") + ');}\n' +
                    '}\n' +
                    '\n' +
                    '@-webkit-keyframes slide-in {\n' +
                    '      100% { transform: translateY(0%); }\n' +
                    '    0% { transform: translateY(' + ((this.tileImages[movedTileIndex].height + 1) + "px") + '); }\n' +
                    '}' +
                    ".moved {" +
                    "top: -1px;" +
                    "z-index:100;" +
                    "animation: slide-in 0.25s forwards;" +
                    '        -webkit-animation: slide-in 0.25s forwards;}'
                )
            if (movedTileIndex === emptyTileIndex - 1)
                this.uniqueStyleSheet.replaceSync(
                    '@keyframes slide-in {\n' +
                    '      100% { transform: translateX(0%); }\n' +
                    '    0% { transform: translateX(' + (-(this.tileImages[movedTileIndex].width + 1) + "px") + ');}\n' +
                    '}\n' +
                    '\n' +
                    '@-webkit-keyframes slide-in {\n' +
                    '      100% { transform: translateX(0%); }\n' +
                    '    0% { transform: translateX(' + (-(this.tileImages[movedTileIndex].width + 1) + "px") + '); }\n' +
                    '}' +
                    ".moved {" +
                    "left: -1px;z-index:100;" +
                    "animation: slide-in 0.25s forwards;" +
                    '        -webkit-animation: slide-in 0.25s forwards;}'
                )
            if (movedTileIndex === emptyTileIndex + 1)
                this.uniqueStyleSheet.replaceSync(
                    '@keyframes slide-in {\n' +
                    '      100% { transform: translateX(0%); }\n' +
                    '    0% { transform: translateX(' + ((this.tileImages[movedTileIndex].width + 1) + "px") + ');}\n' +
                    '}\n' +
                    '\n' +
                    '@-webkit-keyframes slide-in {\n' +
                    '      100% { transform: translateX(0%); }\n' +
                    '    0% { transform: translateX(' + ((this.tileImages[movedTileIndex].width + 1) + "px") + '); }\n' +
                    '}' +
                    ".moved {" +
                    "left: -1px;z-index:100;" +
                    "animation: slide-in 0.25s forwards;" +
                    '        -webkit-animation: slide-in 0.25s forwards;}'
                )
            this.tileImages[emptyTileIndex].classList.toggle('moved')
            document.adoptedStyleSheets = [this.uniqueStyleSheet];
            resolve()
        })
    }


    /**
     * calls tile switching function according to button pushed, checking limits, dont moves down empty it's in the last row for eg.
     * @param {string} key pressed keyboard key
     * @returns {Promise<void>}
     */
    async onKeyPressed(key) {
        switch (key) {
            case 's': {
                if (this.emptyIndexPosition < this.tileNum - this.columnNum + 1)
                    await this.switchTiles(this.emptyIndexPosition + this.columnNum)
                break;
            }
            case 'w': {
                if (this.emptyIndexPosition > this.columnNum - 1)
                    await this.switchTiles(this.emptyIndexPosition - this.columnNum)
                break;
            }
            case 'd': {
                if (this.emptyIndexPosition % this.columnNum !== this.columnNum - 1)
                    await this.switchTiles(this.emptyIndexPosition + 1)
                break;
            }
            case 'a': {
                if (this.emptyIndexPosition % this.columnNum !== 0)
                    await this.switchTiles(this.emptyIndexPosition - 1)
                break;
            }
        }
    }

    /**
     * check if winning condition is fulfilled, if yes, display winning text and buttons (messagePopup)
     */
    checkIfWon() {
        if (this.emptyIndexPosition !== this.tileNum)
            return
        let tileInRightPlace = 0;
        for (let i = 0; i < this.tileNum; i++)
            if (i === this.indexArray[i]) tileInRightPlace++;
        if (tileInRightPlace === this.tileNum)
            this.messagePopup.classList.add('won')

    }

    /**
     * checks if the clicked tiles orthogonal neighbour is the empty tile
     * @param {number} tileIndex index of the clicked tile
     * @returns {boolean}
     */
    checkNeighbourIsEmpty(tileIndex) {
        return ((tileIndex === this.emptyIndexPosition - 1 && tileIndex % this.columnNum !== this.columnNum - 1) ||
            (tileIndex === this.emptyIndexPosition + 1 && tileIndex % this.columnNum !== 0)
            || (tileIndex === this.emptyIndexPosition - this.columnNum) || (tileIndex === this.emptyIndexPosition + this.columnNum));
    }

    /**
     * redrawing table, rows, tds (columns)
     */
    createTable() {
        this.puzzleTable.replaceChildren();
        let row
        for (let i = 0; i < this.rowNum; i++) {
            row = document.createElement('tr')
            this.puzzleTable.appendChild(row)
            for (let j = 0; j < this.columnNum; j++)
                row.appendChild(document.createElement('td'))
        }
    }

    /**
     * loads the source game image, asynchronously
     * @returns {Promise<unknown>}
     */
    async loadImg() {
        return new Promise((resolve, reject) => {
            this.fullPhotoImg.src = this.imgPath
            this.fullPhotoImg.crossOrigin = '*';
            this.fullPhotoImg.onload = () => resolve(true)
            this.fullPhotoImg.onerror = e => reject(e)
        })
    }

    /**
     * recreates the image with width according to page size, redraws the image with canvas
     * @returns {Promise<unknown>}
     */
    async reSizeImage() {
        return new Promise(resolve => {
            this.canvas.width = this.reducedImageSize;
            this.canvas.height = this.canvas.width * (this.fullPhotoImg.height / this.fullPhotoImg.width);
            let tempCanvas = document.createElement('canvas')
            let tempContext = tempCanvas.getContext('2d');
            tempCanvas.width = this.canvas.width;
            tempCanvas.height = this.canvas.height;
            tempContext.drawImage(this.fullPhotoImg, 0, 0, tempCanvas.width, tempCanvas.height);
            this.fullPhotoImg.src = tempCanvas.toDataURL()
            resolve()
        })
    }

    /**
     * generates tiles images for the tiles according to column and row parameters, with canvas
     * it copies the parts of the image into separate image, as base64String
     * dropping last piece => adding the empty tile instead
     */
    createTileImages() {
        let tileImages = [];
        let rowNum = this.rowNum;
        let colNum = this.columnNum;
        let context = this.canvas.getContext('2d');
        let pieceWidth = this.fullPhotoImg.naturalWidth / colNum
        let pieceHeight = this.fullPhotoImg.naturalHeight / rowNum
        for (let x = 0; x < rowNum; ++x)
            for (let y = 0; y < colNum; ++y) {
                this.canvas.width = pieceWidth;
                this.canvas.height = pieceHeight;
                context.drawImage(this.fullPhotoImg, y * pieceWidth, x * pieceHeight, pieceWidth, pieceHeight,
                    0, 0, this.canvas.width, this.canvas.height);
                tileImages.push(this.canvas.toDataURL());
            }
        tileImages.pop()
        context.fillStyle = "#faf8ef";
        context.fillRect(0, 0, pieceWidth, pieceHeight);
        tileImages.push(this.canvas.toDataURL());
        this.emptyTileSrc = this.canvas.toDataURL()
        this.tileImageSource = tileImages
    }

    /**
     * adds event to image switcher button, calls image replacer function
     */
    addImageSwitcherClickEvent() {
        this.imageSwitcher.addEventListener('change', async () => {
            if (this.imageSwitcher.files.length === 0)
                return
            await this.replacePuzzleImage(await this.fileToDataURL(this.imageSwitcher.files[0]))
        })
    }


    /**
     * read file from input file as base64 string
     * @param file file from file input
     * @returns {Promise<unknown>}
     */
    fileToDataURL(file) {
        let reader = new FileReader()
        return new Promise((resolve) => {
            reader.onload = (event) => resolve(event.target.result)
            reader.readAsDataURL(file)
        })
    }
}