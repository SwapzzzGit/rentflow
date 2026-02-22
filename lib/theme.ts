export type Theme = 'dark' | 'light' | 'system'

export function getTheme(): Theme {
    if (typeof window === 'undefined') return 'system'
    return (localStorage.getItem('theme') as Theme) || 'system'
}

export function applyTheme(theme: Theme) {
    if (typeof window === 'undefined') return

    const root = document.documentElement
    let resolvedTheme = theme

    if (theme === 'system') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    if (resolvedTheme === 'dark') {
        root.classList.add('dark')
        root.classList.remove('light')
    } else {
        root.classList.add('light')
        root.classList.remove('dark')
    }

    localStorage.setItem('theme', theme)
}

export function toggleTheme(): Theme {
    const current = getTheme()
    // 3-way toggle: system -> light -> dark -> system
    let next: Theme = 'light'
    if (current === 'light') next = 'dark'
    else if (current === 'dark') next = 'system'
    else next = 'light'

    applyTheme(next)
    return next
}
