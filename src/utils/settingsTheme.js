export const ACCENT_COLORS = {
  blue: { primary: '#1a3a6b', mid: '#2a5298', light: '#e8f0fa' },
  green: { primary: '#1b7a4b', mid: '#27ae60', light: '#e8f8ef' },
  purple: { primary: '#5b2c8f', mid: '#7d3cbe', light: '#f0e8fa' },
  orange: { primary: '#c0650a', mid: '#f39c12', light: '#fef5e7' },
  pink: { primary: '#b83280', mid: '#e056a0', light: '#fdeef6' },
  cyan: { primary: '#0e7490', mid: '#0891b2', light: '#e6f7fb' },
};

export function resolveTheme(theme) {
  if (theme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export function applyThemeSettings(settings) {
  const resolved = resolveTheme(settings.theme);
  const accent = ACCENT_COLORS[settings.accentColor] ?? ACCENT_COLORS.blue;

  document.body.dataset.theme = resolved;
  document.body.dataset.numberStyle = settings.numberStyle ?? 'standard';
  document.body.dataset.animations = settings.animationsEnabled ? 'on' : 'off';

  const root = document.documentElement;
  root.style.setProperty('--accent-primary', accent.primary);
  root.style.setProperty('--accent-mid', accent.mid);
  root.style.setProperty('--accent-light', accent.light);
  root.style.setProperty('--navy', accent.primary);
  root.style.setProperty('--navy-mid', accent.mid);
  root.style.setProperty('--blue-light', accent.light);
}
