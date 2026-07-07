<template>
  <div class="archive-page">
    <h2 class="page-heading"><i class="fas fa-archive"></i> الأرشيف</h2>

    <div class="tab-bar">
      <button :class="['tab-btn', { active: tab === 'fin' }]" @click="tab = 'fin'"><i class="fas fa-coins"></i> سجلات مالية</button>
      <button :class="['tab-btn', { active: tab === 'subs' }]" @click="tab = 'subs'"><i class="fas fa-users"></i> مشتركين مؤرشفة</button>
    </div>

    <div v-if="tab === 'fin'" class="archive-list">
      <div v-for="r in archivedFinRecords" :key="r.id" class="archive-item">
        <div class="ar-icon" :class="r.type === 'income' ? 'green' : 'red'"><i :class="r.type === 'income' ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i></div>
        <div class="ar-body">
          <div class="ar-desc">{{ r.desc }}</div>
          <div class="ar-meta">{{ r.date }} {{ r.category ? '| ' + r.category : '' }}</div>
        </div>
        <div class="ar-amount" :class="r.type === 'income' ? 'green' : 'red'">{{ formatMoney(r.amount) }}</div>
      </div>
      <div v-if="!archivedFinRecords.length" class="empty-state"><i class="fas fa-inbox"></i> لا توجد سجلات مؤرشفة</div>
    </div>

    <div v-if="tab === 'subs'" class="archive-list">
      <div v-for="s in archivedSubs" :key="s.id" class="archive-item">
        <div class="ar-icon gray"><i class="fas fa-user-slash"></i></div>
        <div class="ar-body">
          <div class="ar-desc">{{ s.name }}</div>
          <div class="ar-meta">{{ s.phone }} | {{ s.type }} | {{ s.end || 'بدون تاريخ' }}</div>
        </div>
        <div class="ar-sub-status">{{ s.status }}</div>
      </div>
      <div v-if="!archivedSubs.length" class="empty-state"><i class="fas fa-inbox"></i> لا يوجد مشتركين مؤرشفة</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'

const store = inject('store')

const tab = ref('fin')

const archivedFinRecords = computed(() => store.finRecords.filter(r => r.archived))
const archivedSubs = computed(() => store.archivedSubs)

function formatMoney(amount) {
  return (amount || 0).toLocaleString() + ' د.ع'
}
</script>
