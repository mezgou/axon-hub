<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { login, register } from '../services/auth.js';
import { saveSession, getReturnPath } from '../composables/useSession.js';
const props = defineProps({ registration: Boolean });
const route = useRoute();
const router = useRouter();
const email = ref('');
const password = ref('');
const displayName = ref('');
const pending = ref(false);
const error = ref('');
const nameError = ref('');
const nameInput = ref(null);
const submitLabel = computed(() => (props.registration ? 'Create account' : 'Log in'));
async function submit() {
  if (pending.value) return;
  error.value = '';
  nameError.value = '';
  if (props.registration && !displayName.value.trim()) {
    nameError.value = 'Enter your display name.';
    nameInput.value.focus();
    return;
  }
  pending.value = true;
  try {
    const result = props.registration
      ? await register(email.value.trim(), password.value, displayName.value.trim())
      : await login(email.value.trim(), password.value);
    saveSession(result);
    password.value = '';
    await router.replace(props.registration ? '/profile' : getReturnPath(route.query.returnTo));
  } catch (cause) {
    error.value =
      cause.status === 409
        ? 'This email is already registered.'
        : [400, 401].includes(cause.status)
          ? 'Check your email and password.'
          : cause.message;
  } finally {
    pending.value = false;
  }
}
</script>
<template>
  <form class="axon-auth-form" @submit.prevent="submit" :aria-busy="pending">
    <div v-if="registration" class="mb-3">
      <label class="form-label" for="display-name">Display name</label>
      <input
        id="display-name"
        ref="nameInput"
        v-model="displayName"
        class="form-control"
        required
        maxlength="60"
        autocomplete="nickname"
        :aria-invalid="!!nameError"
        aria-describedby="name-error"
      />
      <p id="name-error" class="axon-error">{{ nameError }}</p>
    </div>
    <div class="mb-3">
      <label class="form-label" for="email">Email</label
      ><input
        id="email"
        v-model="email"
        class="form-control"
        type="email"
        required
        autocomplete="email"
      />
    </div>
    <div class="mb-3">
      <label class="form-label" for="password">Password</label
      ><input
        id="password"
        v-model="password"
        class="form-control"
        type="password"
        required
        minlength="8"
        :autocomplete="registration ? 'new-password' : 'current-password'"
        aria-describedby="password-hint"
      />
      <p id="password-hint" class="form-text">At least 8 characters. Use demo credentials only.</p>
    </div>
    <p role="alert" class="axon-error">{{ error }}</p>
    <button class="btn btn-primary" :disabled="pending">
      {{ pending ? 'Please wait…' : submitLabel }}
    </button>
  </form>
</template>
