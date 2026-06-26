import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

let echoInstance: Echo | null = null;

export const initEcho = (token: string | null) => {
  if (echoInstance) {
    echoInstance.disconnect();
  }

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: 'chatweb_reverb_key',
    wsHost: 'localhost',
    wsPort: 8080,
    forceTLS: false,
    disableStats: true,
    authEndpoint: 'http://localhost:8000/api/broadcasting/auth',
    auth: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  return echoInstance;
};

export const getEcho = () => echoInstance;