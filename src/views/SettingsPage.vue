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
      <!-- 1. AI 服务 -->
      <div v-show="activeTab === 'ai'" class="tab-content">
        <div class="section-head">
          <div>
            <h3>AI 服务</h3>
            <p class="section-desc">选择服务商后只需填 API Key 即可使用</p>
          </div>
          <div class="section-actions">
            <button class="sm-btn warn" @click="resetSection('ai')">恢复默认</button>
            <button class="sm-btn" @click="refreshModelList" :disabled="!ai.apiKey">刷新模型</button>
          </div>
        </div>

        <div class="form-section">
          <div class="form-group">
            <label>服务商</label>
            <div class="provider-grid">
              <button
                v-for="p in AI_PROVIDERS"
                :key="p.id"
                class="provider-card"
                :class="{ active: ai.provider === p.id }"
                @click="selectProvider(p.id)"
                type="button"
              >
                <div class="provider-name">{{ p.name }}</div>
                <div class="provider-desc">{{ p.description }}</div>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>API Key</label>
            <input
              v-model="ai.apiKey"
              type="password"
              class="text-input"
              placeholder="请输入 API Key"
              @input="autoSave"
            />
            <p v-if="ai.provider === 'siliconflow'" class="field-hint">
              硅基流动：<a class="link" :href="siliconflowKeyUrl" @click.prevent="openUrl(siliconflowKeyUrl)">获取 API Key →</a>
            </p>
            <p v-else-if="ai.provider === 'deepseek'" class="field-hint">
              DeepSeek：<a class="link" :href="deepseekKeyUrl" @click.prevent="openUrl(deepseekKeyUrl)">获取 API Key →</a>
            </p>
            <p v-else-if="ai.provider === 'kimi'" class="field-hint">
              Kimi：<a class="link" :href="kimiKeyUrl" @click.prevent="openUrl(kimiKeyUrl)">获取 API Key →</a>
            </p>
          </div>

          <div v-if="ai.provider === 'custom'" class="form-group">
            <label>API 地址</label>
            <input
              v-model="ai.baseUrl"
              class="text-input"
              placeholder="https://your-api.com/v1"
              @input="autoSave"
            />
            <p class="field-hint">任何 OpenAI 兼容的中转 API（如 one-api、new-api）</p>
          </div>

          <div class="form-group">
            <label>模型</label>
            <div v-if="currentProviderModels.length" class="model-chips">
              <button
                v-for="m in currentProviderModels"
                :key="m.value"
                class="model-chip"
                :class="{ active: ai.model === m.value }"
                @click="selectModel(m.value)"
                type="button"
              >
                <span v-if="m.tag" :class="['chip-tag', m.tag === '推荐' ? 'tag-recommend' : 'tag-advanced']">{{ m.tag }}</span>
                {{ m.label }}
              </button>
            </div>
            <input
              v-model="ai.model"
              class="text-input"
              :placeholder="currentProviderModels.length ? '或输入自定义模型名' : '请输入模型名称'"
              @input="autoSave"
            />
            <p v-if="!currentProviderModels.length && ai.provider === 'custom'" class="field-hint">
              自定义中转请输入服务商提供的模型 ID
            </p>
            <p v-else class="field-hint">
              切换服务商时会自动选择推荐模型，你也可以输入任何服务商支持的模型名
            </p>
          </div>
        </div>

        <div class="form-section">
          <div class="form-group">
            <label>最大输出 Tokens</label>
            <input
              v-model.number="ai.maxTokens"
              type="number"
              min="1000"
              max="16000"
              step="1000"
              class="text-input"
              @input="autoSave"
            />
            <p class="field-hint">控制 AI 响应的最大长度，合同审查建议 8000+ tokens</p>
          </div>

          <div class="form-group">
            <label>Temperature <span class="value-tag">{{ ai.temperature }}</span></label>
            <input
              v-model.number="ai.temperature"
              type="range"
              min="0"
              max="1"
              step="0.1"
              class="range-input"
              @input="autoSave"
            />
            <div class="range-marks">
              <span>精确 (0)</span>
              <span>平衡 (0.5)</span>
              <span>创造 (1)</span>
            </div>
            <p class="field-hint">控制 AI 响应的随机性，法律文档建议 0.1-0.3</p>
          </div>

          <div class="form-group">
            <label>请求超时 <span class="value-tag">{{ ai.timeout / 1000 }} 秒</span></label>
            <input
              v-model.number="ai.timeout"
              type="range"
              min="5000"
              max="300000"
              step="5000"
              class="range-input"
              @input="autoSave"
            />
            <p class="field-hint">长文档审查建议 60 秒以上</p>
          </div>
        </div>
      </div>

      <!-- 2. RAG 向量检索 -->
      <div v-show="activeTab === 'rag'" class="tab-content">
        <div class="section-head">
          <div>
            <h3>RAG 向量检索</h3>
            <p class="section-desc">启用后 AI 将自动检索相关上下文，提供更精准的答复</p>
          </div>
        </div>

        <div class="form-section">
          <div class="form-group">
            <label class="toggle-row">
              <span>启用 RAG 检索增强</span>
              <label class="switch">
                <input
                  type="checkbox"
                  :checked="rag.enabled"
                  @change="updateRag('enabled', $event.target.checked)"
                />
                <span class="slider"></span>
              </label>
            </label>
            <div v-if="rag.enabled" class="field-hint hint-ok">✅ 已启用，AI 对话将自动检索相关上下文</div>
            <div v-else class="field-hint hint-warn">⚠️ 未启用，AI 使用全文模式</div>
          </div>
        </div>

        <div class="form-section">
          <h4>Qdrant 连接</h4>
          <div class="form-group">
            <label>地址</label>
            <input
              v-model="rag.qdrantUrl"
              class="text-input"
              placeholder="http://your-server:6333"
              @input="updateRagField('qdrantUrl', $event.target.value)"
            />
          </div>
          <div class="form-group">
            <label>API Key</label>
            <input
              v-model="rag.qdrantApiKey"
              type="password"
              class="text-input"
              placeholder="可选"
              @input="updateRagField('qdrantApiKey', $event.target.value)"
            />
          </div>
          <div class="rag-actions">
            <button class="sm-btn" :disabled="ragTesting" @click="testRagConnection">
              {{ ragTesting ? '测试中...' : '测试连接' }}
            </button>
            <span v-if="ragTestResult" :class="['rag-result', ragTestResult.ok ? 'ok' : 'fail']">
              {{ ragTestResult.ok ? '✅ 连接成功' : `❌ ${ragTestResult.error}` }}
            </span>
          </div>
        </div>

        <div class="form-section">
          <h4>Embedding 配置</h4>
          <p class="field-hint">地址和密钥留空则自动跟随 AI 服务配置，仅需选择模型</p>
          <div class="form-group">
            <label>Embedding 模型</label>
            <select
              v-model="rag.embeddingModel"
              class="text-input"
              @change="updateRagField('embeddingModel', $event.target.value)"
            >
              <option value="Qwen/Qwen3-Embedding-8B">Qwen3-Embedding-8B（推荐）</option>
              <option value="BAAI/bge-large-zh-v1.5">BGE-large-zh-v1.5</option>
            </select>
          </div>
          <div class="form-group">
            <label>API 地址<span v-if="!rag.embeddingBaseUrl" class="inherit-tag">跟随 AI 服务</span></label>
            <input
              v-model="rag.embeddingBaseUrl"
              class="text-input"
              placeholder="留空则使用 AI 服务地址"
              @input="updateRagField('embeddingBaseUrl', $event.target.value)"
            />
          </div>
          <div class="form-group">
            <label>API Key<span v-if="!rag.embeddingApiKey" class="inherit-tag">跟随 AI 服务</span></label>
            <input
              v-model="rag.embeddingApiKey"
              type="password"
              class="text-input"
              placeholder="留空则使用 AI 服务 Key"
              @input="updateRagField('embeddingApiKey', $event.target.value)"
            />
          </div>
        </div>

        <div class="form-section">
          <h4>数据统计</h4>
          <div class="rag-actions">
            <button class="sm-btn" :disabled="ragStatsLoading" @click="loadRagStats">
              {{ ragStatsLoading ? '加载中...' : '刷新统计' }}
            </button>
          </div>
          <div v-if="ragStats" class="rag-stats">
            <div class="stat-row">
              <span>文档分块</span>
              <span>{{ ragStats.collections?.DOCUMENT_CHUNKS?.points_count || 0 }}</span>
            </div>
            <div class="stat-row">
              <span>对话记忆</span>
              <span>{{ ragStats.collections?.CONVERSATION_MEMORY?.points_count || 0 }}</span>
            </div>
            <div class="stat-row">
              <span>审查历史</span>
              <span>{{ ragStats.collections?.REVIEW_HISTORY?.points_count || 0 }}</span>
            </div>
            <div class="stat-row">
              <span>法律法规</span>
              <span>{{ ragStats.collections?.LAW_KNOWLEDGE?.points_count || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. 审查策略 (Playbook) -->
      <div v-show="activeTab === 'playbook'" class="tab-content">
        <div class="section-head">
          <div>
            <h3>审查策略</h3>
            <p class="section-desc">设定 AI 审查合同时的关注要点和回复风格</p>
          </div>
          <div class="section-actions">
            <button class="sm-btn warn" @click="resetPlaybook">恢复默认</button>
            <button class="sm-btn" @click="openChatSettings">抽屉视图</button>
          </div>
        </div>

        <div class="pb-section sec-danger">
          <div class="pb-label" @click="pbSections.positions = !pbSections.positions">
            <span>🔍 审查要点（{{ playbook.positions.length }}）</span>
            <span class="toggle-icon">{{ pbSections.positions ? '▾' : '▸' }}</span>
          </div>
          <Transition name="collapse">
            <div v-if="pbSections.positions" class="section-body">
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
                      <input
                        v-model="pos.category"
                        class="text-input"
                        placeholder="如：违约金条款"
                      />
                    </div>
                    <div class="pb-field">
                      <label>我方底线</label>
                      <textarea
                        v-model="pos.standardPosition"
                        rows="2"
                        class="text-input"
                        placeholder="我方对该条款的基本立场"
                      ></textarea>
                    </div>
                    <div class="pb-field">
                      <label>可接受范围</label>
                      <input
                        v-model="pos.acceptableRange"
                        class="text-input"
                        placeholder="可以接受的妥协范围"
                      />
                    </div>
                    <div class="pb-field">
                      <label>必须预警的情况</label>
                      <input
                        v-model="pos.escalationTrigger"
                        class="text-input"
                        placeholder="遇到这些情况必须提醒我"
                      />
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
          <div class="pb-label" @click="pbSections.nda = !pbSections.nda">
            <span>🔒 保密协议偏好</span>
            <span class="toggle-icon">{{ pbSections.nda ? '▾' : '▸' }}</span>
          </div>
          <Transition name="collapse">
            <div v-if="pbSections.nda" class="section-body">
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
          <div class="pb-label" @click="pbSections.templates = !pbSections.templates">
            <span>💬 常用回复（{{ playbook.responseTemplates.length }}）</span>
            <span class="toggle-icon">{{ pbSections.templates ? '▾' : '▸' }}</span>
          </div>
          <Transition name="collapse">
            <div v-if="pbSections.templates" class="section-body">
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

      <!-- 4. 金山文档 -->
      <div v-show="activeTab === 'kdocs'" class="tab-content">
        <div class="section-head">
          <div>
            <h3>金山文档对接</h3>
            <p class="section-desc">配置金山文档接口参数（Coze 工作流）</p>
          </div>
          <div class="section-actions">
            <select v-model="activeKdocsSchemeId" class="select-sm" @change="switchKdocsScheme">
              <option v-for="s in kdocsSchemes" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
            <button class="sm-btn" @click="showNewKdocsModal = true">新建方案</button>
            <button class="sm-btn" @click="saveCurrentKdocsScheme">保存方案</button>
            <button class="sm-btn warn" @click="deleteCurrentKdocsScheme" :disabled="kdocsSchemes.length <= 1">
              删除
            </button>
          </div>
        </div>

        <div class="form-section">
          <div class="form-group">
            <label>Webhook URL</label>
            <input v-model="kdocs.webhookUrl" class="text-input" placeholder="请输入 Webhook URL" @input="autoSaveKdocs" />
          </div>
          <div class="form-group">
            <label>Token</label>
            <input v-model="kdocs.token" type="password" class="text-input" placeholder="请输入 Token" @input="autoSaveKdocs" />
          </div>
          <div class="form-group">
            <label>Sheet ID</label>
            <input v-model.number="kdocs.sheetId" type="number" min="1" step="1" class="text-input" placeholder="5" @input="autoSaveKdocs" />
          </div>
          <div class="form-group">
            <label>Coze API Key</label>
            <input v-model="kdocs.cozeApiKey" type="password" class="text-input" placeholder="请输入 Coze API Key" @input="autoSaveKdocs" />
          </div>
          <div class="form-group">
            <label>金山文档工作流 ID</label>
            <input v-model="kdocs.workflowId" class="text-input" placeholder="请输入金山文档操作工作流ID" @input="autoSaveKdocs" />
          </div>
          <div class="form-group">
            <label>企业信息工作流 ID</label>
            <input v-model="kdocs.companyInfoWorkflowId" class="text-input" placeholder="请输入企业信息查询工作流ID" @input="autoSaveKdocs" />
          </div>
          <div class="form-group">
            <label>合同编号前缀</label>
            <input v-model="kdocs.contractNumberPrefix" class="text-input" placeholder="如 HT" @input="autoSaveKdocs" />
            <p class="field-hint">合同编号格式：前缀-年份-编号，如 HT-2025-001</p>
          </div>
        </div>

        <Teleport to="body">
          <div v-if="showNewKdocsModal" class="modal-mask" @click.self="showNewKdocsModal = false">
            <div class="modal-card">
              <h3>新建金山文档方案</h3>
              <div class="form-group">
                <label>方案名称</label>
                <input v-model="newKdocsSchemeName" class="text-input" placeholder="请输入方案名称" />
              </div>
              <div class="modal-actions">
                <button class="sm-btn" @click="showNewKdocsModal = false">取消</button>
                <button class="sm-btn primary" @click="createKdocsScheme">创建</button>
              </div>
            </div>
          </div>
        </Teleport>
      </div>

      <!-- 5. 关键词批注方案 -->
      <div v-show="activeTab === 'keyword'" class="tab-content">
        <div class="section-head">
          <div>
            <h3>关键词批注方案</h3>
            <p class="section-desc">配置 AI 自动批注的关键词规则，支持多套方案</p>
          </div>
          <div class="section-actions">
            <select v-model="activeKeywordSchemeId" class="select-sm" @change="switchKeywordScheme">
              <option v-for="s in keywordSchemes" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
            <button class="sm-btn" @click="showNewKeywordModal = true">新建方案</button>
            <button class="sm-btn" @click="saveCurrentKeywordScheme">保存方案</button>
            <button class="sm-btn warn" @click="deleteCurrentKeywordScheme" :disabled="keywordSchemes.length <= 1">
              删除
            </button>
          </div>
        </div>

        <div class="form-section">
          <div class="section-head">
            <div></div>
            <div class="section-actions">
              <button class="sm-btn" @click="addKeywordRule">+ 添加规则</button>
            </div>
          </div>
          <div v-for="(rule, idx) in activeKeywordRules" :key="idx" class="rule-card">
            <div class="rule-head">
              <span class="rule-num">#{{ idx + 1 }}</span>
              <button class="del-btn-sm" @click="removeKeywordRule(idx)" title="删除">×</button>
            </div>
            <div class="form-group">
              <label>关键词</label>
              <input v-model="rule.keyword" class="text-input" placeholder="如：付款方式" />
            </div>
            <div class="form-group">
              <label>操作类型</label>
              <select v-model="rule.actionType" class="text-input">
                <option value="批注">批注</option>
                <option value="修订">修订</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ rule.actionType === '修订' ? '建议文本' : '批注内容' }}</label>
              <textarea
                v-if="rule.actionType === '批注'"
                v-model="rule.comment"
                rows="3"
                class="text-input"
                placeholder="如：提醒确认金额是否准确无误"
              ></textarea>
              <input
                v-else
                v-model="rule.suggestedText"
                class="text-input"
                placeholder="如：建议约定仲裁"
              />
            </div>
          </div>
          <button class="primary-save-btn" @click="saveCurrentKeywordScheme">保存到当前方案</button>
        </div>

        <Teleport to="body">
          <div v-if="showNewKeywordModal" class="modal-mask" @click.self="showNewKeywordModal = false">
            <div class="modal-card">
              <h3>新建关键词批注方案</h3>
              <div class="form-group">
                <label>方案名称</label>
                <input v-model="newKeywordSchemeName" class="text-input" placeholder="如：政府采购项目" />
              </div>
              <div class="modal-actions">
                <button class="sm-btn" @click="showNewKeywordModal = false">取消</button>
                <button class="sm-btn primary" @click="createKeywordScheme">创建</button>
              </div>
            </div>
          </div>
        </Teleport>
      </div>

      <!-- 6. 审查方案 -->
      <div v-show="activeTab === 'review'" class="tab-content">
        <div class="section-head">
          <div>
            <h3>审查方案</h3>
            <p class="section-desc">配置 AI 合同审查的检查项，支持多套方案</p>
          </div>
          <div class="section-actions">
            <select v-model="activeReviewSchemeId" class="select-sm" @change="switchReviewScheme">
              <option v-for="s in reviewSchemes" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
            <button class="sm-btn" @click="showNewReviewModal = true">新建方案</button>
            <button class="sm-btn" @click="saveCurrentReviewScheme">保存方案</button>
            <button class="sm-btn warn" @click="deleteCurrentReviewScheme" :disabled="reviewSchemes.length <= 1">
              删除
            </button>
          </div>
        </div>

        <div class="form-section">
          <div class="section-head">
            <div></div>
            <div class="section-actions">
              <button class="sm-btn" @click="addReviewRule">+ 添加审查项</button>
            </div>
          </div>
          <div v-for="(rule, idx) in activeReviewRules" :key="idx" class="rule-card">
            <div class="rule-head">
              <span class="rule-num">#{{ idx + 1 }}</span>
              <button class="del-btn-sm" @click="removeReviewRule(idx)" title="删除">×</button>
            </div>
            <div class="form-group">
              <label>审查类别</label>
              <input v-model="rule.keyword" class="text-input" placeholder="如：付款条款" />
            </div>
            <div class="form-group">
              <label>操作类型</label>
              <select v-model="rule.actionType" class="text-input">
                <option value="批注">批注</option>
                <option value="修订">修订</option>
              </select>
            </div>
            <div class="form-group">
              <label>审查要求</label>
              <textarea
                v-model="rule.comment"
                rows="3"
                class="text-input"
                placeholder="请 AI 审查的具体要求"
              ></textarea>
            </div>
          </div>
          <button class="primary-save-btn" @click="saveCurrentReviewScheme">保存到当前方案</button>
        </div>

        <Teleport to="body">
          <div v-if="showNewReviewModal" class="modal-mask" @click.self="showNewReviewModal = false">
            <div class="modal-card">
              <h3>新建审查方案</h3>
              <div class="form-group">
                <label>方案名称</label>
                <input v-model="newReviewSchemeName" class="text-input" placeholder="如：劳动用工合同" />
              </div>
              <div class="modal-actions">
                <button class="sm-btn" @click="showNewReviewModal = false">取消</button>
                <button class="sm-btn primary" @click="createReviewScheme">创建</button>
              </div>
            </div>
          </div>
        </Teleport>
      </div>

      <!-- 7. 数据管理 -->
      <div v-show="activeTab === 'data'" class="tab-content">
        <div class="section-head">
          <div>
            <h3>数据管理</h3>
            <p class="section-desc">导入导出配置、查看配置文件位置</p>
          </div>
        </div>

        <div class="form-section">
          <h4>合同要素提取</h4>
          <p class="field-hint">配置 AI 提取合同时关注的字段，可调整标签顺序</p>
          <div class="tag-list">
            <div v-for="(tag, idx) in extractor.extractTags" :key="idx" class="tag-item">
              <span class="tag-text">{{ tag }}</span>
              <button class="del-btn-sm" @click="removeExtractTag(idx)">×</button>
            </div>
            <button class="add-tag" @click="addExtractTag">+ 添加</button>
          </div>
          <button class="primary-save-btn" @click="saveExtractor">保存</button>
        </div>

        <div class="form-section">
          <h4>配置导入导出</h4>
          <div class="data-actions">
            <button class="sm-btn" @click="handleExport">导出配置</button>
            <label class="sm-btn upload-btn">
              导入配置
              <input type="file" accept=".json" hidden @change="handleImport" />
            </label>
            <button class="sm-btn" @click="showConfigPath">查看配置文件路径</button>
          </div>
          <div v-if="configPath" class="config-path-card">
            <p class="path-label">配置文件位置（已复制到剪贴板）：</p>
            <code class="path-text">{{ configPath }}</code>
          </div>
        </div>

        <div class="form-section danger-zone">
          <h4>危险操作</h4>
          <p class="field-hint">重置后将清空所有自定义配置，恢复到默认状态，不可恢复</p>
          <button class="danger-btn" @click="handleResetAll">重置所有配置</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { appConfig } from '@/utils/AppConfig.js'
