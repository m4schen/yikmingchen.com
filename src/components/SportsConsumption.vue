<script setup lang="ts">
import type { Athlete, Coach, SportType } from '../../data/sports'
import { sports } from '../../data/sports'

const route = useRoute()

const type = computed<SportType>(() => route.query.type as SportType || 'athlete')

// Type guard: 检查是否有 team 属性
function hasTeam(record: any): record is Athlete | Coach {
  return 'team' in record
}
</script>

<template>
  <div font-mono>
    <div flex="~ gap-2">
      <RouterLink
        v-for="t of Object.keys(sports)"
        :key="t"
        :to="{ query: { type: t } }"
        px-2
        class="no-underline!"
        :class="type === t ? 'bg-black dark:bg-white text-white! dark:text-black!' : ''"
      >
        {{ t }}
      </RouterLink>
    </div>

    <template v-for="t of Object.keys(sports)" :key="t">
      <table v-show="type === t" font-400>
        <tbody>
          <template v-for="s of sports[type]" :key="s.name">
            <tr>
              <td>
                <a v-if="s.link" :href="s.link" target="_blank" rel="noopener noreferrer">
                  {{ s.name }}
                </a>
                <span v-else>{{ s.name }}</span>
              </td>
              <td text-right>
                {{ s.sport }}
              </td>
              <td v-if="hasTeam(s)" lt-sm:hidden>
                {{ s.team }}
              </td>
              <td v-if="s.note" lt-sm:hidden>
                {{ s.note }}
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </template>
  </div>
</template>
