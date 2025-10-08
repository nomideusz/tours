import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// Create feature_feedback table if it doesn't exist
// Now supports both old (like/dislike) and new (1-5 star) rating systems
const createTableQuery = `
CREATE TABLE IF NOT EXISTS feature_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  feature_id VARCHAR(100) NOT NULL,
  feature_version VARCHAR(50) NOT NULL,
  rating VARCHAR(20) NOT NULL, -- Legacy: 'like'/'dislike' or numeric string
  rating_score INTEGER CHECK (rating_score >= 1 AND rating_score <= 5), -- New: 1-5 stars
  usability_score INTEGER CHECK (usability_score >= 1 AND usability_score <= 5), -- New: 1-5 ease of use
  comment TEXT,
  improvements TEXT[],
  would_use BOOLEAN DEFAULT false,
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  -- Aggregate data for analysis
  session_id TEXT,
  comparison_group VARCHAR(50) -- For A/B testing
);

-- Index for querying by feature
CREATE INDEX IF NOT EXISTS idx_feature_feedback_feature ON feature_feedback(feature_id, feature_version);
CREATE INDEX IF NOT EXISTS idx_feature_feedback_user ON feature_feedback(user_id);
`;

export const POST: RequestHandler = async ({ locals, request }) => {
	// Check if user is authenticated
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { 
			featureId, 
			version, 
			rating,  // Can be 'like'/'dislike' (old) or number 1-5 (new)
			usability, // New: 1-5 usability score
			comment, 
			improvements, 
			wouldUse,
			pageUrl,
			userAgent
		} = await request.json();

		// Validation
		if (!featureId || !version || rating === undefined || rating === null) {
			return json({ 
				error: 'Feature ID, version, and rating are required' 
			}, { status: 400 });
		}

		// Determine if this is new format (numeric) or old format (like/dislike)
		let ratingScore = null;
		let ratingText = '';
		
		if (typeof rating === 'number') {
			// New format: 1-5 star rating
			if (rating < 1 || rating > 5) {
				return json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
			}
			ratingScore = rating;
			ratingText = rating.toString();
		} else {
			// Old format: 'like' or 'dislike'
			if (!['like', 'dislike'].includes(rating)) {
				return json({ error: 'Invalid rating' }, { status: 400 });
			}
			ratingText = rating;
		}
		
		// Validate usability score if provided
		if (usability !== null && usability !== undefined) {
			if (usability < 1 || usability > 5) {
				return json({ error: 'Usability score must be between 1 and 5' }, { status: 400 });
			}
		}

		// Insert feedback
		const feedbackId = createId();
		
		await db.execute(sql`
			INSERT INTO feature_feedback (
				id,
				user_id,
				feature_id,
				feature_version,
				rating,
				rating_score,
				usability_score,
				comment,
				improvements,
				would_use,
				page_url,
				user_agent,
				created_at
			) VALUES (
				${feedbackId},
				${locals.user.id},
				${featureId},
				${version},
				${ratingText},
				${ratingScore},
				${usability || null},
				${comment || null},
				${improvements || []},
				${wouldUse || false},
				${pageUrl || null},
				${userAgent || null},
				NOW()
			)
		`);

		// Log for monitoring
		if (ratingScore) {
			console.log(`Feature feedback: ${locals.user.email} rated ${featureId} v${version} - ${ratingScore}/5 stars${usability ? `, usability: ${usability}/5` : ''}`);
		} else {
			console.log(`Feature feedback: ${locals.user.email} ${ratingText} ${featureId} v${version}`);
		}

		return json({ 
			success: true,
			feedbackId
		});

	} catch (error) {
		console.error('Error submitting feature feedback:', error);
		return json({ 
			error: 'Failed to submit feedback' 
		}, { status: 500 });
	}
};

// Get aggregated feedback for a feature
export const GET: RequestHandler = async ({ locals, url }) => {
	// Check if user is authenticated
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const featureId = url.searchParams.get('featureId');
		const version = url.searchParams.get('version');
		
		if (!featureId) {
			return json({ error: 'Feature ID is required' }, { status: 400 });
		}

		// Get aggregated stats (supports both old and new rating systems)
		const query = `
			SELECT 
				feature_version,
				COUNT(*) as total_feedback,
				-- Old rating system
				COUNT(CASE WHEN rating = 'like' THEN 1 END) as likes,
				COUNT(CASE WHEN rating = 'dislike' THEN 1 END) as dislikes,
				-- New rating system
				ROUND(AVG(rating_score), 2) as avg_rating,
				ROUND(AVG(usability_score), 2) as avg_usability,
				COUNT(CASE WHEN rating_score >= 4 THEN 1 END) as positive_ratings,
				COUNT(CASE WHEN rating_score <= 2 THEN 1 END) as negative_ratings,
				-- Common fields
				COUNT(CASE WHEN would_use = true THEN 1 END) as would_use_count,
				ROUND(AVG(CASE WHEN would_use = true THEN 1 ELSE 0 END) * 100, 1) as would_use_percent,
				ARRAY_AGG(DISTINCT unnest(improvements)) FILTER (WHERE improvements IS NOT NULL) as all_improvements
			FROM feature_feedback
			WHERE feature_id = $1
			${version ? 'AND feature_version = $2' : ''}
			GROUP BY feature_version
			ORDER BY feature_version DESC
		`;
		
		const params = version ? [featureId, version] : [featureId];
		const result = await db.execute(sql.raw(query, params));
		
		// Get recent comments
		const commentsQuery = `
			SELECT 
				comment,
				rating,
				rating_score,
				usability_score,
				improvements,
				would_use,
				created_at,
				u.name as user_name
			FROM feature_feedback f
			JOIN users u ON f.user_id = u.id
			WHERE f.feature_id = $1
			${version ? 'AND f.feature_version = $2' : ''}
			AND f.comment IS NOT NULL
			AND f.comment != ''
			ORDER BY f.created_at DESC
			LIMIT 10
		`;
		
		const comments = await db.execute(sql.raw(commentsQuery, params));
		
		return json({
			stats: result.rows,
			recentComments: comments.rows
		});
		
	} catch (error) {
		console.error('Error fetching feature feedback:', error);
		return json({ 
			error: 'Failed to fetch feedback' 
		}, { status: 500 });
	}
};
