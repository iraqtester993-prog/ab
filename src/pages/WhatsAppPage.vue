<template>
  <div class="whatsapp-page">
    <h2 class="page-heading"><i class="fab fa-whatsapp"></i> واتساب</h2>

    <div class="wa-section">
      <div class="st-group"><label>القالب</label>
        <select v-model="selectedTemplate">
          <option v-for="t in waTemplates" :key="t.id" :value="t">{{ t.title }}</option>
        </select>
      </div>
      <div class="st-group"><label>المشترك</label>
        <select v-model="selectedSub" @change="fillWA">
          <option v-for="s in allSubs" :key="s.id" :value="s">{{ s.name }} - {{ s.phone }}</option>
        </select>
      </div>
      <div class="st-group"><label>رقم الهاتف</label>
        <input v-model="waPhone" type="text" placeholder="رقم الهاتف" />
      </div>
      <div class="st-group"><label>الرسالة</label>
        <textarea v-model="waMessage" rows="6" placeholder="نص الرسالة"></textarea>
      </div>
      <button class="btn-primary" @click="sendWA"><i class="fab fa-whatsapp"></i> إرسال</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, watch } from 'vue'
import { todayStr, formatMoney } from '@/data/store.js'

const store = inject('store')
const waTemplates = inject('waTemplates')
const towerInfo = inject('towerInfo')

const allSubs = computed(() => store.subs)

const selectedTemplate = ref(waTemplates[0] || {})
const selectedSub = ref(null)
const waPhone = ref('')
const waMessage = ref('')

function fillWA() {
  const s = selectedSub.value
  if (!s) return
  waPhone.value = s.phone
  const tmpl = selectedTemplate.value
  if (tmpl) {
    let msg = tmpl.msg
    msg = msg.replace(/\{name\}/g, s.name)
    msg = msg.replace(/\{type\}/g, s.type || '')
    msg = msg.replace(/\{end\}/g, s.end || '')
    msg = msg.replace(/\{amount\}/g, formatMoney(s.amount))
    msg = msg.replace(/\{phone\}/g, s.phone)
    msg = msg.replace(/\{towerPhone\}/g, towerInfo?.phone || '')
    waMessage.value = msg
  }
}

watch(selectedTemplate, () => { if (selectedSub.value) fillWA() })

function sendWA() {
  if (!waPhone.value || !waMessage.value) return window.showToast?.('يرجى ملء الحقول', 'warning')
  const url = 'https://wa.me/' + waPhone.value.replace(/^0/, '964') + '?text=' + encodeURIComponent(waMessage.value)
  window.open(url, '_blank')
}
</script>
