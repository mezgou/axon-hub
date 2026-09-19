<script setup>
import { nextTick, ref, watch } from 'vue';
import { accountNotice, dismissAccountNotice } from '../composables/useSession.js';
const remaining = ref(3);
const version = ref(0);
watch(
  accountNotice,
  (notice, previous, onCleanup) => {
    version.value++;
    remaining.value = 3;
    if (!notice || notice.tone === 'error') return;
    const started = Date.now();
    const countdown = setInterval(() => {
      remaining.value = Math.max(1, Math.ceil((3000 - (Date.now() - started)) / 1000));
    }, 1000);
    const timeout = setTimeout(() => {
      // Automatic dismissal must not move focus away from the user's current field.
      if (accountNotice.value === notice) dismissAccountNotice();
    }, 3000);
    onCleanup(() => {
      clearInterval(countdown);
      clearTimeout(timeout);
    });
  },
  { immediate: true },
);
async function dismiss() {
  dismissAccountNotice();
  await nextTick();
  document.querySelector('main h1')?.focus({ preventScroll: true });
}
</script>
<template>
  <Transition name="axon-notice" appear>
    <div v-if="accountNotice" :key="version" class="axon-notice-slot">
      <div class="axon-notice-clip">
        <div
          class="axon-account-notice"
          :class="[
            `axon-account-notice--${accountNotice.tone}`,
            { 'axon-account-notice--timed': accountNotice.tone !== 'error' },
          ]"
        >
          <p :role="accountNotice.tone === 'error' ? 'alert' : 'status'" aria-atomic="true">
            {{ accountNotice.message }}
          </p>
          <span
            v-if="accountNotice.tone !== 'error'"
            class="axon-notice-countdown"
            aria-hidden="true"
            >{{ remaining }}s</span
          >
          <button
            v-else
            type="button"
            class="btn btn-outline-primary"
            aria-label="Dismiss account notification"
            @click="dismiss"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
