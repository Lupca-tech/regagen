import { auth } from '../config/firebase.js';

export const verifyToken = async (req, res, next) => {
  // 1. SỬA LỖI CORS: Phải trả về headers cho phép trước khi send 204
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', '*'); // Nên thay '*' bằng domain frontend của bạn để bảo mật
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.sendStatus(204);
  }

  const authHeader = req.headers.authorization;
  const publicUser = { uid: 'public_guest_user', email: 'guest@regagen.com', displayName: 'Guest User' };

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
    console.warn('Warning: Invalid token.', error);
    // 2. DEBUG: Nếu backend log dòng này, nghĩa là token từ client gửi lên đang bị sai.
    // Thay vì cho làm Guest (dễ gây 403 khó hiểu), bạn có thể trả về 401 luôn để client biết token lỗi.
    // Tuy nhiên, nếu muốn giữ logic Guest, hãy đảm bảo Controller cho phép Guest ghi dữ liệu (hoặc chỉ cho đọc).
    req.user = publicUser;
    next();
  }
};