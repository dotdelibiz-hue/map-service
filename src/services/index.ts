import type { Backend } from './backend';

let instance: Promise<Backend> | null = null;

/** Firebase の設定があれば本番モード、無ければブラウザ内保存のデモモードで動きます */
export function isFirebaseConfigured(): boolean {
  return Boolean(import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID);
}

export function getBackend(): Promise<Backend> {
  if (!instance) {
    instance = isFirebaseConfigured()
      ? import('./firebase/firebaseBackend').then(
          ({ FirebaseBackend }) =>
            new FirebaseBackend({
              apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
              authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
              projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
              storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
              messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
              appId: import.meta.env.VITE_FIREBASE_APP_ID,
              useEmulator: import.meta.env.VITE_FIREBASE_USE_EMULATOR === 'true',
            }),
        )
      : import('./local/localBackend').then(({ LocalBackend }) => new LocalBackend());
  }
  return instance;
}
