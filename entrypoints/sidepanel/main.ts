import { createApp } from 'vue';
import App from './App.vue';
import { router } from '@/src/router';
import { applyThemeMode, getJenkinsSettings } from '@/src/composables/useJenkinsSettings';
import './style.css';

getJenkinsSettings().then((settings) => {
  applyThemeMode(settings.theme);
});

createApp(App).use(router).mount('#app');
