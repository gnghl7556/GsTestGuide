/**
 * ESLint rule: no-hardcoded-tailwind-colors
 *
 * 시맨틱 디자인 토큰 대신 하드코딩된 Tailwind 색상 클래스 사용을 감지한다.
 * 예: bg-red-500, text-slate-700, border-purple-400 등
 *
 * 허용되는 패턴:
 * - 시맨틱 토큰: bg-surface-base, text-tx-primary, border-ln 등
 * - 투명도/흑백: bg-white, bg-black, text-white, text-black
 * - 임의값: bg-[#hex], text-[rgb(...)]
 */

const TAILWIND_COLOR_PATTERN =
  /\b(?:bg|text|border|ring|from|via|to|divide|outline|shadow|decoration)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+/g;

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '시맨틱 토큰 대신 하드코딩된 Tailwind 색상 사용 금지',
    },
    messages: {
      noHardcodedColor:
        '하드코딩된 Tailwind 색상 "{{match}}"를 발견했습니다. 시맨틱 토큰(surface, tx, ln, accent, status 등)을 사용하세요.',
    },
    schema: [],
  },
  create(context) {
    function checkString(node, value) {
      TAILWIND_COLOR_PATTERN.lastIndex = 0;
      let m;
      while ((m = TAILWIND_COLOR_PATTERN.exec(value)) !== null) {
        context.report({
          node,
          messageId: 'noHardcodedColor',
          data: { match: m[0] },
        });
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') {
          checkString(node, node.value);
        }
      },
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          checkString(node, quasi.value.raw);
        }
      },
    };
  },
};
