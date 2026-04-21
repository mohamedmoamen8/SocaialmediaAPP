import { createClient } from 'redis';
import { REDIS_URL } from '../config';


const redisClient = createClient({
  url: REDIS_URL || 'redis://localhost:6379',
});

let errorLogged = false;

redisClient.on('error', (err: Error) => {
  if (!errorLogged) {
    console.error('Redis error:', err.message);
    errorLogged = true;
  }
});

redisClient.on('connect', () => {
  errorLogged = false;
  console.log('Redis connected ✅');
});

export default redisClient;