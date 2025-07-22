import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getBrowser } from '$lib/utils/puppeteer-helper.js';
import { formatCurrency } from '$lib/utils/currency.js';

type Platform = 'instagram-post' | 'instagram-story' | 'facebook' | 'twitter' | 'linkedin';
type Template = 'tour-promo' | 'profile-intro' | 'schedule' | 'testimonial';
type ColorTheme = 'brand' | 'vibrant' | 'minimal' | 'dark';

const platformDimensions = {
	'instagram-post': { width: 1080, height: 1080 },
	'instagram-story': { width: 1080, height: 1920 },
	'facebook': { width: 1200, height: 630 },
	'twitter': { width: 1200, height: 675 },
	'linkedin': { width: 1200, height: 627 }
};

const colorThemes = {
	brand: {
		background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
		text: '#ffffff',
		accent: '#fed7aa'
	},
	vibrant: {
		background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
		text: '#ffffff',
		accent: '#fde68a'
	},
	minimal: {
		background: '#ffffff',
		text: '#1f2937',
		accent: '#f97316'
	},
	dark: {
		background: '#111827',
		text: '#ffffff',
		accent: '#f97316'
	}
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return error(401, 'Unauthorized');
	}

	try {
		const { 
			platform, 
			template, 
			tourId, 
			tour, 
			profile, 
			text,
			includeQR,
			color
		}: {
			platform: Platform;
			template: Template;
			tourId?: string;
			tour?: any;
			profile: any;
			text: string;
			includeQR: boolean;
			color: ColorTheme;
		} = await request.json();
		
		const dimensions = platformDimensions[platform];
		const theme = colorThemes[color];
		
		// Generate QR code if needed
		let qrCodeDataUri = '';
		if (includeQR) {
			const QRCode = await import('qrcode');
			const profileURL = `https://zaur.app/${profile.username}`;
			
			const qrSvg = await QRCode.toString(profileURL, {
				type: 'svg',
				width: 200,
				margin: 1,
				color: {
					dark: color === 'minimal' ? '#1f2937' : '#ffffff',
					light: '#ffffff'
				},
				errorCorrectionLevel: 'M'
			});
			
			const qrCodeBase64 = Buffer.from(qrSvg).toString('base64');
			qrCodeDataUri = `data:image/svg+xml;base64,${qrCodeBase64}`;
		}

		// Format text with line breaks
		const formattedText = text.split('\n').map(line => 
			`<div>${line.replace(/([🌟🗺️📅⭐]+)/g, '<span class="emoji">$1</span>')}</div>`
		).join('');

		// Create HTML content
		const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
        }
        
        .container {
            width: ${dimensions.width}px;
            height: ${dimensions.height}px;
            background: ${theme.background};
            color: ${theme.text};
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: ${platform === 'instagram-story' ? '80px 40px' : '60px'};
            position: relative;
            overflow: hidden;
        }
        
        .container.minimal {
            border: 20px solid #f3f4f6;
        }
        
        .content {
            text-align: center;
            z-index: 2;
            max-width: ${platform === 'instagram-story' ? '100%' : '80%'};
        }
        
        .business-name {
            font-size: ${platform === 'instagram-story' ? '36px' : '48px'};
            font-weight: 800;
            margin-bottom: 20px;
            line-height: 1.2;
        }
        
        .text {
            font-size: ${platform === 'instagram-story' ? '28px' : '32px'};
            font-weight: 600;
            line-height: 1.5;
            margin-bottom: 40px;
        }
        
        .text .emoji {
            font-size: 1.2em;
        }
        
        .tour-details {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 30px;
            border-radius: 20px;
            margin: 30px 0;
        }
        
        .tour-details.minimal {
            background: #f9fafb;
            border: 2px solid #e5e7eb;
        }
        
        .tour-name {
            font-size: 36px;
            font-weight: 800;
            margin-bottom: 10px;
        }
        
        .tour-price {
            font-size: 28px;
            font-weight: 600;
            color: ${theme.accent};
        }
        
        .qr-wrapper {
            position: absolute;
            bottom: 40px;
            right: 40px;
            width: 120px;
            height: 120px;
            background: white;
            border-radius: 12px;
            padding: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        
        .qr-wrapper.story {
            bottom: 80px;
            right: 50%;
            transform: translateX(50%);
        }
        
        .qr-wrapper img {
            width: 100%;
            height: 100%;
        }
        
        .watermark {
            position: absolute;
            bottom: 40px;
            left: 40px;
            font-size: 18px;
            font-weight: 600;
            opacity: 0.8;
        }
        
        .watermark.story {
            left: 50%;
            transform: translateX(-50%);
            bottom: 40px;
        }
        
        /* Decorative elements */
        .decoration {
            position: absolute;
            border-radius: 50%;
            opacity: 0.1;
        }
        
        .decoration-1 {
            width: 300px;
            height: 300px;
            background: ${theme.accent};
            top: -150px;
            right: -150px;
        }
        
        .decoration-2 {
            width: 200px;
            height: 200px;
            background: ${theme.accent};
            bottom: -100px;
            left: -100px;
        }
    </style>
</head>
<body>
    <div class="container ${color === 'minimal' ? 'minimal' : ''}">
        <div class="decoration decoration-1"></div>
        <div class="decoration decoration-2"></div>
        
        <div class="content">
            <div class="business-name">${profile.businessName || profile.name}</div>
            
            ${template === 'tour-promo' && tour ? `
                <div class="tour-details ${color === 'minimal' ? 'minimal' : ''}">
                    <div class="tour-name">${tour.name}</div>
                    <div class="tour-price">${formatCurrency(tour.price, tour.currency || 'EUR')}</div>
                </div>
            ` : ''}
            
            <div class="text">${formattedText}</div>
        </div>
        
        ${includeQR ? `
            <div class="qr-wrapper ${platform === 'instagram-story' ? 'story' : ''}">
                <img src="${qrCodeDataUri}" alt="QR Code" />
            </div>
        ` : ''}
        
        <div class="watermark ${platform === 'instagram-story' ? 'story' : ''}">
            zaur.app/${profile.username}
        </div>
    </div>
</body>
</html>`;

		// Get shared browser instance
		const browser = await getBrowser();
		let page = null;

		try {
			page = await browser.newPage();
			
			// Set viewport to exact dimensions
			await page.setViewport({
				width: dimensions.width,
				height: dimensions.height,
				deviceScaleFactor: 1
			});
			
			// Set the HTML content
			await page.setContent(htmlContent, {
				waitUntil: 'networkidle2',
				timeout: 20000
			});

			// Wait for fonts to load
			await page.evaluateHandle('document.fonts.ready');

			// Take screenshot
			const screenshot = await page.screenshot({
				type: 'png',
				fullPage: false
			});

			// Close page but keep browser open for reuse
			await page.close();

			// Return PNG as response
			return new Response(screenshot, {
				headers: {
					'Content-Type': 'image/png',
					'Content-Disposition': `attachment; filename="${profile.username}-${platform}-${template}-${new Date().toISOString().split('T')[0]}.png"`
				}
			});

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

	} catch (err) {
		console.error('Error generating social media graphic:', err);
		
		// Provide more specific error messages
		if (err instanceof Error && err.message.includes('timeout')) {
			return error(503, 'Image generation timed out. Please try again.');
		} else if (err instanceof Error && err.message.includes('Target closed')) {
			return error(503, 'Image generation service is temporarily unavailable. Please try again later.');
		}
		
		return error(500, 'Failed to generate social media graphic');
	}
}; 