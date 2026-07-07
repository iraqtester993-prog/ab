<template>
  <div v-if="showLogin" class="login-container">
    <div class="login-box">
      <div class="login-logo"><i class="fas fa-tower-cell"></i></div>
      <h1>NetTower Pro</h1>
      <div class="login-input-wrap">
        <i class="fas fa-user"></i>
        <input v-model="loginUser" type="text" placeholder="اسم المستخدم" @keyup.enter="handleLogin" />
      </div>
      <div class="login-input-wrap">
        <i class="fas fa-lock"></i>
        <input v-model="loginPass" type="password" placeholder="كلمة المرور" @keyup.enter="handleLogin" />
      </div>
      <button class="login-btn" @click="handleLogin">دخول</button>
      <p v-if="loginErr" class="login-err">{{ loginErr }}</p>
    </div>
  </div>

  <div v-else class="layout">
    <aside :class="['sidebar', { 'sidebar-open': sideOpen }]" @click.self="closeSide">
      <div class="side-head">
        <div class="side-logo"><i class="fas fa-tower-cell"></i><span>NetTower</span></div>
        <button class="side-close" @click="closeSide"><i class="fas fa-times"></i></button>
      </div>
      <nav class="side-nav">
        <router-link v-for="r in routes" :key="r.path" :to="r.path"
          class="side-item" :class="{ active: $route.path === r.path }"
          @click="closeSide">
          <i :class="['fas', r.icon]"></i>
          <span>{{ r.title }}</span>
        </router-link>
      </nav>
      <div class="side-foot">
        <div class="side-user"><i class="fas fa-user-circle"></i><span>{{ userName }}</span></div>
        <button class="side-logout" @click="logout"><i class="fas fa-sign-out-alt"></i></button>
      </div>
    </aside>

    <div class="main-area" @click="closeSide">
      <header class="shead">
        <div class="shead-start">
          <button class="menu-btn" @click="toggleSide"><i class="fas fa-bars"></i></button>
          <div class="page-title"><i :class="['fas', $route.meta.icon]"></i><span>{{ $route.meta.title }}</span></div>
        </div>
        <div class="search-bar" :class="{ open: searchOpen }">
          <input v-model="searchQuery" type="text" placeholder="بحث..." @keyup.enter="doSearch" />
          <button @click="doSearch"><i class="fas fa-search"></i></button>
        </div>
        <div class="shead-actions">
          <button class="filter-btn" @click="toggleFilter"><i class="fas fa-filter"></i></button>
          <button v-if="$route.path==='/subscribers'" class="shead-btn" @click="routerPush('/add-subscriber')"><i class="fas fa-plus"></i><span>إضافة</span></button>
          <button class="shead-btn search-toggle" @click="toggleSearch"><i class="fas fa-search"></i></button>
        </div>
      </header>

      <main class="content">
        <router-view
          :search-query="searchQuery"
          :filter-open="filterOpen"
          @search="onSearch"
          @close-filter="filterOpen = false" />
      </main>

      <nav class="bottom-nav">
        <router-link v-for="r in bottomRoutes" :key="r.path" :to="r.path"
          class="bnav-item" :class="{ active: $route.path === r.path }">
          <i :class="['fas', r.icon]"></i>
          <span>{{ r.title }}</span>
        </router-link>
        <a class="bnav-item logout-btn" @click.prevent="logout" href="#">
          <i class="fas fa-sign-out-alt"></i><span>خروج</span>
        </a>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, provide, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { _store, auth, doLogin as loginUserFn, doLogout, restoreSession, saveAllData, can as canFn, subscriptionTypes, areas, towers, towerInfo, alertDays, users, waTemplates, expenseCategories } from '@/data/store.js'

const router = useRouter()
const route = useRoute()

const showLogin = ref(false)
const loginUser = ref('')
const loginPass = ref('')
const loginErr = ref('')
const sideOpen = ref(false)
const searchOpen = ref(false)
const searchQuery = ref('')
const filterOpen = ref(false)

const userName = computed(() => auth.user?.name || '')

const routes = [
  { path: '/', title: 'لوحة التحكم', icon: 'fa-chart-pie' },
  { path: '/subscribers', title: 'المشتركين', icon: 'fa-users' },
  { path: '/add-subscriber', title: 'إضافة مشترك', icon: 'fa-user-plus' },
  { path: '/whatsapp', title: 'واتساب', icon: 'fa-brands fa-whatsapp' },
  { path: '/finance', title: 'المالية', icon: 'fa-coins' },
  { path: '/archive', title: 'الأرشيف', icon: 'fa-archive' },
  { path: '/reports', title: 'التقارير', icon: 'fa-file-alt' },
  { path: '/notifications', title: 'الإشعارات', icon: 'fa-bell' },
  { path: '/settings', title: 'الإعدادات', icon: 'fa-cog' },
]

const bottomRoutes = [
  { path: '/', title: 'الرئيسية', icon: 'fa-home' },
  { path: '/subscribers', title: 'المشتركين', icon: 'fa-users' },
  { path: '/add-subscriber', title: 'إضافة', icon: 'fa-user-plus' },
  { path: '/whatsapp', title: 'واتساب', icon: 'fa-brands fa-whatsapp' },
  { path: '/finance', title: 'المالية', icon: 'fa-coins' },
]

function toggleSide() { sideOpen.value = !sideOpen.value }
function closeSide() { sideOpen.value = false }
function toggleSearch() { searchOpen.value = !searchOpen.value }
function toggleFilter() { filterOpen.value = !filterOpen.value }
function doSearch() { searchOpen.value = false }
function onSearch(q) { searchQuery.value = q }
function routerPush(path) { router.push(path) }

function handleLogin() {
  loginErr.value = ''
  const u = loginUserFn(loginUser.value, loginPass.value)
  if (u) {
    showLogin.value = false
    loginUser.value = ''
    loginPass.value = ''
  } else {
    loginErr.value = 'خطأ في اسم المستخدم أو كلمة المرور'
  }
}

function logout() {
  doLogout()
  showLogin.value = true
}

function applySettings() {
  const saved = JSON.parse(localStorage.getItem('nettower_settings') || '{}')
  document.documentElement.setAttribute('data-theme', saved.theme || 'dark')
  document.documentElement.setAttribute('data-accent', saved.accent || 'purple')
  document.documentElement.setAttribute('data-style', saved.style || 'neo')
  if (saved.side === 'left') document.documentElement.setAttribute('data-side', 'left')
  else document.documentElement.removeAttribute('data-side')
  if (saved.glass) document.documentElement.setAttribute('data-glass', '')
  else document.documentElement.removeAttribute('data-glass')
}

function checkAuth() {
  restoreSession()
  if (!auth.user) {
    const saved = JSON.parse(localStorage.getItem('nettower_settings') || '{}')
    if (saved.lastUser) {
      const found = users.find(u => u.username === saved.lastUser && u.password === saved.lastPass)
      if (found) { auth.user = found; return }
    }
    showLogin.value = true
  }
}

provide('can', canFn)
provide('store', _store)
provide('subscriptionTypes', subscriptionTypes)
provide('areas', areas)
provide('towers', towers)
provide('towerInfo', towerInfo)
provide('alertDays', alertDays)
provide('waTemplates', waTemplates)
provide('expenseCategories', expenseCategories)
provide('saveAllData', saveAllData)

onMounted(() => {
  applySettings()
  checkAuth()
  document.getElementById('vue-error')?.remove()
})

watch(() => route.path, () => {
  filterOpen.value = false
  searchOpen.value = false
})
</script>
