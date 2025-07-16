import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ locals }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		return error(401, 'Unauthorized');
	}

	try {
		// Import modules
		const QRCode = await import('qrcode');
		
		const STICKER_URL = 'https://zaur.app/auth/register?ref=sticker';
		
		// Generate QR code
		const qrSvg = await QRCode.toString(STICKER_URL, {
			type: 'svg',
			width: 120,
			margin: 1,
			color: {
				dark: '#1f2937',
				light: '#ffffff'
			},
			errorCorrectionLevel: 'M'
		});
		
		const qrCodeBase64 = Buffer.from(qrSvg).toString('base64');
		const qrCodeDataUri = `data:image/svg+xml;base64,${qrCodeBase64}`;

		// Create HTML content for PDF generation
		const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zaur Promotional Stickers - Clean Design</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
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
            padding: 15mm;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(3, 1fr);
            gap: 12mm;
            place-items: center;
        }
        
        .sticker {
            width: 80mm;
            height: 80mm;
            background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
            border-radius: 12mm;
            border: 2px solid #e5e7eb;
            padding: 8mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            box-shadow: 0 2mm 4mm rgba(0, 0, 0, 0.1);
        }
        
        .sticker-header {
            text-align: center;
            margin-bottom: 6mm;
        }
        
        .brand-name {
            font-size: 20pt;
            font-weight: 800;
            color: #1f2937;
            margin-bottom: 2mm;
            letter-spacing: -0.5pt;
        }
        
        .tagline {
            font-size: 9pt;
            font-weight: 500;
            color: #6b7280;
        }
        
        .qr-section {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 6mm;
        }
        
        .qr-code {
            width: 25mm;
            height: 25mm;
            background: #ffffff;
            border: 2px solid #e5e7eb;
            border-radius: 3mm;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        
        .qr-code img {
            width: 95%;
            height: 95%;
            object-fit: contain;
        }
        
        .value-prop {
            font-size: 11pt;
            font-weight: 700;
            color: #f97316;
            text-align: center;
            margin-bottom: 6mm;
        }
        
        .website {
            text-align: center;
        }
        
        .website-url {
            font-size: 12pt;
            font-weight: 700;
            color: #1f2937;
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
            background: rgba(255, 255, 255, 0.95);
            border-color: rgba(255, 255, 255, 0.3);
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Clean White Version -->
        <div class="sticker">
            <div class="sticker-header">
                <div class="brand-name">ZAUR</div>
                <div class="tagline">Tour Guide Platform</div>
            </div>
            
            <div class="qr-section">
                <div class="qr-code">
                    <img src="${qrCodeDataUri}" alt="QR Code for zaur.app" />
                </div>
            </div>
            
            <div class="value-prop">Zero Commission</div>
            
            <div class="website">
                <div class="website-url">zaur.app</div>
            </div>
        </div>
        
        <!-- Clean Orange Version -->
        <div class="sticker sticker-alt">
            <div class="sticker-header">
                <div class="brand-name">ZAUR</div>
                <div class="tagline">QR Bookings</div>
            </div>
            
            <div class="qr-section">
                <div class="qr-code">
                    <img src="${qrCodeDataUri}" alt="QR Code for zaur.app" />
                </div>
            </div>
            
            <div class="value-prop">Keep 100% Revenue</div>
            
            <div class="website">
                <div class="website-url">zaur.app</div>
            </div>
        </div>
        
        <!-- Repeat patterns for 6 stickers total -->
        <div class="sticker">
            <div class="sticker-header">
                <div class="brand-name">ZAUR</div>
                <div class="tagline">Tour Guide Platform</div>
            </div>
            <div class="qr-section">
                <div class="qr-code"><img src="${qrCodeDataUri}" alt="QR Code for zaur.app" /></div>
            </div>
            <div class="value-prop">Zero Commission</div>
            <div class="website">
                <div class="website-url">zaur.app</div>
            </div>
        </div>
        
        <div class="sticker sticker-alt">
            <div class="sticker-header">
                <div class="brand-name">ZAUR</div>
                <div class="tagline">QR Bookings</div>
            </div>
            <div class="qr-section">
                <div class="qr-code"><img src="${qrCodeDataUri}" alt="QR Code for zaur.app" /></div>
            </div>
            <div class="value-prop">Keep 100% Revenue</div>
            <div class="website">
                <div class="website-url">zaur.app</div>
            </div>
        </div>
        
        <div class="sticker">
            <div class="sticker-header">
                <div class="brand-name">ZAUR</div>
                <div class="tagline">Tour Guide Platform</div>
            </div>
            <div class="qr-section">
                <div class="qr-code"><img src="${qrCodeDataUri}" alt="QR Code for zaur.app" /></div>
            </div>
            <div class="value-prop">Zero Commission</div>
            <div class="website">
                <div class="website-url">zaur.app</div>
            </div>
        </div>
        
        <div class="sticker sticker-alt">
            <div class="sticker-header">
                <div class="brand-name">ZAUR</div>
                <div class="tagline">QR Bookings</div>
            </div>
            <div class="qr-section">
                <div class="qr-code"><img src="${qrCodeDataUri}" alt="QR Code for zaur.app" /></div>
            </div>
            <div class="value-prop">Keep 100% Revenue</div>
            <div class="website">
                <div class="website-url">zaur.app</div>
            </div>
        </div>
    </div>
</body>
</html>`;

		// Try Puppeteer first, fallback to html-pdf-node if it fails
		try {
			const puppeteer = await import('puppeteer');
			
			// Launch Puppeteer and generate PDF
			const browser = await puppeteer.launch({
				headless: true,
				args: [
					'--no-sandbox',
					'--disable-setuid-sandbox',
					'--disable-dev-shm-usage',
					'--disable-accelerated-2d-canvas',
					'--no-first-run',
					'--no-zygote',
					'--single-process',
					'--disable-gpu'
				]
			});

			const page = await browser.newPage();
			
			// Set page content
			await page.setContent(htmlContent, {
				waitUntil: 'networkidle0'
			});

			// Generate PDF
			const pdfBuffer = await page.pdf({
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

			// Return PDF with proper headers
			return new Response(pdfBuffer, {
				headers: {
					'Content-Type': 'application/pdf',
					'Content-Disposition': 'attachment; filename="zaur-promotional-stickers.pdf"',
					'Content-Length': pdfBuffer.length.toString()
				}
			});

		} catch (puppeteerError) {
			console.warn('Puppeteer failed, trying fallback method:', puppeteerError);
			
			// Fallback to html-pdf-node
			try {
				const htmlPdf = await import('html-pdf-node');
				
				const options = { 
					format: 'A4',
					margin: {
						top: '20mm',
						right: '20mm',
						bottom: '20mm',
						left: '20mm'
					},
					printBackground: true
				};
				
				const file = { content: htmlContent };
				const pdfBuffer = await htmlPdf.generatePdf(file, options);
				
				return new Response(pdfBuffer, {
					headers: {
						'Content-Type': 'application/pdf',
						'Content-Disposition': 'attachment; filename="zaur-promotional-stickers.pdf"',
						'Content-Length': pdfBuffer.length.toString()
					}
				});
				
			} catch (fallbackError) {
				console.error('Both PDF generation methods failed:', fallbackError);
				
				// Final fallback - return HTML for browser printing
				return new Response(htmlContent, {
					headers: {
						'Content-Type': 'text/html',
						'X-PDF-Fallback': 'true'
					}
				});
			}
		}

	} catch (err) {
		console.error('Error generating sticker PDF:', err);
		return error(500, 'Failed to generate sticker PDF');
	}
}; 