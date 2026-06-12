<script setup lang="ts">
import {
  Ban,
  CheckCircle,
  CircleDashed,
  CircleOff,
  HelpCircle,
  LoaderCircle,
  TriangleAlert,
  XCircle,
} from '@lucide/vue';
import { computed } from 'vue';
import { getJenkinsStatus } from '@/src/composables/useJenkinsStatus';

const props = defineProps<{
  color: string;
}>();

const status = computed(() => getJenkinsStatus(props.color));

const statusIcon = computed(() => {
  const color = props.color.toLowerCase();

  if (color.endsWith('_anime')) return LoaderCircle;
  if (color === 'blue') return CheckCircle;
  if (color === 'red') return XCircle;
  if (color === 'yellow') return TriangleAlert;
  if (color === 'disabled') return Ban;
  if (color === 'aborted') return CircleOff;
  if (color === 'grey' || color === 'notbuilt') return CircleDashed;

  return HelpCircle;
});
</script>

<template>
  <span class="status-badge" :data-tone="status.tone">
    <component
      :is="statusIcon"
      class="status-icon"
      :class="{ spinning: status.spinning }"
      :size="13"
      :stroke-width="2.2"
    />
    <span class="status-text">{{ status.label }}</span>
  </span>
</template>
