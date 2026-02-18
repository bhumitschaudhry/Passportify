// Main Application Controller

const AppState = {
    currentStep: 1,
    capturedImage: null,
    processedImage: null,
    croppedImage: null,
    backgroundColor: '#FFFFFF'
};

// Initialize application
async function initApp() {
    updateStepIndicators();
    
    // Check browser compatibility
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showError('Your browser does not support camera access. Please use a modern browser like Chrome, Firefox, or Safari.');
        return;
    }
    
    // Start camera automatically
    const cameraStarted = await Camera.startCamera();
    if (!cameraStarted) {
        showError('Failed to start camera. Please check camera permissions and try again.');
    }
    
    // Set up event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Photo captured event (from camera.js)
    document.addEventListener('photoCaptured', (e) => {
        handlePhotoCapture(e.detail);
    });
    
    // Background applied event (from segmentation.js)
    document.addEventListener('backgroundApplied', (e) => {
        handleBackgroundApplied(e.detail);
    });
    
    // Crop applied event (from cropping.js)
    document.addEventListener('cropApplied', (e) => {
        handleCropApplied(e.detail);
    });
    
    // Navigation events
    document.addEventListener('backToReview', () => {
        goToStep(2);
    });
    
    document.addEventListener('backToBackground', () => {
        goToStep(3);
    });
    
    document.addEventListener('startOver', () => {
        resetApplication();
    });
    
    // Button event listeners
    document.getElementById('use-photo-btn').addEventListener('click', handleUsePhoto);
    document.getElementById('retake-btn').addEventListener('click', handleRetake);
}

function handlePhotoCapture(photoData) {
    AppState.capturedImage = photoData;
    
    // Pause video
    const video = document.getElementById('webcam');
    video.pause();
    
    // Display captured photo
    const capturedPhoto = document.getElementById('captured-photo');
    capturedPhoto.src = photoData.dataUrl;
    
    // Move to review step
    goToStep(2);
}

function handleUsePhoto() {
    const applyBackgroundBtn = document.getElementById('apply-background-btn');
    applyBackgroundBtn.disabled = true;

    // Move to background step
    goToStep(3);
    
    // Start background removal
    processBackgroundRemoval();
}

async function processBackgroundRemoval() {
    const loadingIndicator = document.getElementById('loading-indicator');
    const applyBackgroundBtn = document.getElementById('apply-background-btn');

    applyBackgroundBtn.disabled = true;
    loadingIndicator.classList.remove('hidden');

    console.log('Starting background removal process...');

    try {
        // Load model and process image
        console.log('Loading MediaPipe model...');
        const modelLoaded = await Segmentation.loadModel();

        if (!modelLoaded) {
            throw new Error('Failed to load the background removal model. Please refresh the page and try again.');
        }

        console.log('Model loaded successfully, processing image...');
        await Segmentation.processImage(AppState.capturedImage, AppState.backgroundColor);

        console.log('Background removal completed successfully');

        loadingIndicator.classList.add('hidden');
        applyBackgroundBtn.disabled = false;

        // Auto-enable the continue button after a short delay
        setTimeout(() => {
            applyBackgroundBtn.disabled = false;
        }, 500);
    } catch (error) {
        console.error('Background removal failed:', error);
        let errorMessage = 'Background removal failed. ';

        if (error.message.includes('not available')) {
            errorMessage += 'The MediaPipe library failed to load. Please check your internet connection and refresh the page.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage += 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('Invalid image')) {
            errorMessage += 'The captured image is invalid. Please retake the photo.';
        } else {
            errorMessage += 'Please try again or retake your photo.';
        }

        showError(errorMessage);
        loadingIndicator.classList.add('hidden');
        applyBackgroundBtn.disabled = true;
    }
}

