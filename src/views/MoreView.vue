<template>
  <div class="pb-8">

    <h1 class="text-xl font-semibold text-slate-100 px-4 pt-4 pb-5">Mehr</h1>

    <!-- Settings -->
    <section class="mx-4 mb-5">
      <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">Einstellungen</p>
      <div class="bg-slate-800 rounded-xl divide-y divide-slate-700">

        <div class="flex items-center px-4 py-3.5 gap-3">
          <AppIcon name="wallet" :size="18" class="text-slate-400 flex-shrink-0" />
          <span class="text-sm text-slate-200 flex-1">Monatl. Nettoeinkommen</span>
          <div class="flex items-center gap-1">
            <input type="number" v-model.number="monthlyIncome" @blur="saveIncome"
              class="w-24 bg-slate-700 text-slate-100 text-sm rounded-lg px-2 py-1 text-right outline-none focus:ring-1 focus:ring-blue-500"
              step="50" min="0" />
            <span class="text-sm text-slate-400">€</span>
          </div>
        </div>

        <div class="flex items-center px-4 py-3.5 gap-3">
          <AppIcon name="circle-dollar" :size="18" class="text-slate-400 flex-shrink-0" />
          <span class="text-sm text-slate-200 flex-1">Währung</span>
          <span class="text-sm text-slate-400">EUR (€)</span>
        </div>

      </div>
    </section>

    <!-- Export -->
    <section class="mx-4 mb-5">
      <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">Export</p>
      <div class="bg-slate-800 rounded-xl divide-y divide-slate-700">

        <button @click="exportJSON"
          class="flex items-center px-4 py-3.5 gap-3 w-full active:bg-slate-700 transition-colors rounded-t-xl">
          <AppIcon name="circle-ellipsis" :size="18" class="text-blue-400 flex-shrink-0" />
          <div class="flex-1 text-left">
            <p class="text-sm text-slate-200">JSON exportieren</p>
            <p class="text-xs text-slate-500">Alle Buchungen als Backup</p>
          </div>
          <AppIcon name="chevron-right" :size="16" class="text-slate-600" />
        </button>

        <button @click="exportCSV"
          class="flex items-center px-4 py-3.5 gap-3 w-full active:bg-slate-700 transition-colors">
          <AppIcon name="book-open" :size="18" class="text-green-400 flex-shrink-0" />
          <div class="flex-1 text-left">
            <p class="text-sm text-slate-200">CSV exportieren</p>
            <p class="text-xs text-slate-500">Excel-kompatibel (Semikolon)</p>
          </div>
          <AppIcon name="chevron-right" :size="16" class="text-slate-600" />
        </button>

        <button @click="exportPhotosZip"
          class="flex items-center px-4 py-3.5 gap-3 w-full active:bg-slate-700 transition-colors rounded-b-xl"
          :disabled="exportingZip">
          <AppIcon name="camera" :size="18" class="text-orange-400 flex-shrink-0" />
          <div class="flex-1 text-left">
            <p class="text-sm text-slate-200">Belege als ZIP</p>
            <p class="text-xs text-slate-500">{{ exportingZip ? 'Wird erstellt …' : 'Fotos dieses Monats' }}</p>
          </div>
          <AppIcon name="chevron-right" :size="16" class="text-slate-600" />
        </button>

      </div>
    </section>

    <!-- Info -->
    <section class="mx-4 mb-5">
      <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">App</p>
      <div class="bg-slate-800 rounded-xl divide-y divide-slate-700">

        <div class="flex items-center px-4 py-3.5 gap-3">
          <AppIcon name="shield-check" :size="18" class="text-slate-400 flex-shrink-0" />
          <div class="flex-1">
            <p class="text-sm text-slate-200">Datenschutz</p>
            <p class="text-xs text-slate-500">Alle Daten bleiben lokal auf diesem Gerät</p>
          </div>
        </div>

        <div class="flex items-center px-4 py-3.5 gap-3">
          <AppIcon name="alert-circle" :size="18" class="text-slate-400 flex-shrink-0" />
          <div class="flex-1">
            <p class="text-sm text-slate-200">Version</p>
            <p class="text-xs text-slate-500">1.0.0 – lokal gespeichert (IndexedDB)</p>
          </div>
        </div>

      </div>
    </section>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toastMsg" class="toast-msg">{{ toastMsg }}</div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import JSZip from 'jszip'
