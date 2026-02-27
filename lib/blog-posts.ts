export type BlogPost = {
    slug: string
    category: string
    title: string
    description: string
    readTime: string
    date: string
    featured?: boolean
    body?: BlogSection[]
}

export type BlogSection = {
    type: 'heading' | 'paragraph' | 'tip' | 'step'
    step?: number
    text: string
}

export const categoryColors: Record<string, string> = {
    'Getting Started': '#E8392A',
    'Rent Tracking': '#22C55E',
    'Maintenance': '#EAB308',
    'Expenses & Tax': '#3B82F6',
    'Tenant Management': '#A855F7',
    'Tips & Tricks': '#EC4899',
}

export const categoryGradients: Record<string, string> = {
    'Getting Started': 'linear-gradient(135deg, rgba(232,57,42,0.25), rgba(232,57,42,0.06))',
    'Rent Tracking': 'linear-gradient(135deg, rgba(34,197,94,0.25), rgba(34,197,94,0.06))',
    'Maintenance': 'linear-gradient(135deg, rgba(234,179,8,0.25), rgba(234,179,8,0.06))',
    'Expenses & Tax': 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(59,130,246,0.06))',
    'Tenant Management': 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(168,85,247,0.06))',
    'Tips & Tricks': 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(236,72,153,0.06))',
}

