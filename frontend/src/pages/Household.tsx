import { useState } from 'react'
import { Shield, Key, ShoppingCart, Calendar, UserPlus, Settings, ChevronRight } from 'lucide-react'
import { householdMembers } from '../data/mock'
import '../styles/household.css'

const approvalQueue = [
    { id: 'aq1', action: 'Unlock front door remotely', requester: 'Max', icon: <Key size={16} />, time: '5 min ago' },
    { id: 'aq2', action: 'Add item to shopping list', requester: 'Sarah', icon: <ShoppingCart size={16} />, time: '20 min ago' },
    { id: 'aq3', action: 'Reschedule morning meeting', requester: 'OpenClaw (auto)', icon: <Calendar size={16} />, time: '1 hr ago' },
]

const sharedRoutines = [
    { name: 'Morning Wake Up', members: ['You', 'Sarah'], shared: true },
    { name: 'Bedtime Routine', members: ['You'], shared: false },
    { name: 'Kid Homework Mode', members: ['Max'], shared: false },
    { name: 'Movie Night', members: ['You', 'Sarah', 'Max'], shared: true },
]

export default function Household() {
    const [tab, setTab] = useState<'members' | 'routines' | 'approvals'>('members')

    return (
        <div className="household-page fade-in">
            {/* ── Tabs ── */}
            <div className="hh-tabs">
                <button className={`hh-tab ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>Members</button>
                <button className={`hh-tab ${tab === 'routines' ? 'active' : ''}`} onClick={() => setTab('routines')}>Routines</button>
                <button className={`hh-tab ${tab === 'approvals' ? 'active' : ''}`} onClick={() => setTab('approvals')}>
                    Approvals
                    <span className="approval-count">{approvalQueue.length}</span>
                </button>
            </div>

            {tab === 'members' && (
                <div className="members-section">
                    <div className="members-grid">
                        {householdMembers.map(member => (
                            <div key={member.id} className="member-card glass-card">
                                <div className="member-avatar-wrap">
                                    <span className="member-avatar">{member.avatar}</span>
                                    <div className={`member-presence ${member.isHome ? 'home' : 'away'}`} />
                                </div>
                                <div className="member-info">
                                    <span className="member-name">{member.name}</span>
                                    <span className={`member-role ${member.role}`}>{member.role}</span>
                                </div>
                                <div className="member-meta">
                                    <span className="member-routines">{member.routines} routines</span>
                                    <span className={`member-location ${member.isHome ? 'home' : 'away'}`}>
                                        {member.isHome ? 'Home' : 'Away'}
                                    </span>
                                </div>
                                <ChevronRight size={16} className="member-arrow" />
                            </div>
                        ))}
                    </div>

                    <button className="add-member-btn">
                        <UserPlus size={16} />
                        <span>Invite Member</span>
                    </button>
                </div>
            )}

            {tab === 'routines' && (
                <div className="routines-section">
                    {sharedRoutines.map(r => (
                        <div key={r.name} className="routine-card glass-card">
                            <div className="routine-info">
                                <span className="routine-name">{r.name}</span>
                                <div className="routine-members">
                                    {r.members.map(m => (
                                        <span key={m} className="routine-member-tag">{m}</span>
                                    ))}
                                </div>
                            </div>
                            <div className={`shared-badge ${r.shared ? 'shared' : 'private'}`}>
                                {r.shared ? (
                                    <><Shield size={10} /> Shared</>
                                ) : (
                                    <><Key size={10} /> Private</>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'approvals' && (
                <div className="approvals-section">
                    <p className="approvals-intro">These actions need your approval before executing.</p>
                    {approvalQueue.map(a => (
                        <div key={a.id} className="approval-card glass-card">
                            <div className="approval-icon">{a.icon}</div>
                            <div className="approval-info">
                                <span className="approval-action">{a.action}</span>
                                <span className="approval-meta">Requested by {a.requester} · {a.time}</span>
                            </div>
                            <div className="approval-actions">
                                <button className="approve-btn">Approve</button>
                                <button className="deny-btn">Deny</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
