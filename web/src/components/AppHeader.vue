<script setup>
import { useRouter } from 'vue-router';
import Icon from './Icon.vue';
import { useSession } from '../composables/useSession.js';
import { useTheme } from '../composables/useTheme.js';
const { session, clearSession } = useSession();
const { theme, toggleTheme } = useTheme();
const router = useRouter();
function logout() {
  clearSession();
  router.push('/login');
}
</script>
<template>
  <header class="axon-header">
    <div class="container-fluid axon-container axon-header-row">
      <RouterLink class="axon-brand" to="/explore"
        ><Icon name="axon-mark" class="axon-logo" />AxonHub</RouterLink
      >
      <nav class="axon-nav" aria-label="Main navigation">
        <RouterLink class="axon-nav-link" to="/explore">Explore</RouterLink>
        <RouterLink class="axon-nav-link" to="/profile">Your library</RouterLink>
      </nav>
      <div class="axon-theme-controls">
        <button
          class="btn btn-outline-primary axon-theme-toggle"
          type="button"
          :aria-label="`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`"
          @click="toggleTheme"
        >
          <Icon :name="theme === 'dark' ? 'sun' : 'moon'" />
        </button>
      </div>
      <div class="axon-account-nav">
        <template v-if="session"
          ><span class="small">Signed in</span
          ><button class="btn btn-outline-primary" @click="logout">Log out</button></template
        >
        <template v-else
          ><RouterLink class="axon-nav-link" to="/login">Log in</RouterLink
          ><RouterLink class="btn btn-primary" to="/register">Sign up</RouterLink></template
        >
      </div>
    </div>
  </header>
</template>
