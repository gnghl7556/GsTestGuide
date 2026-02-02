import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, type Firestore } from 'firebase/firestore';
import type { User } from '../types';

export function useUsers(db: Firestore | null | undefined, authReady: boolean) {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!db || !authReady) return;
    const dbRef = db;
    const q = query(collection(dbRef, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const next = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as {
          name?: string;
          rank?: User['rank'];
          email?: string;
          phone?: string;
          role?: User['role'];
        };
        return {
          id: docSnap.id,
          name: data.name || docSnap.id,
          rank: data.rank || '전임',
          email: data.email || '',
          phone: data.phone || '',
          role: data.role
        };
      });
      setUsers(next);
    });
    return () => unsubscribe();
  }, [authReady, db]);

  return users;
}
