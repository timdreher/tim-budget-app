<template>
  <div class="pb-6">

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

    <!-- Search -->
    <div class="mx-4 mb-4 relative">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
        <AppIcon name="search" :size="15" />
      </span>
      <input type="text" v-model="searchQuery" placeholder="Suchen …"
        class="w-full bg-slate-800 text-slate-200 placeholder-slate-500 rounded-xl pl-8 pr-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
    </div>

    <!-- Month summary -->
    <div class="flex gap-2 mx-4 mb-4">
      <div class="flex-1 bg-slate-800 rounded-xl p-3 text-center">
        <p class="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Einnahmen</p>
        <p class="text-sm font-semibold text-green-400">{{ fmt(monthIncome) }}</p>
      </div>
      <div class="flex-1 bg-slate-800 rounded-xl p-3 text-center">
        <p class="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Ausgaben</p>
        <p class="text-sm font-semibold text-orange-400">{{ fmt(monthExpense) }}</p>
      </div>
      <div class="flex-1 bg-slate-800 rounded-xl p-3 text-center">
        <p class="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Bilanz</p>
        <p :class="['text-sm font-semibold', cashflow >= 0 ? 'text-blue-400' : 'text-red-400']">{{ fmt(cashflow) }}</p>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="groupedTransactions.length === 0"
      class="flex flex-col items-center justify-center py-16 text-slate-600">
      <AppIcon name="alert-circle" :size="32" />
      <p class="mt-3 text-sm">{{ searchQuery ? 'Keine Treffer' : 'Noch keine Buchungen' }}</p>
    </div>

    <!-- Transaction groups -->
    <div v-for="group in groupedTransactions" :key="group.date">
      <div class="flex items-center justify-between px-4 py-1.5">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">{{ group.label }}</span>
        <span class="text-xs text-slate-600">{{ fmt(group.dayTotal) }}</span>
      </div>

      <div v-for="tx in group.transactions" :key="tx.id" class="mx-4 mb-1.5">
        <div class="relative overflow-hidden rounded-xl">
          <!-- Delete action, revealed by swiping the row left -->
          <button type="button"
            class="absolute inset-y-0 right-0 w-[84px] flex flex-col items-center justify-center gap-0.5 bg-red-600 text-white active:bg-red-700"
            @click="onDeleteClick(tx)">
            <AppIcon name="trash" :size="18" />
            <span class="text-[11px] font-medium">Löschen</span>
          </button>

          <!-- Swipeable foreground row -->
          <div class="swipe-row relative flex items-center gap-3 bg-slate-800 px-3 py-3 active:bg-slate-700"
            :class="{ 'swipe-row--dragging': dragId === tx.id }"
            :style="{ transform: `translateX(${offsetFor(tx.id)}px)` }"
            @touchstart.passive="onTouchStart($event, tx.id)"
            @touchmove.passive="onTouchMove($event, tx.id)"
            @touchend="onTouchEnd(tx.id)"
            @click="onRowClick(tx)">
            <!-- Category icon -->
            <span class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              :style="{ background: catMap[tx.category]?.color + '22', color: catMap[tx.category]?.color ?? '#94a3b8' }">
              <AppIcon :name="catMap[tx.category]?.icon ?? 'circle-ellipsis'" :size="18" />
            </span>
            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-100 truncate">{{ catMap[tx.category]?.name ?? tx.category }}</p>
              <p v-if="tx.notes" class="text-xs text-slate-500 truncate">{{ tx.notes }}</p>
            </div>
            <!-- Photo thumbnail -->
            <img v-if="photoUrls[tx.id]" :src="photoUrls[tx.id]"
              class="w-9 h-9 rounded-lg object-cover flex-shrink-0 ring-1 ring-slate-600" />
            <!-- Amount -->
            <span :class="['text-sm font-semibold flex-shrink-0 ml-1',
                           tx.type === 'income' ? 'text-green-400' : 'text-orange-400']">
              {{ tx.type === 'income' ? '+' : '−' }}{{ fmt(tx.amount) }}
            </span>
          </div>
        </div>
      </div>
    </div>

  </div>

  <!-- Photo lightbox -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="lightboxUrl" class="lightbox" @click="lightboxUrl = null">
        <img :src="lightboxUrl" class="lightbox-img" @click.stop />
        <button class="lightbox-close" @click="lightboxUrl = null">
          <AppIcon name="x" :size="24" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { db } from '../db/index.js'
import AppIcon from '../components/AppIcon.vue'

const now = new Date()
const viewYear  = ref(now.getFullYear())
const viewMonth = ref(now.getMonth())
const transactions  = ref([])
const categories    = ref([])
const photoUrls     = ref({})
const searchQuery   = ref('')
const lightboxUrl   = ref(null)

// ── Swipe-to-delete state ────────────────────────────────────────────────────
const SWIPE_W = 84          // px the row slides to reveal the delete button
const openId  = ref(null)   // row whose delete button is currently revealed
const dragId  = ref(null)   // row being actively dragged
const dragX   = ref(0)      // live horizontal offset while dragging
let swipeStartX = 0, swipeStartY = 0, swipeBaseX = 0, swipeAxis = null, swipeMoved = false

// ── Load ───────────────────────────────────────────────────────────────────