function handleBackgroundApplied(processedImage) {
    console.log('handleBackgroundApplied called', processedImage);

    if (!processedImage) {
        console.error('processedImage is null or undefined');
        showError('No processed image available. Please try the background removal again.');
        return;
    }

    if (!processedImage.dataUrl) {
        console.error('processedImage does not have dataUrl', processedImage);
        showError('Background processing is not complete yet. Please wait and try again.');
        return;
    }

    console.log('Processed image received successfully:', {
        width: processedImage.width,
        height: processedImage.height,
        hasImageData: !!processedImage.imageData
    });

    AppState.processedImage = processedImage;

    // Move to cropping step
    goToStep(4);

    // Load image into cropping module
    console.log('Loading image into cropping module...');
    Cropping.loadImage(processedImage);
}

function handleRetake() {
    // Resume video
    const video = document.getElementById('webcam');
    video.play();
    
    // Clear captured image
    AppState.capturedImage = null;
    
    // Go back to camera step
    goToStep(1);
}

function handleCropApplied(croppedImage) {
    AppState.croppedImage = croppedImage;
    
    // Move to download step
    goToStep(5);
    
    // Display final image
    Export.displayFinalImage(croppedImage);
}

function goToStep(stepNumber) {
    // Validate transition
    if (stepNumber < 1 || stepNumber > 5) {
        return;
    }
    
    // Hide all steps
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
        step.classList.add('hidden');
    });
    
    // Show target step
    const targetStep = document.getElementById(`step-${getStepName(stepNumber)}`);
    if (targetStep) {
        targetStep.classList.remove('hidden');
        targetStep.classList.add('active');
    }
    
    // Update state
    AppState.currentStep = stepNumber;
    
    // Update indicators
    updateStepIndicators();
    
    // Step-specific actions
    handleStepActions(stepNumber);
}

function getStepName(stepNumber) {
    const stepNames = {
        1: 'camera',
        2: 'review',
        3: 'background',
        4: 'sizing',
        5: 'download'
    };
    return stepNames[stepNumber] || 'camera';
}

function updateStepIndicators() {
    const indicators = document.querySelectorAll('.step-indicator');
    
    indicators.forEach((indicator, index) => {
        const stepNum = index + 1;
        
        // Remove all states
        indicator.classList.remove('active', 'completed');
        
        // Add appropriate state
        if (stepNum === AppState.currentStep) {
            indicator.classList.add('active');
        } else if (stepNum < AppState.currentStep) {
            indicator.classList.add('completed');
        }
    });
}

function handleStepActions(stepNumber) {
    switch (stepNumber) {
        case 1:
            // Camera step - ensure camera is running
            Camera.clearError();
            break;
            
        case 2:
            // Review step - nothing special needed
            break;
            
        case 3:
            // Background step - loading is handled by processBackgroundRemoval
            break;
            
        case 4:
            // Sizing step - image is loaded by event handler
            break;
            
        case 5:
            // Download step - image is displayed by event handler
            break;
    }
}

function resetApplication() {
    // Clear all image data
    AppState.capturedImage = null;
    AppState.processedImage = null;
    AppState.croppedImage = null;
    AppState.backgroundColor = '#FFFFFF';
    
    // Reset camera
    const video = document.getElementById('webcam');
    video.play();
    
    // Reset modules
    Camera.clearError();
    Export.reset();
    
    // Reset color selection
    document.querySelectorAll('.color-preset').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.color-preset[data-color="#FFFFFF"]').classList.add('active');
    document.getElementById('custom-color').value = '#FFFFFF';
    document.getElementById('color-value').textContent = '#FFFFFF';
    document.getElementById('apply-background-btn').disabled = false;
    
    // Reset country selection
    document.getElementById('country-select').value = 'us';
    
    // Reset crop controls
    document.getElementById('scale-slider').value = 1;
    document.getElementById('x-slider').value = 0;
    document.getElementById('y-slider').value = 0;
    
    // Go back to first step
    goToStep(1);
}

function showError(message) {
    alert(message);
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initApp);
