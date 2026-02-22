import { AlertCircle, CheckCircle2, DollarSign } from 'lucide-react'

const statCards = [
    {
        label: 'Monthly Rent',
        value: '$12,400',
        sub: '+8.2% this month',
        subColor: 'var(--dash-badge-paid-text)',
        icon: DollarSign,
        iconBg: 'var(--dash-badge-paid-bg)',
        iconColor: 'var(--dash-badge-paid-text)',
    },
    {
        label: 'Paid',
        value: '8 / 10 tenants',
        sub: 'On track',
        subColor: 'var(--dash-badge-paid-text)',
        icon: CheckCircle2,
        iconBg: 'var(--dash-badge-paid-bg)',
        iconColor: 'var(--dash-badge-paid-text)',
    },
    {
        label: 'Open Issues',
        value: '2',
        sub: 'Needs attention',
        subColor: 'var(--dash-badge-over-text)',
        icon: AlertCircle,
        iconBg: 'var(--dash-badge-over-bg)',
        iconColor: 'var(--dash-badge-over-text)',
    },
]

const rentActivity = [
    { name: 'Sarah Mitchell', address: '12 Oak Lane, Unit 3', amount: '$1,450', status: 'Paid', initials: 'SM' },
    { name: 'James Wright', address: '47 Maple Ave, Unit 1', amount: '$1,200', status: 'Overdue', initials: 'JW' },
    { name: 'Maria Garcia', address: '8 Birch Rd, Unit 5', amount: '$1,650', status: 'Paid', initials: 'MG' },
    { name: 'Tom Anderson', address: '23 Elm St, Unit 2', amount: '$980', status: 'Pending', initials: 'TA' },
]

const statusCfg: Record<string, { bg: string; text: string }> = {
    Paid: { bg: 'var(--dash-badge-paid-bg)', text: 'var(--dash-badge-paid-text)' },
    Overdue: { bg: 'var(--dash-badge-over-bg)', text: 'var(--dash-badge-over-text)' },
    Pending: { bg: 'var(--dash-badge-pend-bg)', text: 'var(--dash-badge-pend-text)' },
}

const avatarColors = ['#E8392A', '#6366F1', '#22C55E', '#F59E0B']

const recentExpenses = [
    { label: 'Plumber – emergency fix', amount: '$280', date: 'Feb 18' },
    { label: 'Building insurance', amount: '$180', date: 'Feb 14' },
    { label: 'Paint supplies', amount: '$65', date: 'Feb 10' },
]

const maintenanceItems = [
    { label: 'Leaking tap', unit: 'Unit 3', status: 'Open', color: 'var(--dash-badge-over-text)' },
    { label: 'Broken heater', unit: 'Unit 1', status: 'In Progress', color: 'var(--dash-badge-pend-text)' },
    { label: 'Door lock replaced', unit: 'Unit 5', status: 'Fixed', color: 'var(--dash-badge-paid-text)' },
]

const maintenanceDotBg: Record<string, string> = {
    'Open': 'var(--dash-badge-over-bg)',
    'In Progress': 'var(--dash-badge-pend-bg)',
    'Fixed': 'var(--dash-badge-paid-bg)',
}

export default function DashboardPage() {
    return (
        <div className="p-8 w-full max-w-[1200px]" style={{ transition: 'background-color 200ms ease' }}>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>
                    Dashboard
                </h1>
                <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>
                    Here&apos;s what&apos;s happening with your properties.
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {statCards.map((card) => {
                    const Icon = card.icon
                    return (
                        <div
                            key={card.label}
                            className="rounded-2xl p-6 flex items-start justify-between gap-4 transition-colors duration-200"
                            style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}
                        >
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--dash-muted)' }}>
                                    {card.label}
                                </p>
                                <p className="text-2xl font-bold mb-1.5" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>
                                    {card.value}
                                </p>
                                <p className="text-xs font-medium" style={{ color: card.subColor }}>
                                    {card.sub}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1" style={{ background: card.iconBg }}>
                                <Icon className="w-5 h-5" style={{ color: card.iconColor }} />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Rent Activity Table */}
            <div
                className="rounded-2xl mb-6 overflow-hidden transition-colors duration-200"
                style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}
            >
                <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--dash-border)' }}>
                    <h2 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>
                        Recent Rent Activity
                    </h2>
                    <span className="text-xs" style={{ color: 'var(--dash-muted)' }}>February 2026</span>
                </div>
                <div>
                    {rentActivity.map((row, idx) => {
                        const s = statusCfg[row.status]
                        return (
                            <div
                                key={row.name}
                                className="dash-row flex items-center justify-between px-6 py-4 transition-colors duration-150"
                                style={{ borderBottom: idx < rentActivity.length - 1 ? '1px solid var(--dash-divider)' : 'none' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                        style={{ background: avatarColors[idx % avatarColors.length] }}
                                    >
                                        {row.initials}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--dash-text)' }}>{row.name}</p>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--dash-muted)' }}>{row.address}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>{row.amount}</span>
                                    <span
                                        className="text-xs font-semibold rounded-full px-3 py-1"
                                        style={{ background: s.bg, color: s.text }}
                                    >
                                        {row.status}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Bottom: Expenses + Maintenance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Recent Expenses */}
                <div
                    className="rounded-2xl overflow-hidden transition-colors duration-200"
                    style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}
                >
                    <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--dash-border)' }}>
                        <h2 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>
                            Recent Expenses
                        </h2>
                        <span className="text-xs font-semibold text-[#E8392A]">$525 total</span>
                    </div>
                    <div className="px-6 py-2">
                        {recentExpenses.map((exp, i) => (
                            <div
                                key={exp.label}
                                className="flex items-center justify-between py-3.5"
                                style={{ borderBottom: i < recentExpenses.length - 1 ? '1px solid var(--dash-divider)' : 'none' }}
                            >
                                <div>
                                    <p className="text-sm" style={{ color: 'var(--dash-expense-text)' }}>{exp.label}</p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--dash-subtle)' }}>{exp.date}</p>
                                </div>
                                <span className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>{exp.amount}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Maintenance */}
                <div
                    className="rounded-2xl overflow-hidden transition-colors duration-200"
                    style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)' }}
                >
                    <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--dash-border)' }}>
                        <h2 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--dash-text)' }}>
                            Maintenance
                        </h2>
                        <span className="text-xs" style={{ color: 'var(--dash-muted)' }}>3 requests</span>
                    </div>
                    <div className="px-6 py-2">
                        {maintenanceItems.map((item, i) => (
                            <div
                                key={item.label}
                                className="flex items-center justify-between py-3.5"
                                style={{ borderBottom: i < maintenanceItems.length - 1 ? '1px solid var(--dash-divider)' : 'none' }}
                            >
                                <div>
                                    <p className="text-sm" style={{ color: 'var(--dash-expense-text)' }}>{item.label}</p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--dash-subtle)' }}>{item.unit}</p>
                                </div>
                                <div
                                    className="flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1"
                                    style={{ background: maintenanceDotBg[item.status], color: item.color }}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                                    {item.status}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}
