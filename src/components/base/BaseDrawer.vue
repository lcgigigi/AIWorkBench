<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    width?: number
    maxWidthVw?: number
    dismissible?: boolean
  }>(),
  {
    width: 480,
    maxWidthVw: 92,
    dismissible: true,
  },
)

const emit = defineEmits<{
  (e: 'close'): void
}>()

const style = computed(() => ({
  width: `${props.width}px`,
  maxWidth: `${props.maxWidthVw}vw`,
}))

function onBackdrop() {
  if (!props.dismissible) return
  emit('close')
}
</script>

<template>
  <div v-if="open">
    <div class="backdrop" @click="onBackdrop" />
    <section class="panel" :style="style">
      <slot />
    </section>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 30;
}

.panel {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  z-index: 40;
  border-left: 1px solid var(--wb-border);
  background: rgba(10, 16, 28, 0.96);
  backdrop-filter: blur(14px);
  box-shadow: var(--wb-shadow-panel);
  animation: slideIn 160ms ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(12px);
    opacity: 0.5;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>

