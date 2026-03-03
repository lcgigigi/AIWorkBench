<script setup lang="ts">
import BaseButton from '../../components/base/BaseButton.vue'
</script>

<template>
  <div class="wrap">
    <div class="badge">Coming soon</div>
    <div class="title">这里准备放一个新模块</div>
    <div class="desc">暂时先占位，你想好内容后我再帮你接入真实功能。</div>
    <div class="row">
      <BaseButton size="sm" variant="ghost" disabled>配置</BaseButton>
      <BaseButton size="sm" variant="ghost" disabled>添加</BaseButton>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.badge {
  width: fit-content;
  font-size: 12px;
  font-weight: 700;
  color: var(--wb-accent-blue-text);
  background: var(--wb-accent-blue);
  border-radius: 999px;
  padding: 4px 10px;
}

.title {
  font-size: 14px;
  font-weight: 700;
  color: var(--wb-text);
}

.desc {
  font-size: 13px;
  line-height: 1.5;
  color: var(--wb-text-muted);
}

.row {
  margin-top: auto;
  display: flex;
  gap: 10px;
}
</style>

