# Passport Photo Creator

A browser-based web application that allows users to capture passport-sized photos using their webcam, with automatic background removal and customizable backgrounds. All processing happens locally in your browser - no photos are uploaded to any server.

## Features

- **Webcam Capture**: Take photos directly from your device's camera
- **Background Removal**: AI-powered background removal using MediaPipe
- **Custom Backgrounds**: Choose from preset colors or select a custom color
- **Passport Standards**: Support for multiple international passport photo dimensions
- **Privacy First**: All processing happens locally - no data uploaded or stored
- **Free & Open Source**: Completely free to use

## Supported Passport Standards

- United States (2x2 inch)
- European Union (35x45 mm)
- United Kingdom (35x45 mm)
- India (35x45 mm)
- China (33x48 mm)
- Canada (50x70 mm)
- Australia (35x45 mm)
- Japan (35x45 mm)

## How to Use

1. **Capture Photo**: Allow camera access and position yourself in good lighting
2. **Review**: Check that your photo is clear and well-lit
3. **Remove Background**: Select your desired background color
4. **Size & Crop**: Choose your country's standard and adjust positioning
5. **Download**: Save your passport photo in JPEG or PNG format

## Browser Requirements

- **Supported Browsers**:
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+
- **Required Features**:
  - Webcam or camera
  - JavaScript enabled
  - WebAssembly support (for AI processing)

## Installation

### Option 1: Direct Use

Simply open `index.html` in a modern web browser. No installation required.

### Option 2: Local Server

For better performance, especially with camera access:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (with http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

Then open http://localhost:8000 in your browser.

### Option 3: GitHub Pages

1. Fork or clone this repository
2. Enable GitHub Pages in repository settings
3. Select source as main branch, root directory
4. Access at `https://yourusername.github.io/Passportify`

## Project Structure

```
Passportify/
├── index.html              # Main HTML file
├── README.md              # This file
├── css/
│   └── styles.css         # Application styles
├── js/
│   ├── app.js            # Main application controller
│   ├── camera.js         # Webcam handling
│   ├── segmentation.js   # Background removal (MediaPipe)
│   ├── cropping.js       # Passport photo sizing
│   └── export.js         # Download functionality
└── assets/
    ├── icons/            # UI icons (future)
    └── guides/           # Crop guide templates (future)
```

## Technical Details

### Technologies Used

- **HTML5/CSS3**: Modern, responsive design
- **JavaScript (ES6+)**: Vanilla JavaScript, no frameworks
- **MediaPipe Selfie Segmentation**: AI-powered background removal
- **Canvas API**: Image processing and manipulation

### Key Features

- **Client-Side Processing**: All image processing happens in the browser
- **Privacy Focused**: No data leaves the user's device
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: WCAG 2.1 compliant with keyboard navigation

### Background Removal

The application uses Google's MediaPipe Selfie Segmentation model:
- Runs entirely in the browser via WebAssembly
- ~2-3MB model size (loaded from CDN)
- Real-time segmentation for person detection
- Optimized for selfie/portrait photos

## Limitations

- Requires good lighting for best results
- Works best with single-person photos
- Background removal accuracy varies with lighting conditions
- Processing speed depends on device capabilities

## Troubleshooting

### Camera Not Working

1. Check browser permissions (camera access must be allowed)
2. Ensure no other application is using the camera
3. Try refreshing the page
4. Use HTTPS or localhost (camera API requires secure context)

### Background Removal Issues

1. Ensure good, even lighting
2. Avoid busy backgrounds similar to clothing color
3. Stand at a reasonable distance from the background
4. Retake photo if segmentation quality is poor

### Performance Issues

1. Close other browser tabs
2. Use a modern browser with WebAssembly support
3. Lower resolution cameras process faster

## Privacy Policy

**Your Privacy Matters**

- Photos never leave your device
- No data is uploaded to any server
- No analytics or tracking
- No cookies or local storage
- All processing happens in your browser

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

### Areas for Contribution

- Additional passport standards
- UI/UX improvements
- Performance optimizations
- Bug fixes
- Documentation improvements

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- **MediaPipe** by Google for the selfie segmentation model
- **Passport photo standards** from various government sources

## Future Enhancements

Planned features for future versions:

- File upload alternative (for existing photos)
- Print layout generator (multiple photos per sheet)
- Manual background refinement tools
- Advanced editing (brightness, contrast)
- Compliance checking (photo validation)
- Multi-language support
- PWA capabilities for offline use

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting guide above

## Version History

- **v1.0.0** (2026-02-16): Initial release
  - Webcam capture
  - Background removal
  - Multiple passport standards
  - Download functionality

---

**Note**: This tool generates passport-style photos, but final acceptance depends on the specific requirements of the issuing authority. Always check official guidelines before submitting photos for official documents.
