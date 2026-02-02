import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, type Auth } from 'firebase/auth';

export function useAuthReady(auth: Auth | null | undefined) {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const currentAuth = auth;
    const unsubscribe = onAuthStateChanged(currentAuth, (user) => {
      if (!user) {
        signInAnonymously(currentAuth).catch((error) => {
          console.warn('[Firebase] 익명 로그인 실패:', error);
        });
        return;
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, [auth]);

  return authReady;
}