async function loadTransactions() {
  const y = viewYear.value
  const m = String(viewMonth.value + 1).padStart(2, '0')
  const rows = await db.transactions
    .where('date').between(`${y}-${m}-01`, `${y}-${m}-31`, true, true)
    .reverse().sortBy('date')

  // revoke old photo URLs
  Object.values(photoUrls.value).forEach(u => URL.revokeObjectURL(u))
  photoUrls.value = {}

  transactions.value = rows

  // create URLs for rows that have photos
  for (const tx of rows) {
    if (tx.photo) photoUrls.value[tx.id] = URL.createObjectURL(tx.photo)
  }
}

db.categories.toArray().then(r => { categories.value = r })
loadTransactions()
watch([viewYear, viewMonth], loadTransactions)
onUnmounted(() => Object.values(photoUrls.value).forEach(u => URL.revokeObjectURL(u)))

// ── Computed ───────────────────────────────────────────────────────────────

const catMap = computed(() => Object.fromEntries(categories.value.map(c => [c.id, c])))
const isCurrentMonth = computed(() => viewYear.value === now.getFullYear() && viewMonth.value === now.getMonth())
const monthLabel = computed(() => new Date(viewYear.value, viewMonth.value, 1).toLocaleDateString('de-AT', { month: 'long', year: 'numeric' }))

const filteredTransactions = computed(() => {
  if (!searchQuery.value.trim()) return transactions.value
  const q = searchQuery.value.toLowerCase()
  return transactions.value.filter(tx => {
    const cat = catMap.value[tx.category]
    return cat?.name.toLowerCase().includes(q) || tx.notes?.toLowerCase().includes(q)
  })
})

const monthIncome  = computed(() => transactions.value.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
const monthExpense = computed(() => transactions.value.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))
const cashflow     = computed(() => monthIncome.value - monthExpense.value)

const groupedTransactions = computed(() => {
  const groups = {}
  for (const tx of filteredTransactions.value) {
    if (!groups[tx.date]) groups[tx.date] = []
    groups[tx.date].push(tx)
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, txs]) => ({
      date, label: formatDayLabel(date), transactions: txs,
      dayTotal: txs.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0),
    }))
})

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n) {
  return new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(n)
}

function formatDayLabel(iso) {
  const d = new Date(iso + 'T12:00:00')
  const today = new Date(); today.setHours(0,0,0,0)
  const diff = Math.round((d - today) / 86400000)
  if (diff === 0) return 'Heute'
  if (diff === -1) return 'Gestern'
  return d.toLocaleDateString('de-AT', { weekday: 'short', day: 'numeric', month: 'short' })
}

function shiftMonth(delta) {
  let m = viewMonth.value + delta, y = viewYear.value
  if (m > 11) { m = 0; y++ }
  if (m < 0)  { m = 11; y-- }
  viewMonth.value = m; viewYear.value = y
  openId.value = null
}

// ── Swipe-to-delete ──────────────────────────────────────────────────────────

function offsetFor(id) {
  if (dragId.value === id) return dragX.value
  return openId.value === id ? -SWIPE_W : 0
}

function onTouchStart(e, id) {
  swipeStartX = e.touches[0].clientX
  swipeStartY = e.touches[0].clientY
  swipeAxis = null
  swipeMoved = false
  swipeBaseX = openId.value === id ? -SWIPE_W : 0
  if (openId.value && openId.value !== id) openId.value = null  // close any other open row
  dragId.value = id
  dragX.value = swipeBaseX
}

function onTouchMove(e, id) {
  if (dragId.value !== id) return
  const dx = e.touches[0].clientX - swipeStartX
  const dy = e.touches[0].clientY - swipeStartY
  if (swipeAxis === null) {
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
    swipeAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
  }
  if (swipeAxis === 'y') { dragId.value = null; return }   // vertical scroll → abandon swipe
  swipeMoved = true
  let next = swipeBaseX + dx
  if (next > 0) next = 0
  if (next < -SWIPE_W) next = -SWIPE_W
  dragX.value = next
}

function onTouchEnd(id) {
  if (dragId.value !== id) return
  const shouldOpen = dragX.value < -SWIPE_W / 2
  dragId.value = null
  openId.value = shouldOpen ? id : (openId.value === id ? null : openId.value)
}

function onRowClick(tx) {
  if (swipeMoved) { swipeMoved = false; return }      // ignore click synthesised after a swipe
  if (openId.value) { openId.value = null; return }   // tap closes an open row
  if (photoUrls.value[tx.id]) lightboxUrl.value = photoUrls.value[tx.id]
}

function onDeleteClick(tx) {
  deleteTransaction(tx.id)
}

async function deleteTransaction(id) {
  await db.transactions.delete(id)
  const deleted = transactions.value.find(t => t.id === id)
  if (deleted?.photo && photoUrls.value[id]) URL.revokeObjectURL(photoUrls.value[id])
  delete photoUrls.value[id]
  transactions.value = transactions.value.filter(t => t.id !== id)
  if (openId.value === id) openId.value = null
}
</script>

<style scoped>
/* Swipe-to-delete: vertical scroll stays with the browser, horizontal swipe comes to us */
.swipe-row { touch-action: pan-y; transition: transform 0.2s ease; will-change: transform; }
.swipe-row--dragging { transition: none; }

.lightbox {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.92);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.lightbox-img {
  max-width: 100%; max-height: 100%;
  border-radius: 12px; object-fit: contain;
}
.lightbox-close {
  position: absolute; top: 16px; right: 16px;
  color: white; background: rgba(255,255,255,0.15);
  border-radius: 50%; width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
