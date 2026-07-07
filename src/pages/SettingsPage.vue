<template>
  <div class="settings-page">
    <h2 class="page-heading"><i class="fas fa-cog"></i> الإعدادات</h2>

    <div class="tab-bar">
      <button :class="['tab-btn', { active: stTab === 'app' }]" @click="stTab = 'app'"><i class="fas fa-palette"></i> المظهر</button>
      <button :class="['tab-btn', { active: stTab === 'types' }]" @click="stTab = 'types'"><i class="fas fa-tags"></i> الاشتراكات</button>
      <button :class="['tab-btn', { active: stTab === 'areas' }]" @click="stTab = 'areas'"><i class="fas fa-map-marker-alt"></i> المناطق</button>
      <button :class="['tab-btn', { active: stTab === 'towers' }]" @click="stTab = 'towers'"><i class="fas fa-tower-cell"></i> الأبراج</button>
      <button :class="['tab-btn', { active: stTab === 'wa' }]" @click="stTab = 'wa'"><i class="fab fa-whatsapp"></i> واتساب</button>
      <button :class="['tab-btn', { active: stTab === 'users' }]" @click="stTab = 'users'"><i class="fas fa-users-cog"></i> المستخدمين</button>
    </div>

    <div v-if="!can('settings.view')" class="no-perm">ليس لديك صلاحية الوصول</div>

    <div v-if="stTab === 'app' && can('settings.view')" class="st-section">
      <div class="st-group"><label>السمة</label>
        <select v-model="settings.theme" @change="applyAndSave">
          <option value="dark">داكن</option><option value="light">فاتح</option>
        </select>
      </div>
      <div class="st-group"><label>اللون الأساسي</label>
        <div class="accent-grid">
          <button v-for="c in accents" :key="c.val" :class="['accent-btn', c.val, { active: settings.accent === c.val }]" @click="settings.accent = c.val; applyAndSave()"></button>
        </div>
      </div>
      <div class="st-group"><label>الستايل</label>
        <div class="style-grid">
          <button :class="['style-btn', { active: settings.style === 'neo' }]" @click="settings.style = 'neo'; applyAndSave()"><i class="fas fa-cube"></i> Neo</button>
          <button :class="['style-btn', { active: settings.style === 'skeuo' }]" @click="settings.style = 'skeuo'; applyAndSave()"><i class="fas fa-layer-group"></i> Skeuo</button>
          <button :class="['style-btn', { active: settings.style === 'super' }]" @click="settings.style = 'super'; applyAndSave()"><i class="fas fa-star"></i> Super</button>
        </div>
      </div>
      <div class="st-group"><label>الشريط الجانبي</label>
        <div class="toggle-row">
          <label class="toggle-lbl">جهة اليسار</label>
          <label class="toggle"><input type="checkbox" :checked="settings.side === 'left'" @change="e => { settings.side = e.target.checked ? 'left' : 'right'; applyAndSave() }"><span class="slider"></span></label>
        </div>
      </div>
      <div class="st-group"><label>الزجاجية</label>
        <div class="toggle-row">
          <label class="toggle-lbl">Glassmorphism</label>
          <label class="toggle"><input type="checkbox" v-model="settings.glass" @change="applyAndSave"><span class="slider"></span></label>
        </div>
      </div>
    </div>

    <div v-if="stTab === 'types' && can('settings.manageTypes')" class="st-section">
      <div v-for="(t, i) in subscriptionTypes" :key="i" class="st-item">
        <input v-model="t.name" placeholder="اسم النوع" />
        <input v-model.number="t.price" type="number" placeholder="السعر" />
        <input v-model.number="t.days" type="number" placeholder="عدد الأيام" />
        <button class="btn-icon red" @click="remType(i)" :disabled="subscriptionTypes.length <= 1"><i class="fas fa-trash"></i></button>
      </div>
      <button class="btn-secondary" @click="addType"><i class="fas fa-plus"></i> إضافة نوع</button>
    </div>

    <div v-if="stTab === 'areas' && can('settings.manageAreas')" class="st-section">
      <div v-for="(a, i) in areas" :key="i" class="st-inline-item">
        <input v-model="areas[i]" placeholder="اسم المنطقة" />
        <button class="btn-icon red" @click="remArea(i)"><i class="fas fa-times"></i></button>
      </div>
      <button class="btn-secondary" @click="areas.push('')"><i class="fas fa-plus"></i> إضافة منطقة</button>
    </div>

    <div v-if="stTab === 'towers' && can('settings.manageTowers')" class="st-section">
      <div v-for="(t, i) in towers" :key="i" class="st-group">
        <div class="st-inline-item">
          <input v-model="t.name" placeholder="اسم البرج" />
          <button class="btn-icon red" @click="remTower(i)"><i class="fas fa-times"></i></button>
        </div>
        <input v-model="towerInfo.address" placeholder="العنوان" />
        <input v-model="towerInfo.phone" placeholder="رقم الهاتف" />
      </div>
      <button class="btn-secondary" @click="addTower"><i class="fas fa-plus"></i> إضافة برج</button>
    </div>

    <div v-if="stTab === 'wa' && can('settings.manageTemplates')" class="st-section">
      <div v-for="(tmpl, i) in waTemplates" :key="i" class="st-group">
        <input v-model="tmpl.title" placeholder="عنوان القالب" />
        <textarea v-model="tmpl.msg" rows="3" placeholder="نص الرسالة"></textarea>
        <button class="btn-icon red" @click="remWAT(i)"><i class="fas fa-trash"></i></button>
      </div>
      <button class="btn-secondary" @click="addWAT"><i class="fas fa-plus"></i> إضافة قالب</button>
    </div>

    <div v-if="stTab === 'users' && can('settings.manageUsers')" class="st-section">
      <div v-for="(u, i) in users" :key="i" class="st-user-card">
        <div class="st-user-head">{{ u.name }} <span v-if="u.id === 1">(مدير)</span></div>
        <input v-model="u.name" placeholder="الاسم" />
        <input v-model="u.username" placeholder="اسم المستخدم" />
        <input v-model="u.password" type="text" placeholder="كلمة المرور" />
        <button v-if="u.id !== 1" class="btn-icon red" @click="remUser(i)"><i class="fas fa-user-slash"></i></button>
      </div>
      <button class="btn-secondary" @click="addUser"><i class="fas fa-user-plus"></i> إضافة مستخدم</button>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted, watch } from 'vue'
