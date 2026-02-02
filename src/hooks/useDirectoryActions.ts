import { addDoc, collection, deleteDoc, doc, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore';
import type { PlContactInput } from '../components/PlDirectoryPage';

export function useDirectoryActions(db: Firestore | null | undefined, authReady: boolean) {
  const addPlContact = async (input: PlContactInput) => {
    if (!db || !authReady) {
      window.alert('Firestore가 연결되지 않았습니다.');
      return;
    }
    await addDoc(collection(db, 'plContacts'), {
      ...input,
      createdAt: serverTimestamp()
    });
  };

  const removePlContact = async (id: string) => {
    if (!db || !authReady) return;
    await deleteDoc(doc(db, 'plContacts', id));
  };

  const createUser = async (input: { name: string; rank: string; email: string; phone: string }) => {
    if (!db || !authReady) {
      window.alert('Firestore가 연결되지 않았습니다.');
      return null;
    }
    const rawId = input.email?.trim() || input.name?.trim();
    const baseId = rawId && rawId.length > 0 ? rawId : `user-${Date.now()}`;
    const docId = baseId.replace(/[\\/]/g, '-');
    try {
      await setDoc(
        doc(db, 'users', docId),
        {
          userId: docId,
          name: input.name,
          rank: input.rank,
          email: input.email,
          phone: input.phone,
          createdAt: serverTimestamp()
        },
        { merge: true }
      );
      return docId;
    } catch (error) {
      console.warn('[Firestore] 사용자 생성 실패:', error);
      return null;
    }
  };

  const updateUser = async (id: string, input: { name: string; rank: string; email: string; phone: string }) => {
    if (!db || !authReady) {
      window.alert('Firestore가 연결되지 않았습니다.');
      return false;
    }
    try {
      await setDoc(
        doc(db, 'users', id),
        {
          userId: id,
          name: input.name,
          rank: input.rank,
          email: input.email,
          phone: input.phone,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      return true;
    } catch (error) {
      console.warn('[Firestore] 사용자 수정 실패:', error);
      return false;
    }
  };

  const deleteUser = async (id: string) => {
    if (!db || !authReady) {
      window.alert('Firestore가 연결되지 않았습니다.');
      return false;
    }
    try {
      await deleteDoc(doc(db, 'users', id));
      return true;
    } catch (error) {
      console.warn('[Firestore] 사용자 삭제 실패:', error);
      return false;
    }
  };

  return { addPlContact, removePlContact, createUser, updateUser, deleteUser };
}

export type UseDirectoryActionsReturn = ReturnType<typeof useDirectoryActions>;
