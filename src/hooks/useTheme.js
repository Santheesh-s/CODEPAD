import { useSyncExternalStore, useCallback } from 'react';

// Shared theme store so every component (toolbar, editor, ...) reads and
// writes the SAME state. Previously each useTheme() call had its own
// useState, so toggling in one component left the others out of sync.

function getInitial() {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true; // Default to dark theme
}

let isDark = getInitial();
const listeners = new Set();

function apply() {
    if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
}

// Apply once on load so the <html> class matches the stored preference.
apply();

function setDark(next) {
    const value = typeof next === 'function' ? next(isDark) : next;
    if (value === isDark) return;
    isDark = value;
    apply();
    listeners.forEach((l) => l());
}

function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot() {
    return isDark;
}

export function useTheme() {
    const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    const set = useCallback((next) => setDark(next), []);
    return [value, set];
}
