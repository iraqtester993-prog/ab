<template>
  <div class="add-sub-page">
    <h2 class="page-heading"><i class="fas fa-user-plus"></i> إضافة مشترك جديد</h2>

    <div v-if="can('subscribers.add')" class="form-grid">
      <div class="form-group"><label>الاسم الثلاثي</label><input v-model="form.name" type="text" placeholder="مثل: أحمد علي محمد" /></div>
      <div class="form-group"><label>رقم الهاتف</label><input v-model="form.phone" type="text" placeholder="رقم الهاتف" /></div>
      <div class="form-group"><label>SSID</label><input v-model="form.ssid" type="text" placeholder="اسم الشبكة" /></div>
      <div class="form-group"><label>كلمة السر</label><input v-model="form.pass" type="text" placeholder="كلمة سر الواي فاي" /></div>
      <div class="form-group"><label>المنطقة</label>
        <select v-model="form.area"><option value="">اختر المنطقة</option><option v-for="a in areas" :key="a" :value="a">{{ a }}</option></select>
      </div>
      <div class="form-group"><label>البرج</label>
        <select v-model="form.tower"><option v-for="t in towers" :key="t.id" :value="t.name">{{ t.name }}</option></select>
      </div>
      <div class="form-group"><label>نقطة التوصيل</label><input v-model="form.point" type="text" placeholder="نقطة التوصيل" /></div>
      <div class="form-group"><label>نوع الاشتراك</label>
        <select v-model="form.type" @change="updateAmount">
          <option v-for="t in subscriptionTypes" :key="t.id" :value="t.name">{{ t.name }} ({{ t.price.toLocaleString() }} د.ع / {{ t.days }} يوم)</option>
        </select>
      </div>
      <div class="form-group"><label>المبلغ</label><input v-model.number="form.amount" type="number" placeholder="المبلغ" /></div>
      <div class="form-group"><label>تاريخ البداية</label><input v-model="form.start" type="date" /></div>
      <div class="form-group"><label>تاريخ النهاية</label><input v-model="form.end" type="date" /></div>
      <div class="form-group"><label>ملاحظات</label><textarea v-model="form.notes" placeholder="ملاحظات"></textarea></div>
    </div>

    <div v-if="can('subscribers.add')" class="form-actions">
      <button class="btn-primary" @click="saveSub"><i class="fas fa-save"></i> حفظ</button>
      <button class="btn-secondary" @click="resetForm"><i class="fas fa-undo"></i> إعادة تعيين</button>
    </div>

    <div v-if="!can('subscribers.add')" class="no-perm">ليس لديك صلاحية الإضافة</div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import { todayStr, calcEndFromType, saveAllData } from '@/data/store.js'

const router = useRouter()
const can = inject('can')
const subscriptionTypes = inject('subscriptionTypes')
const areas = inject('areas')
const towers = inject('towers')
const store = inject('store')

const form = ref({
  name: '', phone: '', ssid: '', pass: '', area: '', tower: 'برج الاتحاد',
  point: '', type: 'شهري', amount: 35000, start: todayStr(), end: '',
  notes: '', status: 'active', paid: true, freeCount: 0, freeDates: [],
  prevDebt: 0, debtHistory: []
})

function updateAmount() {
  const found = subscriptionTypes.find(t => t.name === form.value.type)
  if (found) { form.value.amount = found.price; form.value.end = calcEndFromType(found.name, form.value.start).toISOString().split('T')[0] }
}

function nextId() {
  const maxId = store.subs.reduce((a, s) => Math.max(a, s.id || 0), 0)
  return maxId + 1
}

function saveSub() {
  if (!form.value.name) return window.showToast?.('يرجى إدخال الاسم', 'warning')
  const sub = { ...form.value, id: nextId() }
  if (!sub.end) { const found = subscriptionTypes.find(t => t.name === sub.type); sub.end = found ? calcEndFromType(found.name, sub.start).toISOString().split('T')[0] : '' }
  store.subs.push(sub)
  saveAllData()
  window.showToast?.('تم حفظ المشترك بنجاح ✅', 'success')
  router.push('/subscribers')
}

function resetForm() {
  form.value = { name: '', phone: '', ssid: '', pass: '', area: '', tower: 'برج الاتحاد', point: '', type: 'شهري', amount: 35000, start: todayStr(), end: '', notes: '', status: 'active', paid: true, freeCount: 0, freeDates: [], prevDebt: 0, debtHistory: [] }
}
</script>
