<script setup lang="ts">
import { Check, Info, TriangleAlert, X } from '@lucide/vue';
import { useToasts } from '@/src/composables/useToast';

const { toasts, dismissToast } = useToasts();
</script>

<template>
  <div class="toast-stack" aria-live="polite" aria-atomic="true">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="toast-item"
      :data-type="toast.type"
      role="status"
    >
      <span class="toast-icon" aria-hidden="true">
        <Check v-if="toast.type === 'success'" :size="14" :stroke-width="3" />
        <TriangleAlert v-else-if="toast.type === 'error'" :size="14" :stroke-width="2.6" />
        <Info v-else :size="14" :stroke-width="2.8" />
      </span>
      <p class="toast-message">{{ toast.message }}</p>
      <button class="toast-close" title="关闭" type="button" @click="dismissToast(toast.id)">
        <X :size="14" :stroke-width="2.4" />
      </button>
    </div>
  </div>
</template>
