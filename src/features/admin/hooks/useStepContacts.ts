import { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

type Contact = {
  role: string;
  name: string;
  phone?: string;
  email?: string;
};

/**
 * Subscribe to the global roleContacts collection.
 * Given the step's markdown-defined roles, returns resolved contacts
 * with Firestore data overriding markdown defaults.
 */
export function useStepContacts(
  markdownContacts?: Contact[]
): Contact[] {
  const [roleMap, setRoleMap] = useState<Record<string, Contact>>({});

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'roleContacts'), (snap) => {
      const map: Record<string, Contact> = {};
      snap.forEach((doc) => {
        const data = doc.data() as Contact;
        if (data.role) map[data.role] = data;
      });
      setRoleMap(map);
    });
    return () => unsub();
  }, []);

  if (!markdownContacts || markdownContacts.length === 0) return [];

  // For each role the step references, use Firestore override if available
  return markdownContacts.map((md) => {
    const override = roleMap[md.role];
    if (override) {
      return {
        role: md.role,
        name: override.name,
        phone: override.phone,
        email: override.email,
      };
    }
    return md;
  });
}
