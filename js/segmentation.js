// Segmentation Module - Handles background removal using MediaPipe

const Segmentation = {
    segmenter: null,
    canvas: null,
    ctx: null,
    originalImageData: null,
    currentMask: null,
    currentBackgroundColor: '#FFFFFF',
    isModelLoaded: false,
    
    init() {
        this.canvas = document.getElementById('processed-canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    },
    
    async loadModel() {
        if (this.isModelLoaded) {
            return true;
        }
        
        try {
            // Initialize MediaPipe Selfie Segmentation
            const selfieSegmentation = new SelfieSegmentation({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
                }
            });
            
            selfieSegmentation.setOptions({
                modelSelection: 1, // 0: General, 1: Landscape (better quality)
                selfieMode: true   // Flip horizontally for selfie view
            });
            
            await selfieSegmentation.initialize();
            
            this.segmenter = selfieSegmentation;
            this.isModelLoaded = true;
            
            return true;
        } catch (error) {
            console.error('Error loading segmentation model:', error);
            return false;
        }
    },
    
    async processImage(imageData, backgroundColor = '#FFFFFF') {
        if (!this.isModelLoaded) {
            await this.loadModel();
        }
        
        this.currentBackgroundColor = backgroundColor;
        this.originalImageData = imageData;
        
        // Set canvas dimensions
        this.canvas.width = imageData.width;
        this.canvas.height = imageData.height;
        
        // Create an image element from the data URL
        const img = new Image();
        img.src = imageData.dataUrl;
        
        return new Promise((resolve, reject) => {
            img.onload = async () => {
                try {
                    // Set up results handler BEFORE sending image
                    this.segmenter.onResults((results) => {
                        this.currentMask = results.segmentationMask;
                        this.applyBackground(backgroundColor);
                        resolve(true);
                    });
                    
                    // Process image with MediaPipe
                    await this.segmenter.send({ image: img });
                } catch (error) {
                    console.error('Error processing image:', error);
                    reject(error);
                }
            };
            
            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
        });
    },
    
    applyBackground(color) {
        if (!this.currentMask || !this.originalImageData) {
            return;
        }
        
        this.currentBackgroundColor = color;
        
        // Parse the background color
        const bgColor = this.hexToRgb(color);
        
        // Get image data
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Draw original image first
        const img = new Image();
        img.src = this.originalImageData.dataUrl;
        
        img.onload = () => {
            this.ctx.drawImage(img, 0, 0, width, height);
            
            // Get the pixel data
            const imageData = this.ctx.getImageData(0, 0, width, height);
            const pixels = imageData.data;
            const maskData = this.currentMask.data;
            
            // Apply background color based on mask
            for (let i = 0; i < maskData.length; i++) {
                const maskValue = maskData[i];
                
                // If maskValue < 0.5, it's background; otherwise it's person
                if (maskValue < 0.5) {
                    // Set pixel to background color
                    pixels[i * 4] = bgColor.r;
                    pixels[i * 4 + 1] = bgColor.g;
                    pixels[i * 4 + 2] = bgColor.b;
                    pixels[i * 4 + 3] = 255; // Full opacity
                }
            }
            
            // Put the modified image data back
            this.ctx.putImageData(imageData, 0, 0);
        };
    },
    
    changeBackgroundColor(color) {
        if (this.currentMask) {
            this.applyBackground(color);
        }
    },
    
    getProcessedImage() {
        if (!this.canvas) {
            return null;
        }
        
        return {
            dataUrl: this.canvas.toDataURL('image/png'),
            imageData: this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height),
            width: this.canvas.width,
            height: this.canvas.height
        };
    },
    
    hexToRgb(hex) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Parse hex color
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
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
        const event = new CustomEvent('backgroundApplied', {
            detail: Segmentation.getProcessedImage()
        });
        document.dispatchEvent(event);
    });
    
    // Back button
    document.getElementById('back-to-review-btn').addEventListener('click', () => {
        const event = new Event('backToReview');
        document.dispatchEvent(event);
    });
});
