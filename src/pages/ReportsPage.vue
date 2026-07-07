<template>
  <div class="reports-page">
    <h2 class="page-heading"><i class="fas fa-file-alt"></i> التقارير</h2>

    <div class="tab-bar">
      <button :class="['tab-btn', { active: repTab === 'subs' }]" @click="repTab = 'subs'"><i class="fas fa-users"></i> المشتركين</button>
      <button :class="['tab-btn', { active: repTab === 'debt' }]" @click="repTab = 'debt'"><i class="fas fa-hand-holding-usd"></i> الديون</button>
      <button :class="['tab-btn', { active: repTab === 'fin' }]" @click="repTab = 'fin'"><i class="fas fa-chart-line"></i> المالية</button>
      <button :class="['tab-btn', { active: repTab === 'area' }]" @click="repTab = 'area'"><i class="fas fa-map-marker-alt"></i> المناطق</button>
    </div>

    <div v-if="repTab === 'subs'" class="rep-section">
      <div class="rep-row">
        <div class="rep-card"><div class="rep-val">{{ totalActive }}</div><div class="rep-lbl">نشط</div></div>
        <div class="rep-card"><div class="rep-val">{{ totalExpired }}</div><div class="rep-lbl">منتهي</div></div>
        <div class="rep-card"><div class="rep-val">{{ totalDisabled }}</div><div class="rep-lbl">معطل</div></div>
        <div class="rep-card"><div class="rep-val">{{ totalInactive }}</div><div class="rep-lbl">غير فعال</div></div>
      </div>
      <div class="rep-chart-box">
        <div class="rep-chart-bar flex">
          <div class="bar-seg green" :style="{ flex: totalActive || 1 }" :title="'نشط: '+totalActive">
            <span v-if="totalActive">{{ totalActive }}</span>
          </div>
          <div class="bar-seg orange" :style="{ flex: totalExpired || 1 }" :title="'منتهي: '+totalExpired">
            <span v-if="totalExpired">{{ totalExpired }}</span>
          </div>
          <div class="bar-seg red" :style="{ flex: totalDisabled || 1 }" :title="'معطل: '+totalDisabled">
            <span v-if="totalDisabled">{{ totalDisabled }}</span>
          </div>
          <div class="bar-seg gray" :style="{ flex: totalInactive || 1 }" :title="'غير فعال: '+totalInactive">
            <span v-if="totalInactive">{{ totalInactive }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="repTab === 'debt'" class="rep-section">
      <div class="debt-list">
        <div v-for="s in debtList" :key="s.id" class="debt-row" @click="$router.push('/subscriber/'+s.id)">
          <span>{{ s.name }}</span>
          <span class="debt-amt">{{ formatMoney(s.totalDebt) }}</span>
        </div>
        <div v-if="!debtList.length" class="empty-state"><i class="fas fa-check-circle"></i> لا يوجد ديون مستحقة</div>
      </div>
    </div>

    <div v-if="repTab === 'fin'" class="rep-section">
      <div class="rep-row">
        <div class="rep-card green"><div class="rep-val">{{ totalIncome }}</div><div class="rep-lbl">إجمالي الوارد</div></div>
        <div class="rep-card red"><div class="rep-val">{{ totalExpense }}</div><div class="rep-lbl">إجمالي الصادر</div></div>
        <div class="rep-card" :class="netBalance >= 0 ? 'green' : 'red'"><div class="rep-val">{{ netBalanceFormatted }}</div><div class="rep-lbl">الصافي</div></div>
      </div>
    </div>

    <div v-if="repTab === 'area'" class="rep-section">
      <div class="area-list">
        <div v-for="a in areaStats" :key="a.name" class="area-row">
          <span class="area-name">{{ a.name }}</span>
          <span class="area-count">{{ a.count }} مشترك</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'

const store = inject('store')

const repTab = ref('subs')
const subs = computed(() => store.subs)

const totalActive = computed(() => subs.value.filter(s => s.status === 'active').length)
const totalExpired = computed(() => subs.value.filter(s => s.status === 'expired').length)
const totalDisabled = computed(() => subs.value.filter(s => s.status === 'disabled').length)
const totalInactive = computed(() => subs.value.filter(s => s.status === 'inactive').length)

const debtList = computed(() => {
  return subs.value
    .filter(s => (s.status === 'active' || s.status === 'expired'))
    .map(s => ({ ...s, totalDebt: calcTotalDebt(s) }))
    .filter(s => s.totalDebt > 0)
    .sort((a, b) => b.totalDebt - a.totalDebt)
})

const totalIncome = computed(() => formatMoney(store.finRecords.filter(r => r.type === 'income').reduce((a, r) => a + (r.amount || 0), 0)))
const totalExpense = computed(() => formatMoney(store.finRecords.filter(r => r.type === 'expense').reduce((a, r) => a + (r.amount || 0), 0)))

const netBalance = computed(() => {
  return store.finRecords.reduce((a, r) => a + (r.type === 'income' ? (r.amount || 0) : -(r.amount || 0)), 0)
})

const netBalanceFormatted = computed(() => formatMoney(netBalance.value))

const areaStats = computed(() => {
  const map = {}
  subs.value.forEach(s => { if (s.area) { map[s.area] = (map[s.area] || 0) + 1 } })
  return Object.keys(map).map(name => ({ name, count: map[name] })).sort((a, b) => b.count - a.count)
})

function calcTotalDebt(sub) {
  const debtSum = (sub.debtHistory || []).reduce((a, d) => a + (d.remaining || 0), 0)
  return debtSum + (!sub.paid ? (sub.amount || 0) : 0)
}

function formatMoney(amount) {
  return (amount || 0).toLocaleString() + ' د.ع'
}
</script>
