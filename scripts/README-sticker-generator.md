# Zaur Promotional Sticker Generator

This script generates professional promotional stickers for Zaur with QR codes and key messaging, ready for printing.

## Features

- **Two Design Variants**: Clean white and vibrant orange versions
- **Real QR Codes**: Generated dynamically pointing to `https://zaur.app/auth/register?ref=sticker`
- **Print-Ready PDF**: A4 format with 6 stickers per page (85mm x 85mm each)
- **Professional Design**: Clean, minimal styling following Zaur's brand guidelines
- **Key Messaging**: Zero commission, tour discovery, and promotional codes

## Quick Start

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Generate Stickers**:
   ```bash
   pnpm run generate:stickers
   ```

3. **Output Files**:
   - `zaur-stickers.html` - Preview file you can open in browser
   - `zaur-promotional-stickers.pdf` - Print-ready PDF file

## Design Specifications

### Sticker Dimensions
- **Size**: 85mm x 85mm (3.3" x 3.3")
- **Format**: 6 stickers per A4 page
- **Print Resolution**: Optimized for 300 DPI printing

### Design Elements

#### White Version (Clean & Professional)
- **Background**: Subtle white gradient with light texture
- **Text Colors**: Dark gray (#1f2937) for headlines, medium gray (#6b7280) for features
- **Accent Color**: Orange (#f97316) for value proposition
- **Border**: Light gray with rounded corners

#### Orange Version (Bold & Eye-catching)
- **Background**: Orange gradient (#f97316 to #ea580c)
- **Text Colors**: White with good contrast
- **Features**: Semi-transparent white text
- **Border**: Rounded corners with subtle shadow

### Content Strategy

#### Key Messages
1. **Zero Commission** - Primary value proposition
2. **Keep 100% Revenue** - Financial benefit
3. **5-minute setup** - Ease of use
4. **Instant bookings** - Speed benefit
5. **Tour discovery** - Platform advantage
6. **Promo codes** - Call to action incentive

#### QR Code
- **Target URL**: `https://zaur.app/auth/register?ref=sticker`
- **Tracking**: Includes `ref=sticker` parameter for analytics
- **Error Correction**: Medium level for reliable scanning
- **Size**: 25mm x 25mm for optimal scanning

## Printing Instructions

### Recommended Setup
- **Paper**: Adhesive sticker paper (weatherproof for outdoor use)
- **Printer**: Inkjet or laser printer capable of 300 DPI
- **Settings**: Print at actual size, enable "Print backgrounds"

### Quality Tips
1. **Use high-quality sticker paper** for durability
2. **Test print one page first** to check colors and sizing
3. **Enable print backgrounds** in browser print settings
4. **Print at 300 DPI** for crisp QR codes
5. **Consider lamination** for outdoor/weather resistance

### Cutting
- Each sticker is designed with rounded corners
- Leave 2-3mm margin around each sticker when cutting
- Use a craft knife and ruler for clean edges

## Customization

### Changing the QR Code URL
Edit the `STICKER_URL` constant in `scripts/generate-sticker-pdf.js`:
```javascript
const STICKER_URL = 'https://zaur.app/auth/register?ref=sticker';
```

### Modifying Design
The HTML template in `createStickerHTML()` function can be customized:
- **Colors**: Update CSS color values
- **Text**: Modify content within HTML elements
- **Layout**: Adjust CSS grid and flexbox properties
- **Fonts**: Change font family or weights

### Adding More Variants
To add additional design variants:
1. Create new CSS classes in the style section
2. Add new sticker divs in the HTML template
3. Adjust the grid layout if needed

## Marketing Usage

### Target Audience
- **Tour guides** looking for booking solutions
- **Travel industry professionals** at conferences
- **Tourism boards** and travel agencies
- **Hospitality venues** that work with tour guides

### Distribution Ideas
1. **Tourism conferences** and trade shows
2. **Travel blogger meetups** and networking events
3. **Tour guide associations** and professional groups
4. **Partner hotels** and tourist information centers
5. **Coworking spaces** in tourist areas
6. **Travel accessories** and gear shops

### Tracking Results
- Monitor registrations with `ref=sticker` parameter
- Track QR code scans if using analytics tools
- A/B test different QR code destinations
- Measure conversion from sticker scans to signups

## Technical Notes

### Dependencies
- **qrcode**: QR code generation
- **puppeteer**: PDF generation from HTML
- **Node.js**: Runtime environment

### Browser Compatibility
The generated HTML uses modern CSS features:
- CSS Grid for layout
- CSS Variables for theming
- Flexbox for alignment
- Print media queries

### File Sizes
- **HTML file**: ~15-20KB with embedded QR code
- **PDF file**: ~50-100KB depending on QR code complexity
- **QR codes**: SVG format for crisp printing at any size

## Troubleshooting

### Common Issues

**QR Code not generating**:
- Check internet connection (for fonts)
- Verify Node.js version (16+ recommended)
- Install dependencies with `pnpm install`

**PDF generation fails**:
- Ensure Puppeteer is properly installed
- Check file permissions in output directory
- Try running with `--no-sandbox` flag

**Print quality issues**:
- Verify 300 DPI print setting
- Enable background graphics in print dialog
- Use high-quality sticker paper
- Check printer ink/toner levels

**QR codes not scanning**:
- Increase QR code size if too small
- Ensure good contrast between code and background
- Test with multiple QR scanner apps
- Check URL is accessible

### Support
For technical issues with the sticker generator, check the main Zaur documentation or create an issue in the project repository. 