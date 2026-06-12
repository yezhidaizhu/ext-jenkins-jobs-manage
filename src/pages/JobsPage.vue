<script setup lang="ts">
import {
  CircleStop,
  ExternalLink,
  PlayCircle,
  RefreshCcw,
  RefreshCw,
  Search,
  Settings,
  X,
} from '@lucide/vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import JenkinsStatusBadge from '@/src/components/JenkinsStatusBadge.vue';
import { getJobs, stopBuild, triggerBuild } from '@/src/composables/useJenkins';
import {
  applyThemeMode,
  getJenkinsSettings,
  isJenkinsSettingsReady,
  parseJobFilters,
} from '@/src/composables/useJenkinsSettings';
import { showToast } from '@/src/composables/useToast';
import type { JobItem } from '@/src/types/jenkins';

const router = useRouter();
const jobs = ref<JobItem[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');
const pendingAction = ref('');
const searchQuery = ref('');
const jobFilters = ref<string[]>([]);
const confirmJob = ref<JobItem | null>(null);
const confirmType = ref<'build' | 'stop' | null>(null);
const host = ref('');
let pollTimer: number | undefined;

const filteredJobs = computed(() => {
  const filterJobs = jobFilters.value.length
    ? jobs.value.filter((job) => {
        const jobName = job.name.toLowerCase();
        return jobFilters.value.some((filter) => jobName.includes(filter));
      })
    : jobs.value;
  const keyword = searchQuery.value.trim().toLowerCase();

  if (!keyword) return filterJobs;

  return filterJobs.filter((job) => job.name.toLowerCase().includes(keyword));
});

async function refreshJobs() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    jobs.value = await getJobs();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load jobs';
    showToast({ type: 'error', message: errorMessage.value });
  } finally {
    isLoading.value = false;
  }
}

function openConfirm(type: 'build' | 'stop', job: JobItem) {
  confirmType.value = type;
  confirmJob.value = job;
}

function closeConfirm() {
  confirmType.value = null;
  confirmJob.value = null;
}

async function runConfirmedAction() {
  if (!confirmJob.value || !confirmType.value) return;

  const job = confirmJob.value;
  const type = confirmType.value;
  pendingAction.value = `${type}:${job.name}`;
  errorMessage.value = '';
  closeConfirm();

  try {
    if (type === 'build') {
      await triggerBuild(job.name);
      showToast({ type: 'success', message: `Build triggered: ${job.name}` });
    } else {
      await stopBuild(job.name);
      showToast({ type: 'success', message: `Build stopped: ${job.name}` });
    }

    window.setTimeout(refreshJobs, 300);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Action failed';
    showToast({ type: 'error', message: errorMessage.value });
  } finally {
    pendingAction.value = '';
  }
}

function openJenkins() {
  if (!host.value) {
    showToast({ type: 'info', message: 'Configure Jenkins Host first' });
    return;
  }

  window.open(host.value, '_blank');
}

function openJob(job: JobItem) {
  window.open(job.url, '_blank');
}

onMounted(async () => {
  const settings = await getJenkinsSettings();
  host.value = settings.host;
  jobFilters.value = parseJobFilters(settings.jobFilters);
  applyThemeMode(settings.theme);

  if (!isJenkinsSettingsReady(settings)) {
    await router.replace('/settings');
    return;
  }

  await refreshJobs();
  pollTimer = window.setInterval(refreshJobs, 10000);
});

onUnmounted(() => {
  if (pollTimer) {
    window.clearInterval(pollTimer);
  }
});
</script>

