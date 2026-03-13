const logger = {
  warn(ctx: string, msg: string, error?: unknown) {
    console.warn(`[${ctx}] ${msg}`, error ?? '');
  },
  error(ctx: string, msg: string, error?: unknown) {
    console.error(`[${ctx}] ${msg}`, error ?? '');
  },
};

export { logger };
