// Export Module - Handles image download functionality

const Export = {
    canvas: null,
    ctx: null,
    finalImage: null,
    
    init() {
        this.canvas = document.getElementById('final-canvas');
        this.ctx = this.canvas.getContext('2d');
    },
    
    displayFinalImage(imageData) {
        this.finalImage = imageData;
        
        // Set canvas dimensions
        this.canvas.width = imageData.width;
        this.canvas.height = imageData.height;
        
        // Load and draw image
        const img = new Image();
        img.src = imageData.dataUrl;
        
        img.onload = () => {
            this.ctx.drawImage(img, 0, 0);
        };
        
        // Update specifications display
        this.updateSpecs(imageData);
    },
    
    updateSpecs(imageData) {
        const standard = imageData.standard;
        
        document.getElementById('spec-size').textContent = 
            `${standard.mmWidth}x${standard.mmHeight} mm`;
        document.getElementById('spec-dimensions').textContent = 
            `${standard.width}x${standard.height} pixels (${standard.width / 300}x${standard.height / 300} inches at 300 DPI)`;
        document.getElementById('spec-background').textContent = 
            Segmentation.currentBackgroundColor || '#FFFFFF';
    },
    
    downloadJPEG() {
        if (!this.finalImage) {
            return;
        }
        
        const canvas = this.canvas;
        const standard = this.finalImage.standard;
        const date = new Date().toISOString().split('T')[0];
        const filename = `passport-photo-${date}.jpg`;
        
        // Convert to JPEG blob
        canvas.toBlob((blob) => {
            if (blob) {
                this.triggerDownload(blob, filename);
            }
        }, 'image/jpeg', 0.95);
    },
    
    downloadPNG() {
        if (!this.finalImage) {
            return;
        }
        
        const canvas = this.canvas;
        const standard = this.finalImage.standard;
        const date = new Date().toISOString().split('T')[0];
        const filename = `passport-photo-${date}.png`;
        
        // Convert to PNG blob
        canvas.toBlob((blob) => {
            if (blob) {
                this.triggerDownload(blob, filename);
            }
        }, 'image/png');
    },
    
    triggerDownload(blob, filename) {
        // Create object URL
        const url = URL.createObjectURL(blob);
        
        // Create temporary link element
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
    },
    
    reset() {
        this.finalImage = null;
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    Export.init();
    
    // Download JPEG button
    document.getElementById('download-jpg-btn').addEventListener('click', () => {
        Export.downloadJPEG();
    });
    
    // Download PNG button
    document.getElementById('download-png-btn').addEventListener('click', () => {
        Export.downloadPNG();
    });
    
    // Start over button
    document.getElementById('start-over-btn').addEventListener('click', () => {
        const event = new Event('startOver');
        document.dispatchEvent(event);
    });
});
