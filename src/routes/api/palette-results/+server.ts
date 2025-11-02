import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface VoteEntry {
	palette: string;
	timestamp: string;
	userAgent?: string;
	ip?: string;
}

export const GET: RequestHandler = async () => {
	try {
		const logFile = join(process.cwd(), 'logs', 'palette-votes.jsonl');
		
		if (!existsSync(logFile)) {
			return json({ 
				total: 0,
				votes: {},
				message: 'No votes yet'
			});
		}
		
		const content = readFileSync(logFile, 'utf-8');
		const lines = content.trim().split('\n').filter(line => line.length > 0);
		
		const votes: Record<string, number> = {};
		const allVotes: VoteEntry[] = [];
		
		for (const line of lines) {
			try {
				const vote = JSON.parse(line) as VoteEntry;
				votes[vote.palette] = (votes[vote.palette] || 0) + 1;
				allVotes.push(vote);
			} catch {
				// Skip invalid lines
			}
		}
		
		// Sort by vote count
		const sorted = Object.entries(votes)
			.sort(([, a], [, b]) => b - a)
			.map(([palette, count]) => ({ palette, count }));
		
		return json({
			total: lines.length,
			votes,
			sorted,
			recentVotes: allVotes.slice(-10).reverse()
		});
	} catch (error) {
		console.error('Failed to read palette results:', error);
		return json({ error: 'Failed to read results' }, { status: 500 });
	}
};

