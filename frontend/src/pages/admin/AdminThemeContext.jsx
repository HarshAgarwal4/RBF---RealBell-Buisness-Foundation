import React, { createContext, useContext, useState, useLayoutEffect } from 'react';

const AdminThemeContext = createContext();

const DEFAULT_CUSTOM_COLORS = {
    primaryColor: '#6366f1',
    // Dark Mode Defaults
    darkBg: '#0b0d14',
    darkSidebarBg: '#0f1117',
    darkTopbarBg: '#0b0d14',
    darkCardBg: '#151827',
    darkTextPrimary: '#f1f5f9',
    darkTextMuted: '#94a3b8',
    darkInputBg: '#1a1f2e',
    darkInputBorder: '#334155',

    // Light Mode Defaults
    lightBg: '#f8fafc',
    lightSidebarBg: '#ffffff',
    lightTopbarBg: '#ffffff',
    lightCardBg: '#ffffff',
    lightTextPrimary: '#0f172a',
    lightTextMuted: '#475569',
    lightInputBg: '#ffffff',
    lightInputBorder: '#cbd5e1',
};

const applyThemeToDOM = (theme, colors) => {
    try {
        const root = document.documentElement;
        root.setAttribute('data-admin-theme', theme);

        root.style.setProperty('--custom-primary-color', colors?.primaryColor || '#6366f1');

        root.style.setProperty('--custom-dark-bg', colors?.darkBg || '#0b0d14');
        root.style.setProperty('--custom-dark-sidebar-bg', colors?.darkSidebarBg || '#0f1117');
        root.style.setProperty('--custom-dark-topbar-bg', colors?.darkTopbarBg || '#0b0d14');
        root.style.setProperty('--custom-dark-card-bg', colors?.darkCardBg || '#151827');
        root.style.setProperty('--custom-dark-text-primary', colors?.darkTextPrimary || '#f1f5f9');
        root.style.setProperty('--custom-dark-text-muted', colors?.darkTextMuted || '#94a3b8');
        root.style.setProperty('--custom-dark-input-bg', colors?.darkInputBg || '#1a1f2e');
        root.style.setProperty('--custom-dark-input-border', colors?.darkInputBorder || '#334155');

        root.style.setProperty('--custom-light-bg', colors?.lightBg || '#f8fafc');
        root.style.setProperty('--custom-light-sidebar-bg', colors?.lightSidebarBg || '#ffffff');
        root.style.setProperty('--custom-light-topbar-bg', colors?.lightTopbarBg || '#ffffff');
        root.style.setProperty('--custom-light-card-bg', colors?.lightCardBg || '#ffffff');
        root.style.setProperty('--custom-light-text-primary', colors?.lightTextPrimary || '#0f172a');
        root.style.setProperty('--custom-light-text-muted', colors?.lightTextMuted || '#475569');
        root.style.setProperty('--custom-light-input-bg', colors?.lightInputBg || '#ffffff');
        root.style.setProperty('--custom-light-input-border', colors?.lightInputBorder || '#cbd5e1');
    } catch (e) {
        console.error(e);
    }
};

export function AdminThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('rbf_admin_theme') || 'dark';
        return savedTheme;
    });

    const [customColors, setCustomColors] = useState(() => {
        try {
            const savedTheme = localStorage.getItem('rbf_admin_theme') || 'dark';
            const saved = localStorage.getItem('rbf_admin_custom_colors');
            const parsed = saved ? { ...DEFAULT_CUSTOM_COLORS, ...JSON.parse(saved) } : DEFAULT_CUSTOM_COLORS;
            applyThemeToDOM(savedTheme, parsed);
            return parsed;
        } catch {
            applyThemeToDOM('dark', DEFAULT_CUSTOM_COLORS);
            return DEFAULT_CUSTOM_COLORS;
        }
    });

    useLayoutEffect(() => {
        localStorage.setItem('rbf_admin_theme', theme);
        localStorage.setItem('rbf_admin_custom_colors', JSON.stringify(customColors));
        applyThemeToDOM(theme, customColors);
    }, [theme, customColors]);

    const toggleTheme = () => {
        setTheme(prev => {
            const nextTheme = prev === 'dark' ? 'light' : 'dark';
            applyThemeToDOM(nextTheme, customColors);
            return nextTheme;
        });
    };

    const updateCustomColor = (key, value) => {
        setCustomColors(prev => {
            const next = { ...prev, [key]: value };
            applyThemeToDOM(theme, next);
            return next;
        });
    };

    const setAllCustomColors = (newColors) => {
        setCustomColors(newColors);
        applyThemeToDOM(theme, newColors);
    };

    const resetCustomColors = () => {
        setCustomColors(DEFAULT_CUSTOM_COLORS);
        applyThemeToDOM(theme, DEFAULT_CUSTOM_COLORS);
    };

    return (
        <AdminThemeContext.Provider value={{
            theme,
            setTheme,
            toggleTheme,
            customColors,
            updateCustomColor,
            setAllCustomColors,
            resetCustomColors,
            defaultColors: DEFAULT_CUSTOM_COLORS,
        }}>
            {children}
        </AdminThemeContext.Provider>
    );
}

export function useAdminTheme() {
    const context = useContext(AdminThemeContext);
    if (!context) {
        return {
            theme: 'dark',
            toggleTheme: () => {},
            customColors: DEFAULT_CUSTOM_COLORS,
            updateCustomColor: () => {},
            setAllCustomColors: () => {},
            resetCustomColors: () => {},
            defaultColors: DEFAULT_CUSTOM_COLORS,
        };
    }
    return context;
}
