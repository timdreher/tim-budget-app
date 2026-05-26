<template>
  <div class="capture-wrap">

    <!-- Toggle -->
    <div class="flex gap-1 mx-4 mt-4 mb-2 bg-slate-800 rounded-xl p-1">
      <button @click="setType('expense')"
        :class="['flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-150',
                 type === 'expense' ? 'bg-[#C55A11] text-white shadow' : 'text-slate-400']">
        Ausgabe
      </button>
      <button @click="setType('income')"
        :class="['flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-150',
                 type === 'income' ? 'bg-[#70AD47] text-white shadow' : 'text-slate-400']">
        Einnahme
      </button>
    </div>

    <!-- Date -->
    <div class="flex justify-center mb-4">
      <button @click="openDatePicker"
        class="flex items-center gap-1.5 text-slate-400 text-xs rounded-lg px-3 py-1.5 active:bg-slate-800 transition-colors">
        <AppIcon name="calendar" :size="12" />
        {{ formattedDate }}
      </button>
      <input ref="dateInputEl" type="date" v-model="date" class="sr-only" tabindex="-1" />
    </div>

    <!-- Category dropdown trigger -->
    <div class="mx-4 mb-4">
      <button @click="sheetOpen = true"
        :class="['w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-left',
                 selectedCategory ? 'bg-slate-800' : 'bg-slate-800 border border-dashed border-slate-600']"
        :style="selectedCategory ? { boxShadow: `inset 0 0 0 1.5px ${selectedCategory.color}40` } : {}">
        <span class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          :style="selectedCategory
            ? { background: selectedCategory.color + '28', color: selectedCategory.color }
            : { background: '#334155', color: '#64748b' }">
          <AppIcon :name="selectedCategory?.icon ?? 'circle-ellipsis'" :size="18" />
        </span>
        <span :class="['flex-1 text-sm font-medium', selectedCategory ? 'text-slate-100' : 'text-slate-500']">
          {{ selectedCategory ? selectedCategory.name : 'Kategorie wählen …' }}
        </span>
        <AppIcon name="chevron-down" :size="16" class="text-slate-500 flex-shrink-0" />
      </button>
    </div>

    <!-- Amount display -->
    <div class="text-center mb-4 px-4 select-none">
      <span :class="['text-6xl font-light tabular-nums tracking-tight transition-colors',
                     amountRaw
                       ? (type === 'expense' ? 'text-orange-400' : 'text-green-400')
                       : 'text-slate-600']">
        {{ amountDisplay }}
      </span>
      <span class="text-3xl text-slate-500 ml-1.5">€</span>
    </div>

    <!-- Numpad -->
    <div class="grid grid-cols-3 gap-2 mx-4 mb-3 select-none">
      <button v-for="key in NUMPAD_KEYS" :key="key"
        @click="pressKey(key)"
        :class="['flex items-center justify-center h-14 rounded-xl text-xl font-medium transition-all active:scale-95',
                 key === 'backspace' || key === ','
                   ? 'bg-slate-700 text-slate-300'
                   : 'bg-slate-800 text-slate-100']">
        <AppIcon v-if="key === 'backspace'" name="delete" :size="20" />
        <span v-else>{{ key }}</span>
      </button>
    </div>

    <!-- Notes + Photo row -->
    <div class="mx-4 mb-3 flex gap-2">
      <input type="text" v-model="notes" placeholder="Notiz (optional)" maxlength="120"
        class="flex-1 bg-slate-800 text-slate-200 placeholder-slate-500 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-all" />
      <button @click="photoInputEl.click()"
        :class="['w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95',
                 photoPreviewUrl ? 'ring-2 ring-blue-500' : 'bg-slate-800 text-slate-500']"
        :style="photoPreviewUrl ? { backgroundImage: `url(${photoPreviewUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}">
        <AppIcon v-if="!photoPreviewUrl" name="camera" :size="18" />
      </button>
      <input ref="photoInputEl" type="file" accept="image/*" capture="environment"
        class="sr-only" @change="handlePhotoChange" />
    </div>

    <!-- Photo preview strip (shown when photo selected) -->
    <div v-if="photoPreviewUrl" class="mx-4 mb-3 flex items-center gap-3 bg-slate-800 rounded-xl px-3 py-2">
      <img :src="photoPreviewUrl" class="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
      <span class="text-xs text-slate-400 flex-1">Beleg hinzugefügt</span>
      <button @click="removePhoto" class="text-slate-500 active:text-slate-300 p-1">
        <AppIcon name="x" :size="16" />
      </button>
    </div>

    <!-- Save -->
    <div class="mx-4 mb-6">
      <button @click="save" :disabled="!canSave"
        :class="['w-full py-4 rounded-2xl text-base font-semibold transition-all duration-150',
                 canSave
                   ? (type === 'expense'
                       ? 'bg-[#C55A11] text-white active:scale-[0.98]'
                       : 'bg-[#70AD47] text-white active:scale-[0.98]')
                   : 'bg-slate-800 text-slate-600 cursor-not-allowed']">
        Speichern
      </button>
    </div>

  </div>

  <!-- Category bottom sheet -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="sheetOpen" class="sheet-overlay" @click.self="sheetOpen = false">
        <div class="sheet-panel">
          <div class="sheet-handle"></div>
          <div class="sheet-header">
            <span class="text-slate-100 font-semibold text-base">Kategorie</span>
            <button @click="sheetOpen = false" class="text-slate-400 p-1">
              <AppIcon name="x" :size="20" />
            </button>
          </div>
          <div class="sheet-scroll">
            <template v-for="group in groupedCategories" :key="group.name">
              <div class="sheet-group-label">{{ group.name }}</div>
              <button v-for="cat in group.items" :key="cat.id"
                @click="selectCategory(cat)"
                :class="['sheet-item', selectedCategory?.id === cat.id ? 'sheet-item--active' : '']"
                :style="selectedCategory?.id === cat.id ? { color: cat.color } : {}">
                <span class="sheet-item-icon"
                  :style="{ background: cat.color + '22', color: selectedCategory?.id === cat.id ? cat.color : '#94a3b8' }">
                  <AppIcon :name="cat.icon" :size="18" />
                </span>
                <span class="sheet-item-name">{{ cat.name }}</span>
                <AppIcon v-if="selectedCategory?.id === cat.id" name="check" :size="16" />
              </button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Toast -->
  <Transition name="toast">
    <div v-if="showToast" class="toast-msg">Gespeichert ✓</div>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import imageCompression from 'browser-image-compression'
