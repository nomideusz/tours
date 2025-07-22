import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getBrowser } from '$lib/utils/puppeteer-helper.js';
import { formatCurrency } from '$lib/utils/currency.js';

type FlyerLayout = 'single' | 'multi' | 'list';
type FlyerStyle = 'modern' | 'classic' | 'bold';

export const POST: RequestHandler = async ({ locals, request }) => {
	// Check authentication
	if (!locals.user) {
		return error(401, 'Unauthorized');
	}

	try {
		const { 
			layout, 
			style, 
			tourId, 
			tours, 
			profile, 
			headline,
			includeContact,
			includeQR
		}: {
			layout: FlyerLayout;
			style: FlyerStyle;
			tourId?: string;
			tours: any[];
			profile: any;
			headline: string;
			includeContact: boolean;
			includeQR: boolean;
		} = await request.json();
		
		// Import QRCode module if needed
		let qrCodeDataUri = '';
		if (includeQR) {
			const QRCode = await import('qrcode');
			const profileURL = `https://zaur.app/${profile.username}`;
			
			const qrSvg = await QRCode.toString(profileURL, {
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
			qrCodeDataUri = `data:image/svg+xml;base64,${qrCodeBase64}`;
		}

		// Define styles
		const styles = {
			modern: {
				background: '#ffffff',
				headerBg: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
				headerColor: '#ffffff',
				textColor: '#1f2937',
				secondaryColor: '#6b7280',
				accentColor: '#f97316',
				borderStyle: 'none',
				boxShadow: '0 2mm 4mm rgba(0, 0, 0, 0.1)'
			},
			classic: {
				background: '#ffffff',
				headerBg: '#1f2937',
				headerColor: '#ffffff',
				textColor: '#1f2937',
				secondaryColor: '#6b7280',
				accentColor: '#3b82f6',
				borderStyle: '2px solid #e5e7eb',
				boxShadow: 'none'
			},
			bold: {
				background: '#ffffff',
				headerBg: '#f97316',
				headerColor: '#ffffff',
				textColor: '#1f2937',
				secondaryColor: '#6b7280',
				accentColor: '#f97316',
				borderStyle: 'none',
				boxShadow: '0 3mm 6mm rgba(249, 115, 22, 0.2)'
			}
		};
		
		const currentStyle = styles[style] || styles.modern;

		// Generate content based on layout
		let content = '';
		
		if (layout === 'single' && tourId) {
			const tour = tours.find(t => t.id === tourId);
			if (!tour) {
				return error(400, 'Tour not found');
			}
			
			content = `
				<div class="tour-single">
					<h2 class="tour-name">${tour.name}</h2>
					<p class="tour-description">${tour.description || 'Join us for an unforgettable experience!'}</p>
					
					<div class="tour-details">
						<div class="detail-item">
							<span class="detail-label">Duration:</span>
							<span class="detail-value">${tour.duration || '2 hours'}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">Price:</span>
							<span class="detail-value">${formatCurrency(tour.price, tour.currency || 'EUR')}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">Capacity:</span>
							<span class="detail-value">${tour.capacity} people</span>
						</div>
					</div>
					
					<div class="booking-info">
						<p class="booking-text">Book online at</p>
						<p class="booking-url">zaur.app/${profile.username}</p>
					</div>
				</div>
			`;
		} else if (layout === 'multi') {
			const displayTours = tours.slice(0, 4);
			content = `
				<div class="tours-grid">
					${displayTours.map(tour => `
						<div class="tour-card">
							<h3 class="tour-card-name">${tour.name}</h3>
							<p class="tour-card-price">${formatCurrency(tour.price, tour.currency || 'EUR')}</p>
							<p class="tour-card-duration">${tour.duration || '2 hours'}</p>
						</div>
					`).join('')}
				</div>
				<div class="booking-info">
					<p class="booking-text">Book all tours at</p>
					<p class="booking-url">zaur.app/${profile.username}</p>
				</div>
			`;
		} else if (layout === 'list') {
			content = `
				<div class="tours-list">
					${tours.map(tour => `
						<div class="tour-list-item">
							<div class="tour-list-left">
								<h3 class="tour-list-name">${tour.name}</h3>
								<p class="tour-list-duration">${tour.duration || '2 hours'}</p>
							</div>
							<div class="tour-list-right">
								<p class="tour-list-price">${formatCurrency(tour.price, tour.currency || 'EUR')}</p>
							</div>
						</div>
					`).join('')}
				</div>
				<div class="booking-info">
					<p class="booking-text">Book online at</p>
					<p class="booking-url">zaur.app/${profile.username}</p>
				</div>
			`;
		}

		// Create HTML content
		const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${headline} - ${profile.businessName || profile.name}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        @page {
            size: A4;
            margin: 15mm;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            background: ${currentStyle.background};
            color: ${currentStyle.textColor};
            line-height: 1.5;
        }
        
        .flyer {
            width: 100%;
            min-height: 257mm;
            padding: 10mm;
            border: ${currentStyle.borderStyle};
            border-radius: 8mm;
            box-shadow: ${currentStyle.boxShadow};
        }
        
        .header {
            background: ${currentStyle.headerBg};
            color: ${currentStyle.headerColor};
            padding: 15mm 10mm;
            margin: -10mm -10mm 10mm -10mm;
            border-radius: 8mm 8mm 0 0;
            text-align: center;
        }
        
        .business-name {
            font-size: 24pt;
            font-weight: 800;
            margin-bottom: 4mm;
        }
        
        .headline {
            font-size: 18pt;
            font-weight: 600;
        }
        
        .content {
            padding: 10mm 0;
        }
        
        /* Single Tour Styles */
        .tour-single {
            text-align: center;
        }
        
        .tour-name {
            font-size: 20pt;
            font-weight: 700;
            color: ${currentStyle.accentColor};
            margin-bottom: 8mm;
        }
        
        .tour-description {
            font-size: 12pt;
            color: ${currentStyle.secondaryColor};
            margin-bottom: 15mm;
            line-height: 1.6;
        }
        
        .tour-details {
            display: flex;
            justify-content: space-around;
            margin-bottom: 15mm;
        }
        
        .detail-item {
            text-align: center;
        }
        
        .detail-label {
            display: block;
            font-size: 10pt;
            color: ${currentStyle.secondaryColor};
            margin-bottom: 2mm;
        }
        
        .detail-value {
            display: block;
            font-size: 14pt;
            font-weight: 600;
            color: ${currentStyle.textColor};
        }
        
        /* Multi Tour Grid Styles */
        .tours-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10mm;
            margin-bottom: 15mm;
        }
        
        .tour-card {
            background: #f9fafb;
            padding: 8mm;
            border-radius: 4mm;
            text-align: center;
        }
        
        .tour-card-name {
            font-size: 12pt;
            font-weight: 600;
            color: ${currentStyle.textColor};
            margin-bottom: 4mm;
        }
        
        .tour-card-price {
            font-size: 14pt;
            font-weight: 700;
            color: ${currentStyle.accentColor};
            margin-bottom: 2mm;
        }
        
        .tour-card-duration {
            font-size: 10pt;
            color: ${currentStyle.secondaryColor};
        }
        
        /* List Styles */
        .tours-list {
            margin-bottom: 15mm;
        }
        
        .tour-list-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6mm 0;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .tour-list-item:last-child {
            border-bottom: none;
        }
        
        .tour-list-name {
            font-size: 12pt;
            font-weight: 600;
            color: ${currentStyle.textColor};
        }
        
        .tour-list-duration {
            font-size: 10pt;
            color: ${currentStyle.secondaryColor};
        }
        
        .tour-list-price {
            font-size: 14pt;
            font-weight: 700;
            color: ${currentStyle.accentColor};
        }
        
        /* Footer */
        .footer {
            margin-top: auto;
            padding-top: 10mm;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        
        .contact-info {
            flex: 1;
        }
        
        .contact-info p {
            font-size: 10pt;
            color: ${currentStyle.secondaryColor};
            margin-bottom: 2mm;
        }
        
        .qr-section {
            width: 30mm;
            height: 30mm;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 4mm;
            padding: 2mm;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .qr-section img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .booking-info {
            text-align: center;
            margin-top: 10mm;
            padding: 8mm;
            background: #f9fafb;
            border-radius: 4mm;
        }
        
        .booking-text {
            font-size: 11pt;
            color: ${currentStyle.secondaryColor};
            margin-bottom: 2mm;
        }
        
        .booking-url {
            font-size: 14pt;
            font-weight: 700;
            color: ${currentStyle.accentColor};
        }
    </style>
</head>
<body>
    <div class="flyer">
        <div class="header">
            <div class="business-name">${profile.businessName || profile.name}</div>
            <div class="headline">${headline}</div>
        </div>
        
        <div class="content">
            ${content}
        </div>
        
        <div class="footer">
            ${includeContact ? `
                <div class="contact-info">
                    ${profile.phone ? `<p>📞 ${profile.phone}</p>` : ''}
                    ${profile.email ? `<p>✉️ ${profile.email}</p>` : ''}
                    ${profile.website ? `<p>🌐 ${profile.website}</p>` : ''}
                </div>
            ` : '<div></div>'}
            
            ${includeQR ? `
                <div class="qr-section">
                    <img src="${qrCodeDataUri}" alt="QR Code" />
                </div>
            ` : ''}
        </div>
    </div>
</body>
</html>`;

		// Get shared browser instance
		const browser = await getBrowser();
		let page = null;

		try {
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
					top: '15mm',
					right: '15mm',
					bottom: '15mm',
					left: '15mm'
				}
			});

			// Close page but keep browser open for reuse
			await page.close();

			// Return PDF as response
			return new Response(pdfBuffer, {
				headers: {
					'Content-Type': 'application/pdf',
					'Content-Disposition': `attachment; filename="${profile.username}-flyer-${layout}-${new Date().toISOString().split('T')[0]}.pdf"`
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
		console.error('Error generating flyer PDF:', err);
		
		// Provide more specific error messages
		if (err instanceof Error && err.message.includes('timeout')) {
			return error(503, 'PDF generation timed out. Please try again.');
		} else if (err instanceof Error && err.message.includes('Target closed')) {
			return error(503, 'PDF generation service is temporarily unavailable. Please try again later.');
		}
		
		return error(500, 'Failed to generate flyer PDF');
	}
}; 