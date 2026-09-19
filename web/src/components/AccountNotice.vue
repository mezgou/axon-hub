<script setup>
import { nextTick } from 'vue';
import { accountNotice, dismissAccountNotice } from '../composables/useSession.js';
async function dismiss() {
  dismissAccountNotice();
  await nextTick();
  document.querySelector('main h1')?.focus({ preventScroll: true });
}
</script>
<template>
  <div
    v-if="accountNotice"
    class="axon-account-notice"
    :class="`axon-account-notice--${accountNotice.tone}`"
  >
    <p :role="accountNotice.tone === 'error' ? 'alert' : 'status'" aria-atomic="true">
      {{ accountNotice.message }}
    </p>
    <button
      type="button"
      class="btn btn-outline-primary"
      aria-label="Dismiss account notification"
      @click="dismiss"
    >
      Dismiss
    </button>
  </div>
</template>
