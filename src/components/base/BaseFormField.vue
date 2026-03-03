<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    required?: boolean
    error?: string | null
  }>(),
  { required: false, error: null },
)
</script>

<template>
  <div class="field" :class="{ hasError: !!error }">
    <div class="label">
      <span>{{ label }}</span>
      <span v-if="required" class="req">*</span>
    </div>
    <div class="control">
      <slot />
    </div>
    <div v-if="error" class="err">{{ error }}</div>
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: 6px;
}

.label {
  font-size: 12px;
  color: var(--wb-text-muted);
}

.req {
  margin-left: 6px;
  color: var(--wb-danger);
}

.err {
  font-size: 12px;
  color: var(--wb-danger);
}

.hasError :deep(.ctl),
.hasError :deep(.control) {
  border-color: rgba(255, 180, 180, 0.55);
}
</style>

