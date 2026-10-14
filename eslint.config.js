// @ts-check
/* eslint perfectionist/sort-objects: "error" */
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    formatters: true,
    markdown: {
      overrides: {
      },
    },
    pnpm: true,
  },
  {
    // Removed for speed (docs/feature-map.md#performance); the message tells an agent why
    rules: {
      'no-restricted-imports': ['error', {
        paths: [
          { message: 'Removed: it cost ~490 kB and pinned a CPU core. Draw on a 2D canvas like src/components/ArtDots.vue.', name: 'pixi.js' },
          { message: 'Removed: 47 kB on every page. Use a native title attribute or <details>.', name: 'floating-vue' },
          { message: 'Removed: no global store is needed. Share state from src/logics/index.ts.', name: 'pinia' },
          { message: 'Deprecated path. Import from "vue-router".', name: 'vue-router/auto' },
        ],
      }],
    },
  },
).removeRules(
  'no-labels',
  'no-lone-blocks',
  'no-restricted-syntax',
  'node/prefer-global/buffer',
  'node/prefer-global/process',
  'prefer-rest-params',
  'symbol-description',
  'ts/ban-types',
  'ts/no-empty-object-type',
  'ts/no-invalid-this',
  'ts/no-unnecessary-type-constraint',
  'vue/no-template-shadow',
  'vue/no-v-text-v-html-on-component',
)
