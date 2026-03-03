<script setup lang="ts">
import { useWorkbenchStore } from '../stores/useWorkbenchStore'
import WidgetGrid from '../widgets/WidgetGrid.vue'
import TaskPanel from '../panels/TaskPanel/TaskPanel.vue'
import BaseButton from '../components/base/BaseButton.vue'
import LeftSidebar from './LeftSidebar.vue'

const wb = useWorkbenchStore()
</script>

<template>
  <div class="wb-root">
    <!-- Decorative background elements -->
    <div class="decor-circle-1"></div>
    <div class="decor-circle-2"></div>

    <LeftSidebar />

    <div class="wb-content">
      <header class="wb-topbar">
        <div class="wb-greeting-wrap">
          <div class="avatar">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 36c9.941 0 18-8.059 18-18S27.941 0 18 0 0 8.059 0 18s8.059 18 18 18z" fill="url(#paint0_linear)"/>
              <path d="M22.5 15.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm-9 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18 26c-3.5 0-6.5-2-7.5-5h15c-1 3-4 5-7.5 5z" fill="#fff"/>
              <defs>
                <linearGradient id="paint0_linear" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#FF9A9E" />
                  <stop offset="1" stop-color="#FECFEF" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div class="wb-greeting">
            <h1>晚上好，同学 👋</h1>
            <p>欢迎回到你的工作台。</p>
          </div>
        </div>
        <div class="wb-top-actions">
          <div class="search-bar">
            <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input type="text" placeholder="搜索任务、操作…" />
          </div>
          <BaseButton class="task-btn" variant="ghost" size="sm" @click="wb.openTaskPanel()">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </BaseButton>
        </div>
      </header>

      <main class="wb-main">
        <WidgetGrid />
      </main>
    </div>

    <!-- Modal Task Panel -->
    <TaskPanel />
  </div>
</template>

<style scoped>
.wb-root {
  width: 95vw;
  height: 95vh;
  background: var(--wb-bg);
  color: var(--wb-text);
  display: flex;
  border-radius: var(--wb-radius-xl);
  overflow: hidden;
  box-shadow: var(--wb-shadow-lg);
  position: relative;
}

/* Decorative background blobs to make it lively */
.decor-circle-1 {
  position: absolute;
  top: -100px;
  left: 200px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(236,72,153,0.08) 0%, rgba(236,72,153,0) 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}
.decor-circle-2 {
  position: absolute;
  bottom: -150px;
  right: -50px;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0) 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.wb-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  z-index: 1;
}

.wb-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px;
}

.wb-greeting-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(255, 154, 158, 0.4);
}

.wb-greeting h1 {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  color: var(--wb-text);
  letter-spacing: -0.02em;
}

.wb-greeting p {
  margin: 4px 0 0;
  color: var(--wb-text-muted);
  font-size: 13px;
}

.wb-top-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-bar {
  position: relative;
  width: 240px;
}

.search-bar input {
  width: 100%;
  padding: 10px 16px 10px 42px;
  border-radius: 99px;
  border: 1px solid transparent;
  background: var(--wb-surface);
  color: var(--wb-text);
  font-size: 13px;
  outline: none;
  box-shadow: var(--wb-shadow-sm);
  transition: all 0.2s ease;
}

.search-bar input:focus {
  border-color: var(--wb-primary-weak);
  box-shadow: 0 0 0 3px var(--wb-primary-weak);
}

.search-bar input::placeholder {
  color: var(--wb-text-muted);
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--wb-text-muted);
}

.icon {
  width: 24px;
  height: 24px;
}

.task-btn {
  background: var(--wb-surface);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--wb-shadow-sm);
  color: var(--wb-primary);
}
.task-btn:hover {
  background: var(--wb-primary-weak);
}

.wb-main {
  padding: 0 32px 32px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
