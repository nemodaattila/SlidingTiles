/**
 * initiates the games properties, events, creates images, handles new game creation
 */
class JigSawPuzzle {
    /**
     * main container for the puzzle tiles and actual game
     * @type {HTMLDivElement}
     */
    static puzzleDesktop
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
     * Input button for switching the played image
     * @type {HTMLInputElement}
     */
    imageSwitcher = document.getElementById("imageSwitcher")
    /**
     * container for the game messages like (win or lose)
     * @type {HTMLDivElement}
     */
    static messagePopup
    /**
     * the reduced size the image and puzzle will be displayed , for responsive design
     * @see countSourceImageDimensions
     * @type {[number, number]}
     */
    reducedImageSize = []
    /**
     * the game's parent DOM container, containes everything, input, images, all
     * @type {HTMLDivElement}
     */
    gameContainer = document.getElementById("gameContainer")
    /**
     * lower limit of cols and columns
     * @type {int}
     */
    lowerNumberLimit = 2
    /**
     * upper limit of cols and columns
     * @type {int}
     */
    upperRowNumberLimit = 10

    /**
     * upper limit of cols and columns
     * @type {int}
     */
    upperColumnNumberLimit = 10
    /**
     * manages tileGroups, handles tile movement and merging
     * @type {PuzzleHandler}
     */
    puzzleHandler
    /**
     * object responsible for creating the source of the jigsaw puzzle pieces
     * @type {TileCreator}
     */
    tileCreator
    /**
     * height of window before any image display, needed for counting the dimensions of the images
     * @see countSourceImageDimensions
     * @type {int}
     */
    originalWindowInnerHeight
    /**
     * modifier for counting the puzzle desktop, to fit the tiles in the space properly
     * @type {number}
     */
    puzzleDesktopHeightModifier = 1.3

