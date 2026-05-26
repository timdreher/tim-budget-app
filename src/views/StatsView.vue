<template>
  <div class="pb-8">

    <!-- Month selector -->
    <div class="flex items-center justify-between px-4 pt-4 pb-3">
      <button @click="shiftMonth(-1)" class="p-2 text-slate-400 active:text-slate-100 transition-colors">
        <AppIcon name="chevron-left" :size="20" />
      </button>
      <span class="text-slate-100 font-semibold text-base">{{ monthLabel }}</span>
      <button @click="shiftMonth(1)" :disabled="isCurrentMonth"
        :class="['p-2 transition-colors', isCurrentMonth ? 'text-slate-700' : 'text-slate-400 active:text-slate-100']">
        <AppIcon name="chevron-right" :size="20" />
      </button>
    </div>

    <!-- KPI cards -->
    <div class="grid grid-cols-2 gap-2 mx-4 mb-4">
      <div class="bg-slate-800 rounded-xl p-4">
        <p class="text-xs text-slate-500 mb-1">Einnahmen</p>
        <p class="text-lg font-semibold text-green-400">{{ fmt(income) }}</p>
      </div>
      <div class="bg-slate-800 rounded-xl p-4">
        <p class="text-xs text-slate-500 mb-1">Ausgaben</p>
        <p class="text-lg font-semibold text-orange-400">{{ fmt(expense) }}</p>
      </div>
      <div class="bg-slate-800 rounded-xl p-4">
        <p class="text-xs text-slate-500 mb-1">Cashflow</p>
        <p :class="['text-lg font-semibold', cashflow >= 0 ? 'text-blue-400' : 'text-red-400']">{{ fmt(cashflow) }}</p>
      </div>
      <div class="bg-slate-800 rounded-xl p-4">
        <p class="text-xs text-slate-500 mb-1">Sparquote</p>
        <p :class="['text-lg font-semibold', savingsRate >= 0 ? 'text-purple-400' : 'text-red-400']">
          {{ income > 0 ? savingsRate.toFixed(1) + ' %' : '—' }}
        </p>
      </div>
    </div>

    <!-- Donut: Ausgaben nach Gruppe -->
    <div v-if="expense > 0" class="mx-4 mb-4 bg-slate-800 rounded-xl p-4">
      <p class="text-xs text-slate-500 uppercase tracking-wide mb-3">Ausgaben nach Gruppe</p>
      <div class="relative flex justify-center mb-4">
        <canvas ref="donutCanvas" width="200" height="200" style="max-width:200px"></canvas>
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="text-center">
            <p class="text-base font-semibold text-slate-100">{{ fmt(expense) }}</p>
            <p class="text-xs text-slate-500">Gesamt</p>
          </div>
        </div>
      </div>
      <div class="space-y-1.5">
        <div v-for="item in donutData" :key="item.label" class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ background: item.color }"></span>
          <span class="text-xs text-slate-300 flex-1 truncate">{{ item.label }}</span>
          <span class="text-xs font-medium text-slate-400">{{ fmt(item.value) }}</span>
          <span class="text-xs text-slate-600 w-10 text-right">{{ ((item.value / expense) * 100).toFixed(0) }}%</span>
        </div>
      </div>
    </div>

    <!-- Top 5 Kategorien -->
    <div v-if="topCategories.length" class="mx-4 mb-4 bg-slate-800 rounded-xl p-4">
      <p class="text-xs text-slate-500 uppercase tracking-wide mb-3">Top Kategorien</p>
      <div class="space-y-2">
        <div v-for="(item, i) in topCategories" :key="item.id" class="flex items-center gap-3">
          <span class="text-xs text-slate-600 w-4 text-right">{{ i + 1 }}</span>
          <span class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            :style="{ background: item.color + '22', color: item.color }">
            <AppIcon :name="item.icon" :size="15" />
          </span>
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-baseline mb-0.5">
              <span class="text-xs font-medium text-slate-200 truncate">{{ item.name }}</span>
              <span class="text-xs text-slate-400 ml-2 flex-shrink-0">{{ fmt(item.amount) }}</span>
            </div>
            <div class="h-1 bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all"
                :style="{ width: ((item.amount / topCategories[0].amount) * 100) + '%', background: item.color }">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cashflow 6-Monats-Verlauf -->
    <div v-if="hasHistory" class="mx-4 mb-4 bg-slate-800 rounded-xl p-4">
      <p class="text-xs text-slate-500 uppercase tracking-wide mb-3">Cashflow letzte 6 Monate</p>
      <canvas ref="lineCanvas" height="120"></canvas>
    </div>

    <!-- Empty state -->
    <div v-if="!expense && !income" class="flex flex-col items-center justify-center py-16 text-slate-600">
      <AppIcon name="trending-up" :size="32" />
      <p class="mt-3 text-sm">Noch keine Buchungen in diesem Monat</p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { Chart, DoughnutController, ArcElement, Tooltip, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler } from 'chart.js'
import { db } from '../db/index.js'
import AppIcon from '../components/AppIcon.vue'

Chart.register(DoughnutController, ArcElement, Tooltip, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler)

// ── State ──────────────────────────────────────────────────────────────────

