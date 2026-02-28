import { Watch, Heart, Activity, Moon, Footprints, Flame, AlertCircle, TrendingDown, TrendingUp, Info } from 'lucide-react'
import { healthMetrics } from '../data/mock'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import '../styles/health.css'

export default function Health() {
    const latestHR = healthMetrics[healthMetrics.length - 1].heartRate
    const latestHRV = healthMetrics[healthMetrics.length - 1].hrv
    const latestSleep = healthMetrics[healthMetrics.length - 1].sleep
    const latestSteps = healthMetrics[healthMetrics.length - 1].steps

    const avgHR = Math.round(healthMetrics.reduce((s, m) => s + m.heartRate, 0) / healthMetrics.length)
    const hrElevated = latestHR > avgHR + 5

    return (
        <div className="health-page fade-in">
            {/* ── Watch Connection ── */}
            <div className="watch-card glass-card">
                <div className="watch-icon">
                    <Watch size={24} />
                </div>
                <div className="watch-info">
                    <span className="watch-title">Apple Watch Connected</span>
                    <span className="watch-sub">Last synced: 2 min ago</span>
                </div>
                <div className="watch-status connected">
                    <div className="status-dot" />
                    <span>Live</span>
                </div>
            </div>

            {/* ── Vitals Grid ── */}
            <div className="vitals-grid">
                <div className="vital-card glass-card">
                    <div className="vital-header">
                        <Heart size={14} className="vital-icon hr" />
                        <span>Heart Rate</span>
                    </div>
                    <span className="vital-value">{latestHR} <small>bpm</small></span>
                    <span className={`vital-trend ${hrElevated ? 'warn' : ''}`}>
                        {hrElevated ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {hrElevated ? 'Above avg' : 'Normal'}
                    </span>
                </div>

                <div className="vital-card glass-card">
                    <div className="vital-header">
                        <Activity size={14} className="vital-icon hrv" />
                        <span>HRV</span>
                    </div>
                    <span className="vital-value">{latestHRV} <small>ms</small></span>
                    <span className="vital-trend">Normal range</span>
                </div>

                <div className="vital-card glass-card">
                    <div className="vital-header">
                        <Moon size={14} className="vital-icon sleep" />
                        <span>Sleep</span>
                    </div>
                    <span className="vital-value">{latestSleep} <small>hrs</small></span>
                    <span className={`vital-trend ${latestSleep < 7 ? 'warn' : 'good'}`}>
                        {latestSleep < 7 ? 'Below target' : 'On target'}
                    </span>
                </div>

                <div className="vital-card glass-card">
                    <div className="vital-header">
                        <Footprints size={14} className="vital-icon steps" />
                        <span>Steps</span>
                    </div>
                    <span className="vital-value">{latestSteps.toLocaleString()}</span>
                    <span className="vital-trend good">
                        <TrendingUp size={12} /> Active day
                    </span>
                </div>
            </div>

            {/* ── Heart Rate Chart ── */}
            <section className="section">
                <h2 className="section-title">Heart Rate — 7 Day Trend</h2>
                <div className="chart-card glass-card">
                    <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={healthMetrics}>
                            <defs>
                                <linearGradient id="hrLine" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#f87171" />
                                    <stop offset="100%" stopColor="#fb923c" />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis domain={['auto', 'auto']} stroke="#475569" fontSize={11} tickLine={false} axisLine={false} width={30} />
                            <Tooltip
                                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                                labelStyle={{ color: '#94a3b8' }}
                            />
                            <Line type="monotone" dataKey="heartRate" stroke="url(#hrLine)" strokeWidth={2.5} dot={{ r: 3, fill: '#f87171' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* ── HRV Chart ── */}
            <section className="section">
                <h2 className="section-title">HRV — Heart Rate Variability</h2>
                <div className="chart-card glass-card">
                    <ResponsiveContainer width="100%" height={140}>
                        <AreaChart data={healthMetrics}>
                            <defs>
                                <linearGradient id="hrvGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                                labelStyle={{ color: '#94a3b8' }}
                            />
                            <Area type="monotone" dataKey="hrv" stroke="#34d399" fill="url(#hrvGrad)" strokeWidth={2} dot={{ r: 3, fill: '#34d399' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* ── Wellness Insights ── */}
            <section className="section">
                <h2 className="section-title">Wellness Insights</h2>
                <div className="insights-list">
                    <div className="insight-card glass-card warn">
                        <div className="insight-icon warn">
                            <AlertCircle size={18} />
                        </div>
                        <div className="insight-info">
                            <span className="insight-title">Elevated Resting Heart Rate</span>
                            <p className="insight-text">Your resting HR has been 12% above your 30-day baseline for 3 days. Combined with reduced HRV and below-target sleep, you might be getting sick.</p>
                            <div className="insight-actions">
                                <button className="insight-btn primary">Activate Sick Day Mode</button>
                                <button className="insight-btn">Dismiss</button>
                            </div>
                        </div>
                    </div>

                    <div className="insight-card glass-card info">
                        <div className="insight-icon info">
                            <TrendingDown size={18} />
                        </div>
                        <div className="insight-info">
                            <span className="insight-title">Sleep Dropped 2 Nights</span>
                            <p className="insight-text">You slept under 6.5 hours on Tuesday and Wednesday. Your Wednesday HRV also dipped. Consider earlier bedtime tonight.</p>
                            <div className="insight-actions">
                                <button className="insight-btn primary">Set Bedtime Reminder</button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Disclaimer ── */}
            <div className="disclaimer glass-card">
                <Info size={14} />
                <span>Wellness guidance only — not medical advice. Consult a healthcare professional for medical concerns.</span>
            </div>
        </div>
    )
}
