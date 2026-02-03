import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, type Auth } from 'firebase/auth';

export function useAuthReady(auth: Auth | null | undefined) {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const currentAuth = auth;
    console.info('[AuthReady] init start', { time: new Date().toISOString() });
    const unsubscribe = onAuthStateChanged(currentAuth, (user) => {
      console.info('[AuthReady] state changed', {
        time: new Date().toISOString(),
        hasUser: Boolean(user)
      });
      if (!user) {
        signInAnonymously(currentAuth).catch((error) => {
          console.warn('[Firebase] 익명 로그인 실패:', error);
        });
        return;
      }
      console.info('[AuthReady] ready', { time: new Date().toISOString() });
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, [auth]);

  return authReady;
}
