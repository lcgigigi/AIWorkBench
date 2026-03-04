<script setup lang="ts">
import BorderBackground from './components/ambient/BorderBackground.vue'
import BaseToast from './components/base/BaseToast.vue'
</script>

<template>
  <BorderBackground />
  <div class="app-content">
    <router-view />
  </div>
  <BaseToast />
</template>

<style scoped>
.app-content {
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  justify-content: center;
}
</style>
