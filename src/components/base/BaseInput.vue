<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: string
    type?: string
    placeholder?: string
    disabled?: boolean
  }>(),
  {
    type: 'text',
    placeholder: '',
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()
</script>

<template>
  <input
    class="ctl"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :value="modelValue"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

<style scoped>
.ctl {
  width: 100%;
  border-radius: var(--wb-radius-sm);
  padding: 9px 10px;
  border: 1px solid var(--wb-border);
  background: var(--wb-surface-2);
  color: var(--wb-text);
  outline: none;
}

.ctl:focus {
  border-color: rgba(141, 196, 255, 0.65);
  box-shadow: 0 0 0 3px rgba(141, 196, 255, 0.15);
}
</style>

