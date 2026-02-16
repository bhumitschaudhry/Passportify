# Quick Start Guide

## Running the Application

### Option 1: Open Directly in Browser

Simply double-click `index.html` to open it in your default browser.

**Note**: Some browsers may restrict camera access when opening HTML files directly. If camera doesn't work, use Option 2 or 3.

### Option 2: Local Server (Recommended)

#### Using Python
```bash
# Open terminal/command prompt in the project directory
python -m http.server 8000

# Then open: http://localhost:8000
```

#### Using Node.js
```bash
# Install http-server globally (one-time)
npm install -g http-server

# Run server
http-server

# Or run once without installing
npx http-server
```

#### Using PHP
```bash
php -S localhost:8000
```

### Option 3: Deploy to GitHub Pages

1. Create a GitHub repository
2. Upload all files to the repository
3. Go to Settings > Pages
4. Source: Deploy from a branch
5. Branch: main (or master), root directory
6. Save and wait for deployment
7. Access at `https://yourusername.github.io/repository-name`

## Using the Application

### Step 1: Camera Capture
1. Allow camera permissions when prompted
2. Position yourself in good lighting
3. Keep a neutral expression
4. Click "Capture Photo"

### Step 2: Review
- Check if photo is clear and well-lit
- Click "Use This Photo" or "Retake"

### Step 3: Background Removal
- Wait for AI processing (2-5 seconds)
- Select background color:
  - White (most common)
  - Gray, Blue, Pink (presets)
  - Custom color picker
- Click "Next: Size & Crop"

### Step 4: Size & Crop
- Select your country/standard from dropdown
- Adjust position using sliders:
  - Scale: Zoom in/out
  - Horizontal: Move left/right
  - Vertical: Move up/down
- Follow the crop guide for proper head positioning
- Click "Next: Download"

### Step 5: Download
- Review your final passport photo
- Check specifications (size, dimensions, background)
- Download as JPEG (recommended) or PNG
- Click "Start Over" to create another photo

## Tips for Best Results

### Lighting
- Use even, frontal lighting
- Avoid harsh shadows on face
- Natural light near a window works well
- Avoid backlighting (window behind you)

### Positioning
- Stand about 1-2 meters from camera
- Face forward, look straight at camera
- Neutral expression, mouth closed
- Both eyes clearly visible
- Hair not covering face

### Background
- Plain, contrasting background works best
- Stand away from walls (reduce shadows)
- Avoid busy patterns
- Solid color wall is ideal

### After Processing
- Check edges for clean background removal
- Retake if segmentation is poor
- Adjust crop to center face properly
- Ensure head occupies 50-70% of frame height

## Troubleshooting

### Camera Not Working
- **Permission denied**: Check browser settings, allow camera access
- **Already in use**: Close other apps using camera (Zoom, Teams, etc.)
- **Not found**: Ensure camera is connected and working

### Background Removal Issues
- **Poor quality**: Improve lighting, retake photo
- **Slow processing**: Close other tabs, use modern browser
- **Edges not clean**: Stand further from background, retake photo

### Download Issues
- **File not downloading**: Check browser download settings
- **File too small**: Ensure you selected JPEG format
- **Wrong size**: Verify correct country standard selected

## Browser Requirements

- **Chrome/Edge**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **JavaScript**: Must be enabled
- **Camera**: Required for capture feature
- **HTTPS**: Required for camera (automatic on GitHub Pages)

## Common Use Cases

### US Passport Photo
- Select "United States" from dropdown
- White background recommended
- 2x2 inches (51x51 mm)
- Head height: 25-35 mm

### EU/UK Passport Photo
- Select "European Union" or "United Kingdom"
- Light gray or white background
- 35x45 mm
- Face must occupy 70-80% of frame

### Other Countries
- Select your country from dropdown
- Check specific requirements for background color
- Adjust crop according to guidelines

## File Information

- **JPEG Output**: ~100-300KB, 300 DPI, print quality
- **PNG Output**: Lossless, larger file size
- **Filename**: `passport-photo-YYYY-MM-DD.jpg`
- **Color Space**: sRGB (standard for web and print)

## Privacy & Security

- ✓ Photos never leave your device
- ✓ No data uploaded to servers
- ✓ No tracking or analytics
- ✓ No cookies or storage
- ✓ Works offline after first load

## Getting Help

1. Check the main README.md for detailed documentation
2. Review troubleshooting section above
3. Open an issue on GitHub for bugs
4. Check browser console for error messages

---

**Ready to start? Open index.html in your browser and create your first passport photo!**
