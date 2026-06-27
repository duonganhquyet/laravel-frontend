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
    key: import.meta.env.VITE_REVERB_APP_KEY || 'chatweb_reverb_key',
    wsHost: import.meta.env.VITE_REVERB_HOST || '127.0.0.1',
    wsPort: Number(import.meta.env.VITE_REVERB_PORT) || 6001,
    forceTLS: false,
    disableStats: true,
    authEndpoint: `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  return echoInstance;
};

export const getEcho = () => echoInstance;