<script setup lang="ts">
import { ArrowLeft, Info, Monitor, Moon, Sun } from '@lucide/vue';
import { onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  applyThemeMode,
  getJenkinsSettings,
  isJenkinsSettingsReady,
  saveJenkinsSettings,
  saveThemeMode,
} from '@/src/composables/useJenkinsSettings';
import { showToast } from '@/src/composables/useToast';
import type { ThemeMode } from '@/src/types/jenkins';

const router = useRouter();
const form = reactive({
  host: '',
  user: '',
  token: '',
  theme: 'auto' as ThemeMode,
  jobFilters: '',
});
const isSaving = ref(false);
const canReturn = ref(false);
let isSettingsLoaded = false;

async function saveSettings() {
  isSaving.value = true;

  try {
    await saveJenkinsSettings(form);
    applyThemeMode(form.theme);
    showToast({ type: 'success', message: 'Jenkins 配置已保存' });
    await router.replace('/');
  } catch (error) {
    showToast({
      type: 'error',
      message: error instanceof Error ? error.message : '保存失败',
    });
  } finally {
    isSaving.value = false;
  }
}

function goBack() {
  if (!canReturn.value) {
    showToast({ type: 'info', message: '请先保存 Jenkins 配置' });
    return;
  }

  router.replace('/');
}

onMounted(async () => {
  const settings = await getJenkinsSettings();
  form.host = settings.host;
  form.user = settings.user;
  form.token = settings.token;
  form.theme = settings.theme;
  form.jobFilters = settings.jobFilters;
  applyThemeMode(settings.theme);
  canReturn.value = isJenkinsSettingsReady(settings);
  isSettingsLoaded = true;
});

watch(
  () => form.theme,
  async (theme) => {
    applyThemeMode(theme);

    if (isSettingsLoaded) {
      await saveThemeMode(theme);
    }
  },
);
</script>

<template>
  <main class="panel-page">
    <header class="app-header">
      <div>
        <h1>Settings</h1>
        <p>Connection, display, filters</p>
      </div>

      <button
        class="icon-button"
        :class="{ disabled: !canReturn }"
        :title="canReturn ? '返回列表' : '请先保存 Jenkins 配置'"
        type="button"
        @click="goBack"
      >
        <ArrowLeft :size="16" :stroke-width="2.4" />
      </button>
    </header>

    <form class="settings-form" @submit.prevent="saveSettings">
      <section class="settings-section" aria-label="Jenkins 连接设置">
        <div class="section-title">
          <h2>Jenkins Connection</h2>
          <p>Required for Jenkins API requests</p>
        </div>

        <div class="section-fields">
          <label class="field">
            <span class="field-label">
              <span>Jenkins Host <span class="required-mark">*</span></span>
              <span class="field-info" tabindex="0" aria-label="Jenkins 服务地址，用于读取任务列表、队列和触发构建。">
                <Info :size="14" :stroke-width="2.4" />
                <span class="field-tooltip" role="tooltip">Jenkins 服务地址，用于读取任务列表、队列和触发构建。</span>
              </span>
            </span>
            <input v-model="form.host" placeholder="https://jenkins.example.com" type="url" />
          </label>

          <label class="field">
            <span class="field-label">
              <span>User Name <span class="required-mark">*</span></span>
              <span class="field-info" tabindex="0" aria-label="Jenkins 用户名，用于 Basic Auth 请求 Jenkins API。">
                <Info :size="14" :stroke-width="2.4" />
                <span class="field-tooltip" role="tooltip">Jenkins 用户名，用于 Basic Auth 请求 Jenkins API。</span>
              </span>
            </span>
            <input v-model="form.user" autocomplete="username" placeholder="user name" />
          </label>

          <label class="field">
            <span class="field-label">
              <span>API Token <span class="required-mark">*</span></span>
              <span class="field-info" tabindex="0" aria-label="Jenkins API Token，用于刷新任务、构建和停止任务。">
                <Info :size="14" :stroke-width="2.4" />
                <span class="field-tooltip" role="tooltip">Jenkins API Token，用于刷新任务、构建和停止任务。</span>
              </span>
            </span>
            <input v-model="form.token" autocomplete="current-password" placeholder="api token" type="password" />
          </label>
        </div>
      </section>

      <section class="settings-section" aria-label="外观设置">
        <div class="section-title">
          <h2>Display</h2>
          <p>Theme applies immediately</p>
        </div>

        <div class="segmented-control" role="radiogroup" aria-label="主题">
          <label>
            <input v-model="form.theme" type="radio" value="auto" />
            <span><Monitor :size="14" :stroke-width="2.4" />Auto</span>
          </label>
          <label>
            <input v-model="form.theme" type="radio" value="light" />
            <span><Sun :size="14" :stroke-width="2.4" />Light</span>
          </label>
          <label>
            <input v-model="form.theme" type="radio" value="dark" />
            <span><Moon :size="14" :stroke-width="2.4" />Dark</span>
          </label>
        </div>
      </section>

      <section class="settings-section" aria-label="Job 过滤设置">
        <div class="section-title">
          <h2>Job Filter</h2>
          <p>Only show jobs matching these keywords</p>
        </div>

        <label class="field">
          <span class="field-label">
            <span>Keywords</span>
            <span class="field-info" tabindex="0" aria-label="一行一个关键词，或用逗号分隔。留空展示全部 Job。">
              <Info :size="14" :stroke-width="2.4" />
              <span class="field-tooltip" role="tooltip">一行一个关键词，或用逗号分隔。留空展示全部 Job。</span>
            </span>
          </span>
          <textarea v-model="form.jobFilters" placeholder="frontend&#10;deploy, production" rows="4" />
        </label>
      </section>

      <div class="form-actions">
        <button class="button save-button" :disabled="isSaving" type="submit">
          {{ isSaving ? '保存中...' : '保存' }}
        </button>
      </div>
    </form>
  </main>
</template>
