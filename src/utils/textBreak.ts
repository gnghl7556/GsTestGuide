const ZWS = '\u200B';

export function insertBreakHints(text: string): string {
  // 1. 짧은 괄호 내용 보호 (20자 미만 → 통째 유지)
  const placeholders = new Map<string, string>();
  let idx = 0;
  let result = text.replace(/([(\[（])([^)\]）]{1,19})([)\]）])/g, (m) => {
    const key = `__PH${idx++}__`;
    placeholders.set(key, m);
    return key;
  });

  // 2. 규칙 기반 ZWS 삽입
  result = result
    .replace(/,\s/g, `,${ZWS} `)           // 쉼표 뒤
    .replace(/·/g, `·${ZWS}`)              // 중점 뒤
    .replace(/\/(?=[가-힣])/g, `/${ZWS}`)   // 슬래시 뒤 한글
    .replace(/(?=[(\[（])/g, ZWS)           // 여는 괄호 앞
    .replace(/([)\]）])\s/g, `$1${ZWS} `);  // 닫는 괄호 뒤

  // 3. 종결어미 보호 — 마지막 공백 이후 ZWS 제거
  const lastSpace = result.lastIndexOf(' ');
  if (lastSpace > 0) {
    result = result.slice(0, lastSpace + 1) + result.slice(lastSpace + 1).replaceAll(ZWS, '');
  }

  // 4. 보호된 괄호 복원
  for (const [key, val] of placeholders) {
    result = result.replace(key, val);
  }

  return result;
}
