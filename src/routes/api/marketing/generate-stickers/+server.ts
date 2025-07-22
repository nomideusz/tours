import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getBrowser } from '$lib/utils/puppeteer-helper.js';

type StickerDesign = 'professional' | 'colorful' | 'minimal';

export const POST: RequestHandler = async ({ locals, request }) => {
	// Check authentication
	if (!locals.user) {
		return error(401, 'Unauthorized');
	}

	let browser = null;
	let page = null;

	try {
		const { design, tagline, businessName, username }: {
			design: StickerDesign;
			tagline: string;
			businessName: string;
			username: string;
		} = await request.json();
		
		if (!username) {
			return error(400, 'Username is required');
		}
		
		// Import QRCode module
		const QRCode = await import('qrcode');
		
		const profileURL = `https://zaur.app/${username}?ref=sticker`;
		
		// Generate QR code
		const qrSvg = await QRCode.toString(profileURL, {
			type: 'svg',
			width: 120,
			margin: 1,
			color: {
				dark: '#1f2937', // Always use dark color for QR code
				light: '#ffffff'
			},
			errorCorrectionLevel: 'M'
		});
		
		const qrCodeBase64 = Buffer.from(qrSvg).toString('base64');
		const qrCodeDataUri = `data:image/svg+xml;base64,${qrCodeBase64}`;

		// Define styles for different designs
		const designStyles = {
			professional: {
				background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
				border: '2px solid #e5e7eb',
				nameColor: '#1f2937',
				taglineColor: '#6b7280',
				urlColor: '#f97316',
				qrBg: '#ffffff',
				qrBorder: '#e5e7eb'
			},
			colorful: {
				background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
				border: 'none',
				nameColor: '#ffffff',
				taglineColor: 'rgba(255, 255, 255, 0.9)',
				urlColor: '#ffffff',
				qrBg: 'rgba(255, 255, 255, 0.95)',
				qrBorder: 'rgba(255, 255, 255, 0.3)'
			},
			minimal: {
				background: '#ffffff',
				border: '2px solid #000000',
				nameColor: '#000000',
				taglineColor: '#666666',
				urlColor: '#000000',
				qrBg: '#f5f5f5',
				qrBorder: '#000000'
			}
		};
		
		const style = designStyles[design] || designStyles.professional;

		// Create HTML content
		const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${businessName} - Promotional Stickers</title>
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
            background: ${style.background};
            border-radius: 12mm;
            border: ${style.border};
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
        
        .business-name {
            font-size: 18pt;
            font-weight: 800;
            color: ${style.nameColor};
            margin-bottom: 2mm;
            letter-spacing: -0.5pt;
        }
        
        .tagline {
            font-size: 9pt;
            font-weight: 500;
            color: ${style.taglineColor};
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
            background: ${style.qrBg};
            border: 1px solid ${style.qrBorder};
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
        
        .website {
            text-align: center;
        }
        
        .website-url {
            font-size: 11pt;
            font-weight: 700;
            color: ${style.urlColor};
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Generate 6 stickers -->
        ${Array(6).fill(null).map(() => `
        <div class="sticker">
            <div class="sticker-header">
                <div class="business-name">${businessName}</div>
                <div class="tagline">${tagline}</div>
            </div>
            
            <div class="qr-section">
                <div class="qr-code">
                    <img src="${qrCodeDataUri}" alt="QR Code for ${username}" />
                </div>
            </div>
            
            <div class="website">
                <div class="website-url">zaur.app/${username}</div>
            </div>
        </div>
        `).join('')}
    </div>
</body>
</html>`;

		// Get shared browser instance
		browser = await getBrowser();
		page = await browser.newPage();
		
		// Set the HTML content
		await page.setContent(htmlContent, {
			waitUntil: 'networkidle2',
			timeout: 20000
		});

		// Wait for fonts to load
		await page.evaluateHandle('document.fonts.ready');

		// Generate PDF
		const pdfBuffer = await page.pdf({
			format: 'A4',
			printBackground: true,
			margin: {
				top: '20mm',
				right: '20mm',
				bottom: '20mm',
				left: '20mm'
			}
		});

		// Close page but keep browser open for reuse
		await page.close();

		// Return PDF as response
		return new Response(pdfBuffer, {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${username}-promotional-stickers-${new Date().toISOString().split('T')[0]}.pdf"`
			}
		});

	} catch (err) {
		console.error('Error generating personalized sticker PDF:', err);
		
		// Provide more specific error messages
		if (err instanceof Error && err.message.includes('timeout')) {
			return error(503, 'PDF generation timed out. Please try again.');
		} else if (err instanceof Error && err.message.includes('Target closed')) {
			return error(503, 'PDF generation service is temporarily unavailable. Please try again later.');
		}
		
		return error(500, 'Failed to generate sticker PDF');
	} finally {
		// Clean up page if it exists
		if (page && !page.isClosed()) {
			try {
				await page.close();
			} catch (e) {
				console.error('Error closing page:', e);
			}
		}
	}
}; 