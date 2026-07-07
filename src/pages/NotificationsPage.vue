<template>
  <div class="notif-page">
    <h2 class="page-heading"><i class="fas fa-bell"></i> الإشعارات</h2>

    <div class="notif-list">
      <div class="notif-item" :class="{ unread: !n.read }" v-for="(n, i) in notifs" :key="i">
        <div class="notif-icon"><i :class="n.icon || 'fas fa-bell'"></i></div>
        <div class="notif-body">
          <div class="notif-msg">{{ n.msg }}</div>
          <div class="notif-time">{{ n.time }}</div>
        </div>
      </div>
      <div v-if="!notifs.length" class="empty-state"><i class="fas fa-bell-slash"></i> لا توجد إشعارات</div>
    </div>

    <button v-if="notifs.length" class="btn-secondary" @click="clearAll" style="margin-top:12px"><i class="fas fa-trash"></i> مسح الكل</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const notifs = ref(JSON.parse(localStorage.getItem('nettower_notifs') || '[]'))

function clearAll() {
  notifs.value = []
  localStorage.setItem('nettower_notifs', '[]')
}
</script>
