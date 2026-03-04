<template>
  <section class="page">
    <article class="hero">
      <div class="badge">Roadmap</div>
      <h2>更多业务流程即将上线</h2>
      <p>你可以先使用左侧「所有功能」中的请假流程，其余能力会逐步从 mock 升级。</p>
    </article>

    <div class="grid">
      <article class="card">
        <h3>销假流程</h3>
        <p>支持提前返岗后的销假确认，并关联原请假单。</p>
      </article>
      <article class="card">
        <h3>加班申请</h3>
        <p>支持填写加班事由、时段和审批人，形成任务追踪链路。</p>
      </article>
      <article class="card">
        <h3>调休申请</h3>
        <p>支持按可用时长申请调休并校验时间冲突。</p>
      </article>
      <article class="card">
        <h3>任务归档中心</h3>
        <p>统一展示已完成任务和失败任务，支持筛选与复盘。</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.page {
  height: 100%;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero {
  border-radius: var(--wb-radius-lg);
  background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%);
  border: 1px solid var(--wb-border);
  padding: 16px;
}

.badge {
  width: fit-content;
  font-size: 12px;
  font-weight: 700;
  color: var(--wb-accent-blue-text);
  background: var(--wb-accent-blue);
  min-height: var(--wb-chip-height);
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
}

h2 {
  margin: 10px 0 0;
  font-size: 22px;
  line-height: 1.2;
  color: var(--wb-text);
}

p {
  margin: 8px 0 0;
  color: var(--wb-text-muted);
  font-size: 13px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.card {
  border-radius: var(--wb-radius-lg);
  background: var(--wb-surface);
  border: 1px solid var(--wb-border);
  box-shadow: var(--wb-shadow-sm);
  padding: 12px;
}

.card h3 {
  margin: 0;
  font-size: 15px;
  color: var(--wb-text);
}

.card p {
  margin-top: 8px;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
