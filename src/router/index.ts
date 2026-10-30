import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'campus',
      component: () => import('../views/CampusView.vue'),
    },
    {
      path: '/workshop',
      name: 'workshop',
      component: () => import('../views/WorkshopView.vue'),
    },
  ],
})

export default router
