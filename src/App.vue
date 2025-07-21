<template>
  <a-config-provider>
    <div class="app-container">
      <a-layout style="min-height: 100vh">
        <!-- Sidebar -->
        <a-layout-sider
          v-model:collapsed="collapsed"
          collapsible
          :trigger="null"
          :theme="theme"
          class="sidebar"
          :width="240"
        >
          <div class="logo">
            <h1>AI Workflow</h1>
          </div>
          <a-menu
            v-model:selectedKeys="selectedKeys"
            :theme="theme"
            mode="inline"
          >
            <a-menu-item key="chat" @click="navigateTo('/')">
              <template #icon>
                <message-outlined />
              </template>
              <span>Chat</span>
            </a-menu-item>
            <a-menu-item key="workflow" @click="navigateTo('/workflow')">
              <template #icon>
                <apartment-outlined />
              </template>
              <span>Workflow</span>
            </a-menu-item>
          </a-menu>
        </a-layout-sider>

        <!-- Main Content -->
        <a-layout>
          <!-- Header -->
          <a-layout-header class="header">
            <menu-unfold-outlined
              v-if="collapsed"
              class="trigger"
              @click="() => (collapsed = !collapsed)"
            />
            <menu-fold-outlined
              v-else
              class="trigger"
              @click="() => (collapsed = !collapsed)"
            />
            <span class="page-title">{{ currentPageTitle }}</span>
          </a-layout-header>

          <!-- Content -->
          <a-layout-content class="content">
            <router-view v-slot="{ Component }">
              <transition name="fade" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </a-layout-content>

          <!-- Footer -->
          <a-layout-footer class="footer">
            AI Workflow Frontend &copy; {{ new Date().getFullYear() }}
          </a-layout-footer>
        </a-layout>
      </a-layout>
    </div>
  </a-config-provider>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  MessageOutlined,
  ApartmentOutlined
} from '@ant-design/icons-vue'

// Router
const router = useRouter()
const route = useRoute()

// State
const collapsed = ref(false)
const theme = ref('dark')
const selectedKeys = ref(['chat'])

// Computed
const currentPageTitle = computed(() => {
  return route.meta.title || 'AI Workflow'
})

// Watch for route changes to update selected menu item
const updateSelectedKeys = () => {
  const path = route.path
  if (path === '/') {
    selectedKeys.value = ['chat']
  } else if (path === '/workflow') {
    selectedKeys.value = ['workflow']
  }
}

// Initialize selected keys based on current route
updateSelectedKeys()

// Methods
const navigateTo = (path) => {
  router.push(path)
}
</script>

<style>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  padding: 0 16px;
}

.logo h1 {
  color: white;
  font-size: 18px;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header {
  background: #fff;
  padding: 0 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.trigger {
  font-size: 18px;
  cursor: pointer;
  transition: color 0.3s;
  padding: 0 24px;
}

.trigger:hover {
  color: #1890ff;
}

.page-title {
  font-size: 18px;
  font-weight: 500;
  margin-left: 12px;
}

.content {
  margin: 24px;
  padding: 24px;
  background: #fff;
  border-radius: 4px;
  overflow: auto;
}

.footer {
  text-align: center;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
  padding: 16px 50px;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>