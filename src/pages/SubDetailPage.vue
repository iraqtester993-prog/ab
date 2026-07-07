<template>
  <div class="detail-page">
    <div v-if="!sub" class="empty-state"><i class="fas fa-user-slash"></i> المشترك غير موجود</div>

    <template v-else>
      <div class="detail-head">
        <button class="btn-back" @click="$router.push('/subscribers')"><i class="fas fa-arrow-right"></i></button>
        <div>
          <h2>{{ sub.name }}</h2>
          <span :class="['sub-status', sub.status]">{{ statusText(sub.status) }}</span>
        </div>
      </div>

      <div class="detail-info">
        <div class="info-row"><span class="info-lbl">رقم الهاتف</span><span class="info-val">{{ sub.phone }}</span></div>
        <div class="info-row"><span class="info-lbl">SSID</span><span class="info-val">{{ sub.ssid || '—' }}</span></div>
        <div class="info-row"><span class="info-lbl">رمز الشبكة</span><span class="info-val">{{ sub.pass || '—' }}</span></div>
        <div class="info-row"><span class="info-lbl">المنطقة</span><span class="info-val">{{ sub.area || '—' }}</span></div>
        <div class="info-row"><span class="info-lbl">البرج</span><span class="info-val">{{ sub.tower || '—' }}</span></div>
        <div class="info-row"><span class="info-lbl">نقطة التوصيل</span><span class="info-val">{{ sub.point || '—' }}</span></div>
        <div class="info-row"><span class="info-lbl">نوع الاشتراك</span><span class="info-val">{{ sub.type }}</span></div>
        <div class="info-row"><span class="info-lbl">المبلغ</span><span class="info-val">{{ formatMoney(sub.amount) }}</span></div>
        <div class="info-row"><span class="info-lbl">تاريخ البداية</span><span class="info-val">{{ sub.start || '—' }}</span></div>
        <div class="info-row"><span class="info-lbl">تاريخ النهاية</span><span class="info-val">{{ sub.end || '—' }}</span></div>
        <div class="info-row"><span class="info-lbl">ملاحظات</span><span class="info-val">{{ sub.notes || '—' }}</span></div>
      </div>

      <div v-if="sub.prevDebt > 0" class="debt-section">
        <h3><i class="fas fa-hand-holding-usd"></i> الديون ({{ formatMoney(sub.prevDebt) }})</h3>
        <div v-for="d in sub.debtHistory" :key="d.id" class="debt-item">
          <div class="debt-head">
            <span>{{ d.date }} - {{ d.note || '' }}</span>
            <span class="debt-remaining">{{ formatMoney(d.remaining) }}</span>
          </div>
          <div v-if="d.payments && d.payments.length" class="debt-payments">
            <div v-for="(p, i) in d.payments" :key="i" class="debt-pay">
              <span>{{ p.date }}: {{ formatMoney(p.amount) }}</span>
              <span class="debt-pay-note">{{ p.note || '' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-actions">
        <button v-if="can('subscribers.renew')" class="btn-primary" @click="openRenew"><i class="fas fa-redo"></i> تجديد</button>
        <button v-if="can('subscribers.settle')" class="btn-warning" @click="openSettle"><i class="fas fa-hand-holding-usd"></i> تسوية ديون</button>
        <button v-if="can('subscribers.edit')" class="btn-secondary" @click="editMode = !editMode"><i class="fas fa-edit"></i> تعديل</button>
        <button v-if="can('subscribers.del')" class="btn-danger" @click="deleteSub"><i class="fas fa-trash"></i> حذف</button>
      </div>

      <div v-if="editMode" class="edit-form">
        <h3><i class="fas fa-edit"></i> تعديل بيانات المشترك</h3>
        <div class="form-grid">
          <div class="form-group"><label>الاسم</label><input v-model="editForm.name" type="text" /></div>
          <div class="form-group"><label>رقم الهاتف</label><input v-model="editForm.phone" type="text" /></div>
          <div class="form-group"><label>SSID</label><input v-model="editForm.ssid" type="text" /></div>
          <div class="form-group"><label>كلمة السر</label><input v-model="editForm.pass" type="text" /></div>
          <div class="form-group"><label>المنطقة</label>
            <select v-model="editForm.area"><option v-for="a in areas" :key="a" :value="a">{{ a }}</option></select>
          </div>
          <div class="form-group"><label>البرج</label>
            <select v-model="editForm.tower"><option v-for="t in towers" :key="t.id" :value="t.name">{{ t.name }}</option></select>
          </div>
          <div class="form-group"><label>نقطة التوصيل</label><input v-model="editForm.point" type="text" /></div>
          <div class="form-group"><label>الحالة</label>
            <select v-model="editForm.status"><option value="active">نشط</option><option value="expired">منتهي</option><option value="disabled">معطل</option><option value="inactive">غير فعال</option></select>
          </div>
          <div class="form-group"><label>ملاحظات</label><textarea v-model="editForm.notes"></textarea></div>
        </div>
        <div class="form-actions">
          <button class="btn-primary" @click="saveEdit">حفظ التعديلات</button>
          <button class="btn-secondary" @click="editMode = false">إلغاء</button>
        </div>
      </div>

      <div v-if="showRenewModal" class="modal-over" @click.self="showRenewModal = false">
        <div class="modal-small">
          <h3>تجديد اشتراك {{ sub.name }}</h3>
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
            <button class="btn-primary" @click="confirmRenew">تأكيد التجديد</button>
            <button class="btn-secondary" @click="showRenewModal = false">إلغاء</button>
          </div>
        </div>
      </div>

      <div v-if="showSettleModal" class="modal-over" @click.self="showSettleModal = false">
        <div class="modal-small">
          <h3>تسوية ديون {{ sub.name }}</h3>
          <p>إجمالي الدين: {{ formatMoney(settleTotal) }}</p>
          <div class="form-group"><label>المبلغ المدفوع</label><input v-model.number="settleForm.amount" type="number" :max="settleTotal" /></div>
          <div class="form-group"><label>ملاحظة</label><input v-model="settleForm.note" type="text" /></div>
          <div class="form-actions">
            <button class="btn-primary" @click="confirmSettle">تأكيد التسوية</button>
            <button class="btn-secondary" @click="showSettleModal = false">إلغاء</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, inject, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { todayStr, formatMoney, calcEndFromType, saveAllData } from '@/data/store.js'

const route = useRoute()
const router = useRouter()

const store = inject('store')
const can = inject('can')
const areas = inject('areas')
const towers = inject('towers')
const subscriptionTypes = inject('subscriptionTypes')

const subId = computed(() => parseInt(route.params.id))
const sub = computed(() => store.subs.find(s => s.id === subId.value))

const editMode = ref(false)
const editForm = ref({})

const showRenewModal = ref(false)
const renewForm = ref({ type: 'شهري', amount: 35000, start: todayStr(), end: '', paid: true })

const showSettleModal = ref(false)
const settleForm = ref({ amount: 0, note: 'تسوية ديون' })

const settleTotal = computed(() => {
  const s = sub.value
  if (!s) return 0
  const debtSum = (s.debtHistory || []).reduce((a, d) => a + (d.remaining || 0), 0)
  return debtSum + (!s.paid ? (s.amount || 0) : 0)
})

function statusText(st) {
  return { active: 'نشط', expired: 'منتهي', disabled: 'معطل', inactive: 'غير فعال' }[st] || st
}

function openRenew() {
  const s = sub.value
  if (!s) return
  renewForm.value = { type: s.type, amount: s.amount, start: s.end || todayStr(), end: '', paid: false }
  calcRenewEnd()
  showRenewModal.value = true
}

function openSettle() {
  const s = sub.value
  if (!s) return
  settleForm.value = { amount: settleTotal.value, note: 'تسوية ديون' }
  showSettleModal.value = true
}

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

function confirmRenew() {
  const s = sub.value
  if (!s) return
  const f = renewForm.value
  if (!f.paid) {
    s.prevDebt = (s.prevDebt || 0) + f.amount
    s.debtHistory = s.debtHistory || []
    s.debtHistory.push({ id: Date.now(), amount: f.amount, remaining: f.amount, date: todayStr(), note: 'تجديد ' + f.type, payments: [] })
  }
  store.finRecords.push({ id: Date.now(), date: todayStr(), desc: 'تجديد اشتراك ' + s.name + ' - ' + f.type, amount: f.amount, type: 'income' })
  s.type = f.type; s.amount = f.amount; s.start = f.start; s.end = f.end; s.status = 'active'; s.paid = f.paid
  saveAllData()
  window.showToast?.('تم تجديد الاشتراك ✅', 'success')
  showRenewModal.value = false
}

function confirmSettle() {
  const s = sub.value
  if (!s || !s.debtHistory) return
  let remaining = settleForm.value.amount
  for (const d of s.debtHistory) {
    if (remaining <= 0) break
    if (d.remaining > 0) {
      const pay = Math.min(remaining, d.remaining)
      d.payments = d.payments || []
      d.payments.push({ amount: pay, date: todayStr(), note: settleForm.value.note })
      d.remaining -= pay
      remaining -= pay
    }
  }
  s.prevDebt = s.debtHistory.reduce((a, d) => a + (d.remaining || 0), 0)
  if (remaining > 0 && !s.paid) s.paid = true
  store.finRecords.push({ id: Date.now(), date: todayStr(), desc: 'تسوية ديون ' + s.name, amount: settleForm.value.amount, type: 'income' })
  saveAllData()
  window.showToast?.('تمت التسوية ✅', 'success')
  showSettleModal.value = false
}

function deleteSub() {
  const s = sub.value
  if (!s) return
  if (!confirm('هل أنت متأكد من حذف ' + s.name + '؟')) return
  store.archivedSubs.push({ ...s })
  const idx = store.subs.findIndex(x => x.id === s.id)
  if (idx !== -1) store.subs.splice(idx, 1)
  saveAllData()
  window.showToast?.('تم نقل المشترك إلى الأرشيف', 'info')
  router.push('/subscribers')
}

function saveEdit() {
  const s = sub.value
  if (!s) return
  Object.assign(s, editForm.value)
  saveAllData()
  window.showToast?.('تم حفظ التعديلات ✅', 'success')
  editMode.value = false
}

watch(sub, (s) => {
  if (s) editForm.value = { name: s.name, phone: s.phone, ssid: s.ssid, pass: s.pass, area: s.area, tower: s.tower, point: s.point, status: s.status, notes: s.notes }
}, { immediate: true })

</script>
