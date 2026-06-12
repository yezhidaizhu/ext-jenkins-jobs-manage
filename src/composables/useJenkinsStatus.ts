import type { JenkinsStatus } from '@/src/types/jenkins';

const statusMap: Record<string, Omit<JenkinsStatus, 'spinning'>> = {
  blue: { label: '成功', tone: 'success' },
  red: { label: '失败', tone: 'danger' },
  yellow: { label: '不稳定', tone: 'warning' },
  grey: { label: '未构建', tone: 'muted' },
  notbuilt: { label: '未构建', tone: 'muted' },
  disabled: { label: '禁用', tone: 'muted' },
  aborted: { label: '中止', tone: 'muted' },
  blue_anime: { label: '构建中', tone: 'primary' },
  red_anime: { label: '构建中', tone: 'primary' },
  yellow_anime: { label: '构建中', tone: 'primary' },
  grey_anime: { label: '构建中', tone: 'primary' },
  notbuilt_anime: { label: '构建中', tone: 'primary' },
  disabled_anime: { label: '构建中', tone: 'primary' },
  aborted_anime: { label: '构建中', tone: 'primary' },
};

export function getJenkinsStatus(color = ''): JenkinsStatus {
  const normalizedColor = color.toLowerCase();
  const status = statusMap[normalizedColor] ?? { label: '未知', tone: 'muted' as const };

  return {
    ...status,
    spinning: normalizedColor.endsWith('_anime'),
  };
}
