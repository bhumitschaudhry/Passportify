// Segmentation Module - Handles background removal using MediaPipe

const Segmentation = {
    segmenter: null,
    canvas: null,
    ctx: null,
    maskCanvas: null,
    maskCtx: null,
    originalPixels: null,
    currentMaskPixels: null,
    imageWidth: 0,
    imageHeight: 0,
    currentBackgroundColor: '#FFFFFF',
    isModelLoaded: false,
    pendingProcess: null,

    init() {
        this.canvas = document.getElementById('processed-canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.maskCanvas = document.createElement('canvas');
        this.maskCtx = this.maskCanvas.getContext('2d', { willReadFrequently: true });
    },

    async loadModel() {
        if (this.isModelLoaded) {
            return true;
        }

        try {
            if (typeof SelfieSegmentation !== 'function') {
                throw new Error('MediaPipe SelfieSegmentation is not available.');
            }

            const selfieSegmentation = new SelfieSegmentation({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
                }
            });

            selfieSegmentation.setOptions({
                modelSelection: 1,
                selfieMode: true
            });

            // Some MediaPipe builds expose initialize(), some do not.
            if (typeof selfieSegmentation.initialize === 'function') {
                await selfieSegmentation.initialize();
            }

            selfieSegmentation.onResults((results) => {
                this.handleSegmentationResults(results);
            });

            this.segmenter = selfieSegmentation;
            this.isModelLoaded = true;
            return true;
        } catch (error) {
            console.error('Error loading segmentation model:', error);
            this.segmenter = null;
            this.isModelLoaded = false;
            return false;
        }
    },

    async processImage(imageData, backgroundColor = '#FFFFFF') {
        const modelLoaded = await this.loadModel();
        if (!modelLoaded || !this.segmenter) {
            throw new Error('Failed to load segmentation model.');
        }

        this.currentBackgroundColor = backgroundColor;
        this.cacheOriginalImage(imageData);

        this.canvas.width = this.imageWidth;
        this.canvas.height = this.imageHeight;

        const inputImage = await this.createSegmentationInput(imageData);

        return new Promise(async (resolve, reject) => {
            this.pendingProcess = { resolve, reject };

            try {
                await this.segmenter.send({ image: inputImage });
            } catch (error) {
                this.pendingProcess = null;
                console.error('Error processing image:', error);
                reject(error);
            }
        });
    },

    handleSegmentationResults(results) {
        try {
            if (!results || !results.segmentationMask) {
                throw new Error('Segmentation did not return a mask.');
            }

            if (!this.imageWidth || !this.imageHeight || !this.originalPixels) {
                throw new Error('Original image data is not initialized.');
            }

            this.currentMaskPixels = this.extractMaskPixels(results.segmentationMask, this.imageWidth, this.imageHeight);
            this.applyBackground(this.currentBackgroundColor);

            if (this.pendingProcess) {
                this.pendingProcess.resolve(true);
                this.pendingProcess = null;
            }
        } catch (error) {
            console.error('Error handling segmentation results:', error);

            if (this.pendingProcess) {
                this.pendingProcess.reject(error);
                this.pendingProcess = null;
            }
        }
    },

    applyBackground(color) {
        if (!this.currentMaskPixels || !this.originalPixels) {
            return false;
        }

        this.currentBackgroundColor = color;
        const bgColor = this.hexToRgb(color);
        const outputImage = this.ctx.createImageData(this.imageWidth, this.imageHeight);
        outputImage.data.set(this.originalPixels);

        const outputPixels = outputImage.data;
        const pixelCount = this.imageWidth * this.imageHeight;

        for (let pixel = 0; pixel < pixelCount; pixel++) {
            const offset = pixel * 4;
            const maskValue = (
                this.currentMaskPixels[offset] +
                this.currentMaskPixels[offset + 1] +
                this.currentMaskPixels[offset + 2]
            ) / (3 * 255);

            if (maskValue < 0.5) {
                outputPixels[offset] = bgColor.r;
                outputPixels[offset + 1] = bgColor.g;
                outputPixels[offset + 2] = bgColor.b;
                outputPixels[offset + 3] = 255;
            }
        }

        this.ctx.putImageData(outputImage, 0, 0);
        return true;
    },

    changeBackgroundColor(color) {
        this.currentBackgroundColor = color;

        if (this.currentMaskPixels) {
            this.applyBackground(color);
        }
    },

    getProcessedImage() {
        if (!this.canvas || this.canvas.width === 0 || this.canvas.height === 0) {
            return null;
        }

        return {
            dataUrl: this.canvas.toDataURL('image/png'),
            imageData: this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height),
            width: this.canvas.width,
            height: this.canvas.height
        };
    },

    cacheOriginalImage(imageData) {
        if (!imageData || !imageData.imageData || !imageData.imageData.data) {
            throw new Error('Invalid image data received for segmentation.');
        }

        this.imageWidth = imageData.width || imageData.imageData.width;
        this.imageHeight = imageData.height || imageData.imageData.height;
        this.originalPixels = new Uint8ClampedArray(imageData.imageData.data);
    },

    async createSegmentationInput(imageData) {
        if (imageData && imageData.dataUrl) {
            return this.loadImageFromDataUrl(imageData.dataUrl);
        }

        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = this.imageWidth;
        fallbackCanvas.height = this.imageHeight;
        const fallbackCtx = fallbackCanvas.getContext('2d');
        fallbackCtx.putImageData(imageData.imageData, 0, 0);
        return fallbackCanvas;
    },

    loadImageFromDataUrl(dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image for segmentation input.'));
            img.src = dataUrl;
        });
    },

    extractMaskPixels(segmentationMask, width, height) {
        this.maskCanvas.width = width;
        this.maskCanvas.height = height;
        this.maskCtx.clearRect(0, 0, width, height);

        // Handle both mask shapes returned by different MediaPipe builds.
        if (segmentationMask && segmentationMask.data && segmentationMask.width && segmentationMask.height) {
            if (segmentationMask.width === width && segmentationMask.height === height) {
                return new Uint8ClampedArray(segmentationMask.data);
            }

            const sourceCanvas = document.createElement('canvas');
            sourceCanvas.width = segmentationMask.width;
            sourceCanvas.height = segmentationMask.height;
            const sourceCtx = sourceCanvas.getContext('2d');
            sourceCtx.putImageData(segmentationMask, 0, 0);
            this.maskCtx.drawImage(sourceCanvas, 0, 0, width, height);
        } else {
            this.maskCtx.drawImage(segmentationMask, 0, 0, width, height);
        }

        const maskImageData = this.maskCtx.getImageData(0, 0, width, height);
        return new Uint8ClampedArray(maskImageData.data);
    },

    hexToRgb(hex) {
        const normalizedHex = hex.replace('#', '');

        if (normalizedHex.length !== 6) {
            return { r: 255, g: 255, b: 255 };
        }

        const r = parseInt(normalizedHex.substring(0, 2), 16);
        const g = parseInt(normalizedHex.substring(2, 4), 16);
        const b = parseInt(normalizedHex.substring(4, 6), 16);

        return { r, g, b };
    },

    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
};

