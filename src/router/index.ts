import { createRouter, createWebHistory } from 'vue-router'
import { useSession } from '../composables/useSession'
import LoginView from '../views/LoginView.vue'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { public: true },
  },
  {
    path: '/',
    name: 'agenda',
    component: () => import('../views/AgendaView.vue'),
    meta: { public: false },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guard: rotas protegidas exigem usuário autenticado
router.beforeEach((to) => {
  if (to.meta.public) return true

  const { isAuthenticated } = useSession()
  if (!isAuthenticated.value) {
    return { name: 'login' }
  }
  return true
})

export default router
