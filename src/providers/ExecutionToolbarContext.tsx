import { createContext, useContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

type ExecutionToolbarState = {
  onReset: (() => void) | null;
};

const Ctx = createContext<{
  state: ExecutionToolbarState;
  register: (fn: () => void) => void;
  unregister: () => void;
}>({
  state: { onReset: null },
  register: () => {},
  unregister: () => {},
});

export function ExecutionToolbarProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ExecutionToolbarState>({ onReset: null });
  const register = useCallback((fn: () => void) => setState({ onReset: fn }), []);
  const unregister = useCallback(() => setState({ onReset: null }), []);
  return (
    <Ctx.Provider value={{ state, register, unregister }}>
      {children}
    </Ctx.Provider>
  );
}

/** WorkspaceLayout — 현재 등록된 리셋 콜백 읽기 */
export function useExecutionToolbar() {
  return useContext(Ctx).state;
}

/** ExecutionPage — 리셋 콜백 등록 (마운트 시 등록, 언마운트 시 해제) */
export function useRegisterExecutionToolbar(onReset: () => void) {
  const { register, unregister } = useContext(Ctx);
  const ref = useRef(onReset);
  ref.current = onReset;

  useEffect(() => {
    register(() => ref.current());
    return () => unregister();
  }, [register, unregister]);
}
