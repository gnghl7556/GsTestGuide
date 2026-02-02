import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, type Firestore } from 'firebase/firestore';
import type { PlContact } from '../components/PlDirectoryPage';

export function usePlDirectory(db: Firestore | null | undefined, authReady: boolean) {
  const [plDirectory, setPlDirectory] = useState<PlContact[]>([]);

  useEffect(() => {
    if (!db || !authReady) return;
    const dbRef = db;
    const q = query(collection(dbRef, 'plContacts'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const next = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Omit<PlContact, 'id'>;
        return { id: docSnap.id, ...data };
      });
      setPlDirectory(next);
    });
    return () => unsubscribe();
  }, [authReady, db]);

  return plDirectory;
}