import { db } from '../db/index.js'
import AppIcon from '../components/AppIcon.vue'

const monthlyIncome = ref(2400)
const exportingZip  = ref(false)
const toastMsg      = ref('')

onMounted(async () => {
  const s = await db.settings.get('monthly_income')
  if (s) monthlyIncome.value = s.value
})

async function saveIncome() {
  await db.settings.put({ key: 'monthly_income', value: monthlyIncome.value })
}

// ── Download helper ────────────────────────────────────────────────────────

function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function showToast(msg) {
  toastMsg.value = msg
  setTimeout(() => { toastMsg.value = '' }, 2500)
}

// ── JSON export ────────────────────────────────────────────────────────────

async function exportJSON() {
  const [transactions, categories] = await Promise.all([
    db.transactions.orderBy('date').toArray(),
    db.categories.toArray(),
  ])
  // Blobs can't be JSON-serialised — strip them, note presence
  const cleaned = transactions.map(tx => ({
    ...tx,
    photo: tx.photo ? '[Beleg vorhanden – in ZIP exportieren]' : null,
  }))
  const payload = { exported_at: new Date().toISOString(), transactions: cleaned, categories }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const date = new Date().toISOString().slice(0, 10)
  download(blob, `budget-export-${date}.json`)
  showToast('JSON exportiert ✓')
}

// ── CSV export ─────────────────────────────────────────────────────────────

async function exportCSV() {
  const [transactions, categories] = await Promise.all([
    db.transactions.orderBy('date').toArray(),
    db.categories.toArray(),
  ])
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))

  const header = 'Datum;Typ;Gruppe;Kategorie;Betrag;Notiz'
  const rows = transactions.map(tx => {
    const cat  = catMap[tx.category]
    const typ  = tx.type === 'income' ? 'Einnahme' : 'Ausgabe'
    const betrag = tx.amount.toFixed(2).replace('.', ',')
    return [tx.date, typ, cat?.group ?? '', cat?.name ?? tx.category, betrag, tx.notes ?? ''].join(';')
  })

  const csv = [header, ...rows].join('\r\n')
  // UTF-8 BOM so Excel opens it correctly
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const date = new Date().toISOString().slice(0, 10)
  download(blob, `budget-export-${date}.csv`)
  showToast('CSV exportiert ✓')
}

// ── Photo ZIP export ───────────────────────────────────────────────────────

async function exportPhotosZip() {
  exportingZip.value = true
  try {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const transactions = await db.transactions
      .where('date').between(`${y}-${m}-01`, `${y}-${m}-31`, true, true)
      .toArray()
    const categories = await db.categories.toArray()
    const catMap = Object.fromEntries(categories.map(c => [c.id, c]))

    const withPhotos = transactions.filter(tx => tx.photo)
    if (!withPhotos.length) { showToast('Keine Belege diesen Monat'); return }

    const zip = new JSZip()
    for (const tx of withPhotos) {
      const catSlug = (catMap[tx.category]?.name ?? tx.category).replace(/[^a-z0-9]/gi, '_').toLowerCase()
      const betrag  = tx.amount.toFixed(2).replace('.', '-')
      const filename = `${tx.date}_${catSlug}_${betrag}.jpg`
      zip.file(filename, tx.photo)
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    download(blob, `belege-${y}-${m}.zip`)
    showToast(`${withPhotos.length} Belege exportiert ✓`)
  } finally {
    exportingZip.value = false
  }
}
</script>

<style scoped>
.toast-msg {
  position: fixed; bottom: calc(68px + env(safe-area-inset-bottom, 0px));
  left: 50%; transform: translateX(-50%);
  background: #1e293b; border: 1px solid #334155; color: #4ade80;
  font-size: 14px; font-weight: 600; padding: 10px 20px; border-radius: 999px;
  white-space: nowrap; z-index: 50; pointer-events: none;
}
.toast-enter-active, .toast-leave-active { transition: opacity 0.2s, transform 0.2s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }
</style>