import { reinitializeAIClient, getAvailableModels } from '@/services/ai/siliconflow.js'
import { playbookService } from '@/services/ai/playbookService.js'
import { qdrantClient } from '@/services/rag/QdrantClient.js'
import { ragService } from '@/services/rag/RagService.js'
import { AI_PROVIDERS, getProvider, detectProviderByUrl } from '@/config/providerPresets.js'
import { wpsCore } from '@/services/wps/WpsCore.js'

const tabs = [
  { id: 'ai', icon: '🤖', label: 'AI 服务' },
  { id: 'rag', icon: '🔍', label: 'RAG' },
  { id: 'playbook', icon: '📋', label: '审查策略' },
  { id: 'kdocs', icon: '📄', label: '金山文档' },
  { id: 'keyword', icon: '🏷️', label: '关键词批注' },
  { id: 'review', icon: '⚖️', label: '审查方案' },
  { id: 'data', icon: '💾', label: '数据管理' }
]

// 各服务商 API Key 申请页
const siliconflowKeyUrl = 'https://cloud.siliconflow.cn/account/ak'
const deepseekKeyUrl = 'https://platform.deepseek.com/api_keys'
const kimiKeyUrl = 'https://platform.moonshot.cn/console/api-keys'

const activeTab = ref('ai')

