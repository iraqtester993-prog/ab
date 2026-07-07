<template>
  <div class="subs-page">
    <div v-if="filterOpen" class="filter-bar">
      <select v-model="filterStatus"><option value="">الحالة</option><option value="active">نشط</option><option value="expired">منتهي</option><option value="disabled">معطل</option><option value="inactive">غير فعال</option></select>
      <select v-model="filterArea"><option value="">المنطقة</option><option v-for="a in areas" :key="a" :value="a">{{ a }}</option></select>
      <select v-model="filterType"><option value="">نوع الاشتراك</option><option v-for="t in subscriptionTypes" :key="t.id" :value="t.name">{{ t.name }}</option></select>
      <select v-model="filterDebt"><option value="">الديون</option><option value="debt">مديون</option><option value="clear">بدون ديون</option></select>
      <button class="btn-sm" @click="clearFilter"><i class="fas fa-times"></i> مسح</button>
    </div>

    <div class="subs-list">
      <div v-for="s in filteredSubs" :key="s.id" class="sub-card" @click="goToDetail(s.id)">
        <div class="sub-card-head">
          <div class="sub-status" :class="s.status">{{ statusText(s.status) }}</div>
          <div class="sub-actions">
            <button class="act-btn" @click.stop="openRenewModal(s)" :title="'تجديد'"><i class="fas fa-redo"></i></button>
            <button class="act-btn" @click.stop="openSettleModal(s)" :title="'تسوية'"><i class="fas fa-hand-holding-usd"></i></button>
          </div>
        </div>
        <div class="sub-name">{{ s.name }}</div>
        <div class="sub-info"><i class="fas fa-phone"></i> {{ s.phone }}</div>
        <div class="sub-info"><i class="fas fa-wifi"></i> {{ s.ssid || '—' }}</div>
        <div class="sub-info" v-if="s.area || s.tower"><i class="fas fa-map-marker-alt"></i> {{ s.area || '' }}{{ s.area && s.tower ? ' | ' : '' }}{{ s.tower || '' }}</div>
        <div class="sub-type">{{ s.type }}</div>
        <div v-if="s.amount > 0" class="sub-amount">{{ formatMoney(s.amount) }}</div>
        <div v-if="s.end" class="sub-date">{{ s.end }} <span :class="endClass(s)">{{ endLabel(s) }}</span></div>
        <div v-if="s.prevDebt > 0" class="sub-debt"><i class="fas fa-exclamation-triangle"></i> دين: {{ formatMoney(s.prevDebt) }}</div>
      </div>
    </div>

    <div v-if="!filteredSubs.length" class="empty-state"><i class="fas fa-users"></i> لا يوجد مشتركين</div>

    <div v-if="savingRenew" class="modal-over" @click.self="savingRenew = false">
      <div class="modal-small">
        <h3>تجديد اشتراك {{ renewSub?.name }}</h3>
        <div class="form-group"><label>نوع الاشتراك</label>
          <select v-model="renewForm.type" @change="renewForm.amount = getTypePrice(renewForm.type); calcRenewEnd()">
            <option v-for="t in subscriptionTypes" :key="t.id" :value="t.name">{{ t.name }} ({{ t.price.toLocaleString() }} د.ع)</option>
          </select>
        </div>
        <div class="form-group"><label>المبلغ</label><input v-model.number="renewForm.amount" type="number" /></div>
        <div class="form-group"><label>تاريخ البداية</label><input v-model="renewForm.start" type="date" @change="calcRenewEnd" /></div>
        <div class="form-group"><label>تاريخ النهاية</label><input v-model="renewForm.end" type="date" readonly /></div>
        <div class="form-group"><label>تم الدفع</label><label class="toggle"><input type="checkbox" v-model="renewForm.paid"><span class="slider"></span></label></div>
        <div class="form-actions">
          <button class="btn-primary" @click="confirmRenewal">تأكيد</button>
          <button class="btn-secondary" @click="savingRenew = false">إلغاء</button>
        </div>
      </div>
    </div>

    <div v-if="savingSettle" class="modal-over" @click.self="savingSettle = false">
      <div class="modal-small">
        <h3>تسوية ديون {{ settleSub?.name }}</h3>
        <p>إجمالي الدين: {{ formatMoney(settleTotal) }}</p>
        <div class="form-group"><label>المبلغ المدفوع</label><input v-model.number="settleAmount" type="number" :max="settleTotal" /></div>
        <div class="form-group"><label>ملاحظة</label><input v-model="settleNote" type="text" placeholder="سبب الدفع" /></div>
        <div class="form-actions">
          <button class="btn-primary" @click="confirmSettle">تأكيد</button>
          <button class="btn-secondary" @click="savingSettle = false">إلغاء</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { todayStr, formatMoney, calcEndFromType, saveAllData, subscriptionTypes as types } from '@/data/store.js'

const router = useRouter()
const route = useRoute()
const props = defineProps({ searchQuery: String, filterOpen: Boolean })
const emit = defineEmits(['search', 'close-filter'])

const store = inject('store')
const can = inject('can')
const areas = inject('areas')
const subscriptionTypes = inject('subscriptionTypes')

const filterStatus = ref('')
const filterArea = ref('')
const filterType = ref('')
const filterDebt = ref('')

