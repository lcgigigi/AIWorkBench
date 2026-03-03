<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useToastStore } from '../../stores/useToastStore'

const toast = useToastStore()
const { items } = storeToRefs(toast)
</script>

<template>
  <div class="host" aria-live="polite" aria-relevant="additions removals">
    <div v-for="t in items" :key="t.id" class="toast" :class="`toast--${t.variant}`" @click="toast.dismiss(t.id)">
      {{ t.text }}
    </div>
  </div>
</template>

<style scoped>
.host {
  position: fixed;
  top: 14px;
  right: 14px;
  z-index: 100;
  display: grid;
  gap: 10px;
}

.toast {
  max-width: 360px;
  padding: 10px 12px;
  border-radius: var(--wb-radius-md);
  border: 1px solid var(--wb-border);
  background: rgba(10, 16, 28, 0.92);
  color: var(--wb-text);
  box-shadow: var(--wb-shadow-card);
  cursor: pointer;
  font-size: 13px;
  line-height: 1.45;
}

.toast--success {
  border-color: rgba(141, 255, 202, 0.35);
}
.toast--warn {
  border-color: rgba(255, 217, 161, 0.35);
}
.toast--error {
  border-color: rgba(255, 180, 180, 0.45);
}
</style>

