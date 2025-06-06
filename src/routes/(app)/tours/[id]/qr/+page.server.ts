import type { PageServerLoad, Actions } from './$types.js';
import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { tours, qrCodes } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const tourData = await db
			.select()
			.from(tours)
			.where(and(
				eq(tours.id, params.id),
				eq(tours.userId, locals.user.id)
			))
			.limit(1);
		
		if (tourData.length === 0) {
			throw error(404, 'Tour not found or access denied');
		}
		
		const tour = tourData[0];

		// Load QR codes for this tour (limit to prevent timeout)
		const qrCodesData = await db
			.select()
			.from(qrCodes)
			.where(and(
				eq(qrCodes.tourId, params.id),
				eq(qrCodes.userId, locals.user.id)
			))
			.limit(50); // Limit to prevent 502 timeout

		const formattedQRCodes = qrCodesData.map(qr => ({
			id: qr.id,
			code: qr.code || '',
			name: qr.name || 'Untitled QR Code',
			category: qr.category || 'digital',
			scans: qr.scans || 0,
			conversions: qr.conversions || 0,
			isActive: qr.isActive || false,
			tour: qr.tourId,
			user: qr.userId,
			created: qr.createdAt.toISOString(),
			updated: qr.updatedAt?.toISOString() || '',
			customization: qr.customization || {}
		}));
		
		return {
			tour: {
				id: tour.id,
				name: tour.name || 'Untitled Tour',
				description: tour.description || '',
				location: tour.location || '',
				price: tour.price || '0',
				duration: tour.duration || 0,
				capacity: tour.capacity || 0,
				status: tour.status || 'draft',
				user: tour.userId,
				created: tour.createdAt.toISOString(),
				updated: tour.updatedAt?.toISOString() || ''
			},
			qrCodes: formattedQRCodes
		};
	} catch (err) {
		console.error('Error loading tour:', err);
		if ((err as any).status === 404) {
			throw error(404, 'Tour not found');
		}
		if ((err as any).status) {
			throw err;
		}
		throw error(500, 'Failed to load tour data');
	}
};

export const actions: Actions = {
	createQR: async ({ request, locals, params }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		try {
			const formData = await request.formData();
			const tourId = formData.get('tourId') as string;
			const name = formData.get('name') as string;
			const category = formData.get('category') as string;
			const code = formData.get('code') as string;
			const color = formData.get('color') as string;
			const backgroundColor = formData.get('backgroundColor') as string;

			if (!tourId || !name || !code) {
				return fail(400, { error: 'Missing required fields' });
			}

			// Verify tour ownership
			const tourData = await db
				.select({ id: tours.id })
				.from(tours)
				.where(and(
					eq(tours.id, tourId),
					eq(tours.userId, locals.user.id)
				))
				.limit(1);

			if (tourData.length === 0) {
				return fail(404, { error: 'Tour not found' });
			}

			// Create QR code
			const qrData = {
				id: createId(),
				tourId: tourId,
				userId: locals.user.id,
				name: name.trim(),
				category: (category as 'digital' | 'print' | 'partner' | 'event' | 'promo') || 'digital',
				code: code,
				scans: 0,
				conversions: 0,
				isActive: true,
				customization: {
					color: color || '#000000',
					backgroundColor: backgroundColor || '#FFFFFF',
					style: 'square' as const
				},
				createdAt: new Date(),
				updatedAt: new Date()
			};

			await db.insert(qrCodes).values(qrData);

			return { success: true };
		} catch (err) {
			console.error('Error creating QR code:', err);
			return fail(500, { error: 'Failed to create QR code' });
		}
	},

	toggleStatus: async ({ request, locals, params }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		try {
			const formData = await request.formData();
			const qrId = formData.get('qrId') as string;
			const isActive = formData.get('isActive') === 'true';

			if (!qrId) {
				return fail(400, { error: 'QR code ID is required' });
			}

			// Verify ownership through tour
			const qrData = await db
				.select({ qrId: qrCodes.id })
				.from(qrCodes)
				.leftJoin(tours, eq(qrCodes.tourId, tours.id))
				.where(and(
					eq(qrCodes.id, qrId),
					eq(tours.id, params.id),
					eq(tours.userId, locals.user.id)
				))
				.limit(1);

			if (qrData.length === 0) {
				return fail(404, { error: 'QR code not found' });
			}

			// Update QR code status
			await db
				.update(qrCodes)
				.set({ 
					isActive: !isActive,
					updatedAt: new Date()
				})
				.where(eq(qrCodes.id, qrId));

			return { success: true };
		} catch (err) {
			console.error('Error updating QR code status:', err);
			return fail(500, { error: 'Failed to update QR code status' });
		}
	},

	delete: async ({ request, locals, params }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		try {
			const formData = await request.formData();
			const qrId = formData.get('qrId') as string;

			if (!qrId) {
				return fail(400, { error: 'QR code ID is required' });
			}

			// Verify ownership through tour
			const qrData = await db
				.select({ qrId: qrCodes.id })
				.from(qrCodes)
				.leftJoin(tours, eq(qrCodes.tourId, tours.id))
				.where(and(
					eq(qrCodes.id, qrId),
					eq(tours.id, params.id),
					eq(tours.userId, locals.user.id)
				))
				.limit(1);

			if (qrData.length === 0) {
				return fail(404, { error: 'QR code not found' });
			}

			// Delete QR code
			await db
				.delete(qrCodes)
				.where(eq(qrCodes.id, qrId));

			return { success: true };
		} catch (err) {
			console.error('Error deleting QR code:', err);
			return fail(500, { error: 'Failed to delete QR code' });
		}
	}
}; 