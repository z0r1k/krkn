try {
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    require('dotenv').config({ path: './.env-node' });
  }
} catch (e) {
  console.warn('.env file is not found', e);
}