// Event Listeners for color selection
document.addEventListener('DOMContentLoaded', () => {
    Segmentation.init();
    
    // Preset color buttons
    const presetButtons = document.querySelectorAll('.color-preset');
    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active state
            presetButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Get color and apply
            const color = button.dataset.color;
            document.getElementById('custom-color').value = color;
            document.getElementById('color-value').textContent = color.toUpperCase();
            
            // Apply background color
            Segmentation.changeBackgroundColor(color);
        });
    });
    
    // Custom color picker
    const customColorInput = document.getElementById('custom-color');
    customColorInput.addEventListener('input', (e) => {
        const color = e.target.value.toUpperCase();
        document.getElementById('color-value').textContent = color;
        
        // Remove active state from preset buttons
        presetButtons.forEach(btn => btn.classList.remove('active'));
        
        // Apply background color
        Segmentation.changeBackgroundColor(color);
    });
    
    // Apply background button (handled by app.js)
    document.getElementById('apply-background-btn').addEventListener('click', () => {
        const processedImage = Segmentation.getProcessedImage();
        if (!processedImage) {
            return;
        }

        const event = new CustomEvent('backgroundApplied', {
            detail: processedImage
        });
        document.dispatchEvent(event);
    });
    
    // Back button
    document.getElementById('back-to-review-btn').addEventListener('click', () => {
        const event = new Event('backToReview');
        document.dispatchEvent(event);
    });
});
