import { testConnection } from './db.js';

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});