<template>
  <div class="app-shell">
    <main class="app-content">
      <RouterView />
    </main>
    <BottomNav />
  </div>
</template>

<script setup>
import BottomNav from './components/BottomNav.vue'
</script>

<style scoped>
.app-shell {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #0f172a;
  max-width: 480px;
  margin: 0 auto;
  overflow: hidden;
}

.app-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
