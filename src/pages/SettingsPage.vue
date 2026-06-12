<script setup lang="ts">
import { ArrowLeft, Info } from '@lucide/vue';
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  getJenkinsSettings,
  isJenkinsSettingsReady,
  saveJenkinsSettings,
} from '@/src/composables/useJenkinsSettings';
import { showToast } from '@/src/composables/useToast';

const router = useRouter();
const form = reactive({
  host: '',
  user: '',
  token: '',
});
const isSaving = ref(false);
const canReturn = ref(false);

async function saveSettings() {
  isSaving.value = true;

  try {
    await saveJenkinsSettings(form);
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
  canReturn.value = isJenkinsSettingsReady(settings);
});
</script>

<template>
  <main class="panel-page">
    <header class="app-header">
      <div>
        <h1>设置</h1>
        <p>Jenkins 连接信息</p>
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

      <div class="form-actions">
        <button class="button save-button" :disabled="isSaving" type="submit">
          {{ isSaving ? '保存中...' : '保存' }}
        </button>
      </div>
    </form>
  </main>
</template>
