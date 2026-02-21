---
tags:
  - Vue
  - 前端工程化
  - Typescript
title: Anthony Fu 的 Vue3 开发规范完整解读
description: 基于 antfu/skills 仓库整理翻译的 Vue 3 开发规范中文文档，涵盖 Anthony Fu 编码偏好、Vue 3 核心 API 规范、最佳实践与常见陷阱、以及为什么选择 UnoCSS 而非 Tailwind CSS
dateCreated: 2026-02-11T12:00:00+08:00
dateModified: 2026-02-11T12:00:00+08:00
isPub: true
---

  

# Anthony Fu 的 Vue3 开发规范完整解读

  

本文基于 [antfu/skills](https://github.com/antfu/skills) 仓库整理翻译，全面解析 Anthony Fu 在 Vue 3 生态中的编码规范、最佳实践和工具链推荐。作为 Vue 核心团队成员、Vite 团队成员以及众多开源项目的作者（VueUse、UnoCSS、Vitest、Slidev 等），Anthony 的开发理念深刻影响了现代 Vue 开发生态。

  

## 第一部分：编码实践与工具链

  

### 代码组织原则

  

**单一职责原则**

  

保持文件和函数专注于单一职责。当文件超过 200-300 行时，考虑拆分：

  

```ts

// ❌ 避免：一个文件包含所有逻辑

// UserManager.ts (800 lines)

export class UserManager {

  validateUser() { /* 50 lines */ }

  fetchUserData() { /* 100 lines */ }

  updateUserProfile() { /* 150 lines */ }

  // ...

}

  

// ✅ 推荐：按职责拆分

// validation.ts

export function validateUser(user: User) { /* ... */ }

  

// api.ts

export function fetchUserData(id: string) { /* ... */ }

  

// profile.ts

export function updateUserProfile(data: ProfileData) { /* ... */ }

```

  

**类型与常量分离**

  

```ts

// types.ts

export interface User {

  id: string

  name: string

  role: UserRole

}

  

export type UserRole = 'admin' | 'user' | 'guest'

  

// constants.ts

export const DEFAULT_PAGE_SIZE = 20

export const MAX_RETRIES = 3

export const API_ENDPOINTS = {

  users: '/api/users',

  posts: '/api/posts',

} as const

  

// user-service.ts

import type { User, UserRole } from './types'

import { API_ENDPOINTS } from './constants'

  

export async function fetchUsers(): Promise<User[]> {

  const response = await fetch(API_ENDPOINTS.users)

  return response.json()

}

```

  

### 运行时环境标注

  

编写同构代码时，为环境特定的代码添加明确的注释：

  

```ts

// ✅ 明确标注环境依赖

// @env browser

export function getWindowSize() {

  return {

    width: window.innerWidth,

    height: window.innerHeight,

  }

}

  

// @env node

export function readConfigFile() {

  return fs.readFileSync('./config.json', 'utf-8')

}

  

// ✅ 同构代码无需标注

export function formatDate(date: Date): string {

  return date.toISOString()

}

```

  

### TypeScript 最佳实践

  

**显式返回类型**

  

```ts

// ❌ 避免：隐式返回类型

export function calculateTotal(items) {

  return items.reduce((sum, item) => sum + item.price, 0)

}

  

// ✅ 推荐：显式返回类型

export function calculateTotal(items: Item[]): number {

  return items.reduce((sum, item) => sum + item.price, 0)

}

  

// ✅ 复杂类型提取为类型别名

export type AsyncResult<T> = Promise<{ data: T; error: null } | { data: null; error: Error }>

  

export function fetchData<T>(url: string): AsyncResult<T> {

  // ...

}

```

  

**避免复杂内联类型**

  

```ts

// ❌ 避免：复杂内联类型

function processUsers(

  users: Array<{

    id: string

    profile: {

      name: string

      email: string

      settings: {

        theme: 'light' | 'dark'

        notifications: boolean

      }

    }

  }>

) {

  // ...

}

  

// ✅ 推荐：提取类型定义

interface UserSettings {

  theme: 'light' | 'dark'

  notifications: boolean

}

  

interface UserProfile {

  name: string

  email: string

  settings: UserSettings

}

  

interface User {

  id: string

  profile: UserProfile

}

  

function processUsers(users: User[]) {

  // ...

}

```

  

### 注释哲学

  

**解释"为什么"而非"怎么做"**

  

```ts

// ❌ 避免：无意义的注释

// 循环遍历用户数组

users.forEach(user => {

  // 打印用户名

  console.log(user.name)

})

  

// ✅ 推荐：解释为什么这样做

// 使用 setTimeout 0 延迟执行，确保 DOM 更新完成后再计算高度

setTimeout(() => {

  const height = element.offsetHeight

}, 0)

  

// ✅ 解释非直观的业务逻辑

// 价格计算需要先扣除折扣，再加税费，顺序不能颠倒

// 因为税费基于折后价计算（符合当地税法要求）

const finalPrice = (price - discount) * (1 + taxRate)

```

  

### 测试规范（Vitest）

  

**文件组织**

  

```bash

src/

  utils/

    format.ts          # 源代码

    format.test.ts     # 测试文件

  components/

    Button.vue

    Button.test.ts

```

  

**测试结构**

  

```ts

// format.test.ts

import { describe, it, expect } from 'vitest'

import { formatCurrency, formatDate } from './format'

  

describe('formatCurrency', () => {

  it('should format USD correctly', () => {

    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56')

  })

  

  it('should handle zero', () => {

    expect(formatCurrency(0, 'USD')).toBe('$0.00')

  })

  

  it('should round to 2 decimal places', () => {

    expect(formatCurrency(1.234, 'USD')).toBe('$1.23')

  })

})

  

describe('formatDate', () => {

  it('should match snapshot', () => {

    const date = new Date('2024-01-15T10:30:00Z')

    expect(formatDate(date)).toMatchSnapshot()

  })

})

```

  

### 工具链速查

  

#### @antfu/ni - 通用包管理器命令

  

| 命令 | npm | yarn | pnpm | bun |

|------|-----|------|------|-----|

| `ni` | `npm install` | `yarn install` | `pnpm install` | `bun install` |

| `nr dev` | `npm run dev` | `yarn run dev` | `pnpm run dev` | `bun run dev` |

| `nu` | `npm update` | `yarn upgrade` | `pnpm update` | `bun update` |

| `nun lodash` | `npm uninstall lodash` | `yarn remove lodash` | `pnpm remove lodash` | `bun remove lodash` |

| `nci` | `npm ci` | `yarn install --frozen-lockfile` | `pnpm install --frozen-lockfile` | `bun install --frozen-lockfile` |

| `nlx vitest` | `npx vitest` | `yarn dlx vitest` | `pnpm dlx vitest` | `bunx vitest` |

  

#### TypeScript 配置标准

  

```json

{

  "compilerOptions": {

    "target": "ESNext",

    "module": "ESNext",

    "moduleResolution": "bundler",

    "lib": ["ESNext", "DOM", "DOM.Iterable"],

    "jsx": "preserve",

    "strict": true,

    "skipLibCheck": true,

    "resolveJsonModule": true,

    "esModuleInterop": true,

    "isolatedModules": true,

    "noUncheckedIndexedAccess": true,

    "paths": {

      "~/*": ["./src/*"]

    }

  }

}

```

  

**关键配置说明：**

  

- `moduleResolution: "bundler"` - 适配 Vite/Rollup 等现代打包工具

- `noUncheckedIndexedAccess: true` - 索引访问返回 `T | undefined`，更安全

- `strict: true` - 启用所有严格类型检查

  

#### ESLint 配置

  

```bash

# 安装

pnpm add -D @antfu/eslint-config eslint

  

# 运行

pnpm run lint --fix

```

  

```ts

// eslint.config.js

import antfu from '@antfu/eslint-config'

  

export default antfu({

  vue: true,

  typescript: true,

  formatters: {

    css: true,

    html: true,

    markdown: true,

  },

})

```

  

#### Git Hooks 配置

  

```bash

# 安装

pnpm add -D simple-git-hooks lint-staged

```

  

```json

// package.json

{

  "simple-git-hooks": {

    "pre-commit": "pnpm lint-staged"

  },

  "lint-staged": {

    "*.{js,ts,vue}": "eslint --fix"

  }

}

```

  

#### pnpm Catalogs 最佳实践

  

```yaml

# pnpm-workspace.yaml

catalogs:

  # 生产依赖

  prod:

    vue: ^3.5.0

    pinia: ^2.2.0

  # 内联依赖（会被打包）

  inlined:

    lodash-es: ^4.17.21

  # 开发依赖

  dev:

    vitest: ^2.0.0

    typescript: ^5.6.0

  # 前端特定依赖

  frontend:

    unocss: ^0.63.0

```

  

```json

// package.json

{

  "dependencies": {

    "vue": "catalog:prod",

    "lodash-es": "catalog:inlined"

  },

  "devDependencies": {

    "vitest": "catalog:dev",

    "unocss": "catalog:frontend"

  }

}

```

  

---

  

## 第二部分：Vue 3 核心规范

  

> 基于 Vue 3.5，优先使用 TypeScript 和 `<script setup>`

  

### 偏好设定

  

| 场景 | 推荐方案 | 原因 |

|------|----------|------|

| 语言选择 | TypeScript | 类型安全、更好的 IDE 支持 |

| 脚本格式 | `<script setup lang="ts">` | 更简洁的语法、更好的性能 |

| 响应式选择 | `shallowRef` > `ref` | 大多数场景足够用，性能更好 |

| API 风格 | Composition API | 更好的逻辑复用和类型推导 |

| Props 解构 | ❌ 不推荐 | 会丢失响应式 |

  

### 标准组件模板

  

```vue

<script setup lang="ts">

import { computed, ref, watch, onMounted } from 'vue'

import type { ComponentPublicInstance } from 'vue'

  

// Props 定义

interface Props {

  title: string

  count?: number

  disabled?: boolean

}

  

const props = withDefaults(defineProps<Props>(), {

  count: 0,

  disabled: false,

})

  

// Emits 定义

interface Emits {

  update: [value: number]

  submit: [data: { name: string }]

}

  

const emit = defineEmits<Emits>()

  

// Model 双向绑定

const modelValue = defineModel<string>({ required: true })

  

// 响应式状态

const isLoading = ref(false)

const items = ref<Item[]>([])

  

// 计算属性

const displayTitle = computed(() => {

  return props.disabled ? `${props.title} (已禁用)` : props.title

})

  

// 侦听器

watch(() => props.count, (newVal, oldVal) => {

  console.log(`Count changed from ${oldVal} to ${newVal}`)

})

  

// 生命周期

onMounted(() => {

  console.log('Component mounted')

})

  

// 方法

function handleClick() {

  emit('update', props.count + 1)

}

  

// 暴露给父组件（defineExpose）

defineExpose({

  focus: () => {

    // 暴露的方法

  },

})

</script>

  

<template>

  <div>

    <h1>{{ displayTitle }}</h1>

    <button @click="handleClick" :disabled="disabled">

      Count: {{ count }}

    </button>

  </div>

</template>

  

<style scoped>

/* scoped 样式 */

</style>

```

  

### 关键导入速查

  

```ts

// 核心响应式 API

import {

  ref,           // 深层响应式

  shallowRef,    // 浅层响应式（推荐）

  reactive,      // 深层响应式对象

  shallowReactive, // 浅层响应式对象

  readonly,      // 只读代理

  computed,      // 计算属性

  watch,         // 侦听器

  watchEffect,   // 副作用侦听器

} from 'vue'

  

// 生命周期钩子

import {

  onMounted,

  onUpdated,

  onUnmounted,

  onBeforeMount,

  onBeforeUpdate,

  onBeforeUnmount,

} from 'vue'

  

// 组件通信

import {

  defineProps,

  defineEmits,

  defineModel,

  defineExpose,

  defineSlots,

  provide,

  inject,

} from 'vue'

  

// 工具函数

import {

  nextTick,      // 等待 DOM 更新

  toRef,         // 转换为 ref

  toRefs,        // 解构保持响应式

  unref,         // 解包 ref

  isRef,         // 判断是否 ref

  markRaw,       // 标记为非响应式

} from 'vue'

  

// 类型工具

import type {

  Ref,

  ComputedRef,

  ComponentPublicInstance,

  PropType,

} from 'vue'

```

  

### ref vs shallowRef 性能对比

  

```ts

// ref - 深层响应式（递归代理所有层级）

const deepState = ref({

  user: {

    profile: {

      name: 'John',

      settings: {

        theme: 'dark',

      },

    },

  },

})

  

// 任何层级的修改都会触发响应

deepState.value.user.profile.settings.theme = 'light' // ✅ 响应式

  

// shallowRef - 浅层响应式（只代理第一层）

const shallowState = shallowRef({

  user: {

    profile: {

      name: 'John',

      settings: {

        theme: 'dark',

      },

    },

  },

})

  

// 只有整体替换才会触发响应

shallowState.value.user.profile.settings.theme = 'light' // ❌ 不会触发

shallowState.value = { ...shallowState.value } // ✅ 触发响应

  

// 性能建议：大部分场景使用 shallowRef 足够

```

  

---

  

## 第三部分：Vue 3 最佳实践与常见陷阱

  

### 响应式系统

  

| 问题 | 建议 |

|------|------|

| ref vs reactive 如何选择？ | 优先使用 `ref`。`ref` 可以存储任何类型，而 `reactive` 只能用于对象。`ref` 在重新赋值时保持响应性，`reactive` 不行。 |

| 什么时候用 shallowRef？ | 存储大型数据结构（如长列表、复杂嵌套对象）时，用 `shallowRef` 避免深层代理的性能开销。更新时需要整体替换对象。 |

| 如何阻止对象变成响应式？ | 使用 `markRaw()`。例如存储第三方库实例（Chart.js、Monaco Editor）时，避免不必要的代理。 |

| 多次修改 ref 会触发多次渲染吗？ | 不会。Vue 会将同一 tick 内的更新批量处理。如需立即看到 DOM 变化，使用 `await nextTick()`。 |

| ref 解包规则是什么？ | 在模板中自动解包（`{{ count }}`）。在 `reactive` 对象中自动解包（`state.count`）。在数组和 Map/Set 中不解包（需要 `.value`）。 |

| 解构 props 会丢失响应性吗？ | 是的。使用 `toRefs(props)` 或 `toRef(props, 'key')` 保持响应性，或在 computed/watch 中访问 `props.xxx`。 |

  

### 计算属性

  

| 问题 | 建议 |

|------|------|

| 计算属性可以有副作用吗？ | 不应该。计算属性应该是纯函数，只做计算和返回值。副作用应该放在 `watch` 或 `watchEffect` 中。 |

| 为什么计算属性是只读的？ | 默认只读，但可以提供 setter。推荐只读设计，修改应通过源数据。 |

| 计算属性什么时候重新计算？ | 只有当依赖的响应式数据变化时才重新计算（懒执行 + 缓存）。这是相比 `method` 的主要优势。 |

| 计算属性的条件依赖如何工作？ | 只追踪当前执行分支的依赖。`if (flag) return a` 时只追踪 `flag` 和 `a`，不追踪 `else` 分支。 |

| 计算属性内使用 array.map 有性能问题吗？ | 有。每次重新计算都会创建新数组。考虑使用 `shallowRef` 存储映射结果，或在 `watch` 中手动更新。 |

  

### 侦听器

  

| 问题 | 建议 |

|------|------|

| watch 的 getter 函数是什么？ | `watch(() => obj.count, ...)` 中的箭头函数。推荐用 getter 而非直接传对象，可以精确控制依赖。 |

| deep: true 有性能问题吗？ | 有。深度侦听需要遍历对象的所有属性。只在必要时使用，或用 getter 函数精确指定依赖。 |

| immediate: true 的执行时机是什么？ | 立即执行一次，此时 DOM 可能未挂载。需要访问 DOM 时注意判断。 |

| flush 选项有什么区别？ | `pre`（默认）：DOM 更新前执行。`post`：DOM 更新后执行。`sync`：同步执行（避免使用）。 |

| 如何在侦听器中访问旧值？ | `watch(source, (newVal, oldVal) => {})`。注意对象类型的 `oldVal` 和 `newVal` 可能指向同一个引用。 |

| watch vs watchEffect 如何选择？ | `watchEffect`：自动追踪依赖，简洁。`watch`：显式指定侦听源，可访问旧值，更精确。 |

  

### 组件通信

  

| 问题 | 建议 |

|------|------|

| 可以修改 props 吗？ | 不可以。Props 是单向数据流，只读。需要修改时，emit 事件或使用 `defineModel`。 |

| 自定义事件会冒泡吗？ | 不会。Vue 的自定义事件不像原生 DOM 事件那样冒泡，只触发直接父组件的监听器。 |

| 组件名应该用什么格式？ | PascalCase（`MyComponent.vue`）。在模板中可以用 `<MyComponent>` 或 `<my-component>`，推荐前者。 |

| defineExpose 何时使用？ | 当需要父组件通过 ref 调用子组件方法时。默认 `<script setup>` 不暴露任何内容。 |

| 如何获取组件实例的类型？ | `InstanceType<typeof MyComponent>`，配合 `ref<InstanceType<typeof MyComponent>>()`。 |

  

### Props 与 Emits

  

| 问题 | 建议 |

|------|------|

| Boolean props 的转换规则？ | `<MyComp disabled>` 等价于 `:disabled="true"`。`<MyComp>` 则是 `undefined`（除非有默认值）。 |

| 解构 props 会丢失响应性吗？ | 是的。`const { title } = defineProps()` 会丢失响应性。使用 `toRefs` 或直接访问 `props.title`。 |

| props 命名约定是什么？ | JS 中用 camelCase，HTML 中用 kebab-case。`defineProps<{ userName: string }>()` → `<Comp user-name="John">`。 |

| emit 事件命名约定？ | JS 中用 camelCase，HTML 中用 kebab-case。`emit('updateValue')` → `@update-value="handler"`。 |

| defineModel 的优势是什么？ | 简化 `v-model` 实现，自动生成 prop 和 emit。支持修饰符（`.trim`、`.number` 等）。 |

  

### 模板语法

  

| 问题 | 建议 |

|------|------|

| v-html 安全吗？ | 不安全。可能导致 XSS 攻击。只用于可信内容，或使用 DOMPurify 等库清理。 |

| v-if 和 v-for 能同时用吗？ | Vue 3 中 `v-if` 优先级高于 `v-for`，但不推荐同时使用。应该用 computed 过滤或嵌套 template。 |

| v-if vs v-show 如何选择？ | `v-if`：条件渲染，切换开销高。`v-show`：CSS 切换，初始渲染开销高。频繁切换用 `v-show`。 |

| key 的作用是什么？ | 帮助 Vue 识别节点，优化 diff 算法。列表渲染必须提供唯一 key，避免用 index。 |

| 如何绑定多个属性？ | `v-bind="attrs"` 可以一次性绑定对象的所有属性。例如 `v-bind="{ id: 'foo', class: 'bar' }"`。 |

  

### 表单与 v-model

  

| 问题 | 建议 |

|------|------|

| defineModel 的修饰符如何使用？ | 内置 `.trim`、`.number`、`.lazy`。自定义修饰符通过 `defineModel` 的第二个参数处理。 |

| v-model 在组件上的原理？ | 语法糖：`:modelValue="value" @update:modelValue="value = $event"`。多个 v-model：`v-model:title`。 |

| 如何在 v-model 更新后访问 DOM？ | 使用 `await nextTick()`，因为 Vue 异步更新 DOM。 |

| textarea 的 v-model 和插值的区别？ | `<textarea v-model="text">` 正确。`<textarea>{{ text }}</textarea>` 不生效，textarea 不支持插值。 |

  

### 事件处理与修饰符

  

| 问题 | 建议 |

|------|------|

| .once 修饰符如何工作？ | 事件只触发一次后自动移除监听器。`@click.once="handler"`。 |

| .exact 修饰符的作用？ | 精确匹配修饰键。`@click.ctrl.exact` 只在按下 Ctrl（无其他键）时触发。 |

| .passive 和 .prevent 冲突吗？ | 冲突。`.passive` 告诉浏览器不调用 `preventDefault()`，两者不能同时使用。 |

| 自定义事件可以用修饰符吗？ | 可以，但需要在子组件中通过 `defineEmits` 的第二个参数手动实现验证逻辑。 |

  

### 生命周期

  

| 问题 | 建议 |

|------|------|

| 生命周期钩子必须同步注册吗？ | 是的。必须在 `setup` 或 `<script setup>` 的同步代码中调用，不能在 `setTimeout` 或 `async` 函数中。 |

| onUpdated 钩子性能如何？ | 会在任何响应式数据变化导致的重新渲染后调用，可能频繁触发。谨慎使用，考虑用 `watch` 替代。 |

| 如何在组件外部注册生命周期？ | 使用 `effectScope` 创建作用域，在其中注册钩子。 |

  

### 插槽

  

| 问题 | 建议 |

|------|------|

| 插槽的作用域是什么？ | 默认插槽只能访问父组件的数据。作用域插槽通过 `v-slot="slotProps"` 接收子组件传递的数据。 |

| defineSlots 的作用？ | 仅用于类型定义，帮助 TypeScript 推导插槽的 props 类型。不影响运行时。 |

| 插槽的 fallback content 是什么？ | `<slot>默认内容</slot>` 中的默认内容，当父组件不提供插槽内容时显示。 |

| 动态插槽名如何使用？ | `v-slot:[dynamicSlotName]` 或 `#[dynamicSlotName]`。 |

  

### Provide / Inject

  

| 问题 | 建议 |

|------|------|

| 应该用什么作为 injection key？ | 使用 Symbol 而非字符串，避免命名冲突。`export const userKey = Symbol('user')`。 |

| 注入的数据可以修改吗？ | 可以，但建议 mutations 集中在 provider 组件，通过提供修改方法而非直接暴露响应式状态。 |

| 如何为 inject 提供类型？ | `const user = inject<User>(userKey)` 或在定义 key 时指定 `InjectionKey<User>`。 |

  

### 组合式函数

  

| 问题 | 建议 |

|------|------|

| 命名约定是什么？ | 以 `use` 开头，camelCase。例如 `useMouse`、`useFetch`。 |

| 返回值应该是什么？ | 返回包含响应式状态和方法的对象。使用 `readonly()` 保护内部状态。 |

| 何时使用 options 对象模式？ | 参数超过 2 个时推荐。`useFetch(url, { method, headers, onSuccess })`。 |

| 组合式函数可以嵌套调用吗？ | 可以。一个组合式函数可以调用其他组合式函数。 |

  

```ts

// 示例：标准组合式函数

export function useMouse() {

  const x = ref(0)

  const y = ref(0)

  

  function update(event: MouseEvent) {

    x.value = event.clientX

    y.value = event.clientY

  }

  

  onMounted(() => window.addEventListener('mousemove', update))

  onUnmounted(() => window.removeEventListener('mousemove', update))

  

  return {

    x: readonly(x),

    y: readonly(y),

  }

}

```

  

### Composition API

  

| 问题 | 建议 |

|------|------|

| 为什么用 Composition API 替代 mixin？ | Mixin 有命名冲突、来源不清晰、难以重用等问题。Composition API 通过函数组合解决这些问题。 |

| Composition API 和 React Hooks 有什么区别？ | Vue 的 setup 只执行一次，不受闭包陷阱影响。React Hooks 每次渲染都执行，需要依赖数组。 |

| 何时仍然使用 Options API？ | 简单组件、团队不熟悉 Composition API、维护老代码时可以使用 Options API。 |

  

### 自定义指令

  

| 问题 | 建议 |

|------|------|

| 必须清理副作用吗？ | 是的。在 `unmounted` 钩子中清理事件监听器、定时器等，避免内存泄漏。 |

| 指令命名约定？ | 以 `v` 开头。注册时用 camelCase（`vFocus`），使用时用 kebab-case（`v-focus`）。 |

| 可以在组件上使用指令吗？ | 可以，但不推荐。指令会应用到组件的根元素，多根元素组件会报警告。 |

  

### 过渡与动画

  

| 问题 | 建议 |

|------|------|

| Transition 只能包含单个子元素吗？ | 是的。多个元素需要用 `v-if` / `v-else` 或 `TransitionGroup`。 |

| 为什么列表项需要 key？ | `TransitionGroup` 使用 key 追踪元素移动，实现平滑的移动动画。 |

| mode 属性的作用？ | `out-in`：旧元素先离开，新元素再进入。`in-out`：新元素先进入，旧元素再离开。 |

| 如何自定义动画时长？ | 通过 `duration` prop：`<Transition :duration="500">` 或 `{ enter: 500, leave: 800 }`。 |

  

### KeepAlive

  

| 问题 | 建议 |

|------|------|

| max 属性的作用？ | 限制缓存组件数量，超出时移除最久未访问的。`<KeepAlive :max="10">`。 |

| 组件必须有 name 属性吗？ | 使用 `include` / `exclude` 时需要。`<script setup>` 组件名默认是文件名。 |

| 特殊生命周期钩子？ | `onActivated`（激活时）、`onDeactivated`（停用时）。用于处理缓存组件的状态恢复。 |

  

### 异步组件

  

| 问题 | 建议 |

|------|------|

| delay 选项的作用？ | 延迟显示加载状态，避免加载很快时出现闪烁。默认 200ms。 |

| hydration 策略是什么？ | Vue 3.5+ 支持延迟 hydration：`defineAsyncComponent({ loader, hydrate: 'visible' })`。 |

  

### TypeScript 集成

  

| 问题 | 建议 |

|------|------|

| 如何为 defineProps 提供类型？ | 基于类型：`defineProps<{ title: string }>()`。基于运行时：`defineProps({ title: String })`。推荐前者。 |

| withDefaults 如何使用？ | `withDefaults(defineProps<Props>(), { count: 0 })`，为类型定义的 props 提供默认值。 |

| 如何获取组件实例类型？ | `InstanceType<typeof MyComponent>`，用于 ref 的类型标注。 |

  

```ts

// 完整示例

import MyComponent from './MyComponent.vue'

  

const compRef = ref<InstanceType<typeof MyComponent>>()

  

onMounted(() => {

  compRef.value?.focus() // 类型安全的方法调用

})

```

  

### SSR 注意事项

  

| 问题 | 建议 |

|------|------|

| 如何避免跨请求状态污染？ | 每个请求创建新的应用实例。避免在模块顶层创建响应式状态。 |

| 服务端可以使用哪些 API？ | 不能用 `window`、`document` 等浏览器 API。生命周期只有 `setup`、`onServerPrefetch`。 |

| getSSRProps 的作用？ | 在 SSR 时修改组件 props，常用于注入服务端数据。 |

  

### 性能优化

  

| 问题 | 建议 |

|------|------|

| props 稳定性为什么重要？ | 子组件使用 `shallowRef` 时，props 引用变化会触发重新渲染。尽量保持 props 引用稳定。 |

| 何时使用虚拟滚动？ | 渲染超过 1000 项的列表时。使用 `vue-virtual-scroller` 等库。 |

| v-once 和 v-memo 的区别？ | `v-once`：只渲染一次，永不更新。`v-memo`：条件性跳过更新，依赖数组未变时复用。 |

  

### SFC 特性

  

| 问题 | 建议 |

|------|------|

| 如何在 scoped 样式中修改子组件？ | 使用 `:deep()` 伪类：`.parent :deep(.child) { }`。 |

| scoped CSS 的限制？ | 不影响子组件的根元素（会自动添加 scoped 属性）。深层元素需要 `:deep()`。 |

  

### 插件开发

  

| 问题 | 建议 |

|------|------|

| 插件应该用 provide/inject 吗？ | 是的。插件通过 provide 提供功能，组件通过 inject 使用，比全局属性更灵活。 |

| 注入 key 命名约定？ | 使用 Symbol 避免冲突：`export const myPluginKey = Symbol()`。 |

| 如何为插件添加类型支持？ | 通过模块扩展：`declare module 'vue' { interface ComponentCustomProperties { $myPlugin: MyPlugin } }`。 |

  

---

  

## 第四部分：为什么选择 UnoCSS 而不是 Tailwind CSS？

  

### 核心论点：UnoCSS 是 Tailwind 的超集

  

UnoCSS 不是 Tailwind 的竞争者，而是增强版。通过预设系统，UnoCSS 可以 **100% 兼容 Tailwind 语法**：

  

```ts

// uno.config.ts

import { defineConfig, presetWind } from 'unocss'

  

export default defineConfig({

  presets: [

    presetWind(), // Tailwind CSS v3 兼容

    // 或 presetWind({ version: 4 }) // Tailwind CSS v4 兼容

  ],

})

```

  

使用 `presetWind` 后，所有 Tailwind 类名都能正常工作：

  

```html

<!-- Tailwind 语法完全兼容 -->

<div class="flex items-center justify-between p-4 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition">

  <span class="text-xl font-bold">完全兼容</span>

</div>

```

  

### UnoCSS 的独家能力

  

#### 1. 纯 CSS 图标（零 JS 运行时）

  

UnoCSS 通过 `presetIcons` 支持 **10 万+ Iconify 图标**，编译为纯 CSS，零 JavaScript 运行时开销：

  

```bash

pnpm add -D @iconify-json/carbon @iconify-json/mdi

```

  

```html

<!-- 直接用 class 引用图标，无需导入 -->

<div class="i-carbon-logo-github text-2xl" />

<div class="i-mdi-home text-red-500" />

<button class="i-carbon-arrow-right hover:i-carbon-arrow-right-filled" />

```

  

**编译结果（纯 CSS）：**

  

```css

.i-carbon-logo-github {

  display: inline-block;

  width: 1em;

  height: 1em;

  background: url("data:image/svg+xml;utf8,...") no-repeat;

  background-size: 100% 100%;

}

```

  

**对比 Tailwind + React Icons：**

  

- Tailwind：需要导入 React/Vue 组件，增加 bundle 体积

- UnoCSS：纯 CSS，零 JS，图标按需编译

  

#### 2. 属性化模式（Attributify）

  

避免 class 字符串爆炸：

  

```html

<!-- Tailwind：class 字符串过长 -->

<button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 flex items-center gap-2">

  提交

</button>

  

<!-- UnoCSS：属性化模式 -->

<button

  bg="blue-500 hover:blue-600"

  text="white"

  font="bold"

  p="y-2 x-4"

  rounded="lg"

  shadow="md"

  transition

  duration="300"

  flex

  items="center"

  gap="2"

>

  提交

</button>

```

  

#### 3. Variant Group（变体组简写）

  

```html

<!-- Tailwind：重复写 hover -->

<div class="hover:bg-red-500 hover:text-white hover:scale-105">

  

<!-- UnoCSS：Variant Group -->

<div class="hover:(bg-red-500 text-white scale-105)">

```

  

#### 4. 自定义规则引擎

  

Tailwind 需要配置复杂的插件系统，UnoCSS 支持正则和函数定义原子类：

  

```ts

// uno.config.ts

import { defineConfig } from 'unocss'

  

export default defineConfig({

  rules: [

    // 正则匹配：自定义间距

    [/^m-(\d+)$/, ([, d]) => ({ margin: `${d}px` })],

    // 函数定义：自定义颜色

    ['text-brand', { color: '#3b82f6' }],

    // 动态值：任意单位

    [/^gap-(\d+)(px|rem|em)$/, ([, num, unit]) => ({ gap: `${num}${unit}` })],

  ],

  shortcuts: {

    // 快捷组合类

    'btn-primary': 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600',

  },

})

```

  

#### 5. 编译模式（Compile Class）

  

将多个原子类编译为一个哈希类，减少 HTML 体积：

  

```html

<!-- 开发模式：原子类 -->

<div class="flex items-center gap-4 bg-blue-500 p-4">

  

<!-- 生产模式：编译为单个类 -->

<div class="uno-abc123">

  

<style>

.uno-abc123 {

  display: flex;

  align-items: center;

  gap: 1rem;

  background: #3b82f6;

  padding: 1rem;

}

</style>

```

  

### 对比总结

  

| 特性 | Tailwind CSS | UnoCSS |

|------|--------------|--------|

| 基础原子类 | ✅ 完整支持 | ✅ 完全兼容（presetWind） |

| 图标方案 | 需要额外库（React Icons 等） | ✅ 内置 10 万+ 图标（纯 CSS） |

| 属性化模式 | ❌ 不支持 | ✅ presetAttributify |

| Variant Group | ❌ 不支持 | ✅ `hover:(bg-red text-white)` |

| 自定义规则 | 复杂插件系统 | ✅ 正则/函数直接定义 |

| 编译模式 | ❌ 不支持 | ✅ 编译为哈希类 |

| 性能 | JIT 编译快 | ✅ 更快（Vite 原生） |

| 生态整合 | Standalone | ✅ Vite/Nuxt 深度集成 |

  

### 与 Anthony Fu 技术栈的协同

  

1. **Vite 原生设计**：UnoCSS 为 Vite 设计，HMR 极快

2. **Nuxt 一等公民**：`@nuxt/unocss` 开箱即用

3. **作者生态**：Anthony Fu 同时是 UnoCSS 和 Iconify 的作者，工具链深度整合

  

### 完整配置示例

  

```ts

// uno.config.ts

import {

  defineConfig,

  presetAttributify,

  presetIcons,

  presetTypography,

  presetUno,

  presetWebFonts,

  transformerDirectives,

  transformerVariantGroup,

} from 'unocss'

  

export default defineConfig({

  // 预设

  presets: [

    presetUno(), // 默认预设（类似 Tailwind）

    presetAttributify(), // 属性化模式

    presetIcons({

      scale: 1.2,

      cdn: 'https://esm.sh/',

    }),

    presetTypography(), // 排版预设

    presetWebFonts({

      fonts: {

        sans: 'Inter',

        mono: 'Fira Code',

      },

    }),

  ],

  

  // 转换器

  transformers: [

    transformerDirectives(), // @apply 指令

    transformerVariantGroup(), // Variant Group

  ],

  

  // 自定义规则

  rules: [

    ['text-brand', { color: '#3b82f6' }],

  ],

  

  // 快捷方式

  shortcuts: {

    'btn': 'px-4 py-2 rounded inline-block cursor-pointer',

    'btn-primary': 'btn bg-blue-500 text-white hover:bg-blue-600',

  },

  

  // 主题扩展

  theme: {

    colors: {

      brand: {

        primary: '#3b82f6',

        secondary: '#8b5cf6',

      },

    },

  },

})

```

  

**安装命令：**

  

```bash

pnpm add -D unocss

pnpm add -D @iconify-json/carbon @iconify-json/mdi

```

  

---

  

## 第五部分：配套工具链一览

  

| 工具 | 用途 | 推荐理由 |

|------|------|----------|

| **Vue 3.5+** | 渐进式 JavaScript 框架 | Composition API、性能优化、TypeScript 支持 |

| **Nuxt 3** | Vue 元框架 | SSR/SSG、文件路由、服务端 API、SEO 优化 |

| **Pinia** | 状态管理 | 直观的 API、完整的 TypeScript 支持、Vue DevTools 集成 |

| **Vite** | 构建工具 | 极速 HMR、原生 ESM、Rollup 生产构建 |

| **VitePress** | 静态站点生成器 | Vue 驱动、Markdown 扩展、主题定制 |

| **Vitest** | 单元测试 | Vite 原生、与 Jest 兼容的 API、快速执行 |

| **UnoCSS** | 原子化 CSS 引擎 | Tailwind 超集、纯 CSS 图标、Vite 深度集成 |

| **pnpm** | 包管理器 | 磁盘高效、严格依赖管理、monorepo 支持 |

| **VueUse** | 组合式函数集合 | 200+ 实用工具、SSR 友好、Tree-shakable |

| **Slidev** | 开发者幻灯片 | Markdown 编写、Vue 组件、录制功能 |

| **tsdown** | TypeScript 打包工具 | 零配置、类型声明生成、ESM/CJS 双输出 |

| **Vue Router** | 官方路由 | 嵌套路由、导航守卫、动态路由匹配 |

  

### 快速开始命令

  

```bash

# 创建 Vue 3 项目（Vite）

pnpm create vite my-vue-app --template vue-ts

  

# 创建 Nuxt 3 项目

pnpm dlx nuxi@latest init my-nuxt-app

  

# 添加 UnoCSS

pnpm add -D unocss

  

# 添加 VueUse

pnpm add @vueuse/core

  

# 添加 Pinia

pnpm add pinia

  

# 添加 Vitest

pnpm add -D vitest

```

  

---

  

## 总结

  

Anthony Fu 的开发规范强调：

  

1. **类型安全优先**：TypeScript + 显式类型定义

2. **性能意识**：`shallowRef` > `ref`、避免深度侦听、虚拟滚动

3. **工具链协同**：Vite + UnoCSS + Vitest 深度整合

4. **代码质量**：单一职责、ESLint 自动化、Git Hooks

5. **现代化实践**：Composition API、`<script setup>`、组合式函数

  

通过遵循这些规范，可以构建更快、更可维护、更具扩展性的 Vue 3 应用。

  

---

  

**参考资料：**

- [antfu/skills](https://github.com/antfu/skills) - Anthony Fu 的技能标准文档

- [Vue 3 官方文档](https://vuejs.org/)

- [UnoCSS 文档](https://unocss.dev/)

- [VueUse 文档](https://vueuse.org/)

  

**译者注：** 本文基于 antfu/skills 仓库于 2026 年 2 月的内容整理翻译，随着生态演进，部分实践可能更新，请以官方文档为准。