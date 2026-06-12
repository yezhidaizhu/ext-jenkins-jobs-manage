import type { JenkinsSettings, ThemeMode } from '@/src/types/jenkins';

const STORAGE_KEYS = {
  host: 'jkHost',
  user: 'jkUser',
  token: 'jkToken',
  theme: 'jkTheme',
  jobFilters: 'jkJobFilters',
} as const;

const themeModes = new Set<ThemeMode>(['auto', 'light', 'dark']);

export function normalizeJenkinsHost(host: string) {
  return host.trim().replace(/\/+$/, '');
}

export function validateJenkinsSettings(settings: JenkinsSettings) {
  const normalizedSettings = {
    host: normalizeJenkinsHost(settings.host),
    user: settings.user.trim(),
    token: settings.token.trim(),
    theme: normalizeThemeMode(settings.theme),
    jobFilters: settings.jobFilters.trim(),
  };

  if (!normalizedSettings.host) {
    throw new Error('Enter Jenkins Host');
  }

  if (!/^https?:\/\//.test(normalizedSettings.host)) {
    throw new Error('Jenkins Host must start with http:// or https://');
  }

  if (!normalizedSettings.user) {
    throw new Error('Enter User Name');
  }

  if (!normalizedSettings.token) {
    throw new Error('Enter API Token');
  }

  return normalizedSettings;
}

export function normalizeThemeMode(theme: string): ThemeMode {
  return themeModes.has(theme as ThemeMode) ? (theme as ThemeMode) : 'auto';
}

export function parseJobFilters(jobFilters: string) {
  return jobFilters
    .split(/[\n,]/)
    .map((filter) => filter.trim().toLowerCase())
    .filter(Boolean);
}

export function applyThemeMode(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
}

export async function saveThemeMode(theme: ThemeMode) {
  await browser.storage.local.set({
    [STORAGE_KEYS.theme]: normalizeThemeMode(theme),
  });
}

export async function saveJobFilters(jobFilters: string) {
  await browser.storage.local.set({
    [STORAGE_KEYS.jobFilters]: jobFilters.trim(),
  });
}

export async function getJenkinsSettings(): Promise<JenkinsSettings> {
  const result = await browser.storage.local.get([
    STORAGE_KEYS.host,
    STORAGE_KEYS.user,
    STORAGE_KEYS.token,
    STORAGE_KEYS.theme,
    STORAGE_KEYS.jobFilters,
  ]);

  return {
    host: String(result[STORAGE_KEYS.host] ?? ''),
    user: String(result[STORAGE_KEYS.user] ?? ''),
    token: String(result[STORAGE_KEYS.token] ?? ''),
    theme: normalizeThemeMode(String(result[STORAGE_KEYS.theme] ?? 'auto')),
    jobFilters: String(result[STORAGE_KEYS.jobFilters] ?? ''),
  };
}

export async function saveJenkinsSettings(settings: JenkinsSettings) {
  const normalizedSettings = validateJenkinsSettings(settings);

  await browser.storage.local.set({
    [STORAGE_KEYS.host]: normalizedSettings.host,
    [STORAGE_KEYS.user]: normalizedSettings.user,
    [STORAGE_KEYS.token]: normalizedSettings.token,
    [STORAGE_KEYS.theme]: normalizedSettings.theme,
    [STORAGE_KEYS.jobFilters]: normalizedSettings.jobFilters,
  });
}

export function isJenkinsSettingsReady(settings: JenkinsSettings) {
  return Boolean(settings.host && settings.user && settings.token);
}
