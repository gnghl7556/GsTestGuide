import { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

type Contact = {
  role: string;
  name: string;
  phone?: string;
  email?: string;
  requestMethod?: string;
  requestUrl?: string;
};

type FirestoreRoleContact = Contact & {
  linkedSteps?: string[];
};

/**
 * Subscribe to the global roleContacts collection.
 * Returns contacts whose linkedSteps include the given stepId,
 * plus markdown-defined contacts for roles not covered by Firestore.
 */
export function useStepContacts(
  stepId?: string,
  markdownContacts?: Contact[]
): Contact[] {
  const [firestoreRoles, setFirestoreRoles] = useState<FirestoreRoleContact[]>([]);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'roleContacts'), (snap) => {
      const list: FirestoreRoleContact[] = [];
      snap.forEach((doc) => {
        const data = doc.data() as FirestoreRoleContact;
        if (data.role) list.push(data);
      });
      setFirestoreRoles(list);
    });
    return () => unsub();
  }, []);

  if (!stepId) return [];

  // Firestore roles whose linkedSteps include this step
  const matchedFromFirestore = firestoreRoles.filter(
    (r) => r.linkedSteps && r.linkedSteps.includes(stepId)
  );

  const coveredRoles = new Set(matchedFromFirestore.map((r) => r.role));

  // Markdown contacts for roles not already covered by Firestore
  const fromMarkdown = (markdownContacts ?? []).filter(
    (md) => !coveredRoles.has(md.role)
  );

  return [...matchedFromFirestore, ...fromMarkdown];
}
