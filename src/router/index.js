import {createRouter, createWebHistory} from 'vue-router'

const router = createRouter({
  history: createWebHistory('/map/'),
  routes: [
    {
      path: '/:embedUuid/:subProjectUuid?',
      name: 'home',
      component: () => import('../views/home/ProjectMap.vue')
    },

    {
      path: '/:embedUuid/building/:buildingUuid',
      name: 'show-building',
      component: () => import('../views/building/BuildingMap.vue')
    },
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue'),
    // },
  ],
})

export default router
