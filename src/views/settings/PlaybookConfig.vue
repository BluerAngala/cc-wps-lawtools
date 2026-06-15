<template>
  <div>
    <div class="pb-section sec-danger">
      <div class="pb-label" @click="sections.positions = !sections.positions">
        <span>🔍 审查要点（{{ playbook.positions.length }}）</span>
        <span class="toggle-icon">{{ sections.positions ? '▾' : '▸' }}</span>
      </div>
      <Transition name="collapse">
        <div v-if="sections.positions" class="section-body">
          <button class="add-btn" @click="addPosition">+ 添加审查要点</button>
          <div v-for="(pos, idx) in playbook.positions" :key="pos.id" class="acc-card">
            <div class="acc-head" @click="toggleExpand('pos', pos.id)">
              <span class="acc-title">
                <span :class="['sev-dot', pos.severity]"></span>
                {{ pos.category || '未命名' }}
              </span>
              <span class="acc-actions">
                <button class="del-btn-sm" @click.stop="removePosition(idx)" title="删除">×</button>
                <span class="acc-arrow">{{ expanded.pos === pos.id ? '▾' : '▸' }}</span>
              </span>
            </div>
            <Transition name="collapse">
              <div v-if="expanded.pos === pos.id" class="acc-body">
                <div class="pb-field">
                  <label>条款类别</label>
                  <input v-model="pos.category" class="text-input" placeholder="如：违约金条款" />
                </div>
                <div class="pb-field">
                  <label>我方底线</label>
                  <textarea v-model="pos.standardPosition" rows="2" class="text-input" placeholder="我方对该条款的基本立场"></textarea>
                </div>
                <div class="pb-field">
                  <label>可接受范围</label>
                  <input v-model="pos.acceptableRange" class="text-input" placeholder="可以接受的妥协范围" />
                </div>
                <div class="pb-field">
                  <label>必须预警的情况</label>
                  <input v-model="pos.escalationTrigger" class="text-input" placeholder="遇到这些情况必须提醒我" />
                </div>
                <div class="pb-field">
                  <label>重要程度</label>
                  <select v-model="pos.severity" class="text-input">
                    <option value="high">🔴 高 — 必须关注</option>
                    <option value="medium">🟡 中 — 建议关注</option>
                    <option value="low">🟢 低 — 可忽略</option>
                  </select>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </div>

    <div class="pb-section sec-primary">
      <div class="pb-label" @click="sections.nda = !sections.nda">
        <span>🔒 保密协议偏好</span>
        <span class="toggle-icon">{{ sections.nda ? '▾' : '▸' }}</span>
      </div>
      <Transition name="collapse">
        <div v-if="sections.nda" class="section-body">
          <div class="pb-field">
            <label>是否要求互负保密义务</label>
            <select v-model="playbook.ndaDefaults.mutualRequired" class="text-input">
              <option :value="true">是 — 双方均有保密义务</option>
              <option :value="false">否 — 可接受单方保密</option>
            </select>
          </div>
          <div class="pb-field">
            <label>标准保密期限</label>
            <input v-model="playbook.ndaDefaults.standardTerm" class="text-input" placeholder="如：2-3年" />
          </div>
          <div class="pb-field">
            <label>商业秘密保密期限</label>
            <input v-model="playbook.ndaDefaults.tradeSecretTerm" class="text-input" placeholder="如：5年" />
          </div>
          <div class="pb-field">
            <label>例外条款范围</label>
            <select v-model="playbook.ndaDefaults.standardCarveouts" class="text-input">
              <option value="narrowly-scoped">窄 — 仅法定例外</option>
              <option value="broadly-scoped">宽 — 含已有信息例外</option>
              <option value="none">不设例外</option>
            </select>
          </div>
        </div>
      </Transition>
    </div>

    <div class="pb-section sec-accent">
      <div class="pb-label" @click="sections.templates = !sections.templates">
        <span>💬 常用回复（{{ playbook.responseTemplates.length }}）</span>
        <span class="toggle-icon">{{ sections.templates ? '▾' : '▸' }}</span>
      </div>
      <Transition name="collapse">
        <div v-if="sections.templates" class="section-body">
          <button class="add-btn" @click="addTemplate">+ 添加回复模板</button>
          <div v-for="(tpl, idx) in playbook.responseTemplates" :key="tpl.id" class="acc-card">
            <div class="acc-head" @click="toggleExpand('tpl', tpl.id)">
              <span class="acc-title">{{ tpl.name || '未命名回复' }}</span>
              <span class="acc-actions">
                <button class="del-btn-sm" @click.stop="removeTemplate(idx)" title="删除">×</button>
                <span class="acc-arrow">{{ expanded.tpl === tpl.id ? '▾' : '▸' }}</span>
              </span>
            </div>
            <Transition name="collapse">
              <div v-if="expanded.tpl === tpl.id" class="acc-body">
                <div class="pb-field">
                  <label>名称</label>
                  <input v-model="tpl.name" class="text-input" placeholder="回复模板名称" />
                </div>
                <div class="pb-field">
                  <label>适用场景</label>
                  <input v-model="tpl.category" class="text-input" placeholder="如：合规、争议、询价" />
                </div>
                <div class="pb-field">
                  <label>回复内容</label>
                  <textarea v-model="tpl.template" rows="4" class="text-input" placeholder="回复模板的具体内容"></textarea>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { playbookService } from '@/services/ai/playbookService.js'

const playbook = ref(playbookService.loadPlaybook())
const sections = ref({ positions: false, nda: false, templates: false })
const expanded = ref({ pos: null, tpl: null })

function toggleExpand(type, id) {
  expanded.value[type] = expanded.value[type] === id ? null : id
}

watch(
  () => playbook.value,
  () => playbookService.savePlaybook(playbook.value),
  { deep: true }
)

function addPosition() {
  playbook.value = playbookService.addPosition({
    category: '',
    standardPosition: '',
    acceptableRange: '',
    escalationTrigger: '',
    severity: 'medium'
  })
  sections.value.positions = true
}

function removePosition(idx) {
  const id = playbook.value.positions[idx]?.id
  if (id) playbook.value = playbookService.removePosition(id)
}

function addTemplate() {
  playbook.value = playbookService.addResponseTemplate({
    name: '',
    category: 'general',
    template: ''
  })
  sections.value.templates = true
}

function removeTemplate(idx) {
  const id = playbook.value.responseTemplates[idx]?.id
  if (id) playbook.value = playbookService.removeResponseTemplate(id)
}

function resetToDefault() {
  playbookService.resetPlaybook()
  playbook.value = playbookService.loadPlaybook()
  window.$message?.success('已恢复默认')
}

defineExpose({ resetToDefault })
</script>