// AI 配置
const aiRaw = appConfig.get('ai')
// 向后兼容：旧配置没有 provider 字段，根据 baseUrl 推断
if (!aiRaw.provider) {
  aiRaw.provider = detectProviderByUrl(aiRaw.baseUrl)
}
const ai = ref({ ...aiRaw })
const currentProvider = computed(() => getProvider(ai.value.provider))
const currentProviderModels = computed(() => currentProvider.value.models)

// RAG 配置
const rag = ref({ ...appConfig.get('rag') })
const ragTesting = ref(false)
const ragTestResult = ref(null)
const ragStatsLoading = ref(false)
const ragStats = ref(null)

// Playbook
const playbook = ref(playbookService.loadPlaybook())
const pbSections = ref({ positions: false, nda: false, templates: false })
const expanded = ref({ pos: null, tpl: null })

// 金山文档方案
const kdocsSchemes = ref([])
const activeKdocsSchemeId = ref('')
const kdocs = ref({ ...appConfig.get('kdocs') })
const showNewKdocsModal = ref(false)
const newKdocsSchemeName = ref('')

// 关键词方案
const keywordSchemes = ref([])
const activeKeywordSchemeId = ref('')
const activeKeywordRules = ref([])
const showNewKeywordModal = ref(false)
const newKeywordSchemeName = ref('')