export const blogPosts: BlogPost[] = [
    {
        slug: 'getting-started',
        category: 'Getting Started',
        title: 'How to Set Up RentFlow in 10 Minutes',
        description: 'Add your first property, invite your tenant, and track your first rent payment — complete walkthrough for new landlords.',
        readTime: '5 min read',
        date: 'Feb 2026',
        featured: true,
        body: [
            { type: 'paragraph', text: 'Getting started with RentFlow takes less time than it sounds. In this guide we will walk you through every step — from creating your account to receiving your first rent payment — in under 10 minutes.' },
            { type: 'tip', text: 'Tip: Have your property address and tenant\'s email address ready before you start. That\'s all you need.' },
            { type: 'step', step: 1, text: 'Create your account' },
            { type: 'paragraph', text: 'Visit rentflow.app and click "Get Started". Enter your email, create a password, and verify your email address. You will be taken straight to your dashboard.' },
            { type: 'step', step: 2, text: 'Add your first property' },
            { type: 'paragraph', text: 'From the dashboard, click "Properties" in the sidebar, then "Add Property". Fill in the property name, address, and currency. Hit Save — your property is live.' },
            { type: 'step', step: 3, text: 'Add your tenant' },
            { type: 'paragraph', text: 'Navigate to the Tenants section and click "Add Tenant". Enter their full name, email, and rent amount. Choose a move-in date and rent due day. RentFlow will auto-generate monthly rent rows from that date forward.' },
            { type: 'step', step: 4, text: 'Track rent payments' },
            { type: 'paragraph', text: 'In the Rent section, you will see a row for every month your tenant owes rent. When they pay, click "Mark as Paid" and the row goes green instantly. No spreadsheets, no confusion.' },
            { type: 'step', step: 5, text: "You are set up — what to explore next" },
            { type: 'paragraph', text: 'Now that you\'re live, explore these sections: Maintenance (log repair jobs), Expenses (track costs against your property), and Leases (upload signed lease agreements). The tenant portal lets your tenant see their rent history and raise maintenance tickets on their own.' },
            { type: 'tip', text: 'Pro tip: Invite your tenant to the Tenant Portal so they can check their rent status and log maintenance requests without texting you every time.' },
        ],
    },
    {
        slug: 'track-rent-payments',
        category: 'Rent Tracking',
        title: 'How to Track Rent Payments and Never Miss an Overdue',
        description: 'Learn how RentFlow auto-generates monthly rent rows and how to mark payments as paid in one click.',
        readTime: '4 min read',
        date: 'Feb 2026',
        body: [
            { type: 'paragraph', text: 'Chasing rent manually is one of the most frustrating parts of being a landlord. RentFlow removes that friction entirely with auto-generated monthly rent rows and a one-click payment tracker.' },
            { type: 'heading', text: 'How auto-generated rent rows work' },
            { type: 'paragraph', text: 'When you add a tenant, RentFlow notes their move-in date and monthly rent due date. Every month, a new "rent due" row appears automatically in the Rent section. You never have to create it — it just appears.' },
            { type: 'tip', text: 'Rows appear in advance so you always see upcoming rent before it is actually due.' },
            { type: 'heading', text: 'Marking a payment as paid' },
            { type: 'paragraph', text: 'Click "Mark as Paid" on any row and enter the date you received the payment. The row turns green and the amount is logged. That\'s it — one click.' },
            { type: 'heading', text: 'Spotting overdue payments' },
            { type: 'paragraph', text: 'Any row past its due date that is not marked paid automatically turns red and shows "Overdue". You can see every overdue tenant at a glance from the main dashboard.' },
            { type: 'tip', text: 'Filter by "Overdue" in the Rent section to get a focused view of who needs a reminder.' },
        ],
    },
    {
        slug: 'maintenance-receipts',
        category: 'Maintenance',
        title: 'How to Log Maintenance Jobs and Split Costs with Tenants',
        description: 'Upload receipts, assign who pays — landlord, tenant, or split — and auto-link to your expense tracker.',
        readTime: '6 min read',
        date: 'Feb 2026',
        body: [
            { type: 'paragraph', text: 'Every property needs maintenance. The question is: who pays, and how do you keep track? RentFlow\'s maintenance module handles both — logging the job, tracking its status, and recording who covers the cost.' },
            { type: 'heading', text: 'Creating a maintenance ticket' },
            { type: 'paragraph', text: 'Go to Maintenance and click "New Ticket". Choose a category (Plumbing, Electrical, etc.), set a priority, and describe the issue. Your tenant can also raise tickets from their portal, which appear here automatically.' },
            { type: 'heading', text: 'Updating status as work progresses' },
            { type: 'paragraph', text: 'Use the status stepper on the ticket detail page — Open → In Progress → Fixed. Click any step to update it instantly. This gives you a clear audit trail if questions arise later.' },
            { type: 'heading', text: 'Uploading a receipt and splitting costs' },
            { type: 'paragraph', text: 'Once the job is done, upload the receipt photo or PDF. Enter the amount and choose who bears the cost: landlord, tenant, split 50/50, or a custom percentage. RentFlow automatically creates an expense entry linked to this ticket.' },
            { type: 'tip', text: 'Custom split is useful for damage claims where the tenant covers a portion but not the full cost.' },
        ],
    },
    {
        slug: 'expense-tracking-tax',
        category: 'Expenses & Tax',
        title: 'How to Prepare for Tax Season as a Landlord Using RentFlow',
        description: 'Export your full expense report as PDF in one click. Everything categorised and ready for your accountant.',
        readTime: '5 min read',
        date: 'Feb 2026',
        body: [
            { type: 'paragraph', text: 'Tax season does not have to be a nightmare. If you have been logging expenses in RentFlow throughout the year, generating your landlord tax report takes about 30 seconds.' },
            { type: 'heading', text: 'What counts as a deductible expense?' },
            { type: 'paragraph', text: 'Common deductible property expenses include: repairs and maintenance, insurance premiums, property management fees, mortgage interest (in many regions), and utility costs you cover for tenants. RentFlow\'s expense categories align with these.' },
            { type: 'heading', text: 'Logging expenses as you go' },
            { type: 'paragraph', text: 'Every time you spend money on a property, add it in the Expenses section. Maintenance tickets auto-link their receipts. For everything else — insurance, fees, utilities — add them manually with the correct category.' },
            { type: 'tip', text: 'Consistency is the key. Log expenses the same week you incur them and tax season becomes trivial.' },
            { type: 'heading', text: 'Exporting your report' },
            { type: 'paragraph', text: 'Go to Expenses and click "Export PDF". The report includes every expense, categorised and totalled, with the date range of your choice. Hand it to your accountant and you are done.' },
        ],
    },
    {
        slug: 'lease-management',
        category: 'Tenant Management',
        title: 'Never Let a Lease Expire Without Knowing: Lease Tracking Guide',
        description: 'RentFlow alerts you 60 days before any lease expires. Here is how to set it up and what to do when one is expiring.',
        readTime: '3 min read',
        date: 'Feb 2026',
        body: [
            { type: 'paragraph', text: 'A lease expiring without a renewal plan is one of the most avoidable landlord headaches. RentFlow tracks every lease end date and surfaces expiry warnings so you always have time to act.' },
            { type: 'heading', text: 'Adding a lease' },
            { type: 'paragraph', text: 'In the Leases section, click "Add Lease" and enter the start date, end date, and rent amount. You can also upload the signed PDF and send a digital signing request to your tenant — all from within RentFlow.' },
            { type: 'heading', text: 'How expiry alerts work' },
            { type: 'paragraph', text: 'RentFlow automatically flags leases that expire within 60 days. You will see an amber warning on the lease card and a notification in your dashboard. No manual checking required.' },
            { type: 'tip', text: '60 days is enough time to negotiate a renewal, give proper notice, or find a new tenant if needed.' },
            { type: 'heading', text: 'What to do when a lease is expiring' },
            { type: 'paragraph', text: 'You have three options: (1) Renew the lease by creating a new lease record with the updated dates. (2) Go periodic — continue month-to-month. (3) Issue a termination notice and start searching for a new tenant. RentFlow supports all three.' },
        ],
    },
    {
        slug: 'multiple-properties',
        category: 'Tips & Tricks',
        title: 'Managing 5+ Properties Without Losing Your Mind',
        description: 'Tips from experienced landlords on staying organised when your portfolio grows beyond a few units.',
        readTime: '7 min read',
        date: 'Feb 2026',
        body: [
            { type: 'paragraph', text: 'One or two properties is manageable with a spreadsheet and some patience. Once you hit five or more, the complexity grows fast. Here are the habits and systems that experienced portfolio landlords swear by.' },
            { type: 'heading', text: '1. Standardise your naming conventions' },
            { type: 'paragraph', text: 'Use a consistent naming format for properties, tenants, and expenses. "Flat 3 - 12 Oak Street" is more scannable than "oak st 3". Small thing, big difference when you have a dozen properties.' },
            { type: 'heading', text: '2. Categorise expenses the same way every time' },
            { type: 'paragraph', text: 'Resist the urge to create one-off expense categories. Stick to the defaults (Repairs, Insurance, Utilities, etc.) so your annual export is clean and your accountant does not have to ask questions.' },
            { type: 'tip', text: 'Create a personal "expense logging" habit: every Friday, 10 minutes reviewing that week\'s receipts and logging them in RentFlow.' },
            { type: 'heading', text: '3. Use the tenant portal to reduce inbound messages' },
            { type: 'paragraph', text: 'Every tenant on the portal can see their rent history and raise maintenance tickets themselves. This removes a significant portion of the daily messages that slow you down.' },
            { type: 'heading', text: '4. Treat lease renewals like calendar events' },
            { type: 'paragraph', text: 'When you add a new lease, immediately calendar the renewal conversation 90 days before the end date. RentFlow alerts you at 60 days, but starting the conversation at 90 gives you more flexibility.' },
            { type: 'heading', text: '5. Review your dashboard weekly, not daily' },
            { type: 'paragraph', text: 'Daily checking creates anxiety. A weekly 20-minute dashboard review covers: overdue rent, open maintenance, expiring leases, and recent expenses. That\'s enough to stay fully on top of a large portfolio.' },
        ],
    },
]
