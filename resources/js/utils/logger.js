const isDev = import.meta.env.DEV;

export const logger = {
    log: (...args) => {
        if (isDev) console.log('[LOG]:', ...args);
    },
    error: (...args) => {
        if (isDev) console.error('[ERROR]:', ...args);
        // In production, we could send this to an external service like Sentry
    },
    warn: (...args) => {
        if (isDev) console.warn('[WARN]:', ...args);
    }
};

export default logger;
