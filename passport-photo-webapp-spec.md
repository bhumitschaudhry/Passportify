# Passport Photo Webapp - Technical Specification

## 1. Project Overview

### 1.1 Purpose
A browser-based web application that allows users to capture a photo using their device's webcam and automatically convert it into a passport-sized photo with background removal and solid color replacement. The application will be hosted on GitHub Pages as a static site.

### 1.2 Target Users
- Individuals needing passport photos for official documents
- Users who want a quick, free alternative to professional photo services
- Anyone with a webcam and modern web browser

### 1.3 Key Features
- Webcam photo capture
- Automatic background removal using AI/ML
- Customizable solid background color
- Passport-compliant photo sizing
- Download functionality for the final image
- No server-side processing (all client-side)

---

## 2. Technical Requirements

### 2.1 Hosting Platform
- **Platform**: GitHub Pages
- **Type**: Static website (HTML/CSS/JavaScript only)
- **Constraints**: 
  - No server-side processing
  - All functionality must run in the browser
  - Maximum repository size: 1GB (recommended to stay well under this)
  - HTTPS enabled by default

### 2.2 Browser Compatibility
- **Minimum Support**:
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+
- **Required APIs**:
  - MediaDevices API (getUserMedia)
  - Canvas API
  - File API (for downloads)

### 2.3 Device Requirements
- Webcam or front-facing camera
- Modern browser with JavaScript enabled
- Minimum screen resolution: 1024x768 recommended

---

## 3. Core Functionality

### 3.1 Webcam Access and Photo Capture

#### 3.1.1 Camera Initialization
- Request camera permissions using `navigator.mediaDevices.getUserMedia()`
- Default to front-facing camera on mobile devices
- Display live camera feed in a `<video>` element
- Handle permission denial gracefully with user-friendly error messages

#### 3.1.2 Camera Controls
- **Capture button**: Take a snapshot from the live video feed
- **Camera switch button**: Toggle between front/rear cameras (on devices with multiple cameras)
- **Retry button**: Return to live camera view to retake photo

#### 3.1.3 Photo Capture Process
1. User clicks capture button
2. Application captures current video frame to Canvas
3. Pause video stream
4. Display captured image for user review
5. Provide options: "Use this photo" or "Retake"

### 3.2 Background Removal

#### 3.2.1 Technology Options

**Option A: MediaPipe Selfie Segmentation (Recommended)**
- **Library**: Google MediaPipe Solutions
- **Approach**: Pre-trained ML model for person segmentation
- **Pros**: 
  - High accuracy for human subjects
  - Runs entirely in browser using WebAssembly
  - Free and open source
  - Optimized for real-time performance
- **Cons**: 
  - Adds ~2-3MB to page load
  - Requires modern browser with WebAssembly support

**Option B: TensorFlow.js with BodyPix**
- **Library**: TensorFlow.js with BodyPix model
- **Approach**: Deep learning person segmentation
- **Pros**: 
  - Highly accurate segmentation
  - Flexible and well-documented
- **Cons**: 
  - Larger file size (~5-7MB)
  - May be slower on lower-end devices

**Option C: Remove.bg API**
- **Approach**: Cloud-based API service
- **Pros**: 
  - Excellent quality results
  - Simple implementation
- **Cons**: 
  - Requires API key and has usage limits
  - Not fully client-side (violates static hosting principle)
  - **Not recommended** for this use case

**Recommended Implementation**: MediaPipe Selfie Segmentation

#### 3.2.2 Background Removal Process
1. Load captured image into Canvas
2. Process image through segmentation model
3. Generate alpha mask for person vs. background
4. Apply mask to separate foreground (person) from background
5. Replace background pixels with selected solid color
6. Output processed image on Canvas

#### 3.2.3 Performance Considerations
- Use Web Workers for processing to avoid blocking UI
- Display loading indicator during background removal
- Implement progress feedback if processing takes >2 seconds
- Consider reducing image resolution for faster processing, then upscaling

### 3.3 Background Color Selection

