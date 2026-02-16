// Camera Module - Handles webcam access and photo capture

const Camera = {
    stream: null,
    currentCamera: 'user',
    availableCameras: [],
    videoElement: null,
    canvasElement: null,
    
    init() {
        this.videoElement = document.getElementById('webcam');
        this.canvasElement = document.getElementById('photo-canvas');
    },
    
    async startCamera() {
        try {
            const constraints = {
                video: {
                    facingMode: this.currentCamera,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.stream;
            
            // Enumerate available cameras
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.availableCameras = devices.filter(device => device.kind === 'videoinput');
            
            return true;
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showError(error);
            return false;
        }
    },
    
    async switchCamera() {
        if (this.availableCameras.length <= 1) {
            return; // Only one camera available
        }
        
        // Stop current stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        
        // Toggle between front and back camera
        this.currentCamera = this.currentCamera === 'user' ? 'environment' : 'user';
        
        // Restart camera with new facing mode
        await this.startCamera();
    },
    
    capturePhoto() {
        if (!this.stream) {
            throw new Error('No camera stream available');
        }
        
        const video = this.videoElement;
        const canvas = this.canvasElement;
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Capture current frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Return image data
        return {
            dataUrl: canvas.toDataURL('image/png'),
            imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
            width: canvas.width,
            height: canvas.height
        };
    },
    
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
    },
    
    showError(error) {
        const errorDiv = document.getElementById('camera-error');
        let message = '';
        
        switch (error.name) {
            case 'NotAllowedError':
            case 'PermissionDeniedError':
                message = 'Camera access denied. Please allow camera access in your browser settings and refresh the page.';
                break;
            case 'NotFoundError':
            case 'DevicesNotFoundError':
                message = 'No camera found. Please connect a camera and try again.';
                break;
            case 'NotReadableError':
            case 'TrackStartError':
                message = 'Camera is already in use by another application. Please close other apps using the camera.';
                break;
            case 'OverconstrainedError':
            case 'ConstraintNotSatisfiedError':
                message = 'Camera does not support the required settings. Please try a different camera.';
                break;
            case 'TypeError':
                message = 'Camera access is not supported in this browser or context. Please use a modern browser with HTTPS.';
                break;
            default:
                message = 'Unable to access camera. Please ensure you have granted camera permissions and try again.';
        }
        
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    },
    
    clearError() {
        const errorDiv = document.getElementById('camera-error');
        errorDiv.textContent = '';
        errorDiv.classList.add('hidden');
    },
    
    hasMultipleCameras() {
        return this.availableCameras.length > 1;
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    Camera.init();
    
    document.getElementById('switch-camera-btn').addEventListener('click', async () => {
        await Camera.switchCamera();
    });
    
    document.getElementById('capture-btn').addEventListener('click', () => {
        // This will be handled by app.js
        const event = new CustomEvent('photoCaptured', {
            detail: Camera.capturePhoto()
        });
        document.dispatchEvent(event);
    });
});