// 审查方案
const reviewSchemes = ref([])
const activeReviewSchemeId = ref('')
const activeReviewRules = ref([])
const showNewReviewModal = ref(false)
const newReviewSchemeName = ref('')

// 合同要素
const extractor = ref({ ...appConfig.get('extractor') })

// 数据管理
const configPath = ref('')

onMounted(() => {
  loadKdocsSchemes()
  loadKeywordSchemes()
  loadReviewSchemes()
})

// ========== AI 服务 ==========
function selectProvider(id) {
  const provider = getProvider(id)
  ai.value.provider = id
  if (provider.baseUrl) {
    ai.value.baseUrl = provider.baseUrl
  }
  if (provider.defaultModel) {
    ai.value.model = provider.defaultModel
  }
  autoSave()
}

function selectModel(value) {
  ai.value.model = value
  autoSave()
}

async function refreshModelList() {
  if (!ai.value.apiKey) {
    window.$message?.warning('请先填 API Key')
    return
  }
  autoSave()
  try {
    const models = await getAvailableModels()
    const provider = getProvider(ai.value.provider)
    if (provider.id === 'custom') {
      // 自定义中转：把 API 返回的模型加到可选列表
      const newModels = models.map((m) => ({ label: m.name || m.id, value: m.id, tag: '' }))
      const existing = provider.models.map((m) => m.value)
      const merged = [...provider.models]
      for (const m of newModels) {
        if (!existing.includes(m.value)) merged.push(m)
      }
      provider.models = merged
    }
    window.$message?.success(`已获取 ${models.length} 个模型`)
  } catch (e) {
    window.$message?.error(`获取失败: ${e.message}`)
  }
}