import { db } from '../db/index.js'
import AppIcon from '../components/AppIcon.vue'

// ── State ──────────────────────────────────────────────────────────────────

const type = ref('expense')
const date = ref(todayISO())
const amountRaw = ref('')
const selectedCategory = ref(null)
const notes = ref('')
const showToast = ref(false)
const sheetOpen = ref(false)
const categories = ref([])
const dateInputEl = ref(null)
const photoInputEl = ref(null)
const photoBlob = ref(null)
const photoPreviewUrl = ref(null)

const NUMPAD_KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', ',', '0', 'backspace']

db.categories.toArray().then(rows => { categories.value = rows })

// ── Computed ───────────────────────────────────────────────────────────────

const filteredCategories = computed(() =>
  categories.value
    .filter(c => c.type === type.value)
    .sort((a, b) => b.usage_count - a.usage_count || a.sort_order - b.sort_order)
)

const groupedCategories = computed(() => {
  const groups = {}
  for (const cat of filteredCategories.value) {
    if (!groups[cat.group]) groups[cat.group] = []
    groups[cat.group].push(cat)
  }
  return Object.entries(groups).map(([name, items]) => ({ name, items }))
})

const amountDisplay = computed(() => amountRaw.value || '0')
const amountValue = computed(() => parseFloat((amountRaw.value || '0').replace(',', '.')) || 0)
const formattedDate = computed(() => {
  const d = new Date(date.value + 'T12:00:00')
  return d.toLocaleDateString('de-AT', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
})
const canSave = computed(() => selectedCategory.value !== null && amountValue.value > 0)

// ── Helpers ────────────────────────────────────────────────────────────────

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function openDatePicker() {
  try { dateInputEl.value?.showPicker() } catch { dateInputEl.value?.click() }
}

function setType(t) {
  type.value = t
  selectedCategory.value = null
}

function selectCategory(cat) {
  selectedCategory.value = cat
  sheetOpen.value = false
}

function pressKey(key) {
  if (key === 'backspace') { amountRaw.value = amountRaw.value.slice(0, -1); return }
  if (key === ',') {
    if (amountRaw.value.includes(',')) return
    amountRaw.value = (amountRaw.value || '0') + ','
    return
  }
  const [intPart, decPart] = amountRaw.value.split(',')
  if (decPart !== undefined && decPart.length >= 2) return
  if (decPart === undefined && intPart.length >= 6) return
  if (amountRaw.value === '0') { amountRaw.value = key; return }
  amountRaw.value += key
}

async function handlePhotoChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (photoPreviewUrl.value) URL.revokeObjectURL(photoPreviewUrl.value)
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.8,
    })
    photoBlob.value = compressed
    photoPreviewUrl.value = URL.createObjectURL(compressed)
  } catch {
    photoBlob.value = file
    photoPreviewUrl.value = URL.createObjectURL(file)
  }
}

