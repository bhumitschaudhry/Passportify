// Cropping Module - Handles passport photo sizing and cropping

const Cropping = {
    canvas: null,
    ctx: null,
    sourceImage: null,
    currentStandard: 'us',
    cropPosition: { x: 0, y: 0, scale: 1 },
    
    // Passport photo standards (dimensions in pixels at 300 DPI)
    standards: {
        us: {
            name: 'United States',
            width: 600,
            height: 600,
            mmWidth: 51,
            mmHeight: 51
        },
        eu: {
            name: 'European Union',
            width: 413,
            height: 531,
            mmWidth: 35,
            mmHeight: 45
        },
        uk: {
            name: 'United Kingdom',
            width: 413,
            height: 531,
            mmWidth: 35,
            mmHeight: 45
        },
        india: {
            name: 'India',
            width: 413,
            height: 531,
            mmWidth: 35,
            mmHeight: 45
        },
        china: {
            name: 'China',
            width: 390,
            height: 567,
            mmWidth: 33,
            mmHeight: 48
        },
        canada: {
            name: 'Canada',
            width: 590,
            height: 827,
            mmWidth: 50,
            mmHeight: 70
        },
        australia: {
            name: 'Australia',
            width: 413,
            height: 531,
            mmWidth: 35,
            mmHeight: 45
        },
        japan: {
            name: 'Japan',
            width: 413,
            height: 531,
            mmWidth: 35,
            mmHeight: 45
        }
    },
    
    init() {
        this.canvas = document.getElementById('crop-canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    },
    
    loadImage(imageData) {
        this.sourceImage = imageData;
        
        // Load image onto canvas
        const img = new Image();
        img.src = imageData.dataUrl;
        
        return new Promise((resolve) => {
            img.onload = () => {
                // Set canvas dimensions (maintain aspect ratio, max width 640)
                const maxWidth = 640;
                const scale = Math.min(maxWidth / img.width, 1);
                
                this.canvas.width = img.width * scale;
                this.canvas.height = img.height * scale;
                
                // Draw image
                this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
                
                // Reset crop position
                this.resetCropPosition();
                
                // Update preview
                this.updateCropPreview();
                
                resolve(true);
            };
        });
    },
    
    resetCropPosition() {
        this.cropPosition = { x: 0, y: 0, scale: 1 };
        
        // Reset sliders
        document.getElementById('scale-slider').value = 1;
        document.getElementById('x-slider').value = 0;
        document.getElementById('y-slider').value = 0;
    },
    
    setStandard(standardKey) {
        if (this.standards[standardKey]) {
            this.currentStandard = standardKey;
            this.updateCropPreview();
        }
    },
    
    setCropPosition(x, y, scale) {
        this.cropPosition = { x, y, scale };
        this.updateCropPreview();
    },
    
    updateCropPreview() {
        if (!this.canvas || !this.sourceImage) {
            return;
        }
        
        const standard = this.standards[this.currentStandard];
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw source image with transformations
        this.ctx.save();
        
        // Translate to center
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        
        // Apply scale
        this.ctx.scale(this.cropPosition.scale, this.cropPosition.scale);
        
        // Apply translation
        this.ctx.translate(this.cropPosition.x, this.cropPosition.y);
        
        // Draw image centered
        const img = new Image();
        img.src = this.sourceImage.dataUrl;
        this.ctx.drawImage(img, -this.canvas.width / 2, -this.canvas.height / 2, this.canvas.width, this.canvas.height);
        
        this.ctx.restore();
        
        // Show crop guide
        const cropGuide = document.getElementById('crop-guide');
        cropGuide.classList.add('active');
        
        // Update crop guide dimensions
        const previewSize = Math.min(this.canvas.width, this.canvas.height) * 0.8;
        const aspectRatio = standard.width / standard.height;
        
        if (aspectRatio > 1) {
            cropGuide.style.width = `${previewSize}px`;
            cropGuide.style.height = `${previewSize / aspectRatio}px`;
        } else {
            cropGuide.style.height = `${previewSize}px`;
            cropGuide.style.width = `${previewSize * aspectRatio}px`;
        }
    },
    
    applyCrop() {
        if (!this.canvas || !this.sourceImage) {
            return null;
        }
        
        const standard = this.standards[this.currentStandard];
        
        // Create a temporary canvas for the final output
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = standard.width;
        tempCanvas.height = standard.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Load the source image
        const img = new Image();
        img.src = this.sourceImage.dataUrl;
        
        return new Promise((resolve) => {
            img.onload = () => {
                // Calculate source crop area
                const previewSize = Math.min(this.canvas.width, this.canvas.height) * 0.8;
                const aspectRatio = standard.width / standard.height;
                
                let cropWidth, cropHeight;
                if (aspectRatio > 1) {
                    cropWidth = previewSize;
                    cropHeight = previewSize / aspectRatio;
                } else {
                    cropHeight = previewSize;
                    cropWidth = previewSize * aspectRatio;
                }
                
                // Calculate source coordinates (center of canvas)
                const sourceX = (this.canvas.width - cropWidth) / 2 - this.cropPosition.x;
                const sourceY = (this.canvas.height - cropHeight) / 2 - this.cropPosition.y;
                const sourceWidth = cropWidth / this.cropPosition.scale;
                const sourceHeight = cropHeight / this.cropPosition.scale;
                
                // Draw cropped and scaled image
                tempCtx.drawImage(
                    img,
                    sourceX * (img.width / this.canvas.width),
                    sourceY * (img.height / this.canvas.height),
                    sourceWidth * (img.width / this.canvas.width),
                    sourceHeight * (img.height / this.canvas.height),
                    0,
                    0,
                    standard.width,
                    standard.height
                );
                
                resolve({
                    dataUrl: tempCanvas.toDataURL('image/png'),
                    imageData: tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height),
                    width: tempCanvas.width,
                    height: tempCanvas.height,
                    standard: standard
                });
            };
        });
    },
    
    getCurrentStandard() {
        return this.standards[this.currentStandard];
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    Cropping.init();
    
    // Country/standard selector
    const countrySelect = document.getElementById('country-select');
    countrySelect.addEventListener('change', (e) => {
        Cropping.setStandard(e.target.value);
    });
    
    // Scale slider
    const scaleSlider = document.getElementById('scale-slider');
    scaleSlider.addEventListener('input', (e) => {
        const x = parseFloat(document.getElementById('x-slider').value);
        const y = parseFloat(document.getElementById('y-slider').value);
        const scale = parseFloat(e.target.value);
        Cropping.setCropPosition(x, y, scale);
    });
    
    // X slider
    const xSlider = document.getElementById('x-slider');
    xSlider.addEventListener('input', (e) => {
        const x = parseFloat(e.target.value);
        const y = parseFloat(document.getElementById('y-slider').value);
        const scale = parseFloat(scaleSlider.value);
        Cropping.setCropPosition(x, y, scale);
    });
    
    // Y slider
    const ySlider = document.getElementById('y-slider');
    ySlider.addEventListener('input', (e) => {
        const x = parseFloat(xSlider.value);
        const y = parseFloat(e.target.value);
        const scale = parseFloat(scaleSlider.value);
        Cropping.setCropPosition(x, y, scale);
    });
    
    // Apply crop button
    document.getElementById('apply-crop-btn').addEventListener('click', async () => {
        const croppedImage = await Cropping.applyCrop();
        const event = new CustomEvent('cropApplied', { detail: croppedImage });
        document.dispatchEvent(event);
    });
    
    // Back button
    document.getElementById('back-to-background-btn').addEventListener('click', () => {
        const event = new Event('backToBackground');
        document.dispatchEvent(event);
    });
});
