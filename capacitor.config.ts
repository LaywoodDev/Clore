import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clore.messenger',
  appName: 'Clore',
  webDir: 'public',
  server: {
    url: 'https://clore-web.ru',  // твой задеплоенный URL
    cleartext: false
  }
};

export default config;
