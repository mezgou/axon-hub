<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getResource, forkResource } from '../services/resources.js';
import { displayLabel, displaySize } from '../services/filters.js';
import { useLoad } from '../composables/useLoad.js';
import { session } from '../composables/useSession.js';
import ResourceActions from '../components/ResourceActions.vue';
import DiscussionList from '../components/DiscussionList.vue';
import Icon from '../components/Icon.vue';
const route = useRoute();
const router = useRouter();
const id = Number(route.params.id);
const {
  data: resource,
  loading,
  error,
  reload,
} = useLoad(async () => {
  if (!/^[1-9]\d*$/.test(route.params.id))
    throw Object.assign(new Error('Resource not found.'), { status: 404 });
  return getResource(id);
});
watch(resource, (value) => {
  if (value) document.title = `${value.name} · AxonHub`;
});
const forkPending = ref(false);
const forkError = ref('');
const manifest = `${import.meta.env.BASE_URL}assets/demo/resource-manifest.json`;
async function fork() {
  if (forkPending.value || !session.value || !resource.value) return;
  forkPending.value = true;
  forkError.value = '';
  try {
    const created = await forkResource(resource.value, session.value.user);
    await router.push(`/resources/${created.id}`);
  } catch (cause) {
    forkError.value = cause.message;
  } finally {
    forkPending.value = false;
  }
}
</script>
<template>
  <RouterLink to="/explore">← Back to Explore</RouterLink>
  <h1 tabindex="-1">
    {{ resource?.name || (error?.status === 404 ? 'Resource not found' : 'Resource details') }}
  </h1>
  <p v-if="loading" role="status">Loading resource…</p>
  <div v-if="error" role="alert">
    <p>{{ error.status === 404 ? 'This resource does not exist.' : error.message }}</p>
    <button v-if="error.status !== 404" class="btn btn-outline-primary" @click="reload">
      Retry resource
    </button>
  </div>
  <template v-else-if="resource">
    <p class="axon-resource-owner">
      <span
        class="axon-resource-type"
        :class="{ 'axon-resource-type--dataset': resource.type === 'dataset' }"
        >{{ resource.type === 'dataset' ? 'Dataset' : 'Model' }}</span
      ><Icon name="person" />{{ resource.authorName }}
    </p>
    <p>{{ resource.summary }}</p>
    <p v-if="resource.sourceResourceId">
      Forked from
      <RouterLink :to="`/resources/${resource.sourceResourceId}`"
        >source resource #{{ resource.sourceResourceId }}</RouterLink
      >
    </p>
    <section aria-label="Resource actions">
      <ResourceActions :resource-id="id" />
    </section>
    <div class="axon-detail-grid">
      <aside class="axon-panel">
        <h2>Resource information</h2>
        <dl>
          <template v-for="key in ['task', 'framework', 'license']" :key="key"
            ><dt class="text-capitalize">{{ key }}</dt>
            <dd>{{ displayLabel(key, resource[key]) }}</dd></template
          >
          <dt>Size</dt>
          <dd>{{ displaySize(resource.sizeBytes) }}</dd>
          <dt>Version</dt>
          <dd>{{ resource.revision }}</dd>
        </dl>
        <p v-if="resource.tags?.length">Tags: {{ resource.tags.join(', ') }}</p>
      </aside>
      <div class="axon-panel">
        <section>
          <h2>Overview</h2>
          <p>{{ resource.description }}</p>
        </section>
        <section>
          <h2>Demo metrics</h2>
          <dl>
            <template v-for="(metric, index) in resource.metrics" :key="index"
              ><dt>{{ metric.label }}</dt>
              <dd>{{ metric.value ?? 'Not available' }} {{ metric.unit }}</dd></template
            >
          </dl>
          <p class="small">Illustrative values only; no evaluation has been run by AxonHub.</p>
        </section>
        <section>
          <h2>Usage example</h2>
          <p>This example is for reference. No code is executed by AxonHub.</p>
          <pre
            tabindex="0"
            aria-label="Usage example"
          ><code>{{ resource.usageExample }}</code></pre>
        </section>
        <section>
          <h2>Reproducibility</h2>
          <details>
            <summary>Reproducibility details</summary>
            <p>Version: {{ resource.revision }}</p>
            <p>Environment: {{ resource.reproducibility.environment }}</p>
            <p>Seed: {{ resource.reproducibility.seed ?? 'Not specified' }}</p>
            <ol>
              <li v-for="(step, index) in resource.reproducibility.steps" :key="index">
                {{ step }}
              </li>
            </ol>
          </details>
        </section>
        <section>
          <h2>Fork metadata</h2>
          <p>
            Create a public metadata copy in your library. Files, stars, subscriptions and comments
            are not copied.
          </p>
          <button
            v-if="session"
            class="btn btn-outline-primary"
            :disabled="forkPending"
            @click="fork"
          >
            {{ forkPending ? 'Opening fork…' : 'Fork metadata' }}
          </button>
          <RouterLink v-else :to="{ path: '/login', query: { returnTo: route.fullPath } }"
            >Log in to fork</RouterLink
          >
          <p role="alert">{{ forkError }}</p>
        </section>
        <DiscussionList :resource-id="id" />
        <section>
          <h2>Download information</h2>
          <p>Demo downloads: {{ resource.downloadCount }}</p>
          <p>The JSON contains shared sample metadata, not model weights or a full dataset.</p>
          <a class="btn btn-primary" :href="manifest" download="axonhub-demo-manifest.json"
            ><Icon name="download" />Download demo manifest</a
          >
        </section>
      </div>
    </div>
  </template>
</template>
