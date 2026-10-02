import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (!dsn) {
    console.log('[Sentry] EXPO_PUBLIC_SENTRY_DSN tanımlı değil, crash raporlama devre dışı.');
    return;
  }
  Sentry.init({
    dsn,
    debug: __DEV__,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    enableNative: true,
    // Ses akışı (PTT) ve konum güncellemeleri çok sık tetiklendiği için
    // otomatik breadcrumb gürültüsünü kısmak amacıyla varsayılan entegrasyonlar korunuyor,
    // manuel breadcrumb'lar logBreadcrumb() ile ekleniyor.
  });
}

type BreadcrumbCategory = 'socket' | 'sos' | 'ptt' | 'auth' | 'chat';

export function logBreadcrumb(message: string, category: BreadcrumbCategory, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export { Sentry };
