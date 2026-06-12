import { createMemoryHistory, createRouter } from 'vue-router';
import JobsPage from '@/src/pages/JobsPage.vue';
import SettingsPage from '@/src/pages/SettingsPage.vue';

export const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      component: JobsPage,
    },
    {
      path: '/settings',
      component: SettingsPage,
    },
  ],
});
