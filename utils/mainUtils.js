const utils = {};

utils.getEmailFromAuthHeader = authHeader => {
  if (!authHeader || !authHeader.startsWith('Basic ')) return null;
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [email] = credentials.split(':');
  return email;
};

export default utils;