    constructor() {
        this.originalWindowInnerHeight = {...window}.innerHeight
        this.addImageSwitcherClickEvent()
        this.addDOMEvents();
        this.addInputLimiter();
        JigSawPuzzle.puzzleDesktop = document.getElementById('puzzleDesktop')
            JigSawPuzzle.messagePopup= document.getElementById("messagePopup")
        this.tileCreator = new TileCreator()
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
     * when the row or column input is bigger than the upper limit or smaller than the lower limit it is set to the
     * given limit
     */
    addInputLimiter() {

        this.upperRowNumberLimit=document.getElementById("rowNumInput").max = Math.floor((this.originalWindowInnerHeight / 50)-1)
        document.getElementById("rowNumInput").addEventListener('change', () => {
                let inputValue = parseInt(document.getElementById("rowNumInput").value)
                if (inputValue < this.lowerNumberLimit)
                    document.getElementById("rowNumInput").value = this.lowerNumberLimit;
                if (inputValue > this.upperRowNumberLimit)
                    document.getElementById("rowNumInput").value = this.upperRowNumberLimit;
            }
        )
        this.upperColumnNumberLimit=document.getElementById("colNumInput").max=Math.floor((this.gameContainer.clientWidth - 200)/50)
        document.getElementById("colNumInput").addEventListener('change', () => {
                let inputValue = parseInt(document.getElementById("colNumInput").value)
                if (inputValue < this.lowerNumberLimit)
                    document.getElementById("colNumInput").value = this.lowerNumberLimit;
                if (inputValue > this.upperColumnNumberLimit)
                    document.getElementById("colNumInput").value = this.upperColumnNumberLimit;
            }
        )
    }

    /**
     * replaces the sources image of the game, resizes the source image and canvas, starts a new game
     * @param {string} imgPath image path
     * @returns {Promise<void>}
     */
    async replacePuzzleImage(imgPath) {
        this.imgPath = imgPath
        await this.loadImg()
        this.countSourceImageDimensions();
        JigSawPuzzle.puzzleDesktop.style.height = this.reducedImageSize[1] * this.puzzleDesktopHeightModifier + "px"
        await this.reSizeImage()
        this.tileCreator.setImgSource(this.fullPhotoImg)
        this.tileCreator.setCanvas(this.canvas)
        this.startNewGame(true)
    }

    /**
     * counts the photo's and the puzzle's width and height, to roughly fit the screen
     */
    countSourceImageDimensions() {
        if (this.fullPhotoImg.height > this.fullPhotoImg.width) {
            this.reducedImageSize[1] = Math.min(this.originalWindowInnerHeight - 100, this.fullPhotoImg.height)
            this.reducedImageSize[0] = this.reducedImageSize[1] * (this.fullPhotoImg.width / this.fullPhotoImg.height)
            this.reducedImageSize[0] = Math.min(this.gameContainer.clientWidth - 200, this.reducedImageSize[0])
            this.reducedImageSize[1] = this.reducedImageSize[0] * (this.fullPhotoImg.height / this.fullPhotoImg.width)
        } else {
            this.reducedImageSize[0] = Math.min(this.gameContainer.clientWidth - 200, this.fullPhotoImg.width)
            this.reducedImageSize[1] = this.reducedImageSize[0] * (this.fullPhotoImg.height / this.fullPhotoImg.width)
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
     * recreates the image with the calculated dimensions (reducedImageSize), redraws the image with canvas
     * @returns {Promise<unknown>}
     */
    async reSizeImage() {
        return new Promise(resolve => {
            this.canvas.width = this.reducedImageSize[0];
            this.canvas.height = this.reducedImageSize[1];
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
     * starting the new game, setting default game properties, creating and displaying puzzle pieces
     */
    startNewGame() {
        document.getElementById('messagePopup').classList.remove('won')
        this.puzzleHandler = new PuzzleHandler()
        this.rowNum = parseInt(document.getElementById("rowNumInput").value)
        this.columnNum = parseInt(document.getElementById("colNumInput").value)
        this.puzzleHandler.setGameDimensions(this.rowNum, this.columnNum)
        JigSawPuzzle.puzzleDesktop.replaceChildren();
        this.createTileImages()
        PuzzleHandler.allTiles = []
        this.createTiles()
    }

    /**
     * generates images for pieces according to column and row parameters, with canvas
     * copies the parts of the image into separate pieces, as base64String
     */
    createTileImages() {
        let tileImages = [];
        this.tileCreator.setParams(this.fullPhotoImg.naturalHeight / this.rowNum, this.fullPhotoImg.naturalWidth / this.columnNum)
        this.puzzleHandler.setTilePxDistance(this.tileCreator.paddingPx)
        let interjambs = this.generateInterjambDirections()
        for (let j = 0; j < this.rowNum; ++j)
            for (let i = 0; i < this.columnNum; ++i) {
                this.tileCreator.setInterjambs(...interjambs[i][j])
                tileImages.push(this.tileCreator.createImage(i, j));
                this.tileCreator.clearContext()
            }
        this.tileImageSource = tileImages
    }

    /**
     * randomly generates the intrerjambs (the tongues of the puzzle pieces), the edge of the later pieces depend on
     * the earlier pieces
     * -1 : inner tongue, 1: outer tongue, 0: no tongue
     * @returns {[int,int,int,int][][]} directions of tongues for the images (up, bottom, right, left)
     */
    generateInterjambDirections() {
        let interjambs = [];
        for (let i = 0; i < this.columnNum; ++i) {
            interjambs[i] = []
            for (let j = 0; j < this.rowNum; ++j) {
                let temp = [0, 0, 0, 0]
                if (i === this.columnNum - 1) {
                    temp[2] = -interjambs[i - 1][j][3]
                } else if (i > 0 && i < this.columnNum - 1) {
                    temp[2] = -interjambs[i - 1][j][3]
                    temp[3] = Math.sign(Math.random() - 0.5)
                } else
                    temp[3] = Math.sign(Math.random() - 0.5)
                if (j === this.rowNum - 1) {
                    temp[0] = -interjambs[i][j - 1][1]
                } else if (j > 0 && j < this.rowNum - 1) {
                    temp[0] = -interjambs[i][j - 1][1]
                    temp[1] = Math.sign(Math.random() - 0.5)
                } else
                    temp[1] = Math.sign(Math.random() - 0.5)
                interjambs[i][j] = temp
            }
        }
        return interjambs
    }

    /**
     * create tile groups for each individual pieces
     */
    async createTiles() {
        for (const tile of this.tileImageSource)
            await this.puzzleHandler.addGroup(tile, this.tileImageSource.indexOf(tile))
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