import { useState } from 'react';
import { FeatureManager } from '../components/FeatureManager';
import { TestCaseManager } from '../components/TestCaseManager';

export function DesignPage() {
  const [activeTab, setActiveTab] = useState<'feature' | 'testcase'>('feature');

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 border-b border-surface-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => setActiveTab('feature')}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
            activeTab === 'feature'
              ? 'bg-primary-800 text-white'
              : 'bg-surface-100 text-primary-600 hover:bg-surface-200'
          }`}
        >
          기능 명세 (Features)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('testcase')}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
            activeTab === 'testcase'
              ? 'bg-primary-800 text-white'
              : 'bg-surface-100 text-primary-600 hover:bg-surface-200'
          }`}
        >
          테스트 케이스 (Test Cases)
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'feature' ? <FeatureManager /> : <TestCaseManager />}
      </div>
    </div>
  );
}