function autoSave() {
  const config = appConfig.getConfig()
  config.ai = { ...config.ai, ...ai.value }
  appConfig.saveConfig(config)
  reinitializeAIClient()
}

function resetSection(section) {
  const defaults = appConfig.getDefaultConfig()
  if (section === 'ai') {
    ai.value = { ...defaults.ai }
    autoSave()
    window.$message?.success('已恢复默认配置')
  }
}

function openUrl(url) {
  const providerNames = {
    siliconflow: '硅基流动',
    deepseek: 'DeepSeek',
    kimi: 'Kimi',
    custom: '服务商'
  }
  const providerId = ai.value.provider
  const title = `${providerNames[providerId] || '服务商'} - 获取 API Key`
  const ok = wpsCore.openExternalUrl(url, title)
  if (!ok) {
    window.$message?.warning('无法在 WPS 中打开链接，请手动复制访问：' + url)
  }
}

// ========== RAG ==========
function updateRagField(field, value) {
  rag.value[field] = value
  updateRag(field, value)
}

function updateRag(field, value) {
  const config = appConfig.getConfig()
  if (!config.rag) config.rag = {}
  config.rag[field] = value
  appConfig.saveConfig(config)
  qdrantClient.clearConfigCache()
  ragTestResult.value = null
}

async function testRagConnection() {
  ragTesting.value = true
  try {
    qdrantClient.clearConfigCache()
    const result = await qdrantClient.healthCheck()
    ragTestResult.value = result
    if (result.ok) window.$message?.success('Qdrant 连接成功')
    else window.$message?.error(`连接失败: ${result.error}`)
  } catch (e) {
    ragTestResult.value = { ok: false, error: e.message }
  } finally {
    ragTesting.value = false
  }
}

async function loadRagStats() {
  ragStatsLoading.value = true
  try {
    qdrantClient.clearConfigCache()
    ragStats.value = await ragService.getStats()
  } catch (e) {
    window.$message?.error(`获取统计失败: ${e.message}`)
  } finally {
    ragStatsLoading.value = false
  }
}

// ========== Playbook ==========
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
  pbSections.value.positions = true
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
  pbSections.value.templates = true
}

function removeTemplate(idx) {
  const id = playbook.value.responseTemplates[idx]?.id
  if (id) playbook.value = playbookService.removeResponseTemplate(id)
}

function resetPlaybook() {
  playbookService.resetPlaybook()
  playbook.value = playbookService.loadPlaybook()
  window.$message?.success('已恢复默认')
}

function openChatSettings() {
  window.$emit && window.$emit('open-chat-settings')
  window.$message?.info('抽屉视图请通过 AI 对话面板的 ⚙️ 按钮打开')
}

// ========== 金山文档 ==========
function loadKdocsSchemes() {
  const data = appConfig.getSchemes('kdocs')
  kdocsSchemes.value = data.schemes || []
  activeKdocsSchemeId.value = data.activeSchemeId || ''
  if (activeKdocsSchemeId.value) {
    const s = kdocsSchemes.value.find((x) => x.id === activeKdocsSchemeId.value)
    if (s?.config) kdocs.value = { ...s.config }
  }
}

function switchKdocsScheme(id) {
  const s = kdocsSchemes.value.find((x) => x.id === id)
  if (s?.config) {
    kdocs.value = { ...s.config }
    appConfig.setActiveScheme('kdocs', id)
    autoSaveKdocs()
    window.$message?.success(`已切换: ${s.name}`)
  }
}

