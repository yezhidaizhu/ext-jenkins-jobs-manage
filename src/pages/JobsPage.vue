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
import { getJenkinsSettings, isJenkinsSettingsReady } from '@/src/composables/useJenkinsSettings';
import { showToast } from '@/src/composables/useToast';
import type { JobItem } from '@/src/types/jenkins';

const router = useRouter();
const jobs = ref<JobItem[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');
const pendingAction = ref('');
const searchQuery = ref('');
const confirmJob = ref<JobItem | null>(null);
const confirmType = ref<'build' | 'stop' | null>(null);
const host = ref('');
let pollTimer: number | undefined;

const filteredJobs = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();

  if (!keyword) return jobs.value;

  return jobs.value.filter((job) => job.name.toLowerCase().includes(keyword));
});

async function refreshJobs() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    jobs.value = await getJobs();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '获取任务失败';
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
      showToast({ type: 'success', message: `已触发构建: ${job.name}` });
    } else {
      await stopBuild(job.name);
      showToast({ type: 'success', message: `已停止任务: ${job.name}` });
    }

    window.setTimeout(refreshJobs, 300);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '操作失败';
    showToast({ type: 'error', message: errorMessage.value });
  } finally {
    pendingAction.value = '';
  }
}

function openJenkins() {
  if (!host.value) {
    showToast({ type: 'info', message: '请先配置 Jenkins Host' });
    return;
  }

  window.open(host.value, '_blank');
}

onMounted(async () => {
  const settings = await getJenkinsSettings();
  host.value = settings.host;

  if (!isJenkinsSettingsReady(settings)) {
    showToast({ type: 'info', message: '请先配置 Jenkins' });
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
        <p>{{ jobs.length }} jobs</p>
      </div>

      <nav class="toolbar" aria-label="工具栏">
        <button class="icon-button" :disabled="isLoading" title="刷新" @click="refreshJobs">
          <RefreshCw :class="{ spinning: isLoading }" :size="16" :stroke-width="2.3" />
        </button>
        <button class="icon-button" title="打开 Jenkins" @click="openJenkins">
          <ExternalLink :size="16" :stroke-width="2.3" />
        </button>
        <RouterLink class="icon-button" title="设置" to="/settings">
          <Settings :size="16" :stroke-width="2.3" />
        </RouterLink>
      </nav>
    </header>

    <section v-if="errorMessage" class="notice danger">
      {{ errorMessage }}
    </section>

    <section v-if="confirmJob" class="modal-backdrop" @click.self="closeConfirm">
      <div class="confirm-dialog" :data-type="confirmType" role="dialog" aria-modal="true">
        <button class="dialog-close" title="关闭" type="button" @click="closeConfirm">
          <X :size="15" :stroke-width="2.4" />
        </button>

        <div class="confirm-body">
          <div class="confirm-icon" aria-hidden="true">
            <PlayCircle v-if="confirmType === 'build'" :size="22" :stroke-width="2.3" />
            <CircleStop v-else :size="22" :stroke-width="2.3" />
          </div>

          <div class="confirm-content">
            <h2>{{ confirmType === 'build' ? '确认构建？' : '确认停止？' }}</h2>
            <p class="confirm-message">
              {{
                confirmType === 'build'
                  ? '将立即加入 Jenkins 构建队列。'
                  : '将立即停止正在执行的构建。'
              }}
            </p>
            <p class="confirm-job" :title="confirmJob.name">{{ confirmJob.name }}</p>
          </div>
        </div>

        <div class="confirm-actions">
          <button class="button muted" type="button" @click="closeConfirm">取消</button>
          <button class="button" :class="{ danger: confirmType === 'stop' }" type="button" @click="runConfirmedAction">
            {{ confirmType === 'build' ? '确认构建' : '确认停止' }}
          </button>
        </div>
      </div>
    </section>

    <section class="jobs-table" aria-label="Jenkins jobs">
      <div class="jobs-row jobs-head">
        <div>状态</div>
        <div class="jobs-head-search">
          <Search class="jobs-head-search-icon" :size="14" :stroke-width="2.4" />
          <input v-model="searchQuery" aria-label="搜索 Jenkins Job" placeholder="Search jobs" type="search" />
        </div>
        <div>操作</div>
      </div>

      <div v-if="isLoading && !jobs.length" class="empty-state">加载中...</div>

      <div v-else-if="errorMessage && !jobs.length" class="empty-state danger">请求失败</div>

      <div v-else-if="!jobs.length" class="empty-state">暂无任务</div>

      <div v-else-if="!filteredJobs.length" class="empty-state">无匹配任务</div>

      <div v-for="job in filteredJobs" :key="job.name" class="jobs-row">
        <div>
          <JenkinsStatusBadge :color="job.color" />
        </div>

        <a class="job-name" :href="job.url" :title="job.name" target="_blank">
          {{ job.name }}
        </a>

        <div class="row-actions">
          <button
            v-if="job.canBuild"
            class="row-action-button build"
            :disabled="pendingAction === `build:${job.name}`"
            title="构建"
            @click="openConfirm('build', job)"
          >
            <PlayCircle :size="18" :stroke-width="2.2" />
          </button>

          <button
            v-if="job.building"
            class="row-action-button stop"
            :disabled="pendingAction === `stop:${job.name}`"
            title="停止"
            @click="openConfirm('stop', job)"
          >
            <CircleStop :size="18" :stroke-width="2.2" />
          </button>

          <button
            v-if="!job.canBuild && !job.building"
            class="row-action-button refresh"
            :disabled="isLoading"
            title="刷新"
            @click="refreshJobs"
          >
            <RefreshCcw :size="17" :stroke-width="2.2" />
          </button>
        </div>
      </div>
    </section>
  </main>
</template>
