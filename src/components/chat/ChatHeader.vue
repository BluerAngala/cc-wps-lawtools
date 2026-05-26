<template>
  <header class="chat-header">
    <div class="header-left">
      <div class="brand-badge">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 3v18m-6-4l6 4 6-4M6 7l6-4 6 4" />
        </svg>
      </div>
      <div class="header-info">
        <h1 class="header-title">AI 法律助手</h1>
        <p v-if="docInfo" class="header-sub">当前文档：{{ docInfo }}</p>
        <p v-else class="header-sub warn">未检测到文档</p>
      </div>
    </div>
    <div class="header-right">
      <button class="hdr-btn" @click="$emit('refreshDoc')" title="刷新文档上下文">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      </button>
      <button class="hdr-btn settings-btn" @click="$emit('toggleSettings')" title="助手设置">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
          />
        </svg>
      </button>
      <button class="hdr-btn" @click="$emit('clear')" title="清空对话">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="3 6 5 6 21 6" />
          <path
            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
          />
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup>
defineProps({
  docInfo: { type: String, default: null }
})

defineEmits(['refreshDoc', 'clear', 'toggleSettings'])
</script>

<style scoped>
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  flex-shrink: 0;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.brand-badge {
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-highlight);
}
.header-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  white-space: nowrap;
}
.header-info {
  min-width: 0;
}
.header-sub {
  font-size: 11px;
  margin: 2px 0 0;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;
}
.header-sub.warn {
  color: #f5c518;
  opacity: 1;
}
.header-right {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.hdr-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.hdr-btn:hover {
  background: rgba(255, 255, 255, 0.18);
}
.settings-btn {
  background: rgba(255, 255, 255, 0.13);
}
.settings-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}
</style>
