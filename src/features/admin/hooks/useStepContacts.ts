import { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

type Contact = {
  role: string;
  name: string;
  phone?: string;
  email?: string;
};

/**
 * Subscribe to Firestore contacts for a given step.
 * Returns Firestore contacts if available, otherwise falls back to markdown defaults.
 */
export function useStepContacts(
  stepId: string | undefined,
  markdownContacts?: Contact[]
): Contact[] {
  const [firestoreContacts, setFirestoreContacts] = useState<Contact[] | null>(null);

  useEffect(() => {
    if (!db || !stepId) return;
    const unsub = onSnapshot(doc(db, 'stepContacts', stepId), (snap) => {
      const data = snap.data();
      if (data?.contacts && Array.isArray(data.contacts) && data.contacts.length > 0) {
        setFirestoreContacts(data.contacts as Contact[]);
      } else {
        setFirestoreContacts(null);
      }
    });
    return () => unsub();
  }, [stepId]);

  // Firestore overrides markdown defaults
  return firestoreContacts ?? markdownContacts ?? [];
}
