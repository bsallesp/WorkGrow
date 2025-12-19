import { OAuth2Client } from 'google-auth-library';
import { HttpRequest } from '@azure/functions';
import { db, User } from './db';
import { v4 as uuidv4 } from 'uuid';

// You should put your Google Client ID here or in environment variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '232760690927-1no75qoqke8imcrgdvmikl2ai01v254h.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

export async function authenticateUser(request: HttpRequest): Promise<User | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  if (token === 'DEMO_TOKEN') {
      const demoUser = {
          id: 'demo-user-id',
          googleId: 'demo-google-id',
          email: 'guest@workgrow.demo',
          name: 'Guest User',
          picture: 'https://ui-avatars.com/api/?name=Guest+User'
      };
      
      // Ensure demo user exists in DB
      const users = db.users.getAll();
      if (!users.find(u => u.id === demoUser.id)) {
          db.users.save(demoUser);
      }
      
      return demoUser;
  }

  try {
    // For development/demo without a real Client ID, we might want to just decode
    // But properly we should verify.
    // If CLIENT_ID is default, we might skip audience check or warn.
    
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
    });
    
    const payload = ticket.getPayload();
    
    if (!payload) return null;

    const googleId = payload.sub;
    const email = payload.email || '';
    const name = payload.name || '';
    const picture = payload.picture || '';

    // Check if user exists
    const users = db.users.getAll();
    let user = users.find(u => u.googleId === googleId);

    if (!user) {
      user = {
        id: uuidv4(),
        googleId,
        email,
        name,
        picture
      };
      db.users.save(user);
    }

    return user;
  } catch (error) {
    console.error('Auth Error:', error);
    return null;
  }
}
