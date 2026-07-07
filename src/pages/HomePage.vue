<template>
  <div class="dashboard">
    <h2 class="page-heading"><i class="fas fa-chart-pie"></i> لوحة التحكم</h2>

    <div class="stats-row">
      <div class="stat-card"><div class="stat-num">{{ activeSubs }}</div><div class="stat-lbl"><i class="fas fa-wifi"></i> نشط</div></div>
      <div class="stat-card"><div class="stat-num">{{ expiredCount }}</div><div class="stat-lbl"><i class="fas fa-exclamation-triangle"></i> منتهي</div></div>
      <div class="stat-card"><div class="stat-num">{{ totalSubs }}</div><div class="stat-lbl"><i class="fas fa-users"></i> إجمالي</div></div>
      <div class="stat-card"><div class="stat-num">{{ monthIncome }}</div><div class="stat-lbl"><i class="fas fa-money-bill-wave"></i> وارد الشهر</div></div>
      <div class="stat-card"><div class="stat-num">{{ monthExpense }}</div><div class="stat-lbl"><i class="fas fa-shopping-cart"></i> صادر الشهر</div></div>
      <div class="stat-card"><div class="stat-num">{{ totalDebtAll }}</div><div class="stat-lbl"><i class="fas fa-hand-holding-usd"></i> الديون</div></div>
    </div>

    <div class="db-grid">
      <div class="db-card" @click="$router.push('/subscribers')">
        <div class="dbc-icon"><i class="fas fa-users"></i></div>
        <div class="dbc-title">المشتركين</div>
        <div class="dbc-sub">{{ totalSubs }} مشترك</div>
      </div>
      <div class="db-card" @click="$router.push('/add-subscriber')">
        <div class="dbc-icon"><i class="fas fa-user-plus"></i></div>
        <div class="dbc-title">إضافة مشترك</div>
        <div class="dbc-sub">تسجيل جديد</div>
      </div>
      <div class="db-card" @click="$router.push('/finance')">
        <div class="dbc-icon"><i class="fas fa-coins"></i></div>
        <div class="dbc-title">المالية</div>
        <div class="dbc-sub">إدارة الإيرادات</div>
      </div>
      <div class="db-card" @click="$router.push('/whatsapp')">
        <div class="dbc-icon"><i class="fab fa-whatsapp"></i></div>
        <div class="dbc-title">واتساب</div>
        <div class="dbc-sub">إرسال الرسائل</div>
      </div>
      <div class="db-card" @click="$router.push('/reports')">
        <div class="dbc-icon"><i class="fas fa-file-alt"></i></div>
        <div class="dbc-title">التقارير</div>
        <div class="dbc-sub">تقارير وإحصائيات</div>
      </div>
      <div class="db-card" @click="$router.push('/archive')">
        <div class="dbc-icon"><i class="fas fa-archive"></i></div>
        <div class="dbc-title">الأرشيف</div>
        <div class="dbc-sub">السجلات المؤرشفة</div>
      </div>
    </div>

    <div v-if="!can('dashboard')" class="no-perm">ليس لديك صلاحية الوصول للوحة التحكم</div>

    <div class="db-section">
      <h3><i class="fas fa-bell"></i> تنبيهات</h3>
      <div v-if="expiringSubs.length" class="alert-box">
        <div v-for="s in expiringSubs" :key="s.id" class="alert-item alert-warning" @click="$router.push('/subscriber/'+s.id)">
          <i class="fas fa-clock"></i>
          <span>ينتهي اشتراك <b>{{ s.name }}</b> بعد {{ s.remainingDays }} يوم</span>
        </div>
      </div>
      <div v-if="debtSubs.length" class="alert-box">
        <div v-for="s in debtSubs" :key="s.id" class="alert-item alert-danger" @click="$router.push('/subscriber/'+s.id)">
          <i class="fas fa-exclamation-triangle"></i>
          <span>على <b>{{ s.name }}</b> ديون {{ formatMoney(s.totalDebt) }}</span>
        </div>
      </div>
      <div v-if="!expiringSubs.length && !debtSubs.length" class="alert-item alert-success" style="cursor:default">
        <i class="fas fa-check-circle"></i> لا توجد تنبيهات
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const can = inject('can')
const store = inject('store')
const alertDays = inject('alertDays')

const today = new Date().toISOString().split('T')[0]

const subs = computed(() => store.subs)
const finRecords = computed(() => store.finRecords)

const totalSubs = computed(() => subs.value.length)
const activeSubs = computed(() => subs.value.filter(s => s.status === 'active').length)
const expiredCount = computed(() => subs.value.filter(s => s.status === 'expired').length)

const monthIncome = computed(() => {
  const m = today.substring(0, 7)
  return formatMoney(finRecords.value.filter(r => r.type === 'income' && r.date && r.date.startsWith(m)).reduce((a, r) => a + (r.amount || 0), 0))
})

const monthExpense = computed(() => {
  const m = today.substring(0, 7)
  return formatMoney(finRecords.value.filter(r => r.type === 'expense' && r.date && r.date.startsWith(m)).reduce((a, r) => a + (r.amount || 0), 0))
})

const totalDebtAll = computed(() => formatMoney(subs.value.reduce((a, s) => a + calcTotalDebt(s, s.amount), 0)))

const expiringSubs = computed(() => {
  return subs.value
    .filter(s => s.status === 'active' && s.end)
    .map(s => ({ ...s, remainingDays: daysBetween(s.end, today) }))
    .filter(s => s.remainingDays <= alertDays)
})

const debtSubs = computed(() => {
  return subs.value
    .filter(s => s.status === 'active' || s.status === 'expired')
    .map(s => ({ ...s, totalDebt: calcTotalDebt(s, s.amount) }))
    .filter(s => s.totalDebt > 0)
    .sort((a, b) => b.totalDebt - a.totalDebt)
})

function daysBetween(d1, d2) {
  const a = new Date(d1), b = new Date(d2)
  return Math.ceil((a - b) / 86400000)
}

function calcTotalDebt(sub, amount) {
  const debtSum = (sub.debtHistory || []).reduce((a, d) => a + (d.remaining || 0), 0)
  return debtSum + (!sub.paid ? (amount || 0) : 0)
}

function formatMoney(amount) {
  return (amount || 0).toLocaleString() + ' د.ع'
}
</script>
