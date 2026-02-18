// Segmentation Module - Handles background removal with a refined alpha-matte pipeline.

const MEDIAPIPE_SEGMENTATION_VERSION = '0.1';

const Segmentation = {
    model: null,
    isModelLoaded: false,
    modelLoadPromise: null,
    pendingJob: null,
    canvas: null,
    ctx: null,
    sourceCanvas: null,
    sourceCtx: null,
    maskCanvas: null,
    maskCtx: null,
    sourcePixels: null,
    refinedMask: null,
    imageWidth: 0,
    imageHeight: 0,
    currentBackgroundColor: '#FFFFFF',

    init() {
        this.canvas = document.getElementById('processed-canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.sourceCanvas = document.createElement('canvas');
        this.sourceCtx = this.sourceCanvas.getContext('2d', { willReadFrequently: true });
        this.maskCanvas = document.createElement('canvas');
        this.maskCtx = this.maskCanvas.getContext('2d', { willReadFrequently: true });
    },

    async loadModel() {
        if (this.isModelLoaded && this.model) {
            return true;
        }

        if (this.modelLoadPromise) {
            return this.modelLoadPromise;
        }

        this.modelLoadPromise = (async () => {
            if (typeof SelfieSegmentation !== 'function') {
                throw new Error('MediaPipe SelfieSegmentation is not available.');
            }

            console.log('Initializing MediaPipe SelfieSegmentation...');

            const model = new SelfieSegmentation({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@${MEDIAPIPE_SEGMENTATION_VERSION}/${file}`
            });

            console.log('Setting model options...');
            model.setOptions({
                // General model works better for portrait/passport framing than landscape mode.
                modelSelection: 0,
                selfieMode: false
            });

            console.log('Setting onResults callback...');
            model.onResults((results) => {
                console.log('Segmentation results received:', results);
                this.handleResults(results);
            });

            // MediaPipe SelfieSegmentation doesn't have an initialize() method
            // The model is initialized automatically when we send the first image
            // Just verify the model was created successfully
            if (!model) {
                throw new Error('Failed to create MediaPipe SelfieSegmentation instance.');
            }

            console.log('MediaPipe SelfieSegmentation initialized successfully');
            this.model = model;
            this.isModelLoaded = true;
            return true;
        })();

        try {
            return await this.modelLoadPromise;
        } catch (error) {
            console.error('Error loading segmentation model:', error);
            this.model = null;
            this.isModelLoaded = false;
            return false;
        } finally {
            this.modelLoadPromise = null;
        }
    },

    async processImage(imageData, backgroundColor = '#FFFFFF') {
        console.log('processImage called with backgroundColor:', backgroundColor);

        const modelLoaded = await this.loadModel();
        if (!modelLoaded || !this.model) {
            console.error('Model not loaded, cannot process image');
            throw new Error('Failed to load segmentation model.');
        }

        console.log('Model loaded, preparing to process image...');

        if (this.pendingJob) {
            this.pendingJob.reject(new Error('Background removal was interrupted by a new request.'));
            this.pendingJob = null;
        }

        this.currentBackgroundColor = this.normalizeHex(backgroundColor);
        const source = await this.prepareSource(imageData);
        this.sourcePixels = source.pixels;

        console.log('Source prepared, image dimensions:', this.imageWidth, 'x', this.imageHeight);

        return new Promise(async (resolve, reject) => {
            this.pendingJob = { resolve, reject };

            try {
                console.log('Sending image to MediaPipe model...');
                await this.model.send({ image: source.input });
                console.log('Image sent to model, waiting for results...');
            } catch (error) {
                console.error('Error sending image to model:', error);
                if (this.pendingJob) {
                    this.pendingJob = null;
                }
                reject(error);
            }
        });
    },

    async prepareSource(imageData) {
        console.log('prepareSource called');

        if (!imageData || (!imageData.imageData && !imageData.dataUrl)) {
            console.error('Invalid image data:', imageData);
            throw new Error('Invalid image data received for segmentation.');
        }

        let width = imageData.width || (imageData.imageData ? imageData.imageData.width : 0);
        let height = imageData.height || (imageData.imageData ? imageData.imageData.height : 0);

        console.log('Image dimensions from data:', width, 'x', height);

        // Clear the source canvas
        this.sourceCtx.clearRect(0, 0, this.sourceCanvas.width || 1, this.sourceCanvas.height || 1);

        if (imageData.dataUrl) {
            console.log('Loading image from dataUrl');
            const img = await this.loadImageFromDataUrl(imageData.dataUrl);
            if (!width || !height) {
                width = img.naturalWidth || img.width;
                height = img.naturalHeight || img.height;
            }

            console.log('Loaded image dimensions:', width, 'x', height);

            this.sourceCanvas.width = width;
            this.sourceCanvas.height = height;
            this.sourceCtx.drawImage(img, 0, 0, width, height);
        } else {
            width = imageData.imageData.width;
            height = imageData.imageData.height;
            console.log('Using imageData dimensions:', width, 'x', height);

            this.sourceCanvas.width = width;
            this.sourceCanvas.height = height;
            this.sourceCtx.putImageData(imageData.imageData, 0, 0);
        }

        if (!width || !height) {
            console.error('Invalid dimensions after processing:', width, height);
            throw new Error('Source image has invalid dimensions.');
        }

        const normalizedImage = this.sourceCtx.getImageData(0, 0, width, height);
        this.imageWidth = width;
        this.imageHeight = height;

        // Ensure the output canvas is properly sized
        this.canvas.width = width;
        this.canvas.height = height;

        console.log('Source prepared successfully:', {
            width: this.imageWidth,
            height: this.imageHeight,
            canvasSize: `${this.canvas.width}x${this.canvas.height}`,
            sourcePixelsLength: normalizedImage.data.length
        });

        return {
            input: this.sourceCanvas,
            pixels: new Uint8ClampedArray(normalizedImage.data)
        };
    },

    handleResults(results) {
        console.log('handleResults called');

        if (!this.pendingJob) {
            console.warn('No pending job, ignoring results');
            return;
        }

        const activeJob = this.pendingJob;
        this.pendingJob = null;

        try {
            console.log('Processing segmentation results...');

            if (!results || !results.segmentationMask) {
                console.error('Invalid results:', results);
                throw new Error('Segmentation did not return a mask.');
            }

            if (!this.sourcePixels || !this.imageWidth || !this.imageHeight) {
                console.error('Source not initialized. sourcePixels:', !!this.sourcePixels, 'dimensions:', this.imageWidth, this.imageHeight);
                throw new Error('Source image is not initialized.');
            }

            console.log('Extracting confidence mask...');
            const confidenceMask = this.extractConfidenceMask(
                results.segmentationMask,
                this.imageWidth,
                this.imageHeight
            );

            console.log('Refining mask...');
            this.refinedMask = this.refineMask(confidenceMask, this.imageWidth, this.imageHeight);

            console.log('Rendering background...');
            const rendered = this.renderBackground(this.currentBackgroundColor);
            if (!rendered) {
                throw new Error('Failed to render processed image.');
            }

            console.log('Segmentation completed successfully');
            activeJob.resolve(true);
        } catch (error) {
            console.error('Error handling segmentation results:', error);
            activeJob.reject(error);
        }
    },

    extractConfidenceMask(segmentationMask, width, height) {
        this.maskCanvas.width = width;
        this.maskCanvas.height = height;
        this.maskCtx.clearRect(0, 0, width, height);

        if (segmentationMask instanceof ImageData) {
            if (segmentationMask.width === width && segmentationMask.height === height) {
                this.maskCtx.putImageData(segmentationMask, 0, 0);
            } else {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = segmentationMask.width;
                tempCanvas.height = segmentationMask.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.putImageData(segmentationMask, 0, 0);
                this.maskCtx.drawImage(tempCanvas, 0, 0, width, height);
            }
        } else {
            this.maskCtx.drawImage(segmentationMask, 0, 0, width, height);
        }

        const rawMask = this.maskCtx.getImageData(0, 0, width, height).data;
        const confidence = new Float32Array(width * height);
        const channels = this.detectMaskChannels(rawMask);

        for (let i = 0, p = 0; i < rawMask.length; i += 4, p++) {
            const r = rawMask[i] / 255;
            const g = rawMask[i + 1] / 255;
            const b = rawMask[i + 2] / 255;
            const alpha = rawMask[i + 3] / 255;
            const colorSignal = Math.max(r, g, b);

            if (channels.useAlphaOnly) {
                confidence[p] = alpha;
                continue;
            }

            if (channels.useColorOnly) {
                confidence[p] = colorSignal;
                continue;
            }

            confidence[p] = (channels.colorWeight * colorSignal) + (channels.alphaWeight * alpha);
        }

        this.normalizeMask(confidence);
        this.maybeInvertMask(confidence, width, height);
        return confidence;
    },

    detectMaskChannels(rawMask) {
        let minColor = 1;
        let maxColor = 0;
        let minAlpha = 1;
        let maxAlpha = 0;

        for (let i = 0; i < rawMask.length; i += 4) {
            const color = Math.max(rawMask[i], rawMask[i + 1], rawMask[i + 2]) / 255;
            const alpha = rawMask[i + 3] / 255;

            if (color < minColor) {
                minColor = color;
            }
            if (color > maxColor) {
                maxColor = color;
            }
            if (alpha < minAlpha) {
                minAlpha = alpha;
            }
            if (alpha > maxAlpha) {
                maxAlpha = alpha;
            }
        }

        const colorRange = maxColor - minColor;
        const alphaRange = maxAlpha - minAlpha;
        const rangeTotal = Math.max(0.0001, colorRange + alphaRange);

        return {
            useAlphaOnly: alphaRange > 0.05 && colorRange < 0.01,
            useColorOnly: colorRange > 0.05 && alphaRange < 0.01,
            colorWeight: colorRange / rangeTotal,
            alphaWeight: alphaRange / rangeTotal
        };
    },

    normalizeMask(mask) {
        let minValue = 1;
        let maxValue = 0;

        for (let i = 0; i < mask.length; i++) {
            const value = mask[i];
            if (value < minValue) {
                minValue = value;
            }
            if (value > maxValue) {
                maxValue = value;
            }
        }

        const range = maxValue - minValue;
        if (range < 0.12) {
            return;
        }

        if (minValue <= 0.03 && maxValue >= 0.97) {
            return;
        }

        for (let i = 0; i < mask.length; i++) {
            mask[i] = (mask[i] - minValue) / range;
        }
    },

    maybeInvertMask(mask, width, height) {
        const centerStartX = Math.floor(width * 0.35);
        const centerEndX = Math.ceil(width * 0.65);
        const centerStartY = Math.floor(height * 0.25);
        const centerEndY = Math.ceil(height * 0.75);

        let centerSum = 0;
        let centerCount = 0;
        let edgeSum = 0;
        let edgeCount = 0;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const value = mask[(y * width) + x];
                const isCenter = x >= centerStartX && x <= centerEndX && y >= centerStartY && y <= centerEndY;

                if (isCenter) {
                    centerSum += value;
                    centerCount++;
                } else {
                    edgeSum += value;
                    edgeCount++;
                }
            }
        }

        if (!centerCount || !edgeCount) {
            return;
        }

        const centerMean = centerSum / centerCount;
        const edgeMean = edgeSum / edgeCount;

        if (centerMean + 0.05 >= edgeMean) {
            return;
        }

        for (let i = 0; i < mask.length; i++) {
            mask[i] = 1 - mask[i];
        }
    },

    refineMask(confidenceMask, width, height) {
        const denoised = this.boxBlur(confidenceMask, width, height, 2);
        const thresholded = new Float32Array(denoised.length);

        const minForeground = 0.35;
        const maxForeground = 0.7;

        for (let i = 0; i < denoised.length; i++) {
            thresholded[i] = this.smoothstep(minForeground, maxForeground, denoised[i]);
        }

        const feathered = this.boxBlur(thresholded, width, height, 1);
        const refined = new Float32Array(thresholded.length);

        for (let i = 0; i < thresholded.length; i++) {
            const base = thresholded[i];

            if (base <= 0.05) {
                refined[i] = 0;
                continue;
            }

            if (base >= 0.95) {
                refined[i] = 1;
                continue;
            }

            refined[i] = (0.65 * base) + (0.35 * feathered[i]);
        }

        return refined;
    },

    boxBlur(values, width, height, radius) {
        if (radius <= 0) {
            return new Float32Array(values);
        }

        const size = width * height;
        const horizontal = new Float32Array(size);
        const output = new Float32Array(size);
        const kernelSize = radius * 2 + 1;

        for (let y = 0; y < height; y++) {
            const rowStart = y * width;
            let sum = 0;

            for (let k = -radius; k <= radius; k++) {
                const clampedX = Math.min(width - 1, Math.max(0, k));
                sum += values[rowStart + clampedX];
            }

            for (let x = 0; x < width; x++) {
                horizontal[rowStart + x] = sum / kernelSize;

                const removeX = Math.max(0, x - radius);
                const addX = Math.min(width - 1, x + radius + 1);
                sum -= values[rowStart + removeX];
                sum += values[rowStart + addX];
            }
        }

        for (let x = 0; x < width; x++) {
            let sum = 0;

            for (let k = -radius; k <= radius; k++) {
                const clampedY = Math.min(height - 1, Math.max(0, k));
                sum += horizontal[(clampedY * width) + x];
            }

            for (let y = 0; y < height; y++) {
                output[(y * width) + x] = sum / kernelSize;

                const removeY = Math.max(0, y - radius);
                const addY = Math.min(height - 1, y + radius + 1);
                sum -= horizontal[(removeY * width) + x];
                sum += horizontal[(addY * width) + x];
            }
        }

        return output;
    },

    smoothstep(edge0, edge1, value) {
        if (edge0 === edge1) {
            return value < edge0 ? 0 : 1;
        }

        const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
        return t * t * (3 - (2 * t));
    },

    renderBackground(color) {
        if (!this.refinedMask || !this.sourcePixels || !this.imageWidth || !this.imageHeight) {
            console.error('renderBackground: Missing required data', {
                hasRefinedMask: !!this.refinedMask,
                hasSourcePixels: !!this.sourcePixels,
                width: this.imageWidth,
                height: this.imageHeight
            });
            return false;
        }

        if (!this.canvas || !this.ctx) {
            console.error('renderBackground: Canvas or context not initialized');
            return false;
        }

        console.log('Rendering background with color:', color, 'canvas size:', this.canvas.width, 'x', this.canvas.height);

        this.currentBackgroundColor = this.normalizeHex(color);
        const bg = this.hexToRgb(this.currentBackgroundColor);
        const output = this.ctx.createImageData(this.imageWidth, this.imageHeight);
        const data = output.data;

        for (let i = 0, p = 0; i < data.length; i += 4, p++) {
            const alpha = this.refinedMask[p];
            const inverse = 1 - alpha;

            data[i] = Math.round((this.sourcePixels[i] * alpha) + (bg.r * inverse));
            data[i + 1] = Math.round((this.sourcePixels[i + 1] * alpha) + (bg.g * inverse));
            data[i + 2] = Math.round((this.sourcePixels[i + 2] * alpha) + (bg.b * inverse));
            data[i + 3] = 255;
        }

        this.ctx.putImageData(output, 0, 0);
        console.log('Background rendered successfully');
        return true;
    },

    changeBackgroundColor(color) {
        this.currentBackgroundColor = this.normalizeHex(color);

        if (this.refinedMask) {
            this.renderBackground(this.currentBackgroundColor);
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

    loadImageFromDataUrl(dataUrl) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('Failed to load image for segmentation input.'));
            image.src = dataUrl;
        });
    },

    normalizeHex(hexColor) {
        if (typeof hexColor !== 'string') {
            return '#FFFFFF';
        }

        const normalized = hexColor.trim().toUpperCase();
        if (!normalized.startsWith('#')) {
            return '#FFFFFF';
        }

        if (/^#[0-9A-F]{6}$/.test(normalized)) {
            return normalized;
        }

        if (/^#[0-9A-F]{3}$/.test(normalized)) {
            const r = normalized[1];
            const g = normalized[2];
            const b = normalized[3];
            return `#${r}${r}${g}${g}${b}${b}`;
        }

        return '#FFFFFF';
    },

    hexToRgb(hexColor) {
        const normalizedHex = this.normalizeHex(hexColor);

        return {
            r: parseInt(normalizedHex.slice(1, 3), 16),
            g: parseInt(normalizedHex.slice(3, 5), 16),
            b: parseInt(normalizedHex.slice(5, 7), 16)
        };
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Segmentation.init();

    const presetButtons = document.querySelectorAll('.color-preset');
    const customColorInput = document.getElementById('custom-color');
    const colorValue = document.getElementById('color-value');
    const applyBackgroundButton = document.getElementById('apply-background-btn');
    const backToReviewButton = document.getElementById('back-to-review-btn');

    presetButtons.forEach((button) => {
        button.addEventListener('click', () => {
            presetButtons.forEach((presetButton) => presetButton.classList.remove('active'));
            button.classList.add('active');

            const color = Segmentation.normalizeHex(button.dataset.color || '#FFFFFF');
            customColorInput.value = color;
            colorValue.textContent = color;
            Segmentation.changeBackgroundColor(color);
        });
    });

    customColorInput.addEventListener('input', (event) => {
        const color = Segmentation.normalizeHex(event.target.value);
        colorValue.textContent = color;
        presetButtons.forEach((presetButton) => presetButton.classList.remove('active'));
        Segmentation.changeBackgroundColor(color);
    });

    applyBackgroundButton.addEventListener('click', () => {
        const processedImage = Segmentation.getProcessedImage();
        if (!processedImage) {
            return;
        }

        document.dispatchEvent(new CustomEvent('backgroundApplied', {
            detail: processedImage
        }));
    });

    backToReviewButton.addEventListener('click', () => {
        document.dispatchEvent(new Event('backToReview'));
    });
});
