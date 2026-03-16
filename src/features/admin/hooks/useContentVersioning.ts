import { doc, collection, runTransaction, query, orderBy, getDocs, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { ContentSnapshot, ContentVersionDoc, ContentVersionRoot } from '../../../types/contentVersion';
import { computeSnapshotDiff } from '../../../lib/content/snapshotUtils';
import type { VersionAction } from '../../../types/contentVersion';

type SaveVersionParams = {
  reqId: string;
  content: ContentSnapshot;
  editor: string;
  editorId: string;
  note: string;
  action: VersionAction;
  previousContent?: ContentSnapshot;
};

export async function saveContentVersion({
  reqId, content, editor, editorId, note, action, previousContent,
}: SaveVersionParams): Promise<number> {
  if (!db) throw new Error('Firestore not initialized');

  const rootRef = doc(db, 'contentVersions', reqId);

  const newVersion = await runTransaction(db, async (tx) => {
    const rootSnap = await tx.get(rootRef);
    const currentVersion = rootSnap.exists() ? (rootSnap.data() as ContentVersionRoot).currentVersion : -1;
    const nextVersion = currentVersion + 1;

    const diff = previousContent ? computeSnapshotDiff(previousContent, content) : undefined;

    const versionRef = doc(collection(rootRef, 'versions'), String(nextVersion));
    tx.set(versionRef, {
      version: nextVersion,
      content,
      editor,
      editorId,
      editedAt: serverTimestamp(),
      note,
      action,
      ...(diff && diff.length > 0 ? { diff } : {}),
    });

    tx.set(rootRef, {
      currentVersion: nextVersion,
      content,
      updatedAt: serverTimestamp(),
      updatedBy: editor,
    });

    return nextVersion;
  });

  return newVersion;
}

export async function getVersionHistory(reqId: string): Promise<ContentVersionDoc[]> {
  if (!db) return [];
  const versionsRef = collection(db, 'contentVersions', reqId, 'versions');
  const q = query(versionsRef, orderBy('version', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data() } as ContentVersionDoc));
}

export async function getVersionSnapshot(reqId: string, version: number): Promise<ContentVersionDoc | null> {
  if (!db) return null;
  const versionRef = doc(db, 'contentVersions', reqId, 'versions', String(version));
  const snap = await getDoc(versionRef);
  if (!snap.exists()) return null;
  return snap.data() as ContentVersionDoc;
}
