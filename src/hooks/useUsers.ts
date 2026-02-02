import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, type Firestore } from 'firebase/firestore';

export type UserSummary = { id: string; name: string; rank?: string; email?: string; phone?: string };

export function useUsers(db: Firestore | null | undefined, authReady: boolean) {
  const [users, setUsers] = useState<UserSummary[]>([]);

  useEffect(() => {
    if (!db || !authReady) return;
    const dbRef = db;
    const q = query(collection(dbRef, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const next = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as { name?: string; rank?: string; email?: string; phone?: string };
        return { id: docSnap.id, name: data.name || docSnap.id, rank: data.rank, email: data.email, phone: data.phone };
      });
      setUsers(next);
    });
    return () => unsubscribe();
  }, [authReady, db]);

  return users;
}
