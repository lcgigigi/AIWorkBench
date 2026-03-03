<script setup lang="ts">
withDefaults(
  defineProps<{
    padded?: boolean
  }>(),
  { padded: true },
)
</script>

<template>
  <section class="card" :class="{ padded }">
    <slot />
  </section>
</template>

<style scoped>
.card {
  border: 1px solid var(--wb-border);
  border-radius: var(--wb-radius-lg);
  background: var(--wb-surface);
}

.padded {
  padding: var(--wb-space-3);
}
</style>

