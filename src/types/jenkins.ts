export type ThemeMode = 'auto' | 'light' | 'dark';

export type JenkinsSettings = {
  host: string;
  user: string;
  token: string;
  theme: ThemeMode;
  jobFilters: string;
};

export type JobItem = {
  name: string;
  url: string;
  color: string;
  inQueue: boolean;
  building: boolean;
  canBuild: boolean;
};

export type JenkinsStatusTone =
  | 'success'
  | 'danger'
  | 'warning'
  | 'muted'
  | 'primary';

export type JenkinsStatus = {
  label: string;
  tone: JenkinsStatusTone;
  spinning: boolean;
};
