/** 체크포인트 배열의 구조적 지문 (djb2 해시 기반).
 *  형식: "v1:{count}:{hash36}" */
export function computeCpFingerprint(checkpoints: string[]): string {
  const joined = checkpoints.join('\n');
  let hash = 5381;
  for (let i = 0; i < joined.length; i++) {
    hash = ((hash << 5) + hash + joined.charCodeAt(i)) | 0;
  }
  return `v1:${checkpoints.length}:${(hash >>> 0).toString(36)}`;
}
