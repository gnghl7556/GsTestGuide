import { createContext, useContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

type ExecutionToolbarState = {
  onReset: (() => void) | null;
  onFinalize: (() => void) | null;
  canFinalize: boolean;
  isFinalized: boolean;
};

const defaultState: ExecutionToolbarState = {
  onReset: null,
  onFinalize: null,
  canFinalize: false,
  isFinalized: false,
};

type RegisterPayload = {
  onReset: () => void;
  onFinalize?: () => void;
  canFinalize?: boolean;
  isFinalized?: boolean;
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

  useEffect(() => {
    register({
      onReset: () => ref.current.onReset(),
      onFinalize: ref.current.onFinalize ? () => ref.current.onFinalize!() : undefined,
      canFinalize: ref.current.canFinalize,
      isFinalized: ref.current.isFinalized,
    });
  });

  useEffect(() => {
    return () => unregister();
  }, [unregister]);
}
