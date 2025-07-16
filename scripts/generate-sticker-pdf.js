import QRCode from 'qrcode';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

const STICKER_URL = 'https://zaur.app/auth/register?ref=sticker';
const DISCOVERY_URL = 'https://zaur.app/explore';

async function generateQRCodeSVG(url, size = 120) {
    try {
        const qrSvg = await QRCode.toString(url, {
            type: 'svg',
            width: size,
            margin: 1,
            color: {
                dark: '#1f2937',
                light: '#ffffff'
            },
            errorCorrectionLevel: 'M'
        });
        return qrSvg;
    } catch (error) {
        console.error('Error generating QR code:', error);
        return null;
    }
}

async function createStickerHTML() {
    const qrCodeSvg = await generateQRCodeSVG(STICKER_URL);
    const qrCodeBase64 = Buffer.from(qrCodeSvg).toString('base64');
    const qrCodeDataUri = `data:image/svg+xml;base64,${qrCodeBase64}`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zaur Promotional Stickers</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        @page {
            size: A4;
            margin: 20mm;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            background: white;
            line-height: 1;
        }
        
        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(3, 1fr);
            gap: 15mm;
            page-break-after: always;
        }
        
        .sticker {
            width: 85mm;
            height: 85mm;
            background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
            border-radius: 15mm;
            border: 2px solid #e5e7eb;
            padding: 8mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            box-shadow: 0 2mm 4mm rgba(0, 0, 0, 0.1);
        }
        
        .sticker::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: repeating-linear-gradient(
                45deg,
                transparent,
                transparent 8mm,
                rgba(0, 0, 0, 0.01) 8mm,
                rgba(0, 0, 0, 0.01) 8.2mm
            );
            border-radius: 13mm;
            pointer-events: none;
        }
        
        .sticker-header {
            text-align: center;
            position: relative;
            z-index: 2;
        }
        
        .brand-name {
            font-size: 22pt;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 2mm;
            letter-spacing: -0.3pt;
        }
        
        .tagline {
            font-size: 9pt;
            font-weight: 500;
            color: #6b7280;
            margin-bottom: 4mm;
        }
        
        .value-prop {
            font-size: 12pt;
            font-weight: 600;
            color: #f97316;
            text-align: center;
            margin-bottom: 4mm;
            line-height: 1.3;
        }
        
        .qr-section {
            display: flex;
            justify-content: center;
            align-items: center;
            flex: 1;
            position: relative;
            z-index: 2;
        }
        
        .qr-code {
            width: 25mm;
            height: 25mm;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 3mm;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        
        .qr-code img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .website {
            text-align: center;
            position: relative;
            z-index: 2;
        }
        
        .website-url {
            font-size: 12pt;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 2mm;
        }
        
        .promo-code {
            background: #f97316;
            color: white;
            padding: 1.5mm 3mm;
            border-radius: 2mm;
            font-size: 9pt;
            font-weight: 600;
            display: inline-block;
        }
        
        .features {
            font-size: 8pt;
            color: #6b7280;
            text-align: center;
            margin-bottom: 3mm;
            line-height: 1.3;
        }
        
        .sticker-alt {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
        }
        
        .sticker-alt .brand-name {
            color: white;
        }
        
        .sticker-alt .tagline {
            color: rgba(255, 255, 255, 0.9);
        }
        
        .sticker-alt .value-prop {
            color: white;
        }
        
        .sticker-alt .website-url {
            color: white;
        }
        
        .sticker-alt .qr-code {
            background: white;
            border-color: rgba(255, 255, 255, 0.3);
        }
        
        .sticker-alt .promo-code {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .sticker-alt .features {
            color: rgba(255, 255, 255, 0.9);
        }
        
        .print-info {
            position: fixed;
            bottom: 10mm;
            left: 50%;
            transform: translateX(-50%);
            font-size: 8pt;
            color: #6b7280;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- White version stickers -->
        <div class="sticker">
            <div class="sticker-header">
                <div class="brand-name">ZAUR</div>
                <div class="tagline">QR Bookings for Tour Guides</div>
            </div>
            
            <div class="value-prop">
                Zero Commission<br>
                Keep 100% Revenue
            </div>
            
            <div class="features">
                • 5-minute setup<br>
                • Instant bookings<br>
                • Tour discovery
            </div>
            
            <div class="qr-section">
                <div class="qr-code">
                    <img src="${qrCodeDataUri}" alt="QR Code for zaur.app" />
                </div>
            </div>
            
            <div class="website">
                <div class="website-url">zaur.app</div>
                <div class="promo-code">EARLY2025</div>
            </div>
        </div>
        
        <!-- Orange version sticker -->
        <div class="sticker sticker-alt">
            <div class="sticker-header">
                <div class="brand-name">ZAUR</div>
                <div class="tagline">QR Bookings + Discovery</div>
            </div>
            
            <div class="value-prop">
                Professional Booking<br>
                For Tour Guides
            </div>
            
            <div class="features">
                • No commissions<br>
                • Secure payments<br>
                • 40+ countries
            </div>
            
            <div class="qr-section">
                <div class="qr-code">
                    <img src="${qrCodeDataUri}" alt="QR Code for zaur.app" />
                </div>
            </div>
            
            <div class="website">
                <div class="website-url">zaur.app</div>
                <div class="promo-code">50% OFF LIFETIME</div>
            </div>
        </div>
        
        <!-- Repeat white version -->
        <div class="sticker">
            <div class="sticker-header">
                <div class="brand-name">ZAUR</div>
                <div class="tagline">QR Bookings for Tour Guides</div>
            </div>
            
            <div class="value-prop">
                Zero Commission<br>
                Keep 100% Revenue
            </div>
            
            <div class="features">
                • 5-minute setup<br>
                • Instant bookings<br>
                • Tour discovery
            </div>
            
            <div class="qr-section">
                <div class="qr-code">
                    <img src="${qrCodeDataUri}" alt="QR Code for zaur.app" />
                </div>
            </div>
            
            <div class="website">
                <div class="website-url">zaur.app</div>
                <div class="promo-code">EARLY2025</div>
            </div>
        </div>
        
        <!-- Repeat orange version -->
        <div class="sticker sticker-alt">
            <div class="sticker-header">
                <div class="brand-name">ZAUR</div>
                <div class="tagline">QR Bookings + Discovery</div>
            </div>
            
            <div class="value-prop">
                Professional Booking<br>
                For Tour Guides
            </div>
            
            <div class="features">
                • No commissions<br>
                • Secure payments<br>
                • 40+ countries
            </div>
            
            <div class="qr-section">
                <div class="qr-code">
                    <img src="${qrCodeDataUri}" alt="QR Code for zaur.app" />
                </div>
            </div>
            
            <div class="website">
                <div class="website-url">zaur.app</div>
                <div class="promo-code">50% OFF LIFETIME</div>
            </div>
        </div>
        
        <!-- Repeat white version -->
        <div class="sticker">
            <div class="sticker-header">
                <div class="brand-name">ZAUR</div>
                <div class="tagline">QR Bookings for Tour Guides</div>
            </div>
            
            <div class="value-prop">
                Zero Commission<br>
                Keep 100% Revenue
            </div>
            
            <div class="features">
                • 5-minute setup<br>
                • Instant bookings<br>
                • Tour discovery
            </div>
            
            <div class="qr-section">
                <div class="qr-code">
                    <img src="${qrCodeDataUri}" alt="QR Code for zaur.app" />
                </div>
            </div>
            
            <div class="website">
                <div class="website-url">zaur.app</div>
                <div class="promo-code">EARLY2025</div>
            </div>
        </div>
        
        <!-- Repeat orange version -->
        <div class="sticker sticker-alt">
            <div class="sticker-header">
                <div class="brand-name">ZAUR</div>
                <div class="tagline">QR Bookings + Discovery</div>
            </div>
            
            <div class="value-prop">
                Professional Booking<br>
                For Tour Guides
            </div>
            
            <div class="features">
                • No commissions<br>
                • Secure payments<br>
                • 40+ countries
            </div>
            
            <div class="qr-section">
                <div class="qr-code">
                    <img src="${qrCodeDataUri}" alt="QR Code for zaur.app" />
                </div>
            </div>
            
            <div class="website">
                <div class="website-url">zaur.app</div>
                <div class="promo-code">50% OFF LIFETIME</div>
            </div>
        </div>
    </div>
    
    <div class="print-info">
        Zaur Promotional Stickers - Print at 300 DPI on adhesive paper
    </div>
</body>
</html>`;
}

async function generatePDF() {
    console.log('🎯 Generating Zaur promotional stickers...');
    
    try {
        console.log('📱 Generating QR code...');
        const htmlContent = await createStickerHTML();
        
        console.log('📄 Creating HTML file...');
        const htmlPath = path.join(process.cwd(), 'zaur-stickers.html');
        await fs.writeFile(htmlPath, htmlContent);
        
        console.log('🖨️ Generating PDF...');
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
        
        const pdfPath = path.join(process.cwd(), 'zaur-promotional-stickers.pdf');
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            },
            printBackground: true,
            preferCSSPageSize: true
        });
        
        await browser.close();
        
        console.log('✅ Success! Files generated:');
        console.log(`   📄 HTML: ${htmlPath}`);
        console.log(`   📎 PDF: ${pdfPath}`);
        console.log('');
        console.log('📋 Printing Instructions:');
        console.log('   • Print at 300 DPI for best quality');
        console.log('   • Use adhesive sticker paper');
        console.log('   • Each sticker is approximately 85mm x 85mm (3.3" x 3.3")');
        console.log('   • 6 stickers per A4 page');
        console.log('   • QR code links to: https://zaur.app/auth/register?ref=sticker');
        
    } catch (error) {
        console.error('❌ Error generating stickers:', error);
        process.exit(1);
    }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    generatePDF();
}

export { generatePDF, createStickerHTML }; 