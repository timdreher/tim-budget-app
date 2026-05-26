import { createRouter, createWebHashHistory } from 'vue-router'
import CaptureView from '../views/CaptureView.vue'
import HistoryView from '../views/HistoryView.vue'
import StatsView from '../views/StatsView.vue'
import MoreView from '../views/MoreView.vue'

const routes = [
  { path: '/', redirect: '/erfassen' },
  { path: '/erfassen', component: CaptureView },
  { path: '/verlauf', component: HistoryView },
  { path: '/statistik', component: StatsView },
  { path: '/mehr', component: MoreView },
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
})
