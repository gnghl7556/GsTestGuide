import { useContext } from 'react';
import { TestSetupContext } from './testSetupContext';

export function useTestSetupContext() {
  const context = useContext(TestSetupContext);
  if (!context) {
    throw new Error('useTestSetupContext must be used within TestSetupProvider');
  }
  return context;
}
