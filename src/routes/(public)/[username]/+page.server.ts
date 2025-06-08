import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { getUserByUsername } from '$lib/utils/username.js';

export const load: PageServerLoad = async ({ params }) => {
  const { username } = params;
  
  // Get the user by username
  const profileUser = await getUserByUsername(username);
  
  if (!profileUser) {
    throw error(404, 'User not found');
  }
  
  try {
    console.log('Public profile page: Loading public profile for:', username);
    
    // Return only public profile data
    return {
      profile: {
        id: profileUser.id,
        name: profileUser.name,
        username: profileUser.username,
        businessName: profileUser.businessName,
        avatar: profileUser.avatar,
        description: profileUser.description,
        location: profileUser.location,
        website: profileUser.website,
        // Don't expose private information like email, phone, emailVerified
      }
    };
    
  } catch (err) {
    console.error('Error loading public profile:', err);
    throw error(500, 'Failed to load profile');
  }
}; 