function autoSaveKdocs() {
  const s = kdocsSchemes.value.find((x) => x.id === activeKdocsSchemeId.value)
  if (s) s.config = { ...kdocs.value }
  const config = appConfig.getConfig()
  config.kdocs = { ...kdocs.value }
  appConfig.saveConfig(config)
}

function saveCurrentKdocsScheme() {
  const s = kdocsSchemes.value.find((x) => x.id === activeKdocsSchemeId.value)
  if (s) {
    s.config = { ...kdocs.value }
    s.updatedAt = new Date().toISOString()
    appConfig.saveSchemes('kdocs', { schemes: kdocsSchemes.value, activeSchemeId: activeKdocsSchemeId.value })
    window.$message?.success('方案已保存')
  }
}

function createKdocsScheme() {
  if (!newKdocsSchemeName.value.trim()) {
    window.$message?.warning('请输入方案名称')
    return
  }
  const s = {
    id: `kdocs_${Date.now()}`,
    name: newKdocsSchemeName.value.trim(),
    type: 'kdocs',
    config: { ...kdocs.value },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  kdocsSchemes.value.push(s)
  activeKdocsSchemeId.value = s.id
  appConfig.saveSchemes('kdocs', { schemes: kdocsSchemes.value, activeSchemeId: s.id })
  showNewKdocsModal.value = false
  newKdocsSchemeName.value = ''
  window.$message?.success('方案已创建')
}

function deleteCurrentKdocsScheme() {
  if (kdocsSchemes.value.length <= 1) return
  if (!confirm('确定删除当前方案？')) return
  const idx = kdocsSchemes.value.findIndex((x) => x.id === activeKdocsSchemeId.value)
  if (idx !== -1) {
    kdocsSchemes.value.splice(idx, 1)
    activeKdocsSchemeId.value = kdocsSchemes.value[0].id
    const first = kdocsSchemes.value[0]
    if (first?.config) kdocs.value = { ...first.config }
    appConfig.saveSchemes('kdocs', { schemes: kdocsSchemes.value, activeSchemeId: activeKdocsSchemeId.value })
    autoSaveKdocs()
    window.$message?.success('方案已删除')
  }
}

// ========== 关键词方案 ==========
function loadKeywordSchemes() {
  const data = appConfig.getSchemes('keyword')
  keywordSchemes.value = data.schemes || []
  activeKeywordSchemeId.value = data.activeSchemeId || ''
  loadActiveKeywordRules()
}

function loadActiveKeywordRules() {
  const s = keywordSchemes.value.find((x) => x.id === activeKeywordSchemeId.value)
  activeKeywordRules.value = s?.rules ? JSON.parse(JSON.stringify(s.rules)) : []
}

function switchKeywordScheme(id) {
  activeKeywordSchemeId.value = id
  appConfig.setActiveScheme('keyword', id)
  loadActiveKeywordRules()
  window.$message?.success('已切换')
}

function addKeywordRule() {
  activeKeywordRules.value.push({
    keyword: '',
    comment: '',
    actionType: '批注',
    suggestedText: ''
  })
}

function removeKeywordRule(idx) {
  activeKeywordRules.value.splice(idx, 1)
}

function saveCurrentKeywordScheme() {
  const s = keywordSchemes.value.find((x) => x.id === activeKeywordSchemeId.value)
  if (s) {
    s.rules = JSON.parse(JSON.stringify(activeKeywordRules.value))
    s.updatedAt = new Date().toISOString()
    appConfig.saveSchemes('keyword', { schemes: keywordSchemes.value, activeSchemeId: activeKeywordSchemeId.value })
    window.$message?.success('方案已保存')
  }
}

function createKeywordScheme() {
  if (!newKeywordSchemeName.value.trim()) {
    window.$message?.warning('请输入方案名称')
    return
  }
  const s = {
    id: `keyword_${Date.now()}`,
    name: newKeywordSchemeName.value.trim(),
    type: 'keyword',
    rules: JSON.parse(JSON.stringify(activeKeywordRules.value)),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  keywordSchemes.value.push(s)
  activeKeywordSchemeId.value = s.id
  appConfig.saveSchemes('keyword', { schemes: keywordSchemes.value, activeSchemeId: s.id })
  showNewKeywordModal.value = false
  newKeywordSchemeName.value = ''
  window.$message?.success('方案已创建')
}

function deleteCurrentKeywordScheme() {
  if (keywordSchemes.value.length <= 1) return
  if (!confirm('确定删除当前方案？')) return
  const idx = keywordSchemes.value.findIndex((x) => x.id === activeKeywordSchemeId.value)
  if (idx !== -1) {
    keywordSchemes.value.splice(idx, 1)
    activeKeywordSchemeId.value = keywordSchemes.value[0].id
    appConfig.saveSchemes('keyword', { schemes: keywordSchemes.value, activeSchemeId: activeKeywordSchemeId.value })
    loadActiveKeywordRules()
    window.$message?.success('方案已删除')
  }
}

// ========== 审查方案 ==========
function loadReviewSchemes() {
  const data = appConfig.getSchemes('review')
  reviewSchemes.value = data.schemes || []
  activeReviewSchemeId.value = data.activeSchemeId || ''
  loadActiveReviewRules()
}

function loadActiveReviewRules() {
  const s = reviewSchemes.value.find((x) => x.id === activeReviewSchemeId.value)
  activeReviewRules.value = s?.rules ? JSON.parse(JSON.stringify(s.rules)) : []
}

function switchReviewScheme(id) {
  activeReviewSchemeId.value = id
  appConfig.setActiveScheme('review', id)
  loadActiveReviewRules()
  window.$message?.success('已切换')
}

function addReviewRule() {
  activeReviewRules.value.push({
    keyword: '',
    comment: '',
    actionType: '批注',
    suggestedText: ''
  })
}

function removeReviewRule(idx) {
  activeReviewRules.value.splice(idx, 1)
}

function saveCurrentReviewScheme() {
  const s = reviewSchemes.value.find((x) => x.id === activeReviewSchemeId.value)
  if (s) {
    s.rules = JSON.parse(JSON.stringify(activeReviewRules.value))
    s.updatedAt = new Date().toISOString()
    appConfig.saveSchemes('review', { schemes: reviewSchemes.value, activeSchemeId: activeReviewSchemeId.value })
    window.$message?.success('方案已保存')
  }
}

function createReviewScheme() {
  if (!newReviewSchemeName.value.trim()) {
    window.$message?.warning('请输入方案名称')
    return
  }
  const s = {
    id: `review_${Date.now()}`,
    name: newReviewSchemeName.value.trim(),
    type: 'review',
    rules: JSON.parse(JSON.stringify(activeReviewRules.value)),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  reviewSchemes.value.push(s)
  activeReviewSchemeId.value = s.id
  appConfig.saveSchemes('review', { schemes: reviewSchemes.value, activeSchemeId: s.id })
  showNewReviewModal.value = false
  newReviewSchemeName.value = ''
  window.$message?.success('方案已创建')
}

function deleteCurrentReviewScheme() {
  if (reviewSchemes.value.length <= 1) return
  if (!confirm('确定删除当前方案？')) return
  const idx = reviewSchemes.value.findIndex((x) => x.id === activeReviewSchemeId.value)
  if (idx !== -1) {
    reviewSchemes.value.splice(idx, 1)
    activeReviewSchemeId.value = reviewSchemes.value[0].id
    appConfig.saveSchemes('review', { schemes: reviewSchemes.value, activeSchemeId: activeReviewSchemeId.value })
    loadActiveReviewRules()
    window.$message?.success('方案已删除')
  }
}

// ========== 合同要素 ==========
function addExtractTag() {
  extractor.value.extractTags.push('新字段')
}

function removeExtractTag(idx) {
  extractor.value.extractTags.splice(idx, 1)
}

function saveExtractor() {
  const config = appConfig.getConfig()
  config.extractor = { ...extractor.value }
  appConfig.saveConfig(config)
  window.$message?.success('合同要素配置已保存')
}

// ========== 数据管理 ==========
function handleResetAll() {
  if (confirm('确定要重置所有配置吗？此操作不可恢复。')) {
    appConfig.reset()
    reinitializeAIClient()
    window.$message?.success('所有配置已重置')
    setTimeout(() => window.location.reload(), 500)
  }
}

function handleExport() {
  appConfig.exportConfig()
  window.$message?.success('配置已导出')
}

async function handleImport(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    await appConfig.importConfig(file)
    reinitializeAIClient()
    window.$message?.success('配置已导入，请刷新页面生效')
  } catch (err) {
    window.$message?.error('导入失败: ' + err.message)
  }
  e.target.value = ''
}

function showConfigPath() {
  const fullPath = appConfig.getConfigFullPath()
  configPath.value = fullPath || 'WPS 环境不可用'
  navigator.clipboard?.writeText(fullPath).catch(() => {})
  window.$message?.success('路径已复制到剪贴板')
}
</script>

<style>
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}
</style>

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
  flex-direction: column;
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
  padding: 16px 22px;
  min-width: 0;
}

