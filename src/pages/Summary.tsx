import { Sun, Moon, CloudSun, Calendar, Home as HomeIcon, ListTodo, TrendingUp, TrendingDown, AlertTriangle, Clock, Zap, BedSingle } from 'lucide-react'
import { summaryData, healthMetrics } from '../data/mock'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import '../styles/summary.css'

export default function Summary() {
    return (
        <div className="summary-page fade-in">
            {/* ── Morning Briefing ── */}
            <section className="briefing-card glass-card">
                <div className="briefing-header">
                    <div className="briefing-icon morning">
                        <Sun size={20} />
                    </div>
                    <div>
                        <h2 className="briefing-title">Morning Briefing</h2>
                        <span className="briefing-sub">Thursday, Feb 27</span>
                    </div>
                </div>

                <div className="briefing-row">
                    <CloudSun size={16} className="briefing-row-icon" />
                    <span>{summaryData.morning.weather}</span>
                </div>

                <div className="briefing-section">
                    <span className="briefing-section-label">
                        <Calendar size={12} /> Today's Schedule
                    </span>
                    {summaryData.morning.schedule.map(s => (
                        <div key={s} className="schedule-item">{s}</div>
                    ))}
                </div>

                <div className="briefing-row">
                    <HomeIcon size={16} className="briefing-row-icon" />
                    <span>{summaryData.morning.homeStatus}</span>
                </div>

                {summaryData.morning.unfinished.length > 0 && (
                    <div className="briefing-section">
                        <span className="briefing-section-label">
                            <ListTodo size={12} /> Still to do
                        </span>
                        {summaryData.morning.unfinished.map(u => (
                            <div key={u} className="todo-item">
                                <div className="todo-dot" />
                                {u}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Evening Recap ── */}
            <section className="briefing-card glass-card">
                <div className="briefing-header">
                    <div className="briefing-icon evening">
                        <Moon size={20} />
                    </div>
                    <div>
                        <h2 className="briefing-title">Evening Recap</h2>
                        <span className="briefing-sub">Today's performance</span>
                    </div>
                </div>

                <div className="recap-stats">
                    <div className="recap-stat">
                        <span className="recap-stat-value success">{summaryData.evening.completed}</span>
                        <span className="recap-stat-label">Completed</span>
                    </div>
                    <div className="recap-stat">
                        <span className="recap-stat-value error">{summaryData.evening.missed}</span>
                        <span className="recap-stat-label">Missed</span>
                    </div>
                </div>

                {summaryData.evening.anomalies.length > 0 && (
                    <div className="anomalies">
                        <span className="briefing-section-label">
                            <AlertTriangle size={12} /> Anomalies
                        </span>
                        {summaryData.evening.anomalies.map(a => (
                            <div key={a} className="anomaly-item">
                                <AlertTriangle size={12} />
                                <span>{a}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Weekly Trends ── */}
            <section className="section">
                <h2 className="section-title">Weekly Trends</h2>

                <div className="trends-grid">
                    <div className="trend-card glass-card">
                        <div className="trend-header">
                            <Clock size={14} />
                            <span>Alarms</span>
                        </div>
                        <div className="trend-values">
                            <span className="trend-main">{summaryData.weekly.alarmsHit} hit</span>
                            <span className="trend-sub warn">{summaryData.weekly.alarmsSnoozed} snoozed</span>
                        </div>
                    </div>

                    <div className="trend-card glass-card">
                        <div className="trend-header">
                            <Zap size={14} />
                            <span>Automations</span>
                        </div>
                        <div className="trend-values">
                            <span className="trend-main">{summaryData.weekly.automationsRun} runs</span>
                        </div>
                    </div>

                    <div className="trend-card glass-card">
                        <div className="trend-header">
                            <TrendingUp size={14} />
                            <span>Energy</span>
                        </div>
                        <div className="trend-values">
                            <span className="trend-main warn">{summaryData.weekly.energyChange}</span>
                        </div>
                    </div>

                    <div className="trend-card glass-card">
                        <div className="trend-header">
                            <BedSingle size={14} />
                            <span>Avg Sleep</span>
                        </div>
                        <div className="trend-values">
                            <span className="trend-main">{summaryData.weekly.avgSleep}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Sleep Trend Chart ── */}
            <section className="section">
                <h2 className="section-title">Sleep This Week</h2>
                <div className="chart-card glass-card">
                    <ResponsiveContainer width="100%" height={140}>
                        <AreaChart data={healthMetrics}>
                            <defs>
                                <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                                labelStyle={{ color: '#94a3b8' }}
                            />
                            <Area type="monotone" dataKey="sleep" stroke="#818cf8" fill="url(#sleepGrad)" strokeWidth={2} dot={{ r: 3, fill: '#818cf8' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </section>
        </div>
    )
}