<template>
  <main class="panel-page">
    <header class="app-header">
      <div>
        <h1>Jenkins Jobs</h1>
        <p>{{ filteredJobs.length }} / {{ jobs.length }} jobs</p>
      </div>

      <nav class="toolbar" aria-label="Toolbar">
        <button class="icon-button" :disabled="isLoading" title="Refresh" @click="refreshJobs">
          <RefreshCw :class="{ spinning: isLoading }" :size="16" :stroke-width="2.3" />
        </button>
        <button class="icon-button" title="Open Jenkins" @click="openJenkins">
          <ExternalLink :size="16" :stroke-width="2.3" />
        </button>
        <RouterLink class="icon-button" title="Settings" to="/settings">
          <Settings :size="16" :stroke-width="2.3" />
        </RouterLink>
      </nav>
    </header>

    <section v-if="errorMessage" class="notice danger">
      {{ errorMessage }}
    </section>

    <section v-if="confirmJob" class="modal-backdrop" @click.self="closeConfirm">
      <div class="confirm-dialog" :data-type="confirmType" role="dialog" aria-modal="true">
        <button class="dialog-close" title="Close" type="button" @click="closeConfirm">
          <X :size="15" :stroke-width="2.4" />
        </button>

        <div class="confirm-body">
          <div class="confirm-icon" aria-hidden="true">
            <PlayCircle v-if="confirmType === 'build'" :size="22" :stroke-width="2.3" />
            <CircleStop v-else :size="22" :stroke-width="2.3" />
          </div>

          <div class="confirm-content">
            <h2>{{ confirmType === 'build' ? 'Trigger build?' : 'Stop build?' }}</h2>
            <p class="confirm-message">
              {{
                confirmType === 'build'
                  ? 'This job will be added to the Jenkins build queue.'
                  : 'The running build will be stopped immediately.'
              }}
            </p>
            <p class="confirm-job" :title="confirmJob.name">{{ confirmJob.name }}</p>
          </div>
        </div>

        <div class="confirm-actions">
          <button class="button muted" type="button" @click="closeConfirm">Cancel</button>
          <button class="button" :class="{ danger: confirmType === 'stop' }" type="button" @click="runConfirmedAction">
            {{ confirmType === 'build' ? 'Trigger Build' : 'Stop Build' }}
          </button>
        </div>
      </div>
    </section>

    <section class="jobs-table" aria-label="Jenkins jobs">
      <div class="jobs-row jobs-head">
        <div>Status</div>
        <div class="jobs-head-search">
          <Search class="jobs-head-search-icon" :size="14" :stroke-width="2.4" />
          <input v-model="searchQuery" aria-label="Search Jenkins jobs" placeholder="Search jobs" type="search" />
        </div>
        <div>Actions</div>
      </div>

      <div v-if="isLoading && !jobs.length" class="empty-state">Loading...</div>

      <div v-else-if="errorMessage && !jobs.length" class="empty-state danger">Request failed</div>

      <div v-else-if="!jobs.length" class="empty-state">No jobs</div>

      <div v-else-if="!filteredJobs.length" class="empty-state">No matching jobs</div>

      <div
        v-for="job in filteredJobs"
        :key="job.name"
        class="jobs-row jobs-row-link"
        role="link"
        tabindex="0"
        @click="openJob(job)"
        @keydown.enter.prevent="openJob(job)"
        @keydown.space.prevent="openJob(job)"
      >
        <div>
          <JenkinsStatusBadge :color="job.color" />
        </div>

        <span class="job-name" :title="job.name">
          {{ job.name }}
        </span>

        <div class="row-actions" @click.stop>
          <button
            v-if="job.canBuild"
            class="row-action-button build"
            :disabled="pendingAction === `build:${job.name}`"
            title="Build"
            @click.stop="openConfirm('build', job)"
          >
            <PlayCircle :size="18" :stroke-width="2.2" />
          </button>

          <button
            v-if="job.building"
            class="row-action-button stop"
            :disabled="pendingAction === `stop:${job.name}`"
            title="Stop"
            @click.stop="openConfirm('stop', job)"
          >
            <CircleStop :size="18" :stroke-width="2.2" />
          </button>

          <button
            v-if="!job.canBuild && !job.building"
            class="row-action-button refresh"
            :disabled="isLoading"
            title="Refresh"
            @click.stop="refreshJobs"
          >
            <RefreshCcw :size="17" :stroke-width="2.2" />
          </button>
        </div>
      </div>
    </section>
  </main>
</template>
