import { Echo as LaravelEcho } from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Echo: LaravelEcho;
    Pusher: typeof Pusher;
  }
}

export {}; 