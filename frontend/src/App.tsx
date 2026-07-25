import { useEffect, useMemo, useState } from 'react'
import {
  BrainCircuit,
  Copy,
  Download,
  History,
  Lightbulb,
  MessageSquareText,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Settings as SettingsIcon,
  Eye,
  EyeOff,
  Check,
  Search,
  Code,
  Info,
  Clock,
  Compass,
  LineChart,
  Trash2
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts'
import api from './services/api'
import type { Analytics, FunctionType, GenerateResult, PromptStyle } from './types'
import './styles.css'

const functions = [
  { id: 'question', label: 'Answer Questions', icon: MessageSquareText, placeholder: 'Ask a factual or academic question...', category: 'Informational' },
  { id: 'summarize', label: 'Summarize Text', icon: History, placeholder: 'Paste the text you want summarized...', category: 'Text Processing' },
  { id: 'creative', label: 'Creative Content', icon: Sparkles, placeholder: 'Describe the story, poem, or content you want...', category: 'Generation' },
  { id: 'advice', label: 'Get Advice', icon: Lightbulb, placeholder: 'Describe the situation you need advice about...', category: 'Problem Solving' }
] as const

const promptTemplates = {
  question: {
    concise: "Answer the following question directly in no more than 4 sentences: {input}",
    balanced: "Answer the following question clearly. Include the key explanation and one helpful example where relevant: {input}",
    detailed: "Provide a structured, accurate answer to the question below. Explain essential context, key points, an example, and any important limitation: {input}"
  },
  summarize: {
    concise: "Summarize the following text in 3 concise sentences: {input}",
    balanced: "Summarize the following text, preserving the main idea, key supporting points, and conclusion: {input}",
    detailed: "Create a structured summary of the following text with: overview, key points, important details, and conclusion. Do not add information not present in the text: {input}"
  },
  creative: {
    concise: "Create a short original piece based on this request: {input}",
    balanced: "Create an engaging and original piece based on this request. Use vivid but accessible language and a clear beginning, middle, and end: {input}",
    detailed: "Create a polished, original piece based on the request below. Establish a strong setting, coherent structure, distinctive voice, and satisfying conclusion. Avoid clichés where possible: {input}"
  },
  advice: {
    concise: "Give 5 practical tips for this situation: {input}",
    balanced: "Provide practical, realistic advice for the following situation. Explain why each recommendation helps: {input}",
    detailed: "Analyze the situation below and provide a step-by-step action plan, priorities, possible obstacles, and ways to track progress. Keep the advice realistic and supportive: {input}"
  }
}

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b']

export default function App() {
  const [fn, setFn] = useState<FunctionType>('question')
  const [style, setStyle] = useState<PromptStyle>('balanced')
  const [tone, setTone] = useState('neutral')
  const [format, setFormat] = useState('paragraph')
  const [input, setInput] = useState('')
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [tab, setTab] = useState<'workspace' | 'prompts' | 'analytics' | 'settings'>('workspace')
  const [showPromptPreview, setShowPromptPreview] = useState(false)

  // Settings states (persisted in local storage)
  const [provider, setProvider] = useState(() => localStorage.getItem('ia_provider') || 'openai')
  const [model, setModel] = useState(() => localStorage.getItem('ia_model') || 'gpt-4o-mini')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ia_api_key') || '')
  const [showApiKey, setShowApiKey] = useState(false)

  // Notification states
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const selected = useMemo(() => functions.find(x => x.id === fn)!, [fn])

  // Toast auto-clear
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
  }

  const loadAnalytics = () => {
    api.get('/api/analytics')
      .then(r => setAnalytics(r.data))
      .catch(() => {})
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  // Automatically update active model when provider changes to set a good default
  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider)
    if (newProvider === 'gemini') {
      setModel('gemini-2.0-flash')
    } else {
      setModel('gpt-4o-mini')
    }
  }

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('ia_provider', provider)
    localStorage.setItem('ia_model', model)
    localStorage.setItem('ia_api_key', apiKey)
    showToast('Settings saved successfully!', 'success')
  }

  const clearSettings = () => {
    localStorage.removeItem('ia_provider')
    localStorage.removeItem('ia_model')
    localStorage.removeItem('ia_api_key')
    setProvider('openai')
    setModel('gpt-4o-mini')
    setApiKey('')
    showToast('Settings cleared. Using backend defaults.', 'info')
  }

  // Real-time local prompt preview reconstruction
  const generatedPrompt = useMemo(() => {
    const baseRules = "Be accurate, clear, safe, and useful. Do not invent facts. When uncertain, say so. Respect the requested tone and format."
    const toneRule = `Use a ${tone} tone.`
    const formatRule = format === 'bullets' ? "Use bullet points." : "Use clear paragraphs."
    const cleanInput = input.trim() || "[Your text input will show here...]"
    const bodyText = (promptTemplates[fn]?.[style] || "").replace('{input}', cleanInput)
    return `${baseRules}\n${toneRule} ${formatRule}\n\n${bodyText}`
  }, [fn, style, tone, format, input])

  async function generate() {
    if (input.trim().length < 3) {
      setError('Please enter at least 3 characters.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const payload = {
        function_type: fn,
        prompt_style: style,
        tone,
        output_format: format,
        user_input: input,
        provider,
        model,
        api_key: apiKey || undefined
      }

      const r = await api.post('/api/generate', payload)
      setResult(r.data)
      showToast('AI response generated successfully!', 'success')
      loadAnalytics()
    } catch (e: any) {
      const errMsg = e.response?.data?.detail || 'Could not generate a response. Please check your API key / settings.'
      setError(errMsg)
      showToast(errMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function feedback(helpful: boolean) {
    if (!result) return
    try {
      await api.post(`/api/feedback/${result.interaction_id}`, { helpful })
      showToast(helpful ? 'Saved as helpful!' : 'Saved as not helpful.', 'success')
      loadAnalytics()
    } catch (e) {
      showToast('Could not save feedback.', 'error')
    }
  }

  function download() {
    if (!result) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([result.response], { type: 'text/plain' }))
    a.download = `intelliassist-${fn}-${style}.txt`
    a.click()
    showToast('Response downloaded!', 'success')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast('Copied to clipboard!', 'success')
  }

  // Formatting helper to display paragraphs properly
  const formatResponse = (text: string) => {
    return text.split('\n\n').map((para, i) => {
      if (para.trim().startsWith('-') || para.trim().startsWith('*')) {
        return (
          <ul key={i} className="response-list">
            {para.split('\n').map((item, j) => (
              <li key={j}>{item.replace(/^[-*]\s*/, '')}</li>
            ))}
          </ul>
        )
      }
      return <p key={i} className="response-paragraph">{para}</p>
    })
  }

  // Prepare chart data
  const functionUsageData = useMemo(() => {
    if (!analytics || !analytics.function_usage) return []
    return Object.entries(analytics.function_usage).map(([key, value]) => {
      const fnObj = functions.find(f => f.id === key)
      return {
        name: fnObj ? fnObj.label : key.toUpperCase(),
        requests: value
      }
    })
  }, [analytics])

  const promptStyleData = useMemo(() => {
    if (!analytics || !analytics.style_usage) return []
    return Object.entries(analytics.style_usage).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      requests: value
    }))
  }, [analytics])

  // Filtered prompt list for Prompt Library
  const filteredPrompts = useMemo(() => {
    const list: Array<{ function: string; styleName: string; text: string; category: string }> = []
    Object.entries(promptTemplates).forEach(([fnKey, styles]) => {
      const fnObj = functions.find(f => f.id === fnKey)
      const fnLabel = fnObj ? fnObj.label : fnKey
      const cat = fnObj ? fnObj.category : 'General'
      Object.entries(styles).forEach(([styleKey, templateText]) => {
        list.push({
          function: fnLabel,
          styleName: styleKey.charAt(0).toUpperCase() + styleKey.slice(1),
          text: templateText,
          category: cat
        })
      })
    })

    if (!searchQuery.trim()) return list
    const query = searchQuery.toLowerCase()
    return list.filter(item =>
      item.function.toLowerCase().includes(query) ||
      item.styleName.toLowerCase().includes(query) ||
      item.text.toLowerCase().includes(query)
    )
  }, [searchQuery])

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'error' && <span className="toast-icon">⚠️</span>}
          {toast.type === 'success' && <span className="toast-icon">✨</span>}
          {toast.type === 'info' && <span className="toast-icon">ℹ️</span>}
          <span className="toast-message">{toast.message}</span>
        </div>
      )}

      {/* Modern Sidebar */}
      <aside className="app-sidebar">
        <div className="brand-container">
          <div className="brand-logo">
            <BrainCircuit className="logo-icon" />
            <div className="brand-glow"></div>
          </div>
          <div>
            <span className="brand-name">IntelliAssist</span>
            <span className="brand-version">v1.2.0</span>
          </div>
        </div>
        
        <p className="app-subtitle">Prompt Engineering Studio</p>

        <nav className="nav-menu">
          <button className={`nav-item ${tab === 'workspace' ? 'active' : ''}`} onClick={() => setTab('workspace')}>
            <Compass size={18} />
            <span>Studio Workspace</span>
          </button>
          <button className={`nav-item ${tab === 'prompts' ? 'active' : ''}`} onClick={() => setTab('prompts')}>
            <Code size={18} />
            <span>Prompt Library</span>
          </button>
          <button className={`nav-item ${tab === 'analytics' ? 'active' : ''}`} onClick={() => setTab('analytics')}>
            <LineChart size={18} />
            <span>Analytics Hub</span>
          </button>
          <button className={`nav-item ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
            <SettingsIcon size={18} />
            <span>AI Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="provider-badge">
            <div className={`status-dot ${result?.demo_mode && !apiKey ? 'demo' : 'ready'}`}></div>
            <span>
              Engine: {apiKey ? `${provider === 'openai' ? 'OpenAI' : 'Gemini'}` : 'Demo / Env Fallback'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="app-main">
        {/* TAB 1: WORKSPACE */}
        {tab === 'workspace' && (
          <div className="tab-pane">
            <header className="page-header">
              <h1>Studio Workspace</h1>
              <p>Tailor your prompt parameters and leverage state-of-the-art models for optimal results.</p>
            </header>

            {/* Task Category Grid */}
            <div className="section-title">Select Assistant Function</div>
            <section className="function-grid">
              {functions.map(item => {
                const Icon = item.icon
                const isSelected = fn === item.id
                return (
                  <button
                    key={item.id}
                    className={`function-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setFn(item.id)
                      setInput('')
                      setResult(null)
                    }}
                  >
                    <div className="card-highlight"></div>
                    <div className="icon-wrapper">
                      <Icon size={22} />
                    </div>
                    <div className="card-details">
                      <span className="card-label">{item.label}</span>
                      <span className="card-category">{item.category}</span>
                    </div>
                  </button>
                )
              })}
            </section>

            {/* Generation Controls & Text Input */}
            <section className="panel glass-panel">
              <div className="panel-header">
                <h3>Prompt Parameters</h3>
                <span className="badge">Engineering Panel</span>
              </div>

              <div className="controls-grid">
                <label className="input-group">
                  <span>Prompt Style</span>
                  <div className="select-wrapper">
                    <select value={style} onChange={e => setStyle(e.target.value as PromptStyle)}>
                      <option value="concise">Concise (Direct / Short)</option>
                      <option value="balanced">Balanced (Clarity / Detail)</option>
                      <option value="detailed">Detailed (Advanced Instructions)</option>
                    </select>
                  </div>
                </label>

                <label className="input-group">
                  <span>Output Tone</span>
                  <div className="select-wrapper">
                    <select value={tone} onChange={e => setTone(e.target.value)}>
                      <option value="neutral">Neutral & Informative</option>
                      <option value="formal">Formal & Professional</option>
                      <option value="casual">Casual & Conversational</option>
                      <option value="creative">Creative & Expressive</option>
                    </select>
                  </div>
                </label>

                <label className="input-group">
                  <span>Output Format</span>
                  <div className="select-wrapper">
                    <select value={format} onChange={e => setFormat(e.target.value)}>
                      <option value="paragraph">Standard Paragraphs</option>
                      <option value="bullets">Structured Bullet Points</option>
                    </select>
                  </div>
                </label>
              </div>

              <div className="input-container">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={selected.placeholder}
                  className="main-textarea"
                />
                <div className="meta-row">
                  <div className="word-count">
                    {input.trim() ? input.trim().split(/\s+/).length : 0} words · {input.length} characters
                  </div>
                  <div className="character-limit">Max 12,000 characters</div>
                </div>
              </div>

              {/* Collapsible Prompt Preview */}
              <div className="prompt-preview-container">
                <button
                  className="toggle-preview-btn"
                  onClick={() => setShowPromptPreview(!showPromptPreview)}
                >
                  <Code size={15} />
                  <span>{showPromptPreview ? 'Hide Under-The-Hood Prompt' : 'View Under-The-Hood Prompt'}</span>
                </button>
                {showPromptPreview && (
                  <div className="prompt-raw-preview">
                    <div className="preview-header">
                      <span>Structured Prompt Sent to Model</span>
                      <button className="copy-small-btn" onClick={() => copyToClipboard(generatedPrompt)}>
                        <Copy size={12} /> Copy Raw
                      </button>
                    </div>
                    <pre>{generatedPrompt}</pre>
                  </div>
                )}
              </div>

              {error && (
                <div className="error-alert">
                  <Info size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="action-row">
                <button className="btn-generate" disabled={loading} onClick={generate}>
                  {loading ? (
                    <div className="spinner-container">
                      <div className="loading-spinner"></div>
                      <span>Analyzing & Structuring...</span>
                    </div>
                  ) : (
                    <span>Generate Response</span>
                  )}
                </button>
              </div>
            </section>

            {/* Generated Response Panel */}
            {result && (
              <section className="panel glass-panel response-panel fade-in">
                <div className="response-header">
                  <div className="resp-info">
                    <h2>AI Response Output</h2>
                    <span className="model-badge">
                      {result.demo_mode ? 'Demo Sandbox' : `${provider.toUpperCase()} Model`}
                    </span>
                  </div>
                  <div className="resp-actions">
                    <button className="action-btn" title="Copy Content" onClick={() => copyToClipboard(result.response)}>
                      <Copy size={16} />
                    </button>
                    <button className="action-btn" title="Download Text File" onClick={download}>
                      <Download size={16} />
                    </button>
                  </div>
                </div>

                <div className="response-content">
                  {formatResponse(result.response)}
                </div>

                <div className="feedback-container">
                  <span className="feedback-label">Rate this output:</span>
                  <div className="feedback-buttons">
                    <button className="feedback-btn like" onClick={() => feedback(true)}>
                      <ThumbsUp size={15} />
                      <span>Helpful</span>
                    </button>
                    <button className="feedback-btn dislike" onClick={() => feedback(false)}>
                      <ThumbsDown size={15} />
                      <span>Not Helpful</span>
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* TAB 2: PROMPTS */}
        {tab === 'prompts' && (
          <div className="tab-pane fade-in">
            <header className="page-header">
              <h1>Prompt Templates Explorer</h1>
              <p>Explore the prompt templates used by the system under the hood. Learn and use them anywhere.</p>
            </header>

            <div className="search-bar-container">
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search template functions, styles, or prompt instructions..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="search-field"
                />
              </div>
              <span className="search-count">{filteredPrompts.length} templates found</span>
            </div>

            <div className="prompts-grid">
              {filteredPrompts.map((item, idx) => (
                <div className="prompt-library-card glass-panel" key={idx}>
                  <div className="library-card-header">
                    <div>
                      <span className="lib-badge cat">{item.category}</span>
                      <span className="lib-badge style">{item.styleName}</span>
                    </div>
                    <button className="copy-card-btn" onClick={() => copyToClipboard(item.text)}>
                      <Copy size={14} /> Copy Template
                    </button>
                  </div>
                  <h4>{item.function}</h4>
                  <div className="template-box">
                    <code>{item.text}</code>
                  </div>
                </div>
              ))}
              {filteredPrompts.length === 0 && (
                <div className="empty-state">
                  <Info size={40} />
                  <p>No prompt templates found matching your search query.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ANALYTICS */}
        {tab === 'analytics' && (
          <div className="tab-pane fade-in">
            <header className="page-header">
              <h1>System Performance & Feedback</h1>
              <p>Real-time telemetry and user feedback aggregated locally.</p>
            </header>

            {/* Aggregated Stat Cards */}
            <div className="metrics-grid">
              <div className="metric-card glass-panel border-indigo">
                <span className="metric-title">Total Requests</span>
                <span className="metric-value">{analytics?.total_requests ?? 0}</span>
                <span className="metric-subtext">Cumulative prompt submissions</span>
              </div>
              <div className="metric-card glass-panel border-emerald">
                <span className="metric-title">Helpful Votes</span>
                <span className="metric-value">{analytics?.helpful ?? 0}</span>
                <span className="metric-subtext">Positive user feedback items</span>
              </div>
              <div className="metric-card glass-panel border-rose">
                <span className="metric-title">Not Helpful Votes</span>
                <span className="metric-value">{analytics?.not_helpful ?? 0}</span>
                <span className="metric-subtext">Negative user feedback items</span>
              </div>
              <div className="metric-card glass-panel border-purple">
                <span className="metric-title">Satisfaction Rate</span>
                <span className="metric-value">{analytics?.helpful_rate ?? 0}%</span>
                <span className="metric-subtext">Ratio of positive to total votes</span>
              </div>
            </div>

            {/* Dynamic Charts Section */}
            <div className="charts-grid">
              <div className="chart-container glass-panel">
                <h4>Requests by Function</h4>
                {functionUsageData.length > 0 ? (
                  <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={functionUsageData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#f8fafc' }} />
                        <Bar dataKey="requests" fill="#6366f1" radius={[4, 4, 0, 0]}>
                          {functionUsageData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="empty-chart">No telemetry data recorded yet.</div>
                )}
              </div>

              <div className="chart-container glass-panel">
                <h4>Prompt Style Distribution</h4>
                {promptStyleData.length > 0 ? (
                  <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={promptStyleData}
                          cx="50%"
                          cy="45%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="requests"
                        >
                          {promptStyleData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#f8fafc' }} />
                        <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="empty-chart">No telemetry data recorded yet.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {tab === 'settings' && (
          <div className="tab-pane fade-in">
            <header className="page-header">
              <h1>Engine Configuration</h1>
              <p>Configure your model provider and API keys. Custom configurations are persisted locally in your browser.</p>
            </header>

            <div className="settings-split">
              <form onSubmit={saveSettings} className="settings-form panel glass-panel">
                <h3>Select Provider</h3>
                
                <div className="provider-options">
                  <button
                    type="button"
                    className={`provider-card ${provider === 'openai' ? 'active' : ''}`}
                    onClick={() => handleProviderChange('openai')}
                  >
                    <div className="provider-dot"></div>
                    <strong>OpenAI</strong>
                    <span>GPT-4o, GPT-4o-mini</span>
                  </button>

                  <button
                    type="button"
                    className={`provider-card ${provider === 'gemini' ? 'active' : ''}`}
                    onClick={() => handleProviderChange('gemini')}
                  >
                    <div className="provider-dot"></div>
                    <strong>Google Gemini</strong>
                    <span>Gemini 2.0 Flash, 1.5 Pro</span>
                  </button>
                </div>

                <div className="form-fields">
                  <label className="input-group">
                    <span>Active Model</span>
                    <div className="select-wrapper">
                      {provider === 'gemini' ? (
                        <select value={model} onChange={e => setModel(e.target.value)}>
                          <option value="gemini-2.0-flash">gemini-2.0-flash (Recommended, ultra fast)</option>
                          <option value="gemini-1.5-flash">gemini-1.5-flash (Fast, efficient)</option>
                          <option value="gemini-1.5-pro">gemini-1.5-pro (High intelligence)</option>
                        </select>
                      ) : (
                        <select value={model} onChange={e => setModel(e.target.value)}>
                          <option value="gpt-4o-mini">gpt-4o-mini (Recommended, fast & light)</option>
                          <option value="gpt-4o">gpt-4o (High intelligence model)</option>
                          <option value="gpt-3.5-turbo">gpt-3.5-turbo (Legacy fast model)</option>
                        </select>
                      )}
                    </div>
                  </label>

                  <label className="input-group">
                    <span>API Key (Client-side Override)</span>
                    <div className="api-key-input-wrapper">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        placeholder={`Paste your ${provider === 'openai' ? 'sk-...' : 'AIzaSy...'} API key`}
                        className="api-key-input"
                      />
                      <button
                        type="button"
                        className="toggle-eye-btn"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <span className="helper-text">
                      Leave empty to use keys pre-configured in the server's `.env` file.
                    </span>
                  </label>
                </div>

                <div className="settings-actions">
                  <button type="submit" className="btn-save-settings">
                    <Check size={16} />
                    <span>Save Engine Configuration</span>
                  </button>
                  <button type="button" className="btn-clear-settings" onClick={clearSettings}>
                    <Trash2 size={16} />
                    <span>Reset Defaults</span>
                  </button>
                </div>
              </form>

              <div className="settings-info-panel glass-panel">
                <h3>Configuration Details</h3>
                <div className="info-item">
                  <Clock size={20} className="info-icon text-indigo" />
                  <div>
                    <strong>Low Latency Responses</strong>
                    <p>Using models like `gemini-2.0-flash` or `gpt-4o-mini` with direct endpoint invocation ensures responses generate in sub-second times, similar to official ChatGPT or Claude clients.</p>
                  </div>
                </div>
                <div className="info-item">
                  <Sparkles size={20} className="info-icon text-emerald" />
                  <div>
                    <strong>Get a Free API Key</strong>
                    <p>
                      Don't have a key? You can get a <strong>free Google Gemini API key</strong> in 30 seconds from Google AI Studio. Simply sign in and click "Get API Key" at <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{color: '#818cf8', textDecoration: 'underline'}}>aistudio.google.com</a>.
                    </p>
                  </div>
                </div>
                <div className="info-item">
                  <Info size={20} className="info-icon text-purple" />
                  <div>
                    <strong>Local & Secure Storage</strong>
                    <p>Keys entered here never leave your browser except to make direct queries via the backend. They are stored securely in local browser storage (`localStorage`).</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