.tab-content {
  max-width: 760px;
  margin: 0 auto;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
}
.section-head h3 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 700;
  color: var(--c-text);
}
.section-head h4 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--c-text);
}
.section-desc {
  margin: 0;
  font-size: 12px;
  color: var(--c-text2);
}
.section-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.form-section {
  background: #fff;
  border: 1px solid var(--c-border);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 14px;
}

.form-group {
  margin-bottom: 12px;
}
.form-group:last-child {
  margin-bottom: 0;
}
.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--c-text);
  margin-bottom: 4px;
}

.text-input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--c-border);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
  background: #fff;
  color: var(--c-text);
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
textarea.text-input {
  resize: vertical;
  min-height: 60px;
}
.text-input:focus {
  border-color: var(--c-accent);
  box-shadow: 0 0 0 3px rgba(230, 57, 70, 0.08);
}

.range-input {
  width: 100%;
  margin: 4px 0;
  accent-color: var(--c-accent);
}
.range-marks {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--c-text3);
  margin-top: -2px;
}

.field-hint {
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--c-text2);
  line-height: 1.5;
}
.hint-ok {
  color: #15803d;
  background: #ecfdf5;
  padding: 4px 8px;
  border-radius: 4px;
}
.hint-warn {
  color: #b45309;
  background: #fffbeb;
  padding: 4px 8px;
  border-radius: 4px;
}

.value-tag {
  font-size: 11px;
  color: var(--c-accent);
  background: var(--c-accent-light);
  padding: 1px 6px;
  border-radius: 3px;
  margin-left: 6px;
  font-weight: 600;
}

/* Provider cards */
.provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
}
.provider-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 10px 12px;
  border: 1.5px solid var(--c-border);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  font-family: inherit;
}
.provider-card:hover {
  border-color: var(--c-accent);
  background: var(--c-accent-light);
}
.provider-card.active {
  border-color: var(--c-accent);
  background: var(--c-accent-light);
  box-shadow: 0 0 0 2px rgba(230, 57, 70, 0.15);
}
.provider-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--c-text);
  margin-bottom: 2px;
}
.provider-desc {
  font-size: 11px;
  color: var(--c-text2);
  line-height: 1.4;
}

/* Model chips */
.model-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.model-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid var(--c-border);
  border-radius: 14px;
  background: #fff;
  color: var(--c-text);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.model-chip:hover {
  border-color: var(--c-accent);
  color: var(--c-accent);
}
.model-chip.active {
  background: var(--c-accent);
  color: #fff;
  border-color: var(--c-accent);
}
.chip-tag {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
}
.tag-recommend {
  background: #fef3c7;
  color: #92400e;
}
.tag-advanced {
  background: #ede9fe;
  color: #5b21b6;
}
.model-chip.active .chip-tag {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}

