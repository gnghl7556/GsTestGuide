import { createContext, useContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

export type FinalizeSummary = {
  total: number;
  applicable: number;
  pass: number;
  fail: number;
  hold: number;
  none: number;
};

type ExecutionToolbarState = {
  onReset: (() => void) | null;
  onFinalize: (() => void) | null;
  canFinalize: boolean;
  isFinalized: boolean;
  finalizeSummary: FinalizeSummary | null;
};

const defaultState: ExecutionToolbarState = {
  onReset: null,
  onFinalize: null,
  canFinalize: false,
  isFinalized: false,
  finalizeSummary: null,
};

type RegisterPayload = {
  onReset: () => void;
  onFinalize?: () => void;
  canFinalize?: boolean;
  isFinalized?: boolean;
  finalizeSummary?: FinalizeSummary | null;
};

const Ctx = createContext<{
  state: ExecutionToolbarState;
  register: (payload: RegisterPayload) => void;
  unregister: () => void;
}>({
  state: defaultState,
  register: () => {},
  unregister: () => {},
});

export function ExecutionToolbarProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ExecutionToolbarState>(defaultState);
  const register = useCallback(
    (payload: RegisterPayload) =>
      setState({
        onReset: payload.onReset,
        onFinalize: payload.onFinalize ?? null,
        canFinalize: payload.canFinalize ?? false,
        isFinalized: payload.isFinalized ?? false,
        finalizeSummary: payload.finalizeSummary ?? null,
      }),
    [],
  );
  const unregister = useCallback(() => setState(defaultState), []);
  return (
    <Ctx.Provider value={{ state, register, unregister }}>
      {children}
    </Ctx.Provider>
  );
}

/** WorkspaceLayout — 현재 등록된 상태 읽기 */
export function useExecutionToolbar() {
  return useContext(Ctx).state;
}

/** ExecutionPage — 리셋/완료 콜백 등록 (마운트 시 등록, 언마운트 시 해제) */
export function useRegisterExecutionToolbar(payload: RegisterPayload) {
  const { register, unregister } = useContext(Ctx);
  const ref = useRef(payload);
  ref.current = payload;

  const hasFinalize = !!payload.onFinalize;
  const canFinalize = payload.canFinalize ?? false;
  const isFinalized = payload.isFinalized ?? false;
  const summaryJson = JSON.stringify(payload.finalizeSummary ?? null);

  useEffect(() => {
    register({
      onReset: () => ref.current.onReset(),
      onFinalize: hasFinalize ? () => ref.current.onFinalize!() : undefined,
      canFinalize,
      isFinalized,
      finalizeSummary: JSON.parse(summaryJson) as FinalizeSummary | null,
    });
  }, [register, hasFinalize, canFinalize, isFinalized, summaryJson]);

  useEffect(() => {
    return () => unregister();
  }, [unregister]);
}
