import { verifyToken } from './auth';
import { auth } from '../config/firebase';

// Mock the firebase auth object
jest.mock('../config/firebase', () => ({
  auth: {
    verifyIdToken: jest.fn(),
  },
}));

describe('verifyToken Middleware', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {}; // Not used in this middleware
    nextFunction = jest.fn();
    // Clear mock history before each test
    auth.verifyIdToken.mockClear();
  });

  const publicUser = {
    uid: 'public_guest_user',
    email: 'guest@regagen.com',
    displayName: 'Guest User',
  };

  test('should assign public guest user if no Authorization header is present', async () => {
    await verifyToken(mockRequest, mockResponse, nextFunction);

    expect(mockRequest.user).toEqual(publicUser);
    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(auth.verifyIdToken).not.toHaveBeenCalled();
  });

  test('should assign public guest user if Authorization header does not start with "Bearer "', async () => {
    mockRequest.headers.authorization = 'Invalid token';
    await verifyToken(mockRequest, mockResponse, nextFunction);

    expect(mockRequest.user).toEqual(publicUser);
    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(auth.verifyIdToken).not.toHaveBeenCalled();
  });

  test('should assign decoded user if token is valid', async () => {
    const idToken = 'valid_token';
    const decodedToken = {
      uid: 'test_uid',
      email: 'test@example.com',
      name: 'Test User',
    };
    mockRequest.headers.authorization = `Bearer ${idToken}`;
    auth.verifyIdToken.mockResolvedValue(decodedToken);

    await verifyToken(mockRequest, mockResponse, nextFunction);

    expect(auth.verifyIdToken).toHaveBeenCalledWith(idToken);
    expect(mockRequest.user).toEqual({
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
    });
    expect(nextFunction).toHaveBeenCalledTimes(1);
  });

  test('should assign public guest user and log a warning if token is invalid', async () => {
    const idToken = 'invalid_token';
    mockRequest.headers.authorization = `Bearer ${idToken}`;
    const error = new Error('Invalid token');
    auth.verifyIdToken.mockRejectedValue(error);
    console.warn = jest.fn(); // Mock console.warn

    await verifyToken(mockRequest, mockResponse, nextFunction);

    expect(auth.verifyIdToken).toHaveBeenCalledWith(idToken);
    expect(mockRequest.user).toEqual(publicUser);
    expect(console.warn).toHaveBeenCalledWith('Warning: Invalid token provided. Proceeding as Guest User.', error);
    expect(nextFunction).toHaveBeenCalledTimes(1);
  });
});
