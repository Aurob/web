
$ = document.querySelectorAll.bind(document);

function image_load() {
    return new Promise((res, rej) => {
        let images = ['fruit.jpg']
        let image = images[Math.floor(Math.random() * images.length)];

        img = new Image();
        img.src = image;
        console.log(img.src)
        img.onload = function() {
            window.img = img;
            res(img);
        };
    });
}

var colors = {};
function pixelateImage(originalImage, pixelationFactor) {

    return new Promise((res, rej) => {
        const _canvas = document.createElement("canvas");
        const context = _canvas.getContext("2d");
        const originalWidth = originalImage.width;
        const originalHeight = originalImage.height;
        const _canvasWidth = originalWidth;
        const _canvasHeight = originalHeight;
        _canvas.width = _canvasWidth;
        _canvas.height = _canvasHeight;
        context.drawImage(originalImage, 0, 0, originalWidth, originalHeight);
        const originalImageData = context.getImageData(
            0,
            0,
            originalWidth,
            originalHeight
        ).data;

        res({'imgdata': originalImageData, 'size': [originalWidth, originalHeight]});
    }); 
}
