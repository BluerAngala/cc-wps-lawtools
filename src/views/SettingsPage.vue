<template>
  <div class="settings-root">
    <aside class="settings-sidebar">
      <div class="sidebar-title">设置</div>
      <nav class="sidebar-nav">
        <button
          v-for="t in tabs"
          :key="t.id"
          class="nav-item"
          :class="{ active: activeTab === t.id }"
          @click="activeTab = t.id"
        >
          <span class="nav-icon">{{ t.icon }}</span>
          <span class="nav-label">{{ t.label }}</span>
        </button>
      </nav>
    </aside>

    <main class="settings-body">
      <section v-show="activeTab === 'ai'" class="tab-content">
        <div class="section-head">
          <div>
            <h3>AI 服务</h3>
            <p class="section-desc">选择服务商后只需填 API Key 即可使用</p>
          </div>
          <div class="section-actions">
            <button class="sm-btn warn" @click="aiRef?.resetToDefault()">恢复默认</button>
            <button class="sm-btn" @click="aiRef?.refreshModelList()">刷新模型</button>
          </div>
        </div>
        <AIConfig ref="aiRef" />
      </section>

      <section v-show="activeTab === 'rag'" class="tab-content">
        <div class="section-head">
          <div>
            <h3>RAG 向量检索</h3>
            <p class="section-desc">启用后 AI 将自动检索相关上下文，提供更精准的答复</p>
          </div>
        </div>
        <RAGConfig />
      </section>

      <section v-show="activeTab === 'playbook'" class="tab-content">
        <div class="section-head">
          <div>
            <h3>审查策略</h3>
            <p class="section-desc">设定 AI 审查合同时的关注要点和回复风格</p>
          </div>
          <div class="section-actions">
            <button class="sm-btn warn" @click="playbookRef?.resetToDefault()">恢复默认</button>
          </div>
        </div>
        <PlaybookConfig ref="playbookRef" />
      </section>

      <section v-show="activeTab === 'kdocs'" class="tab-content">
        <div class="section-head">
          <div>
            <h3>金山文档对接</h3>
            <p class="section-desc">配置金山文档接口参数（Coze 工作流）</p>
          </div>
        </div>
        <KDocsConfig />
      </section>

      <section v-show="activeTab === 'keyword'" class="tab-content">
        <div class="section-head">
          <div>
            <h3>关键词批注方案</h3>
            <p class="section-desc">配置 AI 自动批注的关键词规则，支持多套方案</p>
          </div>
        </div>
        <RuleSchemeConfig
          ref="keywordRef"
          scheme-type="keyword"
          type-label="关键词批注"
        />
      </section>

      <section v-show="activeTab === 'review'" class="tab-content">
        <div class="section-head">
          <div>
            <h3>审查方案</h3>
            <p class="section-desc">配置 AI 合同审查的检查项，支持多套方案</p>
          </div>
        </div>
        <RuleSchemeConfig
          ref="reviewRef"
          scheme-type="review"
          type-label="审查"
          :field-labels="{ keyword: '审查类别', comment: '审查要求', suggestedText: '修订建议' }"
          :field-placeholders="{
            keyword: '如：付款条款',
            comment: '请 AI 审查的具体要求',
            suggestedText: '如：建议明确违约金比例'
          }"
        />
      </section>

      <section v-show="activeTab === 'data'" class="tab-content">
        <div class="section-head">
          <div>
            <h3>数据管理</h3>
            <p class="section-desc">导入导出配置、查看配置文件位置</p>
          </div>
        </div>
        <DataConfig />
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AIConfig from '@/components/settings/AIConfig.vue'
import RAGConfig from '@/components/settings/RAGConfig.vue'
import PlaybookConfig from '@/components/settings/PlaybookConfig.vue'
import KDocsConfig from '@/components/settings/KDocsConfig.vue'
import RuleSchemeConfig from '@/components/settings/RuleSchemeConfig.vue'
import DataConfig from '@/components/settings/DataConfig.vue'
import '@/components/settings/shared.css'

const tabs = [
  { id: 'ai', icon: '🤖', label: 'AI 服务' },
  { id: 'rag', icon: '🔍', label: 'RAG' },
  { id: 'playbook', icon: '📋', label: '审查策略' },
  { id: 'kdocs', icon: '📄', label: '金山文档' },
  { id: 'keyword', icon: '🏷️', label: '关键词批注' },
  { id: 'review', icon: '⚖️', label: '审查方案' },
  { id: 'data', icon: '💾', label: '数据管理' }
]

const activeTab = ref('ai')

// Refs for child components that need parent access (reset/refresh actions)
const aiRef = ref(null)
const playbookRef = ref(null)
const keywordRef = ref(null)
const reviewRef = ref(null)
</script>

<style scoped>
.settings-root {
  --c-brand: #1e3a8a;
  --c-brand-light: #2563eb;
  --c-accent: #2563eb;
  --c-accent-light: #dbeafe;
  --c-highlight: #f59e0b;
  --c-highlight-light: #fef3c7;
  --c-surface: #ffffff;
  --c-danger: #dc2626;
  --c-success: #16a34a;
  --c-text: #0a0a0a;
  --c-text2: #6b7280;
  --c-text3: #9ca3af;
  --c-border: #e5e7eb;
  --c-bg: #f9fafb;
  display: flex;
  flex-direction: row;
  height: 100vh;
  background: var(--c-bg);
  color: var(--c-text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.settings-sidebar {
  width: 180px;
  background: #fff;
  border-right: 1px solid var(--c-border);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}
.sidebar-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--c-text3);
  padding: 16px 18px 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 0 8px;
  flex: 1;
  overflow-y: auto;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--c-text);
  text-align: left;
  transition: all 0.15s;
  margin-bottom: 2px;
  width: 100%;
  box-sizing: border-box;
}
.nav-item:hover {
  background: #f3f4f6;
}
.nav-item.active {
  background: var(--c-accent-light);
  color: var(--c-accent);
  font-weight: 600;
}
.nav-icon {
  font-size: 15px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}
.nav-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.settings-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 22px 16px;
  min-width: 0;
}

.tab-content {
  max-width: 760px;
  margin: 0 auto;
  padding-top: 16px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--c-bg);
  padding: 12px 0 10px;
  margin: -12px 0 16px;
  border-bottom: 1px solid var(--c-border);
}
.section-head h3 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 700;
  color: var(--c-text);
}
.section-desc {
  margin: 0;
  font-size: 12px;
  color: var(--c-text2);
}
</style>
