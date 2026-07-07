<template>
  <div class="finance-page">
    <h2 class="page-heading"><i class="fas fa-coins"></i> المالية</h2>

    <div class="fin-summary">
      <div class="fin-stat green"><span class="fin-stat-num">{{ totalIncome }}</span><span class="fin-stat-lbl">الوارد</span></div>
      <div class="fin-stat red"><span class="fin-stat-num">{{ totalExpense }}</span><span class="fin-stat-lbl">الصادر</span></div>
      <div class="fin-stat" :class="netBalance >= 0 ? 'green' : 'red'"><span class="fin-stat-num">{{ netBalanceFormatted }}</span><span class="fin-stat-lbl">الصافي</span></div>
    </div>

    <div class="fin-controls">
      <select v-model="finMonth" @change="applyFinFilter">
        <option v-for="m in months" :key="m" :value="m">{{ m }}</option>
      </select>
      <select v-model="finType" @change="applyFinFilter">
        <option value="">الكل</option><option value="income">وارد</option><option value="expense">صادر</option>
      </select>
      <button v-if="can('finance.add')" class="btn-primary" @click="showAddFin = true"><i class="fas fa-plus"></i> إضافة</button>
    </div>

    <div v-if="showAddFin" class="form-card">
      <div class="form-group"><label>النوع</label>
        <select v-model="finForm.type"><option value="income">وارد</option><option value="expense">صادر</option></select>
      </div>
      <div class="form-group"><label>الوصف</label><input v-model="finForm.desc" type="text" placeholder="وصف الحركة" /></div>
      <div class="form-group"><label>المبلغ</label><input v-model.number="finForm.amount" type="number" placeholder="المبلغ" /></div>
      <div class="form-group"><label>التاريخ</label><input v-model="finForm.date" type="date" /></div>
      <div class="form-group"><label>التصنيف</label>
        <select v-model="finForm.category"><option value="">—</option><option v-for="c in expenseCategories" :key="c.id" :value="c.name">{{ c.name }}</option></select>
      </div>
      <div class="form-actions">
        <button class="btn-primary" @click="addFinRecord">حفظ</button>
        <button class="btn-secondary" @click="showAddFin = false">إلغاء</button>
      </div>
    </div>

    <div class="fin-list">
      <div v-for="r in filteredFinRecords" :key="r.id" class="fin-item">
        <div class="fin-icon" :class="r.type"><i :class="r.type === 'income' ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i></div>
        <div class="fin-body">
          <div class="fin-desc">{{ r.desc || 'بدون وصف' }}</div>
          <div class="fin-meta">{{ r.date }}{{ r.category ? ' | ' + r.category : '' }}</div>
        </div>
        <div class="fin-amount" :class="r.type">{{ formatMoney(r.amount) }}</div>
        <button v-if="can('finance.del')" class="btn-icon red" @click="delFin(r.id)"><i class="fas fa-trash"></i></button>
      </div>
    </div>

    <div v-if="!filteredFinRecords.length" class="empty-state"><i class="fas fa-coins"></i> لا توجد حركات مالية</div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { todayStr, formatMoney, saveAllData } from '@/data/store.js'

const store = inject('store')
const can = inject('can')
const expenseCategories = inject('expenseCategories')

const finMonth = ref(todayStr().substring(0, 7))
const finType = ref('')
const showAddFin = ref(false)

const finForm = ref({ type: 'income', desc: '', amount: 0, date: todayStr(), category: '' })

const months = computed(() => {
  const set = new Set()
  store.finRecords.forEach(r => { if (r.date) set.add(r.date.substring(0, 7)) })
  const arr = Array.from(set).sort().reverse()
  if (!arr.includes(finMonth.value)) arr.unshift(finMonth.value)
  return arr
})

const filteredFinRecords = computed(() => {
  let list = store.finRecords
  if (finType.value) list = list.filter(r => r.type === finType.value)
  if (finMonth.value) list = list.filter(r => r.date && r.date.startsWith(finMonth.value))
  return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
})

const totalIncome = computed(() => formatMoney(store.finRecords.filter(r => r.type === 'income').reduce((a, r) => a + (r.amount || 0), 0)))
const totalExpense = computed(() => formatMoney(store.finRecords.filter(r => r.type === 'expense').reduce((a, r) => a + (r.amount || 0), 0)))

const netBalance = computed(() => store.finRecords.reduce((a, r) => a + (r.type === 'income' ? (r.amount || 0) : -(r.amount || 0)), 0))
const netBalanceFormatted = computed(() => formatMoney(netBalance.value))

function applyFinFilter() {}

function addFinRecord() {
  if (!finForm.value.desc || !finForm.value.amount) return window.showToast?.('يرجى ملء الحقول', 'warning')
  const r = { ...finForm.value, id: Date.now() }
  store.finRecords.push(r)
  saveAllData()
  showAddFin.value = false
  finForm.value = { type: 'income', desc: '', amount: 0, date: todayStr(), category: '' }
  window.showToast?.('تمت الإضافة ✅', 'success')
}

function delFin(id) {
  const idx = store.finRecords.findIndex(r => r.id === id)
  if (idx !== -1) { store.finRecords.splice(idx, 1); saveAllData(); window.showToast?.('تم الحذف', 'info') }
}
</script>
