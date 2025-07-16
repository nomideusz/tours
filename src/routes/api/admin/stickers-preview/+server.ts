import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		return error(401, 'Unauthorized');
	}

	try {
		// Import QRCode dynamically
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

		const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zaur Promotional Stickers - Preview</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', sans-serif;
            background: #f5f5f5;
            padding: 20px;
            line-height: 1;
        }
        
        .preview-header {
            text-align: center;
            margin-bottom: 30px;
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .preview-header h1 {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 8px;
        }
        
        .preview-header p {
            color: #6b7280;
            font-size: 14px;
        }
        
        .page {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(3, 1fr);
            gap: 20px;
        }
        
        .sticker {
            width: 100%;
            max-width: 280px;
            height: 280px;
            background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
            border-radius: 20px;
            border: 2px solid #e5e7eb;
            padding: 20px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin: 0 auto;
        }
        
        .sticker-header { text-align: center; margin-bottom: 24px; }
        .brand-name { font-size: 32px; font-weight: 800; color: #1f2937; margin-bottom: 6px; letter-spacing: -0.5px; }
        .tagline { font-size: 13px; font-weight: 500; color: #6b7280; }
        .qr-section { display: flex; justify-content: center; align-items: center; margin-bottom: 24px; }
        .qr-code { width: 100px; height: 100px; background: #ffffff; border: 2px solid #e5e7eb; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .qr-code img { width: 95%; height: 95%; object-fit: contain; }
        .value-prop { font-size: 18px; font-weight: 700; color: #f97316; text-align: center; margin-bottom: 24px; }
        .website { text-align: center; }
        .website-url { font-size: 20px; font-weight: 700; color: #1f2937; }
        
        .sticker-alt { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; }
        .sticker-alt .brand-name { color: white; }
        .sticker-alt .tagline { color: rgba(255, 255, 255, 0.9); }
        .sticker-alt .value-prop { color: white; }
        .sticker-alt .website-url { color: white; }
        .sticker-alt .qr-code { background: rgba(255, 255, 255, 0.95); border-color: rgba(255, 255, 255, 0.3); }
        
        .print-note {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            background: #f3f4f6;
            border-radius: 8px;
            color: #374151;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="preview-header">
        <h1>Zaur Promotional Stickers - Clean Design</h1>
        <p>Minimal design with brand, QR code, key benefit, and website URL</p>
    </div>
    
    <div class="page">
        <div class="sticker">
            <div class="sticker-header">
                <div class="brand-name">ZAUR</div>
                <div class="tagline">Tour Guide Platform</div>
            </div>
            <div class="qr-section">
                <div class="qr-code"><img src="${qrCodeDataUri}" alt="QR Code" /></div>
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
                <div class="qr-code"><img src="${qrCodeDataUri}" alt="QR Code" /></div>
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
                <div class="qr-code"><img src="${qrCodeDataUri}" alt="QR Code" /></div>
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
                <div class="qr-code"><img src="${qrCodeDataUri}" alt="QR Code" /></div>
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
                <div class="qr-code"><img src="${qrCodeDataUri}" alt="QR Code" /></div>
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
                <div class="qr-code"><img src="${qrCodeDataUri}" alt="QR Code" /></div>
            </div>
            <div class="value-prop">Keep 100% Revenue</div>
            <div class="website">
                <div class="website-url">zaur.app</div>
            </div>
        </div>
    </div>
    
    <div class="print-note">
        <strong>Print Instructions:</strong> Use 300 DPI, adhesive sticker paper, enable background graphics. 
        Each sticker is 85mm × 85mm (3.3" × 3.3"). Print 6 stickers per A4 page.
    </div>
</body>
</html>`;

		return new Response(htmlContent, {
			headers: {
				'Content-Type': 'text/html'
			}
		});

	} catch (err) {
		console.error('Error generating sticker preview:', err);
		return error(500, 'Failed to generate sticker preview');
	}
}; 