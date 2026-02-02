import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, type Firestore, type Timestamp } from 'firebase/firestore';
import type { Project } from '../types';

export function useProjects(db: Firestore | null | undefined, authReady: boolean) {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!db || !authReady) return;
    const dbRef = db;
    const q = query(collection(dbRef, 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const next = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as {
          testNumber?: string;
          projectName?: string;
          companyName?: string;
          plId?: string;
          plName?: string;
          plPhone?: string;
          plEmail?: string;
          testerName?: string;
          testerPhone?: string;
          testerEmail?: string;
          testerId?: string;
          createdBy?: string | null;
          updatedAt?: Timestamp;
          companyContactName?: string;
          companyContactPhone?: string;
          companyContactEmail?: string;
          scheduleWorkingDays?: string;
          scheduleStartDate?: string;
          scheduleDefect1?: string;
          scheduleDefect2?: string;
          schedulePatchDate?: string;
          scheduleEndDate?: string;
          projectYear?: number;
          projectNumber?: number;
          contractType?: string;
          status?: Project['status'];
          startDate?: Timestamp;
          endDate?: Timestamp;
        };
        const testNumber = data.testNumber || docSnap.id;
        return {
          id: docSnap.id,
          testNumber,
          projectYear: data.projectYear,
          projectNumber: data.projectNumber,
          projectName: data.projectName,
          companyName: data.companyName,
          contractType: data.contractType,
          status: data.status,
          startDate: data.startDate,
          endDate: data.endDate,
          plId: data.plId,
          plName: data.plName,
          plPhone: data.plPhone,
          plEmail: data.plEmail,
          testerName: data.testerName,
          testerPhone: data.testerPhone,
          testerEmail: data.testerEmail,
          testerId: data.testerId,
          createdBy: data.createdBy ?? null,
          updatedAt: data.updatedAt ? data.updatedAt.toDate().getTime() : null,
          companyContactName: data.companyContactName,
          companyContactPhone: data.companyContactPhone,
          companyContactEmail: data.companyContactEmail,
          scheduleWorkingDays: data.scheduleWorkingDays,
          scheduleStartDate: data.scheduleStartDate,
          scheduleDefect1: data.scheduleDefect1,
          scheduleDefect2: data.scheduleDefect2,
          schedulePatchDate: data.schedulePatchDate,
          scheduleEndDate: data.scheduleEndDate
        };
      });
      setProjects(next);
    });
    return () => unsubscribe();
  }, [authReady, db]);

  return projects;
}