#### 3.3.1 Preset Colors
Provide quick-select buttons for common passport photo backgrounds:
- **White** (#FFFFFF) - Most common, used in US, India, many others
- **Light Gray** (#E5E5E5) - Alternative neutral color
- **Light Blue** (#C5E1F5) - Some European countries
- **Custom** - Color picker for user selection

#### 3.3.2 Custom Color Picker
- HTML5 `<input type="color">` element
- Display hex code value
- Real-time preview as user changes color
- Default to white (#FFFFFF)

#### 3.3.3 Application
- Apply selected color to background pixels identified by segmentation mask
- Update preview in real-time when color changes
- Allow color changes without re-running segmentation

### 3.4 Passport Photo Sizing

#### 3.4.1 Standard Dimensions
Support multiple international passport photo standards:

| Country/Region | Dimensions (pixels at 300 DPI) | Dimensions (mm) |
|----------------|--------------------------------|-----------------|
| US | 600 x 600 | 51 x 51 |
| EU/Schengen | 413 x 531 | 35 x 45 |
| UK | 413 x 531 | 35 x 45 |
| India | 413 x 531 | 35 x 45 |
| China | 390 x 567 | 33 x 48 |
| Canada | 420 x 540 | 35.6 x 45.7 |

#### 3.4.2 Size Selection Interface
- Dropdown menu to select country/standard
- Display selected dimensions in both pixels and millimeters
- Default to US standard

#### 3.4.3 Cropping and Scaling
- Automatic face detection to center subject
- Overlay guide showing:
  - Head positioning (head should occupy 50-70% of frame height)
  - Eye line positioning (typically 50-60% from bottom)
  - Crop boundaries
- Manual adjustment option with drag-to-position
- Scale slider to zoom in/out while maintaining aspect ratio

#### 3.4.4 Face Detection
- Use browser's native Face Detection API if available
- Fallback to manual positioning if API unavailable
- Provide visual guides for proper head placement

### 3.5 Image Export and Download

#### 3.5.1 Export Formats
- **Primary**: JPEG (default)
  - Quality: 95% to balance file size and quality
  - Color space: sRGB
- **Alternative**: PNG
  - For users needing lossless format

#### 3.5.2 Resolution
- Export at 300 DPI for print quality
- Include DPI metadata in JPEG EXIF data
- File size typically 100-300KB for JPEG

#### 3.5.3 Download Mechanism
- Use Blob API and createObjectURL
- Trigger download via temporary `<a>` element with `download` attribute
- Suggested filename format: `passport-photo-YYYY-MM-DD.jpg`
- Clean up object URL after download

#### 3.5.4 Print Layout Option (Future Enhancement)
- Generate 4x6 inch or A4 sheet with multiple copies
- Common layouts: 2x2 or 3x3 photos per sheet
- Include cut guides between photos

---

## 4. User Interface Design

### 4.1 Layout Structure

#### 4.1.1 Single-Page Application
The application uses a step-based workflow on one page:

**Step 1: Camera Capture**
- Full-width video preview
- Centered capture button (prominent)
- Camera switch button (top-right)
- Instructions text above video

**Step 2: Photo Review**
- Captured photo display
- "Use this photo" and "Retake" buttons
- Basic cropping guides overlay

**Step 3: Background Processing**
- Processing status indicator
- Preview of processed image
- Background color selector (preset buttons + color picker)
- Re-process button if color changes

**Step 4: Size Selection & Crop**
- Country/standard dropdown
- Preview with crop guides
- Manual adjustment controls
- Face position guides

**Step 5: Download**
- Final preview
- Download button (JPEG/PNG options)
- "Start Over" button

#### 4.1.2 Navigation
- Linear workflow with "Next" and "Back" buttons
- Progress indicator showing current step (e.g., "Step 2 of 5")
- Each step can be revisited without losing work

### 4.2 Visual Design Guidelines

#### 4.2.1 Color Scheme
- **Primary**: Blue (#2563EB) - For primary actions
- **Secondary**: Gray (#6B7280) - For secondary actions
- **Success**: Green (#10B981) - For completion states
- **Warning**: Yellow (#F59E0B) - For warnings
- **Error**: Red (#EF4444) - For errors
- **Background**: White (#FFFFFF) or very light gray (#F9FAFB)

#### 4.2.2 Typography
- **Headings**: Sans-serif (e.g., Inter, system-ui)
- **Body**: Sans-serif, 16px base size
- **Buttons**: 14-16px, medium weight
- High contrast for accessibility (WCAG AA minimum)

#### 4.2.3 Responsive Design
- Mobile-first approach
- Breakpoints:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px
- Touch-friendly button sizes (minimum 44x44px)
- Appropriate video/image sizing for viewport

### 4.3 Accessibility

#### 4.3.1 Keyboard Navigation
- All interactive elements accessible via Tab key
- Logical tab order
- Visible focus indicators
- Enter/Space to activate buttons

#### 4.3.2 Screen Reader Support
- Semantic HTML elements
- ARIA labels for custom controls
- Alt text for images
- Status announcements for processing steps

#### 4.3.3 Visual Accessibility
- Minimum 4.5:1 contrast ratio for text
- Color not used as only indicator
- Scalable text (no fixed pixel sizes)
- Reduced motion option for animations

---

## 5. Technical Architecture

### 5.1 File Structure

```
passport-photo-app/
├── index.html              # Main HTML file
├── css/
│   └── styles.css         # All styles
├── js/
│   ├── app.js             # Main application logic
│   ├── camera.js          # Camera handling
│   ├── segmentation.js    # Background removal
│   ├── cropping.js        # Size/crop handling
│   └── export.js          # Download functionality
├── lib/                   # Third-party libraries
│   ├── mediapipe/         # MediaPipe files (or CDN links)
│   └── face-detection/    # Optional face detection
├── assets/
│   ├── icons/             # UI icons
│   └── guides/            # Crop guide templates
└── README.md              # Documentation
```

### 5.2 HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Passport Photo Creator</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <header>
        <h1>Passport Photo Creator</h1>
        <nav id="progress-indicator"><!-- Step indicators --></nav>
    </header>
    
    <main id="app-container">
        <!-- Step 1: Camera -->
        <section id="step-camera" class="step active">
            <video id="webcam" autoplay></video>
            <canvas id="photo-canvas" hidden></canvas>
            <button id="capture-btn">Capture Photo</button>
            <button id="switch-camera-btn">Switch Camera</button>
        </section>
        
        <!-- Step 2: Review -->
        <section id="step-review" class="step hidden">
            <img id="captured-photo" alt="Captured photo">
            <button id="use-photo-btn">Use This Photo</button>
            <button id="retake-btn">Retake</button>
        </section>
        
        <!-- Step 3: Background Removal -->
        <section id="step-background" class="step hidden">
            <canvas id="processed-canvas"></canvas>
            <div id="loading-indicator">Processing...</div>
            <div id="color-selector">
                <button class="color-preset" data-color="#FFFFFF">White</button>
                <button class="color-preset" data-color="#E5E5E5">Gray</button>
                <button class="color-preset" data-color="#C5E1F5">Blue</button>
                <input type="color" id="custom-color" value="#FFFFFF">
            </div>
        </section>
        
        <!-- Step 4: Sizing -->
        <section id="step-sizing" class="step hidden">
            <canvas id="crop-canvas"></canvas>
            <select id="country-select">
                <option value="us">US (2x2 in / 51x51 mm)</option>
                <option value="eu">EU/UK (35x45 mm)</option>
                <!-- More options -->
            </select>
            <div id="crop-controls"><!-- Adjustment controls --></div>
        </section>
        
        <!-- Step 5: Download -->
        <section id="step-download" class="step hidden">
            <canvas id="final-canvas"></canvas>
            <button id="download-jpg-btn">Download JPEG</button>
            <button id="download-png-btn">Download PNG</button>
            <button id="start-over-btn">Start Over</button>
        </section>
    </main>
    
    <footer>
        <p>Free passport photo creator - No data uploaded or stored</p>
    </footer>
    
    <script src="js/camera.js"></script>
    <script src="js/segmentation.js"></script>
    <script src="js/cropping.js"></script>
    <script src="js/export.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
```

### 5.3 JavaScript Modules

#### 5.3.1 app.js - Main Controller
```javascript
// Responsibilities:
// - Initialize application
// - Manage step transitions
// - Coordinate between modules
// - Handle global state

const AppState = {
    currentStep: 1,
    originalImage: null,
    processedImage: null,
    selectedCountry: 'us',
    backgroundColor: '#FFFFFF',
    cropData: null
};

function init() {
    // Initialize camera module
    // Set up event listeners
    // Load MediaPipe model
}

function nextStep() { /* ... */ }
function previousStep() { /* ... */ }
```

#### 5.3.2 camera.js - Webcam Management
```javascript
// Responsibilities:
// - Request camera permissions
// - Manage video stream
// - Capture photo from stream
// - Handle camera switching

let videoStream = null;
let currentCamera = 'user'; // 'user' or 'environment'

async function startCamera() {
    // Request getUserMedia
    // Attach to video element
}

function capturePhoto() {
    // Draw video frame to canvas
    // Return image data
}

async function switchCamera() {
    // Toggle between front/back
    // Restart stream
}
```

#### 5.3.3 segmentation.js - Background Removal
```javascript
// Responsibilities:
// - Load MediaPipe model
// - Process image for segmentation
// - Generate alpha mask
// - Replace background color

let segmenter = null;

async function loadSegmentationModel() {
    // Initialize MediaPipe Selfie Segmentation
}

async function removeBackground(imageData, backgroundColor) {
    // Run segmentation
    // Create mask
    // Apply background color
    // Return processed image
}

function changeBackgroundColor(color) {
    // Reapply color to existing mask
    // Update preview
}
```

#### 5.3.4 cropping.js - Size and Crop Management
```javascript
// Responsibilities:
// - Define country standards
// - Calculate crop dimensions
// - Handle face detection
// - Apply crop and resize

const STANDARDS = {
    us: { width: 600, height: 600, dpi: 300 },
    eu: { width: 413, height: 531, dpi: 300 },
    // More standards...
};

function detectFace(imageData) {
    // Use Face Detection API if available
    // Return face bounds
}

function applyCrop(imageData, standard, position) {
    // Crop to standard dimensions
    // Center on face
    // Return cropped image
}
```

#### 5.3.5 export.js - Download Functionality
```javascript
// Responsibilities:
// - Convert canvas to blob
// - Set DPI metadata
// - Trigger download

function downloadImage(canvas, format = 'jpeg', filename) {
    // Convert to blob
    // Create download link
    // Trigger download
    // Clean up
}

function setJpegDPI(jpegBlob, dpi) {
    // Inject EXIF DPI data
    // Return modified blob
}
```

### 5.4 CSS Architecture

#### 5.4.1 Organization
- Use CSS custom properties for theming
- Mobile-first responsive design
- Component-based styling
- Utility classes for common patterns

#### 5.4.2 Key Styles
```css
:root {
    --color-primary: #2563EB;
    --color-background: #FFFFFF;
    --spacing-unit: 8px;
    --border-radius: 8px;
}

/* Step visibility management */
.step { display: none; }
.step.active { display: block; }

/* Video preview */
#webcam {
    width: 100%;
    max-width: 640px;
    border-radius: var(--border-radius);
}

/* Responsive layout */
@media (max-width: 640px) {
    /* Mobile adjustments */
}
```

### 5.5 External Dependencies

#### 5.5.1 Required Libraries
1. **MediaPipe Selfie Segmentation**
   - CDN or local: ~2.5MB
   - Purpose: Background removal
   - License: Apache 2.0

2. **Optional: Face Detection API**
   - Browser native API
   - Fallback: Manual positioning

#### 5.5.2 Loading Strategy
- Use CDN for faster initial load
- Include fallback to local files
- Lazy load models (only when needed)
- Show loading states during model initialization

---

## 6. Data Flow

### 6.1 Image Processing Pipeline

```
1. Camera Capture
   ↓
   [Video Stream] → [Canvas Capture] → [ImageData]
   
2. Background Removal
   ↓
   [ImageData] → [MediaPipe Segmentation] → [Mask]
   ↓
   [Mask + Background Color] → [Processed ImageData]
   
3. Cropping/Sizing
   ↓
   [Processed ImageData] → [Face Detection] → [Crop Bounds]
   ↓
   [Apply Standard Dimensions] → [Final ImageData]
   
4. Export
   ↓
   [Final ImageData] → [Canvas] → [Blob] → [Download]
```

### 6.2 State Management

```javascript
// Global application state
const AppState = {
    // Current workflow step (1-5)
    currentStep: 1,
    
    // Camera state
    cameraStream: null,
    currentCameraId: null,
    availableCameras: [],
    
    // Image data at each stage
    capturedImage: null,        // After capture
    segmentedImage: null,       // After background removal
    croppedImage: null,         // After sizing
    
    // User selections
    backgroundColor: '#FFFFFF',
    selectedStandard: 'us',
    cropPosition: { x: 0, y: 0, scale: 1 },
    
    // Model state
    segmentationModelLoaded: false,
    faceDetectionAvailable: false
};
```

---

## 7. Performance Optimization

### 7.1 Image Processing
- **Web Workers**: Offload segmentation to worker thread
- **Canvas Optimization**: Reuse canvas elements, avoid recreating
- **Resolution Management**: Process at optimal resolution (not higher than needed)
- **Progressive Enhancement**: Show low-res preview during processing

### 7.2 Loading Performance
- **Lazy Loading**: Load MediaPipe model only when needed (Step 3)
- **Code Splitting**: Separate modules loaded on demand
- **Asset Optimization**: Compress images and minify CSS/JS
- **CDN Usage**: Use CDN for libraries when possible

### 7.3 Memory Management
- Release video stream when not in use
- Clear canvas contexts when done
- Revoke blob URLs after download
- Implement proper cleanup on step changes

### 7.4 Performance Targets
- **Time to Interactive**: < 3 seconds
- **Model Load Time**: < 2 seconds
- **Background Removal**: < 3 seconds for 640x480 image
- **Overall Process**: < 10 seconds from capture to download

---

## 8. Error Handling

### 8.1 Camera Access Errors

#### 8.1.1 Permission Denied
```javascript
Error: NotAllowedError
User Action: Denied camera permission
Response: 
- Show friendly error message
- Provide instructions to enable camera in browser settings
- Offer file upload alternative (future enhancement)
```

#### 8.1.2 No Camera Available
```javascript
Error: NotFoundError
User Action: No camera device detected
Response:
- Detect error and show message
- Suggest using device with camera
- Offer file upload alternative
```

#### 8.1.3 Camera In Use
```javascript
Error: NotReadableError
User Action: Camera already in use by another app
Response:
- Inform user camera is busy
- Suggest closing other apps
- Retry button
```

### 8.2 Processing Errors

#### 8.2.1 Model Load Failure
```javascript
Error: Failed to load MediaPipe model
Causes: Network error, browser incompatibility
Response:
- Show error with retry button
- Check browser compatibility
- Offer fallback processing (if available)
```

#### 8.2.2 Segmentation Failure
```javascript
Error: Background removal failed
Causes: Invalid image, processing error
Response:
- Show error message
- Suggest retaking photo
- Provide skip option (manual crop)
```

### 8.3 Browser Compatibility Errors

#### 8.3.1 Feature Detection
```javascript
// Check for required APIs
if (!navigator.mediaDevices?.getUserMedia) {
    // Show browser upgrade message
}

if (!window.FileReader) {
    // Disable certain features
}
```

#### 8.3.2 Unsupported Browser
```javascript
Response:
- Detect browser and version
- Show specific upgrade instructions
- List supported browsers
```

### 8.4 User Feedback
- All errors shown in clear, non-technical language
- Actionable instructions provided
- Retry mechanisms where appropriate
- Option to contact support or report issue (GitHub Issues)

---

## 9. Privacy and Security

### 9.1 Data Privacy

#### 9.1.1 Core Principles
- **Zero Data Collection**: No photos sent to servers
- **Local Processing Only**: All processing in browser
- **No Analytics**: No tracking or usage statistics
- **No Cookies**: No data persistence required

#### 9.1.2 Privacy Statement
Display prominently on landing page:
```
"Your privacy is protected:
• Photos never leave your device
• No data is uploaded or stored
• All processing happens in your browser
• No account or personal information required"
```

### 9.2 Security Considerations

#### 9.2.1 HTTPS Enforcement
- GitHub Pages provides HTTPS by default
- Camera API requires secure context (HTTPS)

#### 9.2.2 Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; 
               style-src 'self' 'unsafe-inline';
               img-src 'self' blob: data:;">
```

#### 9.2.3 Permissions
- Request camera permission with clear explanation
- Respect user denial of permissions
- Release camera when not in use

### 9.3 Open Source

#### 9.3.1 License
- Recommend MIT License for maximum reusability
- Include LICENSE file in repository
- Credit third-party libraries

#### 9.3.2 Transparency
- Source code publicly viewable on GitHub
- Document all processing steps
- Clear about what the app does and doesn't do

---

## 10. Testing Strategy

### 10.1 Browser Testing

#### 10.1.1 Compatibility Matrix
Test on:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

#### 10.1.2 Test Cases
- Camera initialization and capture
- Background removal accuracy
- Cropping and sizing
- Download functionality
- Responsive design at various screen sizes

### 10.2 Functional Testing

#### 10.2.1 Happy Path
1. User grants camera permission
2. Successfully captures photo
3. Background removed accurately
4. Photo cropped to standard
5. Successfully downloads JPEG

#### 10.2.2 Edge Cases
- Very bright/dark lighting
- Complex backgrounds (patterns, similar colors to subject)
- Off-center subjects
- Different skin tones and hair types
- Accessories (glasses, hats)
- Multiple people in frame

#### 10.2.3 Error Scenarios
- Camera permission denied
- No camera available
- Camera disconnected mid-session
- Network failure during model load
- Processing timeout

### 10.3 Performance Testing

#### 10.3.1 Metrics
- Page load time
- Time to first interaction
- Background removal processing time
- Memory usage during processing
- Battery impact on mobile

#### 10.3.2 Test Devices
- High-end desktop
- Mid-range laptop
- Budget smartphone
- Tablet

### 10.4 Accessibility Testing

#### 10.4.1 Tools
- WAVE browser extension
- Lighthouse accessibility audit
- Screen reader testing (NVDA, VoiceOver)
- Keyboard navigation testing

#### 10.4.2 Criteria
- WCAG 2.1 Level AA compliance
- All functions keyboard accessible
- Proper ARIA labels
- Sufficient color contrast

---

## 11. Deployment

### 11.1 GitHub Pages Setup

#### 11.1.1 Repository Configuration
1. Create public GitHub repository
2. Name: `passport-photo-app` (or custom name)
3. Enable GitHub Pages in repository settings
4. Source: Deploy from main branch, root directory
5. Custom domain (optional): Configure DNS

#### 11.1.2 Deployment Process
```bash
# Development workflow
git add .
git commit -m "Update: feature description"
git push origin main

# Automatic deployment by GitHub Pages
# Live at: https://username.github.io/passport-photo-app/
```

#### 11.1.3 Build Optimization
- Minify JavaScript and CSS before deployment
- Compress images
- Consider using GitHub Actions for automated builds
- Cache-busting for assets (versioned filenames)

### 11.2 Custom Domain (Optional)

#### 11.2.1 Setup Steps
1. Purchase domain from registrar
2. Add CNAME record pointing to `username.github.io`
3. Add CNAME file to repository root with domain name
4. Enable HTTPS in GitHub Pages settings

#### 11.2.2 Example Configuration
```
# CNAME file content
passportphoto.yoursite.com

# DNS Settings
CNAME passportphoto -> username.github.io
```

### 11.3 Version Control

#### 11.3.1 Branching Strategy
- `main`: Production-ready code (auto-deployed)
- `develop`: Integration branch for features
- `feature/*`: Individual feature branches
- `hotfix/*`: Emergency fixes

#### 11.3.2 Release Process
1. Merge feature to develop
2. Test in develop branch
3. Tag release version (e.g., v1.0.0)
4. Merge to main
5. GitHub Pages auto-deploys

---

## 12. Future Enhancements

### 12.1 Phase 2 Features

#### 12.1.1 File Upload Alternative
- Allow users to upload existing photos
- Support for various image formats
- Drag-and-drop interface

#### 12.1.2 Print Layout Generator
- Create printable sheets with multiple photos
- Standard layouts: 4x6 inch, A4
- Include cut guides
- Option to add photo specifications text

#### 12.1.3 Advanced Editing
- Manual background refinement (eraser/brush tools)
- Brightness/contrast adjustment
- Red-eye removal
- Blemish touch-up (simple retouching)

#### 12.1.4 Batch Processing
- Process multiple photos in one session
- Save profiles for different family members
- Export multiple sizes at once

### 12.2 Phase 3 Features

#### 12.2.1 Smart Compliance Checking
- AI-powered validation against country requirements:
  - Face positioning and size
  - Lighting quality
  - Eye visibility and direction
  - Facial expression (neutral)
  - Background uniformity
- Pass/fail indicator with specific feedback

#### 12.2.2 Cloud Save (Optional)
- Integration with Google Drive or Dropbox
- User-controlled, opt-in only
- Still maintain local-first approach

#### 12.2.3 Mobile Apps
- Progressive Web App (PWA) for offline use
- Install prompts for mobile home screen
- Native camera integration

#### 12.2.4 Localization
- Multi-language support
- Country-specific guidance and requirements
- Metric/imperial unit switching

### 12.3 Technical Improvements

#### 12.3.1 Performance
- WebAssembly optimization for segmentation
- GPU acceleration where available
- Better model compression
- Caching strategies

#### 12.3.2 Quality
- Higher quality segmentation models
- Better edge detection and refinement
- HDR photo support
- RAW image support

#### 12.3.3 Developer Experience
- TypeScript migration
- Automated testing suite
- Component-based architecture
- Development mode with hot reload

---

## 13. Success Metrics

### 13.1 Technical KPIs
- **Page Load Time**: < 3 seconds (target)
- **Processing Time**: < 5 seconds capture to download (target)
- **Error Rate**: < 5% of sessions encounter errors
- **Browser Compatibility**: 95%+ of target browsers supported

### 13.2 User Experience Metrics
- **Completion Rate**: % of users who complete full workflow
- **Retry Rate**: % of photos retaken (ideal: < 20%)
- **Average Session Time**: Target 2-3 minutes
- **Returning Users**: Indication of satisfaction

### 13.3 Quality Metrics
- **Background Removal Accuracy**: Visual inspection on test set
- **Compliance Rate**: % of outputs meeting passport standards
- **User Satisfaction**: Feedback via GitHub Issues

---

## 14. Maintenance and Support

### 14.1 Regular Maintenance

#### 14.1.1 Weekly Tasks
- Monitor GitHub Issues for bug reports
- Review browser compatibility with new releases
- Check dependency updates

#### 14.1.2 Monthly Tasks
- Update libraries and dependencies
- Review performance metrics
- Test on new browser versions
- Update documentation

#### 14.1.3 Quarterly Tasks
- Review and update country passport standards
- Evaluate new background removal technologies
- Conduct security audit
- Update roadmap based on user feedback

### 14.2 User Support

#### 14.2.1 Documentation
- Comprehensive README.md
- FAQ section on GitHub Pages
- Troubleshooting guide
- Video tutorial (optional)

#### 14.2.2 Issue Reporting
- GitHub Issues for bug reports
- Issue templates for consistency
- Label system for categorization
- Response SLA: 48 hours

#### 14.2.3 Community
- Encourage contributions via pull requests
- CONTRIBUTING.md guidelines
- Code of conduct
- Credit contributors

### 14.3 Monitoring

#### 14.3.1 Error Logging
- Client-side error tracking (optional, privacy-respecting)
- Console logging for development
- Error reporting to GitHub Issues

#### 14.3.2 Performance Monitoring
- Browser Performance API
- Periodic manual testing
- User feedback on performance

---

## 15. Risks and Mitigations

### 15.1 Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Browser API changes breaking functionality | High | Low | Maintain browser compatibility matrix, test regularly |
| MediaPipe model deprecated or updated | Medium | Medium | Abstract segmentation logic, allow model swapping |
| Performance issues on low-end devices | Medium | Medium | Implement progressive enhancement, provide quality settings |
| Large file size due to ML models | Low | High | Use CDN, lazy loading, optimize model size |

### 15.2 User Experience Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Poor segmentation quality | High | Medium | Provide manual refinement tools, clear retake option |
| Confusing user interface | Medium | Low | User testing, clear instructions, progressive disclosure |
| Browser permission confusion | Medium | High | Clear explanations, helpful error messages |
| Photos don't meet passport requirements | High | Low | Implement compliance checking, provide guidelines |

### 15.3 Operational Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| GitHub Pages service interruption | Low | Low | Monitor status, communicate downtime, consider backup hosting |
| Repository size limits exceeded | Low | Low | Optimize assets, use external CDN for large files |
| Lack of maintenance resources | Medium | Medium | Clear documentation, encourage community contributions |
| Security vulnerabilities | High | Low | Regular dependency updates, security audits, CSP headers |

---

## 16. Conclusion

This specification outlines a comprehensive passport photo web application that can be hosted entirely on GitHub Pages as a static site. The application prioritizes user privacy by processing all images locally in the browser, requires no server infrastructure, and leverages modern web technologies like MediaPipe for high-quality background removal.

### 16.1 Key Strengths
- **Privacy-First**: All processing happens locally
- **Free and Open Source**: No costs for users or developers
- **Accessible**: Works on any device with a camera and modern browser
- **Simple Deployment**: Static hosting on GitHub Pages
- **Extensible**: Clear architecture for future enhancements

### 16.2 Development Roadmap

**Phase 1 (MVP)**: 4-6 weeks
- Core camera capture functionality
- Basic background removal with MediaPipe
- Standard sizing (US, EU)
- JPEG download

**Phase 2**: 8-10 weeks
- File upload support
- Print layout generator
- Additional country standards
- UI/UX improvements

**Phase 3**: Ongoing
- Advanced editing features
- Compliance checking
- PWA capabilities
- Community-driven enhancements

### 16.3 Call to Action
This specification provides a complete blueprint for building a passport photo web application. The next steps are:
1. Set up GitHub repository
2. Implement MVP features
3. Conduct user testing
4. Iterate based on feedback
5. Launch and gather community input

---

## Appendix A: Passport Photo Standards Reference

### Common International Standards

| Country | Size (mm) | Size (pixels @ 300 DPI) | Head Height | Background |
|---------|-----------|-------------------------|-------------|------------|
| United States | 51 x 51 | 600 x 600 | 25-35 mm (50-70%) | White or off-white |
| Canada | 50 x 70 | 590 x 827 | 31-36 mm | Plain white |
| United Kingdom | 35 x 45 | 413 x 531 | 29-34 mm | Light grey or cream |
| European Union | 35 x 45 | 413 x 531 | 32-36 mm | Light background |
| India | 35 x 45 | 413 x 531 | 25-35 mm | White |
| China | 33 x 48 | 390 x 567 | 28-33 mm | White or light blue |
| Australia | 35 x 45 | 413 x 531 | 32-36 mm | Light colored |
| Japan | 35 x 45 | 413 x 531 | 32-36 mm | No background requirement |

### General Requirements (Most Countries)
- **Photo Age**: Taken within last 6 months
- **Lighting**: Even, no shadows on face or background
- **Expression**: Neutral, mouth closed, eyes open
- **Glasses**: Removed or non-reflective lenses
- **Head Covering**: Religious exceptions only
- **Resolution**: Minimum 600 DPI for print
- **Color**: Full color, not black and white
- **Quality**: Sharp focus, no pixelation

---

## Appendix B: Browser API Reference

### MediaDevices API (Camera Access)
```javascript
// Request camera access
navigator.mediaDevices.getUserMedia({
    video: {
        facingMode: 'user', // or 'environment'
        width: { ideal: 1280 },
        height: { ideal: 720 }
    }
}).then(stream => {
    // Attach to video element
}).catch(error => {
    // Handle errors
});

// Enumerate available cameras
navigator.mediaDevices.enumerateDevices()
    .then(devices => {
        const cameras = devices.filter(d => d.kind === 'videoinput');
    });
```

### Canvas API (Image Processing)
```javascript
// Capture from video
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

// Get image data
const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

// Manipulate pixels
const pixels = imageData.data; // RGBA array

// Put image data back
context.putImageData(imageData, 0, 0);
```

### Blob API (File Download)
```javascript
// Convert canvas to blob
canvas.toBlob(blob => {
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'passport-photo.jpg';
    a.click();
    URL.revokeObjectURL(url);
}, 'image/jpeg', 0.95);
```

---

## Appendix C: MediaPipe Integration Example

### Basic Setup
```javascript
import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';

// Initialize segmentation
const selfieSegmentation = new SelfieSegmentation({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
    }
});

// Configure
selfieSegmentation.setOptions({
    modelSelection: 1, // 0: General, 1: Landscape (better quality)
    selfieMode: true   // Flip horizontally for selfie view
});

// Set callback
selfieSegmentation.onResults(onResults);

// Process image
async function processImage(imageElement) {
    await selfieSegmentation.send({ image: imageElement });
}

// Handle results
function onResults(results) {
    const mask = results.segmentationMask;
    // mask is ImageData where each pixel value indicates person (1) or background (0)
    
    // Apply background color
    const canvas = document.getElementById('output');
    const ctx = canvas.getContext('2d');
    
    // Draw original image
    ctx.drawImage(results.image, 0, 0);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // Replace background pixels
    for (let i = 0; i < mask.data.length; i++) {
        if (mask.data[i] < 0.5) { // Background pixel
            pixels[i * 4] = 255;     // R
            pixels[i * 4 + 1] = 255; // G
            pixels[i * 4 + 2] = 255; // B
            // pixels[i * 4 + 3] stays same (alpha)
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}
```

---

## Appendix D: Recommended Libraries and CDN Links

### Core Dependencies
```html
<!-- MediaPipe Selfie Segmentation -->
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1/selfie_segmentation.js"></script>

<!-- Camera Utils (optional) -->
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js"></script>

<!-- Drawing Utils (optional) -->
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3/drawing_utils.js"></script>
```

### Optional Enhancements
```html
<!-- FileSaver.js for download management -->
<script src="https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"></script>

<!-- JSZip for multi-photo export -->
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
```

### CSS Frameworks (Optional)
```html
<!-- Tailwind CSS via CDN (for rapid styling) -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- OR Bootstrap -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
```

---

**Document Version**: 1.0  
**Last Updated**: February 16, 2026  
**Status**: Ready for Development
