import crypto from 'crypto';

export function adminToken() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) return null;
  return crypto
    .createHash('sha256')
    .update(`${process.env.ADMIN_USERNAME}:${process.env.ADMIN_PASSWORD}:${secret}`)
    .digest('hex');
}

export function verifyAdmin(token) {
  const expected = adminToken();
  if (!expected || !token) return false;
  const actualBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

export function checkAdminRequest(req) {
  const token = req.cookies.get('reux_admin')?.value;
  return verifyAdmin(token);
}