const savingRenew = ref(false)
const renewSub = ref(null)
const renewForm = ref({ type: 'شهري', amount: 35000, start: todayStr(), end: '', paid: true })

const savingSettle = ref(false)
const settleSub = ref(null)
const settleAmount = ref(0)
const settleNote = ref('')

const filteredSubs = computed(() => {
  let list = store.subs
  const q = props.searchQuery
  if (q) {
    const ql = q.toLowerCase()
    list = list.filter(s => s.name.toLowerCase().includes(ql) || s.phone.includes(q) || (s.ssid || '').toLowerCase().includes(ql))
  }
  if (filterStatus.value) list = list.filter(s => s.status === filterStatus.value)
  if (filterArea.value) list = list.filter(s => s.area === filterArea.value)
  if (filterType.value) list = list.filter(s => s.type === filterType.value)
  if (filterDebt.value === 'debt') list = list.filter(s => s.prevDebt > 0)
  if (filterDebt.value === 'clear') list = list.filter(s => !s.prevDebt)
  return list
})

const settleTotal = computed(() => {
  const s = settleSub.value
  if (!s) return 0
  const debtSum = (s.debtHistory || []).reduce((a, d) => a + (d.remaining || 0), 0)
  return debtSum + (!s.paid ? (s.amount || 0) : 0)
})

function statusText(st) {
  return { active: 'نشط', expired: 'منتهي', disabled: 'معطل', inactive: 'غير فعال' }[st] || st
}

function endClass(s) {
  if (s.status === 'expired') return 'badge-red'
  const d = daysBetween(s.end, todayStr())
  if (d <= 3) return 'badge-orange'
  return 'badge-green'
}

function endLabel(s) {
  if (s.status === 'expired') return 'منتهي'
  const d = daysBetween(s.end, todayStr())
  if (d <= 3) return 'شارف على الانتهاء'
  return 'متبقي ' + d + ' يوم'
}

function daysBetween(d1, d2) {
  const a = new Date(d1), b = new Date(d2)
  return Math.ceil((a - b) / 86400000)
}

function clearFilter() {
  filterStatus.value = ''; filterArea.value = ''; filterType.value = ''; filterDebt.value = ''
  emit('close-filter')
}

function goToDetail(id) { router.push('/subscriber/' + id) }

function getTypePrice(name) {
  const t = subscriptionTypes.find(x => x.name === name)
  return t ? t.price : 0
}

function calcRenewEnd() {
  const f = renewForm.value
  const found = subscriptionTypes.find(t => t.name === f.type)
  if (found && f.start) {
    const d = new Date(f.start)
    f.end = new Date(d.getTime() + found.days * 86400000).toISOString().split('T')[0]
  }
}

function openRenewModal(sub) {
  if (!can('subscribers.renew')) return window.showToast?.('ليس لديك صلاحية', 'warning')
  renewSub.value = sub
  renewForm.value = { type: sub.type, amount: sub.amount, start: sub.end || todayStr(), end: '', paid: false }
  calcRenewEnd()
  savingRenew.value = true
}

function confirmRenewal() {
  const sub = renewSub.value
  if (!sub) return
  const f = renewForm.value
  const debtEntry = !f.paid ? { id: Date.now(), amount: f.amount, remaining: f.amount, date: todayStr(), note: 'تجديد ' + f.type, payments: [] } : null
  if (!f.paid) {
    sub.prevDebt = (sub.prevDebt || 0) + f.amount
    sub.debtHistory = sub.debtHistory || []
    sub.debtHistory.push(debtEntry)
  }
  const finRec = { id: Date.now(), date: todayStr(), desc: 'تجديد اشتراك ' + sub.name + ' - ' + f.type, amount: f.amount, type: 'income' }
  store.finRecords.push(finRec)
  sub.type = f.type
  sub.amount = f.amount
  sub.start = f.start
  sub.end = f.end
  sub.status = 'active'
  sub.paid = f.paid
  saveAllData()
  window.showToast?.('تم تجديد الاشتراك ✅', 'success')
  savingRenew.value = false
}

function openSettleModal(sub) {
  if (!can('subscribers.settle')) return window.showToast?.('ليس لديك صلاحية', 'warning')
  settleSub.value = sub
  settleAmount.value = settleTotal.value
  settleNote.value = 'تسوية ديون'
  savingSettle.value = true
}

function confirmSettle() {
  const sub = settleSub.value
  if (!sub || !sub.debtHistory) return
  let remaining = settleAmount.value
  for (const d of sub.debtHistory) {
    if (remaining <= 0) break
    if (d.remaining > 0) {
      const pay = Math.min(remaining, d.remaining)
      d.payments = d.payments || []
      d.payments.push({ amount: pay, date: todayStr(), note: settleNote.value })
      d.remaining -= pay
      remaining -= pay
    }
  }
  if (remaining > 0 && sub.amount && !sub.paid) {
    sub.paid = true
  }
  sub.prevDebt = sub.debtHistory.reduce((a, d) => a + (d.remaining || 0), 0)
  const finRec = { id: Date.now(), date: todayStr(), desc: 'تسوية ديون ' + sub.name, amount: settleAmount.value, type: 'income' }
  store.finRecords.push(finRec)
  saveAllData()
  window.showToast?.('تم تسوية الديون ✅', 'success')
  savingSettle.value = false
}

watch(() => props.filterOpen, (v) => { if (!v) clearFilter() })
</script>
