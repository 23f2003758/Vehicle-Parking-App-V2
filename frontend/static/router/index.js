import { createWebHashHistory, createRouter } from 'vue-router'
import home from '../components/home.js'
import login from '../components/login.js'
import signup from '../components/register.js'
import dashboard from '../components/dashboard.js'
import admin from '../components/admindashboard.js'


const routes = [
  { path: '/', component: home },
  { path : '/login', component: login },
  { path : '/signup', component: signup },
  { path : '/dashboard', component: dashboard },
  { path : '/admindashboard', component: admin },
  
]


export const router = createRouter({
  history: createWebHashHistory(),  // Uses # in URLs
  routes: routes,
})