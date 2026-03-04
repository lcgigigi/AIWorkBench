<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'default' | 'primary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'default',
    size: 'md',
    disabled: false,
    type: 'button',
  },
)

const cls = computed(() => [`btn`, `btn--${props.variant}`, `btn--${props.size}`])
</script>

<template>
  <button :type="type" :class="cls" :disabled="disabled">
    <slot />
  </button>
</template>

<style scoped>
.btn {
  border: 1px solid var(--wb-border);
  background: var(--wb-surface);
  color: var(--wb-text);
  border-radius: 10px;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease, transform 120ms ease, color 120ms ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 600;
  line-height: 1;
}

.btn--sm {
  min-height: var(--wb-control-height-sm);
  padding: 0 10px;
  font-size: 12px;
}

.btn--md {
  min-height: var(--wb-control-height-md);
  padding: 0 14px;
  font-size: 13px;
}

.btn:hover:not(:disabled) {
  border-color: #d1d5db;
  background: var(--wb-surface-2);
}

.btn:active:not(:disabled) {
  transform: translateY(1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn--ghost {
  background: transparent;
  color: var(--wb-text-muted);
}

.btn--ghost:hover:not(:disabled) {
  color: var(--wb-text);
}

.btn--primary {
  border-color: transparent;
  background: var(--wb-primary);
  color: #ffffff;
}

.btn--primary:hover:not(:disabled) {
  background: #5658dc;
}

.btn--danger {
  border-color: transparent;
  background: var(--wb-danger);
  color: #ffffff;
}

.btn--danger:hover:not(:disabled) {
  background: #dc2626;
}
</style>
