<script setup lang="ts">
import { ArrowLeft, Info, Monitor, Moon, Sun } from '@lucide/vue';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  applyThemeMode,
  getJenkinsSettings,
  isJenkinsSettingsReady,
  saveJobFilters,
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

const isConnectionReady = computed(() => Boolean(form.host && form.user && form.token));

async function saveSettings() {
  isSaving.value = true;

  try {
    await saveJenkinsSettings(form);
    applyThemeMode(form.theme);
    showToast({ type: 'success', message: 'Jenkins settings saved' });
    await router.replace('/');
  } catch (error) {
    showToast({
      type: 'error',
      message: error instanceof Error ? error.message : 'Save failed',
    });
  } finally {
    isSaving.value = false;
  }
}

function goBack() {
  if (!canReturn.value) {
    showToast({ type: 'info', message: 'Save Jenkins settings first' });
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

watch(
  () => form.jobFilters,
  async (jobFilters) => {
    if (isSettingsLoaded) {
      await saveJobFilters(jobFilters);
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
        :title="canReturn ? 'Back to jobs' : 'Save Jenkins settings first'"
        type="button"
        @click="goBack"
      >
        <ArrowLeft :size="16" :stroke-width="2.4" />
      </button>
    </header>

    <form class="settings-form" @submit.prevent="saveSettings">
      <section class="settings-section" aria-label="Jenkins connection settings">
        <div class="section-title">
          <h2>Jenkins Connection</h2>
          <p>Required for Jenkins API requests</p>
        </div>

        <div v-if="!isConnectionReady" class="setup-alert">
          <Info :size="16" :stroke-width="2.5" />
          <span>Enter Jenkins Host, User Name, and API Token first.</span>
        </div>

        <div class="section-fields">
          <label class="field">
            <span class="field-label">
              <span>Jenkins Host <span class="required-mark">*</span></span>
              <span class="field-info" tabindex="0" aria-label="Jenkins server URL for loading jobs, checking the queue, and triggering builds.">
                <Info :size="14" :stroke-width="2.4" />
                <span class="field-tooltip" role="tooltip">Jenkins server URL for loading jobs, checking the queue, and triggering builds.</span>
              </span>
            </span>
            <input v-model="form.host" placeholder="https://jenkins.example.com" type="url" />
          </label>

          <label class="field">
            <span class="field-label">
              <span>User Name <span class="required-mark">*</span></span>
              <span class="field-info" tabindex="0" aria-label="Jenkins username for Basic Auth requests to the Jenkins API.">
                <Info :size="14" :stroke-width="2.4" />
                <span class="field-tooltip" role="tooltip">Jenkins username for Basic Auth requests to the Jenkins API.</span>
              </span>
            </span>
            <input v-model="form.user" autocomplete="username" placeholder="user name" />
          </label>

          <label class="field">
            <span class="field-label">
              <span>API Token <span class="required-mark">*</span></span>
              <span class="field-info" tabindex="0" aria-label="Jenkins API Token for refreshing jobs, triggering builds, and stopping builds.">
                <Info :size="14" :stroke-width="2.4" />
                <span class="field-tooltip" role="tooltip">Jenkins API Token for refreshing jobs, triggering builds, and stopping builds.</span>
              </span>
            </span>
            <input v-model="form.token" autocomplete="current-password" placeholder="api token" type="password" />
          </label>
        </div>

        <div class="form-actions">
          <button class="button save-button" :disabled="isSaving" type="submit">
            {{ isSaving ? 'Saving...' : 'Save Connection' }}
          </button>
        </div>
      </section>

      <section class="settings-section display-section" aria-label="Display settings">
        <div class="section-title">
          <h2>Theme</h2>
          <p>Applies immediately</p>
        </div>

        <div class="segmented-control" role="radiogroup" aria-label="Theme">
          <label>
            <input v-model="form.theme" type="radio" value="auto" />
            <span title="Auto"><Monitor :size="14" :stroke-width="2.4" /></span>
          </label>
          <label>
            <input v-model="form.theme" type="radio" value="light" />
            <span title="Light"><Sun :size="14" :stroke-width="2.4" /></span>
          </label>
          <label>
            <input v-model="form.theme" type="radio" value="dark" />
            <span title="Dark"><Moon :size="14" :stroke-width="2.4" /></span>
          </label>
        </div>
      </section>

      <section class="settings-section" aria-label="Job filter settings">
        <div class="section-title">
          <h2>Job Filter</h2>
          <p>Only show jobs matching these keywords</p>
        </div>

        <label class="field">
          <span class="field-label">
            <span>Keywords</span>
            <span class="field-info" tabindex="0" aria-label="One keyword per line, or separate keywords with commas. Leave empty to show all jobs.">
              <Info :size="14" :stroke-width="2.4" />
              <span class="field-tooltip" role="tooltip">One keyword per line, or separate keywords with commas. Leave empty to show all jobs.</span>
            </span>
          </span>
          <textarea v-model="form.jobFilters" placeholder="frontend&#10;deploy, production" rows="4" />
        </label>
      </section>

    </form>
  </main>
</template>
