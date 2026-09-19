<script setup>
import { reactive, watch } from 'vue';
import { filterOptions, readFilters } from '../services/filters.js';
import Icon from './Icon.vue';
const props = defineProps({ filters: { type: Object, required: true } });
const emit = defineEmits(['apply']);
const draft = reactive(readFilters(props.filters));
watch(
  () => props.filters,
  (value) => Object.assign(draft, readFilters(value)),
  { deep: true },
);
function reset() {
  Object.assign(draft, readFilters({}));
  emit('apply', { ...draft });
}
</script>
<template>
  <form
    class="axon-filter-form"
    role="search"
    aria-label="Resource filters"
    @submit.prevent="emit('apply', { ...draft })"
  >
    <div class="axon-search">
      <div>
        <label class="form-label" for="resource-query">Search resources</label>
        <input
          id="resource-query"
          v-model="draft.q"
          type="search"
          class="form-control"
          placeholder="Search by name, description or tag"
          aria-controls="resource-results"
        />
      </div>
      <button class="btn btn-primary" type="submit"><Icon name="search" />Apply filters</button>
      <button class="btn btn-outline-primary" type="button" @click="reset">Reset</button>
    </div>
    <details class="axon-filter-panel" open>
      <summary><Icon name="sliders" /> Filters</summary>
      <div class="axon-filter-grid">
        <div v-for="(options, key) in filterOptions" :key="key">
          <label class="form-label text-capitalize" :for="`filter-${key}`">{{ key }}</label>
          <select :id="`filter-${key}`" v-model="draft[key]" class="form-select">
            <option value="">
              All
              {{
                key === 'type'
                  ? 'types'
                  : key === 'size'
                    ? 'sizes'
                    : key === 'license'
                      ? 'licenses'
                      : key === 'task'
                        ? 'tasks'
                        : 'frameworks'
              }}
            </option>
            <option v-for="[value, label] in options" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </div>
      </div>
    </details>
  </form>
</template>
