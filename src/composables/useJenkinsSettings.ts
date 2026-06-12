import type { JenkinsSettings } from '@/src/types/jenkins';

const STORAGE_KEYS = {
  host: 'jkHost',
  user: 'jkUser',
  token: 'jkToken',
} as const;

export function normalizeJenkinsHost(host: string) {
  return host.trim().replace(/\/+$/, '');
}

export function validateJenkinsSettings(settings: JenkinsSettings) {
  const normalizedSettings = {
    host: normalizeJenkinsHost(settings.host),
    user: settings.user.trim(),
    token: settings.token.trim(),
  };

  if (!normalizedSettings.host) {
    throw new Error('请填写 Jenkins Host');
  }

  if (!/^https?:\/\//.test(normalizedSettings.host)) {
    throw new Error('Jenkins Host 需要以 http:// 或 https:// 开头');
  }

  if (!normalizedSettings.user) {
    throw new Error('请填写 User Name');
  }

  if (!normalizedSettings.token) {
    throw new Error('请填写 API Token');
  }

  return normalizedSettings;
}

export async function getJenkinsSettings(): Promise<JenkinsSettings> {
  const result = await browser.storage.local.get([
    STORAGE_KEYS.host,
    STORAGE_KEYS.user,
    STORAGE_KEYS.token,
  ]);

  return {
    host: String(result[STORAGE_KEYS.host] ?? ''),
    user: String(result[STORAGE_KEYS.user] ?? ''),
    token: String(result[STORAGE_KEYS.token] ?? ''),
  };
}

export async function saveJenkinsSettings(settings: JenkinsSettings) {
  const normalizedSettings = validateJenkinsSettings(settings);

  await browser.storage.local.set({
    [STORAGE_KEYS.host]: normalizedSettings.host,
    [STORAGE_KEYS.user]: normalizedSettings.user,
    [STORAGE_KEYS.token]: normalizedSettings.token,
  });
}

export function isJenkinsSettingsReady(settings: JenkinsSettings) {
  return Boolean(settings.host && settings.user && settings.token);
}
