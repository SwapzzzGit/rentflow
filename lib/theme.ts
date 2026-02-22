export type Theme = 'dark' | 'light' | 'system'

export function getTheme(): Theme {
    if (typeof window === 'undefined') return 'system'
    return (localStorage.getItem('theme') as Theme) || 'system'
}

/**
 * Returns the effective mode ('light' or 'dark') regardless of if the setting is 'system'
 */
export function getEffectiveTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light'
    const theme = getTheme()
    if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme as 'light' | 'dark'
}

export function applyTheme(theme: Theme) {
    if (typeof window === 'undefined') return

    const root = document.documentElement
    const resolvedTheme = theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme

    if (resolvedTheme === 'dark') {
        root.classList.add('dark')
        root.classList.remove('light')
    } else {
        root.classList.add('light')
        root.classList.remove('dark')
    }

    localStorage.setItem('theme', theme)
}

export function setTheme(theme: Theme) {
    applyTheme(theme)
}

export function toggleTheme(): Theme {
    const current = getTheme()
    let next: Theme = 'light'

    // If currently 'system', we resolve to the opposite of the effective theme
    if (current === 'system') {
        const effective = getEffectiveTheme()
        next = effective === 'light' ? 'dark' : 'light'
    } else {
        next = current === 'light' ? 'dark' : 'light'
    }

    applyTheme(next)
    return next
}
