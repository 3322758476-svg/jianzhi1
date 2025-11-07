import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { permissionGuard } from '../services/permissionService'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/jobs',
    name: 'Jobs',
    component: () => import('../views/Jobs.vue')
  },
  {
    path: '/jobs/:id',
    name: 'JobDetail',
    component: () => import('../views/JobDetail.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/ForgotPassword.vue')
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('../views/StudentMessages.vue')
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('../views/Notifications.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue')
  },
  {
    path: '/profile/ratings',
    name: 'Ratings',
    component: () => import('../views/Ratings.vue')
  },
  {
    path: '/profile/rating-system',
    name: 'RatingSystem',
    component: () => import('../views/RatingSystem.vue')
  },
  {
    path: '/profile/applications',
    name: 'Applications',
    component: () => import('../views/Applications.vue')
  },
  {
    path: '/profile/favorites',
    name: 'Favorites',
    component: () => import('../views/Favorites.vue')
  },
  {
    path: '/profile/resume',
    name: 'Resume',
    component: () => import('../views/Resume.vue')
  },
  {
    path: '/company/dashboard',
    name: 'CompanyDashboard',
    component: () => import('../views/CompanyDashboard.vue')
  },
  {
    path: '/company/jobs',
    name: 'CompanyJobs',
    component: () => import('../views/CompanyJobs.vue')
  },
  {
    path: '/company/applications',
    name: 'CompanyApplications',
    component: () => import('../views/CompanyApplications.vue')
  },
  {
    path: '/company/jobs/new',
    name: 'CompanyJobNew',
    component: () => import('../views/CompanyJobNew.vue')
  },
  {
    path: '/company/jobs/archived',
    name: 'CompanyJobsArchived',
    component: () => import('../views/CompanyJobsArchived.vue')
  },
  {
    path: '/company/applications/pending',
    name: 'CompanyApplicationsPending',
    component: () => import('../views/CompanyApplicationsPending.vue')
  },
  {
    path: '/company/applications/reviewing',
    name: 'CompanyApplicationsReviewing',
    component: () => import('../views/CompanyApplicationsReviewing.vue')
  },
  {
    path: '/company/applications/accepted',
    name: 'CompanyApplicationsAccepted',
    component: () => import('../views/CompanyApplicationsAccepted.vue')
  },
  {
    path: '/company/applications/rejected',
    name: 'CompanyApplicationsRejected',
    component: () => import('../views/CompanyApplicationsRejected.vue')
  },
  {
    path: '/company/analytics',
    name: 'CompanyAnalytics',
    component: () => import('../views/CompanyAnalytics.vue')
  },
  {
    path: '/company/analytics/overview',
    name: 'CompanyAnalyticsOverview',
    component: () => import('../views/CompanyAnalytics.vue')
  },
  {
    path: '/company/analytics/jobs',
    name: 'CompanyAnalyticsJobs',
    component: () => import('../views/CompanyAnalytics.vue')
  },
  {
    path: '/company/analytics/applications',
    name: 'CompanyAnalyticsApplications',
    component: () => import('../views/CompanyAnalytics.vue')
  },
  {
    path: '/company/analytics/performance',
    name: 'CompanyAnalyticsPerformance',
    component: () => import('../views/CompanyAnalytics.vue')
  },
  {
    path: '/company/approval/workflow',
    name: 'CompanyApprovalWorkflow',
    component: () => import('../views/CompanyApprovalWorkflow.vue')
  },
  {
    path: '/company/approval/templates',
    name: 'CompanyApprovalTemplates',
    component: () => import('../views/CompanyApprovalTemplates.vue')
  },
  {
    path: '/company/approval/history',
    name: 'CompanyApprovalHistory',
    component: () => import('../views/CompanyApprovalHistory.vue')
  },
  {
    path: '/company/messages',
    name: 'CompanyMessages',
    component: () => import('../views/CompanyMessages.vue')
  },
  {
    path: '/company/settings',
    name: 'CompanySettings',
    component: () => import('../views/CompanySettings.vue')
  },
  {
    path: '/company/settings/profile',
    name: 'CompanySettingsProfile',
    component: () => import('../views/CompanySettingsProfile.vue')
  },
  {
    path: '/company/settings/members',
    name: 'CompanySettingsMembers',
    component: () => import('../views/CompanySettingsMembers.vue')
  },
  {
    path: '/company/settings/permissions',
    name: 'CompanySettingsPermissions',
    component: () => import('../views/CompanySettingsPermissions.vue')
  },
  {
    path: '/company/settings/integration',
    name: 'CompanySettingsIntegration',
    component: () => import('../views/CompanySettingsIntegration.vue')
  },
  {
    path: '/company/help',
    name: 'CompanyHelp',
    component: () => import('../views/CompanyHelp.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 添加路由守卫
router.beforeEach((to, from, next) => {
  // 检查是否需要权限验证
  if (to.path.startsWith('/company')) {
    permissionGuard(to, from, next)
  } else {
    next()
  }
})

export default router