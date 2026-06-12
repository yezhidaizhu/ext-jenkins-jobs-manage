import type { JobItem, JenkinsSettings } from '@/src/types/jenkins';
import { getJenkinsSettings, isJenkinsSettingsReady } from './useJenkinsSettings';

type CrumbResponse = {
  crumb: string;
  crumbRequestField: string;
};

type JenkinsJobResponse = {
  jobs?: Array<{
    name: string;
    url: string;
    color: string;
  }>;
};

type JenkinsQueueResponse = {
  items?: Array<{
    task?: {
      name?: string;
    };
  }>;
};

function getAuthHeader(settings: JenkinsSettings) {
  return `Basic ${btoa(`${settings.user}:${settings.token}`)}`;
}

async function request(settings: JenkinsSettings, path: string, init: RequestInit = {}) {
  const res = await fetch(`${settings.host}${path}`, {
    ...init,
    headers: {
      Authorization: getAuthHeader(settings),
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    throw new Error(`${path} request failed: ${res.status} ${res.statusText}`);
  }

  return res;
}

async function requireSettings() {
  const settings = await getJenkinsSettings();

  if (!isJenkinsSettingsReady(settings)) {
    throw new Error('Jenkins settings are incomplete');
  }

  return settings;
}

async function getCrumb(settings: JenkinsSettings): Promise<CrumbResponse> {
  const res = await request(settings, '/crumbIssuer/api/json');
  return res.json();
}

export function canAbortBuild(color = '') {
  return color.toLowerCase().endsWith('_anime');
}

export function canTriggerBuild(color = '') {
  const normalizedColor = color.toLowerCase();
  return !normalizedColor.endsWith('_anime') && normalizedColor !== 'disabled';
}

export async function getJobs(): Promise<JobItem[]> {
  const settings = await requireSettings();
  const [viewRes, queueRes] = await Promise.all([
    request(settings, '/view/All/api/json?tree=jobs[name,url,color]'),
    request(settings, '/queue/api/json'),
  ]);

  const viewJson = (await viewRes.json()) as JenkinsJobResponse;
  const queueJson = (await queueRes.json()) as JenkinsQueueResponse;
  const queueNames = new Set(
    (queueJson.items ?? []).map((item) => item.task?.name).filter(Boolean),
  );

  return (viewJson.jobs ?? []).map((job) => {
    const building = canAbortBuild(job.color);
    const inQueue = queueNames.has(job.name);

    return {
      name: job.name,
      url: job.url,
      color: job.color,
      inQueue,
      building,
      canBuild: canTriggerBuild(job.color) && !inQueue,
    };
  });
}

export async function triggerBuild(jobName: string) {
  const settings = await requireSettings();
  const { crumb, crumbRequestField } = await getCrumb(settings);
  const jobInfoRes = await request(settings, `/job/${jobName}/api/json`);
  const jobInfo = await jobInfoRes.json();
  const isParameterized = jobInfo.property?.some(
    (property: { _class?: string }) =>
      property._class === 'hudson.model.ParametersDefinitionProperty',
  );
  const triggerPath = isParameterized
    ? `/job/${jobName}/buildWithParameters`
    : `/job/${jobName}/build`;

  await request(settings, triggerPath, {
    method: 'POST',
    headers: {
      [crumbRequestField]: crumb,
    },
  });
}

export async function stopBuild(jobName: string) {
  const settings = await requireSettings();
  const { crumb, crumbRequestField } = await getCrumb(settings);
  const numRes = await request(settings, `/job/${jobName}/lastBuild/buildNumber`);
  const buildNumber = (await numRes.text()).trim();

  await request(settings, `/job/${jobName}/${buildNumber}/stop`, {
    method: 'POST',
    headers: {
      [crumbRequestField]: crumb,
    },
  });
}
