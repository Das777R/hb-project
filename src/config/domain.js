export const ALLOWED_DOMAIN = (
  process.env.EXPO_PUBLIC_ALLOWED_DOMAIN || 'hbplus.fit'
).toLowerCase();

export const DOMAIN_ERROR =
  'Access restricted. Please login using your official domain email.';


export const isAllowedEmail = (email) =>
  typeof email === 'string' &&
  email.trim().toLowerCase().endsWith('@' + ALLOWED_DOMAIN);