function removePhoto() {
  if (photoPreviewUrl.value) URL.revokeObjectURL(photoPreviewUrl.value)
  photoBlob.value = null
  photoPreviewUrl.value = null
  if (photoInputEl.value) photoInputEl.value.value = ''
}

async function save() {
  if (!canSave.value) return
  const now = new Date().toISOString()
  await db.transaction('rw', db.transactions, db.categories, async () => {
    await db.transactions.add({
      date: date.value, type: type.value,
      category: selectedCategory.value.id,
      amount: amountValue.value,
      notes: notes.value.trim(),
      photo: photoBlob.value ?? null,
      created_at: now, updated_at: now,
    })
    await db.categories.where('id').equals(selectedCategory.value.id).modify(c => { c.usage_count++ })
  })
  const idx = categories.value.findIndex(c => c.id === selectedCategory.value.id)
  if (idx !== -1) categories.value[idx].usage_count++

  showToast.value = true
  setTimeout(() => { showToast.value = false }, 2000)

  if (photoPreviewUrl.value) URL.revokeObjectURL(photoPreviewUrl.value)
  amountRaw.value = ''
  selectedCategory.value = null
  notes.value = ''
  photoBlob.value = null
  photoPreviewUrl.value = null
  if (photoInputEl.value) photoInputEl.value.value = ''
}
</script>

<style scoped>
.capture-wrap { padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 8px); }

.sheet-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,0.55);
  display: flex; align-items: flex-end;
}
.sheet-panel {
  width: 100%; max-width: 480px; margin: 0 auto;
  background: #1e293b; border-radius: 20px 20px 0 0;
  border-top: 1px solid #334155;
  max-height: 80dvh; display: flex; flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.sheet-handle { width: 36px; height: 4px; border-radius: 2px; background: #475569; margin: 10px auto 0; flex-shrink: 0; }
.sheet-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px 8px; flex-shrink: 0; }
.sheet-scroll { overflow-y: auto; flex: 1; padding: 0 8px 12px; -webkit-overflow-scrolling: touch; }
.sheet-group-label { font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 0.06em; text-transform: uppercase; padding: 12px 8px 4px; }
.sheet-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 8px; border-radius: 12px; color: #cbd5e1; text-align: left; transition: background 0.1s; }
.sheet-item:active, .sheet-item--active { background: #0f172a; }
.sheet-item-icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sheet-item-name { flex: 1; font-size: 14px; font-weight: 500; }

.sheet-enter-active, .sheet-leave-active { transition: opacity 0.22s; }
.sheet-enter-active .sheet-panel, .sheet-leave-active .sheet-panel { transition: transform 0.22s cubic-bezier(0.32,0.72,0,1); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet-panel, .sheet-leave-to .sheet-panel { transform: translateY(100%); }

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