import { subscriptionTypes as types, areas as areaList, towers as towerList, towerInfo as info, waTemplates as templates, users as userList, saveAllData } from '@/data/store.js'

const can = inject('can')

const stTab = ref('app')

const accents = [
  { val: 'purple', label: 'بنفسجي' }, { val: 'blue', label: 'أزرق' },
  { val: 'green', label: 'أخضر' }, { val: 'orange', label: 'برتقالي' },
  { val: 'red', label: 'أحمر' }, { val: 'pink', label: 'وردي' },
  { val: 'teal', label: 'تركواز' }, { val: 'amber', label: 'عنبر' },
]

const settings = ref({
  theme: 'dark',
  accent: 'purple',
  style: 'neo',
  side: 'right',
  glass: false,
})

function applyAndSave() {
  const s = settings.value
  document.documentElement.setAttribute('data-theme', s.theme)
  document.documentElement.setAttribute('data-accent', s.accent)
  document.documentElement.setAttribute('data-style', s.style)
  if (s.side === 'left') document.documentElement.setAttribute('data-side', 'left')
  else document.documentElement.removeAttribute('data-side')
  if (s.glass) document.documentElement.setAttribute('data-glass', '')
  else document.documentElement.removeAttribute('data-glass')
  localStorage.setItem('nettower_settings', JSON.stringify(s))
}

const subscriptionTypes = types
const areas = areaList
const towers = towerList
const towerInfo = info
const waTemplates = templates
const users = userList

function addType() { subscriptionTypes.push({ id: Date.now(), name: '', price: 0, days: 30 }) }
function remType(i) { if (subscriptionTypes.length > 1) subscriptionTypes.splice(i, 1); saveAllData() }
function remArea(i) { areas.splice(i, 1); saveAllData() }
function addTower() { towers.push({ id: Date.now(), name: '', points: [] }); saveAllData() }
function remTower(i) { towers.splice(i, 1); saveAllData() }
function addWAT() { waTemplates.push({ id: Date.now(), title: '', icon: 'fa-edit', msg: '' }); saveAllData() }
function remWAT(i) { waTemplates.splice(i, 1); saveAllData() }
function addUser() { users.push({ id: Date.now(), name: '', username: '', password: '', permissions: {} }); saveAllData() }
function remUser(i) { if (users[i].id !== 1) users.splice(i, 1); saveAllData() }

watch([subscriptionTypes, areas, towers, towerInfo, waTemplates, users], () => saveAllData(), { deep: true })

onMounted(() => {
  const saved = JSON.parse(localStorage.getItem('nettower_settings') || '{}')
  Object.assign(settings.value, saved)
})
</script>