const now = new Date()
const viewYear  = ref(now.getFullYear())
const viewMonth = ref(now.getMonth())
const transactions = ref([])
const categories   = ref([])
const historyData  = ref([])
const donutCanvas  = ref(null)
const lineCanvas   = ref(null)
let donutChart = null
let lineChart  = null

// ── Load ───────────────────────────────────────────────────────────────────

async function loadMonth() {
  const y = viewYear.value
  const m = String(viewMonth.value + 1).padStart(2, '0')
  transactions.value = await db.transactions
    .where('date').between(`${y}-${m}-01`, `${y}-${m}-31`, true, true)
    .toArray()
}

async function loadHistory() {
  // 6 months including current
  const months = []
  for (let i = 5; i >= 0; i--) {
    let m = now.getMonth() - i
    let y = now.getFullYear()
    while (m < 0) { m += 12; y-- }
    const mm = String(m + 1).padStart(2, '0')
    const label = new Date(y, m, 1).toLocaleDateString('de-AT', { month: 'short' })
    const txs = await db.transactions.where('date').between(`${y}-${mm}-01`, `${y}-${mm}-31`, true, true).toArray()
    const inc = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    months.push({ label, cashflow: +(inc - exp).toFixed(2) })
  }
  historyData.value = months
}

db.categories.toArray().then(r => { categories.value = r })
onMounted(() => { loadMonth(); loadHistory() })
watch([viewYear, viewMonth], loadMonth)

// ── Computed ───────────────────────────────────────────────────────────────

const catMap = computed(() => Object.fromEntries(categories.value.map(c => [c.id, c])))

const isCurrentMonth = computed(() => viewYear.value === now.getFullYear() && viewMonth.value === now.getMonth())
const monthLabel = computed(() => new Date(viewYear.value, viewMonth.value, 1).toLocaleDateString('de-AT', { month: 'long', year: 'numeric' }))

const income   = computed(() => transactions.value.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
const expense  = computed(() => transactions.value.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))
const cashflow = computed(() => income.value - expense.value)
const savingsRate = computed(() => income.value > 0 ? (cashflow.value / income.value) * 100 : 0)

const GROUP_COLORS = {
  'Wohnen & Fixkosten': '#1F4E79',
  'Mobilität':          '#2E74B5',
  'Versicherungen':     '#833C00',
  'Lebenshaltung':      '#375623',
  'Gesundheit & Sport': '#7030A0',
  'Bildung & Software': '#C55A11',
  'Freizeit & Sonstiges':'#4472C4',
}

const donutData = computed(() => {
  const groups = {}
  for (const tx of transactions.value.filter(t => t.type === 'expense')) {
    const group = catMap.value[tx.category]?.group ?? 'Sonstiges'
    groups[group] = (groups[group] ?? 0) + tx.amount
  }
  return Object.entries(groups)
    .map(([label, value]) => ({ label, value: +value.toFixed(2), color: GROUP_COLORS[label] ?? '#64748b' }))
    .sort((a, b) => b.value - a.value)
})

const topCategories = computed(() => {
  const cats = {}
  for (const tx of transactions.value.filter(t => t.type === 'expense')) {
    cats[tx.category] = (cats[tx.category] ?? 0) + tx.amount
  }
  return Object.entries(cats)
    .map(([id, amount]) => ({ id, amount: +amount.toFixed(2), ...catMap.value[id] }))
    .filter(c => c.name)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
})

const hasHistory = computed(() => historyData.value.some(h => h.cashflow !== 0))

// ── Charts ─────────────────────────────────────────────────────────────────

function renderDonut() {
  if (!donutCanvas.value || !donutData.value.length) return
  donutChart?.destroy()
  donutChart = new Chart(donutCanvas.value, {
    type: 'doughnut',
    data: {
      labels: donutData.value.map(d => d.label),
      datasets: [{ data: donutData.value.map(d => d.value), backgroundColor: donutData.value.map(d => d.color), borderWidth: 0, hoverOffset: 4 }],
    },
    options: {
      cutout: '72%',
      plugins: { tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.raw)}` } } },
      animation: { duration: 400 },
    },
  })
}

function renderLine() {
  if (!lineCanvas.value || !hasHistory.value) return
  lineChart?.destroy()
  const values = historyData.value.map(h => h.cashflow)
  const positiveColor = '#3b82f6'
  lineChart = new Chart(lineCanvas.value, {
    type: 'line',
    data: {
      labels: historyData.value.map(h => h.label),
      datasets: [{
        data: values,
        borderColor: positiveColor,
        backgroundColor: positiveColor + '15',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: values.map(v => v >= 0 ? positiveColor : '#ef4444'),
        pointBorderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      plugins: { tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.raw)}` } }, legend: { display: false } },
      scales: {
        x: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', font: { size: 11 } } },
        y: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', font: { size: 11 }, callback: v => fmt(v) } },
      },
      animation: { duration: 400 },
    },
  })
}

watch(donutData, () => nextTick(renderDonut))
watch(hasHistory, () => nextTick(renderLine))
watch(historyData, () => nextTick(renderLine))

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n) {
  return new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(n)
}

function shiftMonth(delta) {
  let m = viewMonth.value + delta
  let y = viewYear.value
  if (m > 11) { m = 0; y++ }
  if (m < 0)  { m = 11; y-- }
  viewMonth.value = m
  viewYear.value  = y
}
</script>
