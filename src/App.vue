<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BorderBackground from './components/ambient/BorderBackground.vue'
import BaseToast from './components/base/BaseToast.vue'

const route = useRoute()
const isFullBleed = computed(() => route.meta.fullBleed === true)
</script>

<template>
  <BorderBackground />
  <div class="app-content" :class="{ 'app-content--full': isFullBleed }">
    <router-view />
  </div>
  <BaseToast />
</template>

<style scoped>
.app-content {
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
}

.app-content--full {
  display: block;
  height: 100vh;
}
</style>
