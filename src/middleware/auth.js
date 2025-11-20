import { auth } from '../config/firebase.js';

export const verifyToken = async (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next(); 
  }
  const authHeader = req.headers.authorization;

  // Define a public guest user to allow access without authentication
  // This allows the app to function in a "demo" or "public" mode while keeping controller logic intact
  const publicUser = {
    uid: 'public_guest_user',
    email: 'guest@regagen.com',
    displayName: 'Guest User'
  };

  // If no token is provided, proceed as Guest User
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = publicUser;
    return next();
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name
    };
    next();
  } catch (error) {
    // If token is invalid, do not block. Fallback to Guest User.
    console.warn('Warning: Invalid token provided. Proceeding as Guest User.', error);
    req.user = publicUser;
    next();
  }
};
