<script setup>
import { useRoute } from 'vue-router';
import { session } from '../composables/useSession.js';
import { useResourceActions } from '../composables/useResourceActions.js';
import Icon from './Icon.vue';
const props = defineProps({ resourceId: { type: Number, required: true } });
const emit = defineEmits(['changed']);
const route = useRoute();
const { state, starred, subscribed, count, refresh, toggleStar, toggleSubscription } =
  useResourceActions(() => props.resourceId);
async function subscribe() {
  await toggleSubscription();
  emit('changed');
}
</script>
<template>
  <div class="axon-actions">
    <div class="axon-action-buttons">
      <button
        type="button"
        class="btn btn-outline-primary"
        aria-label="Star"
        :aria-pressed="starred"
        :disabled="!session || !state.loaded || state.starPending || state.loading"
        @click="toggleStar"
      >
        <Icon
          :name="starred ? 'star-fill' : 'star'"
          :class="{ 'axon-star-selected': starred }"
        />Star
      </button>
      <span>Stars: {{ count }}</span>
      <button
        type="button"
        class="btn btn-outline-primary"
        aria-label="Subscribe"
        :aria-pressed="subscribed"
        :disabled="!session || !state.loaded || state.subscriptionPending || state.loading"
        @click="subscribe"
      >
        <Icon name="bell" />{{ subscribed ? 'Subscribed' : 'Subscribe' }}
      </button>
    </div>
    <p v-if="!session" class="small">
      <RouterLink :to="{ path: '/login', query: { returnTo: route.fullPath } }"
        >Log in to star or subscribe</RouterLink
      >
    </p>
    <p v-if="state.error" role="alert">
      {{ state.error }}
      <button class="btn btn-outline-primary" :disabled="state.loading" @click="refresh">
        Reload actions
      </button>
    </p>
    <p class="small" role="status">{{ state.loading ? 'Loading actions…' : state.message }}</p>
  </div>
</template>
