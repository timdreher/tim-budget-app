<template>
  <nav class="bottom-nav">
    <RouterLink v-for="tab in tabs" :key="tab.to" :to="tab.to" class="nav-item">
      <span class="nav-icon" v-html="tab.icon"></span>
      <span class="nav-label">{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
const tabs = [
  {
    to: '/erfassen',
    label: 'Erfassen',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
  },
  {
    to: '/verlauf',
    label: 'Verlauf',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  },
  {
    to: '/statistik',
    label: 'Statistik',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  },
  {
    to: '/mehr',
    label: 'Mehr',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`,
  },
]
</script>

<style scoped>
.bottom-nav {
  display: flex;
  background: #1e293b;
  border-top: 1px solid #334155;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  flex-shrink: 0;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 10px 0;
  color: #64748b;
  text-decoration: none;
  transition: color 0.15s;
  min-height: 56px;
}

.nav-item.router-link-active {
  color: #3b82f6;
}

/* Highlight the Erfassen tab with the primary color */
.nav-item[href*="erfassen"].router-link-active,
.nav-item[to="/erfassen"].router-link-active {
  color: #60a5fa;
}

.nav-icon {
  display: flex;
  width: 24px;
  height: 24px;
}

.nav-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.nav-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.02em;
}
</style>
