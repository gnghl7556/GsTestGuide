import { useState } from 'react';

type TaskStatus = '대기' | '진행 중' | '완료' | '보류' | '실패';

interface ChecklistRow {
  id: string;
  content: string;
  isCompleted: boolean;
}

interface CommentRow {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

const stageData = [
  {
    name: '서류 준비',
    status: '완료',
    tasks: [
      { id: 'doc-1', title: '계약서 확인', status: '완료' },
      { id: 'doc-2', title: '메뉴얼 수집', status: '완료' }
    ]
  },
  {
    name: '기능 시험',
    status: '진행 중',
    tasks: [
      { id: 'fn-1', title: '설치 및 초기 구동', status: '진행 중' },
      { id: 'fn-2', title: '기본 기능 검증', status: '대기' }
    ]
  }
];

const initialChecklist: ChecklistRow[] = [
  { id: 'c1', content: '설치 매뉴얼대로 정상 설치가 완료되었는가?', isCompleted: false },
  { id: 'c2', content: '초기 계정/비밀번호 변경 절차가 확인되었는가?', isCompleted: false },
  { id: 'c3', content: '필수 기능이 정상 동작하는가?', isCompleted: false }
];

const initialComments: CommentRow[] = [
  { id: 'cm1', authorName: '테스터 A', content: '설치 로그 확인 필요', createdAt: '2025-01-10' }
];

export function TaskDetailLayout() {
  const [status, setStatus] = useState<TaskStatus>('진행 중');
  const [checklist, setChecklist] = useState<ChecklistRow[]>(initialChecklist);
  const [comments, setComments] = useState<CommentRow[]>(initialComments);
  const [commentInput, setCommentInput] = useState('');

  const toggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isCompleted: !item.isCompleted } : item))
    );
  };

  const addComment = () => {
    if (!commentInput.trim()) return;
    setComments((prev) => [
      {
        id: `cm-${prev.length + 1}`,
        authorName: '현재 사용자',
        content: commentInput.trim(),
        createdAt: new Date().toISOString().slice(0, 10)
      },
      ...prev
    ]);
    setCommentInput('');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-lg font-bold">과제 상세</h2>
          <p className="text-sm text-gray-500">GS-A-25-0193 / GS 시험 가이드</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-500">PL: 김테스터</span>
          <a className="text-blue-600 hover:underline" href="#" onClick={(e) => e.preventDefault()}>
            협약서
          </a>
          <a className="text-blue-600 hover:underline" href="#" onClick={(e) => e.preventDefault()}>
            제품 매뉴얼
          </a>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_2fr_1.2fr] gap-6">
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-gray-700">프로세스 타임라인</h3>
          <div className="space-y-3">
            {stageData.map((stage) => (
              <div
                key={stage.name}
                className={`rounded-lg border px-3 py-2 ${
                  stage.status === '진행 중' ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
                  <span>{stage.name}</span>
                  <span className="text-xs text-gray-500">{stage.status}</span>
                </div>
                {stage.status === '진행 중' && (
                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                    {stage.tasks.map((task) => (
                      <li key={task.id} className="flex items-center justify-between">
                        <span>{task.title}</span>
                        <span className="text-[10px] text-gray-400">{task.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-700">과제 내용</h3>
            <p className="text-sm text-gray-500 mt-1">설치 및 초기 구동 절차를 확인합니다.</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-slate-50 p-4 space-y-3">
            <h4 className="text-sm font-bold text-gray-700">체크리스트</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              {checklist.map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={item.isCompleted}
                    onChange={() => toggleChecklist(item.id)}
                    className="mt-1"
                  />
                  <span className={item.isCompleted ? 'line-through text-gray-400' : ''}>{item.content}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-700">작업 패널</h3>
            <p className="text-xs text-gray-500 mt-1">상태 업데이트와 증빙 관리</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['완료', '보류', '실패'] as TaskStatus[]).map((value) => (
              <button
                key={value}
                className={`rounded-lg border px-2 py-2 text-xs font-bold ${
                  status === value ? 'border-slate-800 bg-slate-800 text-white' : 'border-gray-200 text-gray-500'
                }`}
                onClick={() => setStatus(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
            <h4 className="text-xs font-bold text-gray-700">첨부 파일</h4>
            <input type="file" className="text-xs text-gray-500" />
            <p className="text-[10px] text-gray-400">Firebase Storage 연동 예정</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-3">
            <h4 className="text-xs font-bold text-gray-700">코멘트</h4>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-md border border-gray-200 px-2 py-1 text-xs"
                placeholder="코멘트를 입력하세요"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
              />
              <button
                className="rounded-md bg-slate-800 px-3 py-1 text-xs font-bold text-white"
                onClick={addComment}
              >
                추가
              </button>
            </div>
            <ul className="space-y-2 text-xs text-gray-600">
              {comments.map((comment) => (
                <li key={comment.id} className="rounded-md bg-slate-50 p-2">
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span>{comment.authorName}</span>
                    <span>{comment.createdAt}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{comment.content}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
