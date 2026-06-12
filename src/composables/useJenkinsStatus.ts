import type { JenkinsStatus } from '@/src/types/jenkins';

const statusMap: Record<string, Omit<JenkinsStatus, 'spinning'>> = {
  blue: { label: 'Success', tone: 'success' },
  red: { label: 'Failed', tone: 'danger' },
  yellow: { label: 'Unstable', tone: 'warning' },
  grey: { label: 'Not Built', tone: 'muted' },
  notbuilt: { label: 'Not Built', tone: 'muted' },
  disabled: { label: 'Disabled', tone: 'muted' },
  aborted: { label: 'Aborted', tone: 'muted' },
  blue_anime: { label: 'Building', tone: 'primary' },
  red_anime: { label: 'Building', tone: 'primary' },
  yellow_anime: { label: 'Building', tone: 'primary' },
  grey_anime: { label: 'Building', tone: 'primary' },
  notbuilt_anime: { label: 'Building', tone: 'primary' },
  disabled_anime: { label: 'Building', tone: 'primary' },
  aborted_anime: { label: 'Building', tone: 'primary' },
};

export function getJenkinsStatus(color = ''): JenkinsStatus {
  const normalizedColor = color.toLowerCase();
  const status = statusMap[normalizedColor] ?? { label: 'Unknown', tone: 'muted' as const };

  return {
    ...status,
    spinning: normalizedColor.endsWith('_anime'),
  };
}
