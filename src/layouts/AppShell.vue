<script setup lang="ts">
import { computed, ref, watch, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Collection,
  Menu,
  Operation,
  Setting,
  SwitchButton,
  UserFilled,
} from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

interface NavItem {
  path: string
  labelKey: string
  icon: Component
}

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

const drawerVisible = ref(false)

const navItems: NavItem[] = [
  { path: '/library', labelKey: 'library.title', icon: Collection },
  { path: '/media-management', labelKey: 'mediaManagement.title', icon: Operation },
  { path: '/settings', labelKey: 'settings.title', icon: Setting },
]

const activePath = computed(() => {
  if (route.path.startsWith('/media/')) return '/library'
  const matched = navItems.find((item) => route.path === item.path || route.path.startsWith(`${item.path}/`))
  return matched?.path || '/library'
})

const goTo = (path: string) => {
  drawerVisible.value = false
  if (route.path !== path) router.push(path)
}

const logout = () => {
  auth.clear()
  drawerVisible.value = false
  router.push('/login')
}

const onAvatarCommand = (command: string | number | object) => {
  if (command === 'settings') {
    goTo('/settings')
    return
  }

  if (command === 'logout') logout()
}

watch(
  () => route.fullPath,
  () => {
    drawerVisible.value = false
  },
)
</script>

<template>
  <div class="app-shell">
    <header class="app-shell__header">
      <div class="app-shell__header-inner">
        <div class="app-shell__left">
          <button class="mobile-menu-trigger" type="button" @click="drawerVisible = true">
            <el-icon><Menu /></el-icon>
          </button>

          <button class="app-logo" type="button" @click="goTo('/library')">
            <img src="/favicon.svg" alt="Emby MVP" />
            <span>Emby MVP</span>
          </button>

          <nav class="top-nav">
            <button
              v-for="item in navItems"
              :key="item.path"
              class="top-nav-item"
              :class="{ 'is-active': activePath === item.path }"
              type="button"
              @click="goTo(item.path)"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ t(item.labelKey) }}</span>
            </button>
          </nav>
        </div>

        <el-dropdown trigger="click" @command="onAvatarCommand">
          <button class="avatar-trigger" type="button">
            <el-avatar :size="34">
              <el-icon><UserFilled /></el-icon>
            </el-avatar>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="settings">
                <el-icon><Setting /></el-icon>
                <span>{{ t('settings.title') }}</span>
              </el-dropdown-item>
              <el-dropdown-item command="logout">
                <el-icon><SwitchButton /></el-icon>
                <span>{{ t('library.logout') }}</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <main class="app-shell__content">
      <router-view />
    </main>

    <el-drawer v-model="drawerVisible" direction="ltr" size="280px" :with-header="false" custom-class="mobile-nav-drawer">
      <div class="mobile-nav">
        <button class="app-logo app-logo--drawer" type="button" @click="goTo('/library')">
          <img src="/favicon.svg" alt="Emby MVP" />
          <span>Emby MVP</span>
        </button>

        <nav class="mobile-nav-list">
          <button
            v-for="item in navItems"
            :key="item.path"
            class="mobile-nav-item"
            :class="{ 'is-active': activePath === item.path }"
            type="button"
            @click="goTo(item.path)"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ t(item.labelKey) }}</span>
          </button>
        </nav>

        <button class="mobile-logout-btn" type="button" @click="logout">
          <el-icon><SwitchButton /></el-icon>
          <span>{{ t('library.logout') }}</span>
        </button>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at 20% -20%, rgba(43, 110, 242, 0.15), transparent 55%),
    radial-gradient(circle at 100% 0%, rgba(15, 185, 177, 0.12), transparent 40%),
    #f5f7fc;
}

.app-shell__header {
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  background: rgba(245, 247, 252, 0.88);
  border-bottom: 1px solid rgba(49, 79, 145, 0.12);
}

.app-shell__header-inner {
  width: min(1320px, 100%);
  margin: 0 auto;
  min-height: 72px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.app-shell__left {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 14px;
}

.mobile-menu-trigger {
  width: 38px;
  height: 38px;
  border: 1px solid #d7dfef;
  border-radius: 10px;
  background: #fff;
  color: #304f91;
  display: grid;
  place-items: center;
  font-size: 18px;
  cursor: pointer;
}

.app-logo {
  border: 0;
  background: transparent;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: #15274b;
}

.app-logo img {
  width: 28px;
  height: 28px;
}

.app-logo span {
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.top-nav {
  display: none;
  align-items: stretch;
  gap: 6px;
}

.top-nav-item {
  min-width: 88px;
  border: 0;
  border-radius: 12px;
  padding: 7px 10px;
  background: transparent;
  color: #3f557f;
  cursor: pointer;
  display: grid;
  justify-items: center;
  gap: 3px;
  transition: all 0.2s ease;
}

.top-nav-item .el-icon {
  font-size: 18px;
}

.top-nav-item span {
  font-size: 12px;
  font-weight: 600;
}

.top-nav-item:hover {
  background: rgba(43, 110, 242, 0.09);
  color: #1b439e;
}

.top-nav-item.is-active {
  background: linear-gradient(145deg, rgba(43, 110, 242, 0.22), rgba(43, 110, 242, 0.08));
  color: #1b439e;
}

.avatar-trigger {
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.app-shell__content {
  width: min(1320px, 100%);
  margin: 0 auto;
}

.mobile-nav {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.app-logo--drawer {
  padding-top: 2px;
}

.mobile-nav-list {
  display: grid;
  gap: 6px;
}

.mobile-nav-item,
.mobile-logout-btn {
  border: 0;
  border-radius: 12px;
  min-height: 42px;
  padding: 0 12px;
  background: transparent;
  color: #334a74;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
}

.mobile-nav-item .el-icon,
.mobile-logout-btn .el-icon {
  font-size: 18px;
}

.mobile-nav-item.is-active {
  background: rgba(43, 110, 242, 0.14);
  color: #1e489f;
}

.mobile-nav-item:not(.is-active):hover,
.mobile-logout-btn:hover {
  background: rgba(43, 110, 242, 0.08);
}

.mobile-logout-btn {
  margin-top: auto;
}

@media (min-width: 900px) {
  .mobile-menu-trigger {
    display: none;
  }

  .top-nav {
    display: flex;
  }
}
</style>
