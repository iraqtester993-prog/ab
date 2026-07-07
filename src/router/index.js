import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import SubscribersPage from '@/pages/SubscribersPage.vue'
import AddSubPage from '@/pages/AddSubPage.vue'
import SubDetailPage from '@/pages/SubDetailPage.vue'
import WhatsAppPage from '@/pages/WhatsAppPage.vue'
import FinancePage from '@/pages/FinancePage.vue'
import ArchivePage from '@/pages/ArchivePage.vue'
import ReportsPage from '@/pages/ReportsPage.vue'
import NotificationsPage from '@/pages/NotificationsPage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'

const routes = [
  { path: '/', name: 'Home', component: HomePage, meta: { title: 'لوحة التحكم', icon: 'fa-chart-pie' } },
  { path: '/subscribers', name: 'Subscribers', component: SubscribersPage, meta: { title: 'المشتركين', icon: 'fa-users' } },
  { path: '/add-subscriber', name: 'AddSubscriber', component: AddSubPage, meta: { title: 'إضافة مشترك', icon: 'fa-user-plus' } },
  { path: '/subscriber/:id', name: 'SubscriberDetail', component: SubDetailPage, meta: { title: 'تفاصيل المشترك', icon: 'fa-user' } },
  { path: '/whatsapp', name: 'WhatsApp', component: WhatsAppPage, meta: { title: 'واتساب', icon: 'fa-brands fa-whatsapp' } },
  { path: '/finance', name: 'Finance', component: FinancePage, meta: { title: 'المالية', icon: 'fa-coins' } },
  { path: '/archive', name: 'Archive', component: ArchivePage, meta: { title: 'الأرشيف', icon: 'fa-archive' } },
  { path: '/reports', name: 'Reports', component: ReportsPage, meta: { title: 'التقارير', icon: 'fa-file-alt' } },
  { path: '/notifications', name: 'Notifications', component: NotificationsPage, meta: { title: 'الإشعارات', icon: 'fa-bell' } },
  { path: '/settings', name: 'Settings', component: SettingsPage, meta: { title: 'الإعدادات', icon: 'fa-cog' } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.afterEach((to) => {
  document.title = to.meta.title + ' | NetTower Pro'
})

export default router
