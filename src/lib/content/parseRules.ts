import matter from 'gray-matter';

export interface ExecutionGateConfig {
  regressionItemId: string;
  securityItemId: string;
  performanceItemId: string;
}

export function parseExecutionGateRules(fileContent: string): ExecutionGateConfig {
  const { data } = matter(fileContent);

  return {
    regressionItemId: (data.regressionItemId as string) ?? 'EXEC-05',
    securityItemId: (data.securityItemId as string) ?? 'EXEC-06',
    performanceItemId: (data.performanceItemId as string) ?? 'EXEC-06',
  };
}
