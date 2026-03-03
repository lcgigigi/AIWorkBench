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
  border-radius: var(--wb-radius-sm);
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease, transform 120ms ease;
}

.btn--sm {
  padding: 6px 10px;
  font-size: 12px;
}

.btn--md {
  padding: 8px 12px;
  font-size: 13px;
}

.btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
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
}

.btn--primary {
  border-color: rgba(141, 196, 255, 0.55);
  background: var(--wb-primary-weak);
}

.btn--primary:hover:not(:disabled) {
  background: rgba(141, 196, 255, 0.22);
}

.btn--danger {
  border-color: rgba(255, 180, 180, 0.45);
  background: var(--wb-danger-weak);
}

.btn--danger:hover:not(:disabled) {
  background: rgba(255, 180, 180, 0.18);
}
</style>

