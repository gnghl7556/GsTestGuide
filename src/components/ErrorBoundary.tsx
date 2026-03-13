import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('App', 'Uncaught error in component tree', { error, componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8 text-center">
          <div className="text-lg font-bold text-tx-primary">오류가 발생했습니다</div>
          <p className="text-sm text-tx-tertiary max-w-md">
            {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-lg border border-ln px-4 py-2 text-sm font-semibold text-tx-secondary hover:bg-interactive-hover transition-colors"
          >
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