.link {
  color: var(--c-accent);
  text-decoration: underline;
  cursor: pointer;
  font-weight: 500;
}
.link:hover {
  color: #1d4ed8;
}

.sm-btn {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--c-border);
  border-radius: 5px;
  background: #fff;
  color: var(--c-text);
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.sm-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}
.sm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.sm-btn.warn {
  color: var(--c-danger);
  border-color: #fca5a5;
}
.sm-btn.warn:hover {
  background: #fef2f2;
}
.sm-btn.primary {
  background: var(--c-accent);
  color: #fff;
  border-color: var(--c-accent);
}
.sm-btn.primary:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}
.danger-btn {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid var(--c-danger);
  border-radius: 6px;
  background: #fff;
  color: var(--c-danger);
  cursor: pointer;
  transition: all 0.15s;
}
.danger-btn:hover {
  background: var(--c-danger);
  color: #fff;
}

.add-btn {
  width: 100%;
  padding: 8px;
  border: 1px dashed var(--c-border);
  border-radius: 6px;
  background: #fafafa;
  color: var(--c-accent);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 10px;
}
.add-btn:hover {
  border-color: var(--c-accent);
  background: var(--c-accent-light);
}

.select-sm {
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--c-border);
  border-radius: 5px;
  background: #fff;
  color: var(--c-text);
  cursor: pointer;
}

.input-with-action {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.hint-text {
  font-size: 11px;
  color: var(--c-text2);
}

.toggle-row {
  display: flex !important;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px !important;
}
.toggle-row span {
  font-size: 13px;
  font-weight: 600;
}
.switch {
  position: relative;
  display: inline-block;
  width: 38px;
  height: 22px;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.switch .slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: #d1d5db;
  border-radius: 22px;
  transition: 0.2s;
}
.switch .slider::before {
  position: absolute;
  content: '';
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background: #fff;
  border-radius: 50%;
  transition: 0.2s;
}
.switch input:checked + .slider {
  background: var(--c-accent);
}
.switch input:checked + .slider::before {
  transform: translateX(16px);
}

.inherit-tag {
  font-size: 10px;
  font-weight: 600;
  color: var(--c-accent);
  background: var(--c-accent-light);
  padding: 1px 5px;
  border-radius: 3px;
  margin-left: 6px;
}

.rag-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}
.rag-result {
  font-size: 12px;
  font-weight: 600;
}
.rag-result.ok {
  color: var(--c-success);
}
.rag-result.fail {
  color: var(--c-danger);
}
.rag-stats {
  margin-top: 10px;
  border: 1px solid var(--c-border);
  border-radius: 6px;
  overflow: hidden;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--c-text2);
  padding: 8px 12px;
  border-bottom: 1px solid var(--c-border);
}
.stat-row:last-child {
  border-bottom: none;
}
.stat-row span:last-child {
  font-weight: 700;
  color: var(--c-text);
}

/* Playbook section */
.pb-section {
  background: #fff;
  border: 1px solid var(--c-border);
  border-radius: 10px;
  margin-bottom: 12px;
  overflow: hidden;
}
.pb-section.sec-danger .pb-label {
  background: #fef2f2;
}
.pb-section.sec-primary .pb-label {
  background: #eff6ff;
}
.pb-section.sec-accent .pb-label {
  background: #f5f3ff;
}
.pb-label {
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 700;
  color: var(--c-text);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}
.toggle-icon {
  font-size: 11px;
  color: var(--c-text3);
}
.section-body {
  padding: 10px 14px;
}
.pb-field {
  margin-bottom: 10px;
}
.pb-field:last-child {
  margin-bottom: 0;
}
.pb-field label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--c-text2);
  margin-bottom: 3px;
}

.acc-card {
  background: #f9fafb;
  border: 1px solid var(--c-border);
  border-radius: 8px;
  margin-bottom: 6px;
  overflow: hidden;
}
.acc-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.1s;
}
.acc-head:hover {
  background: #f3f4f6;
}
.acc-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text);
  display: flex;
  align-items: center;
  gap: 6px;
}
.acc-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.acc-arrow {
  font-size: 11px;
  color: var(--c-text3);
}
.acc-body {
  padding: 0 12px 12px;
}
.sev-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.sev-dot.high {
  background: #ef4444;
}
.sev-dot.medium {
  background: #eab308;
}
.sev-dot.low {
  background: #22c55e;
}
.del-btn-sm {
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  color: var(--c-text3);
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.del-btn-sm:hover {
  background: var(--c-accent-light);
  color: var(--c-danger);
}

/* Rule card (for keyword/review scheme) */
.rule-card {
  background: #f9fafb;
  border: 1px solid var(--c-border);
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 10px;
}
.rule-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.rule-num {
  font-size: 11px;
  font-weight: 700;
  color: var(--c-text3);
  background: #fff;
  padding: 1px 6px;
  border-radius: 3px;
}
.primary-save-btn {
  width: 100%;
  padding: 8px;
  background: var(--c-accent);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 4px;
}
.primary-save-btn:hover {
  background: #1d4ed8;
}

/* Tag list */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--c-accent-light);
  color: var(--c-accent);
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}
.add-tag {
  border: 1px dashed var(--c-border);
  background: #fff;
  color: var(--c-text2);
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}
.add-tag:hover {
  border-color: var(--c-accent);
  color: var(--c-accent);
}

/* Data actions */
.data-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.upload-btn {
  cursor: pointer;
}
.config-path-card {
  margin-top: 10px;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 6px;
}
.path-label {
  margin: 0 0 4px;
  font-size: 11px;
  color: var(--c-text2);
  font-weight: 600;
}
.path-text {
  font-family: monospace;
  font-size: 11px;
  color: var(--c-text);
  word-break: break-all;
}

.danger-zone {
  border-color: #fca5a5;
}
.danger-zone h4 {
  color: var(--c-danger);
}

/* Modal */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}
.modal-card h3 {
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 700;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

/* Collapse transition */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
}
.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 1200px;
}
</style>
