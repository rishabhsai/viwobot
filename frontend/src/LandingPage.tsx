import { useState, type FormEvent } from 'react'
import {
    Workflow,
    Brain,
    ListTodo,
    CheckCircle2,
    Sparkles,
    Coffee,
    Moon,
    ShoppingCart,
    GraduationCap,
    ArrowRight,
    Clock,
    Mic,
    Zap,
    MessageSquare,
} from 'lucide-react'
import './landing.css'

const features = [
    {
        icon: <Workflow size={24} />,
        title: 'Smart Automations',
        description:
            'Nova learns your routines and automates your day — lights, reminders, schedules — hands-free.',
    },
    {
        icon: <Brain size={24} />,
        title: 'Contextual Memory',
        description:
            'It remembers your preferences, habits, and conversations so every interaction feels personal.',
    },
    {
        icon: <ListTodo size={24} />,
        title: 'Lists & Timers',
        description:
            'Manage todos, grocery lists, and focus timers with your voice. Nova keeps you on track.',
    },
]

const useCases = [
    {
        icon: <Coffee size={20} />,
        title: 'Morning Routine',
        description: '"Good morning" triggers your briefing — weather, calendar, and a focus playlist.',
    },
    {
        icon: <Moon size={20} />,
        title: 'Wind Down',
        description: 'Nova dims the lights, locks up, and sets your alarm when you say goodnight.',
    },
    {
        icon: <ShoppingCart size={20} />,
        title: 'Hands-Free Lists',
        description: '"Add oat milk" — Nova adds it to your grocery list, no phone needed.',
    },
    {
        icon: <GraduationCap size={20} />,
        title: 'Study Buddy',
        description: 'Nova quizzes you on flashcards, sets focus timers, and tracks your progress.',
    },
]

const automationSteps = [
    { icon: <Mic size={16} />, label: 'You say', detail: '"Hey Nova, goodnight"' },
    { icon: <Zap size={16} />, label: 'Nova runs', detail: 'Goodnight automation' },
    { icon: <Clock size={16} />, label: 'Step 1', detail: 'Set alarm for 7:30 AM' },
    { icon: <Workflow size={16} />, label: 'Step 2', detail: 'Turn off living room lights' },
    { icon: <MessageSquare size={16} />, label: 'Step 3', detail: 'Lock front door via smart lock' },
    { icon: <CheckCircle2 size={16} />, label: 'Done', detail: '"All set. Goodnight!"' },
]

const memories = [
    { category: 'Preference', text: 'Likes oat milk lattes, not regular milk', source: 'Conversation · 3 days ago' },
    { category: 'Routine', text: 'Usually works out Tuesday & Thursday evenings', source: 'Observed · 2 weeks ago' },
    { category: 'Context', text: 'Has a dentist appointment next Friday at 2pm', source: 'Conversation · yesterday' },
    { category: 'People', text: 'Mom\'s birthday is March 12', source: 'Conversation · 1 week ago' },
]

export default function LandingPage() {
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (!email.trim()) return
        setLoading(true)
        setTimeout(() => {
            setSubmitted(true)
            setLoading(false)
        }, 1200)
    }

    const scrollToWaitlist = () => {
        document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <div className="landing-page">
            <div className="landing-inner">
                {/* Nav */}
                <nav className="landing-nav">
                    <span className="landing-logo">Nova</span>
                    <button
                        type="button"
                        className="landing-nav-cta"
                        onClick={scrollToWaitlist}
                    >
                        Join Waitlist
                    </button>
                </nav>

                {/* Hero */}
                <section className="landing-hero">
                    <div className="hero-badge">
                        <span className="hero-badge-dot" />
                        A physical device for your home
                    </div>
                    <h1>Meet Nova</h1>
                    <p>
                        A beautifully designed in-home companion that listens, learns, and
                        quietly takes care of the little things — so you don't have to.
                    </p>

                    <div className="hero-image-wrapper">
                        <img
                            src="/nova-hero.png"
                            alt="Nova device on a nightstand in warm golden-hour light"
                            className="hero-image"
                        />
                    </div>
                </section>

                {/* Features */}
                <section className="features-section">
                    <div className="section-label">
                        <h2>Designed to disappear</h2>
                        <p>
                            No screens. No distractions. Just a calm presence in your home.
                        </p>
                    </div>

                    <div className="features-grid">
                        {features.map((f) => (
                            <div className="feature-card" key={f.title}>
                                <div className="feature-icon">{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Use Cases */}
                <section className="usecases-section">
                    <div className="section-label">
                        <h2>How people use Nova</h2>
                        <p>Just speak naturally. Nova takes care of the rest.</p>
                    </div>

                    <div className="usecases-grid">
                        {useCases.map((uc) => (
                            <div className="usecase-card" key={uc.title}>
                                <div className="usecase-icon">{uc.icon}</div>
                                <div className="usecase-text">
                                    <h3>{uc.title}</h3>
                                    <p>{uc.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Sample Automation */}
                <section className="automation-section">
                    <div className="section-label">
                        <h2>See it in action</h2>
                        <p>One phrase triggers a whole routine — here's how.</p>
                    </div>

                    <div className="automation-demo">
                        {automationSteps.map((step, i) => (
                            <div className="auto-step" key={i}>
                                <div className="auto-step-icon">{step.icon}</div>
                                <div className="auto-step-content">
                                    <span className="auto-step-label">{step.label}</span>
                                    <span className="auto-step-detail">{step.detail}</span>
                                </div>
                                {i < automationSteps.length - 1 && (
                                    <div className="auto-step-arrow">
                                        <ArrowRight size={14} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Memory Showcase */}
                <section className="memory-section">
                    <div className="section-label">
                        <h2>Nova remembers</h2>
                        <p>Every conversation builds a richer understanding of you.</p>
                    </div>

                    <div className="memory-showcase">
                        {memories.map((m, i) => (
                            <div className="mem-card" key={i}>
                                <div className="mem-top">
                                    <span className="mem-category">{m.category}</span>
                                    <Brain size={14} color="#6a8292" />
                                </div>
                                <p className="mem-text">{m.text}</p>
                                <span className="mem-source">{m.source}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Waitlist */}
                <section className="waitlist-section" id="waitlist">
                    <div className="waitlist-card">
                        {!submitted ? (
                            <>
                                <h2>Get early access</h2>
                                <p>
                                    We're hand-building the first batch. Join the waitlist
                                    to reserve yours.
                                </p>
                                <form
                                    className="waitlist-form"
                                    onSubmit={handleSubmit}
                                >
                                    <input
                                        type="email"
                                        className="waitlist-input"
                                        placeholder="you@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        className="waitlist-btn"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <Sparkles
                                                size={18}
                                                style={{ animation: 'spin 1s linear infinite' }}
                                            />
                                        ) : (
                                            'Join Waitlist'
                                        )}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="waitlist-success">
                                <div className="success-icon">
                                    <CheckCircle2 size={28} />
                                </div>
                                <h3>You're on the list!</h3>
                                <p>
                                    We'll reach out when the first units are ready. Thank
                                    you for believing in Nova.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Footer */}
                <footer className="landing-footer">
                    © 2026 Nova · Crafted with care
                </footer>
            </div>
        </div>
    )
}
