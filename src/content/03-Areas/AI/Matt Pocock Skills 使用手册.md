---
isPub: true
title: Matt Pocock Skills 使用手册
tags:
  - AI
  - agent
  - skills
  - mattpocock
confidence: high
sourceCount: 2
lastConfirmed: 2026-07-13
dateCreated: 2026-06-18T01:06:00+08:00
dateModified: 2026-07-13T22:07:13+08:00
---

## For future Claude

这页记录 [mattpocock/skills](https://github.com/mattpocock/skills) 当前主分支的完整 Skill 地图、调用方式和推荐组合。2026-07-13 核验时，仓库共有 39 个 `SKILL.md`：28 个稳定、7 个开发中、4 个弃用。需要选择工程工作流、核对新旧 Skill 名称或安装该套技能时先读本页。

# Matt Pocock Skills 使用手册

## 当前版本结论

**Matt Pocock Skills** 是一组小型、可组合、可修改的工程工作流，不是接管全部开发过程的自动驾驶框架。它重点解决四类问题：

1. 需求未对齐：通过 grilling 深挖真正需求。
2. 项目语言混乱：维护领域模型、`CONTEXT.md` 和 ADR。
3. 缺少反馈循环：使用 TDD、诊断和双轴代码审查。
4. 架构持续腐化：寻找 deep module、接口与模块边界问题。

| 状态 | 数量 | 建议 |
|---|---:|---|
| 稳定 | **28** | 可以正式使用 |
| 开发中 | **7** | 允许试验，不宜作为关键依赖 |
| 弃用 | **4** | 不建议安装 |
| 合计 | **39** | 以 GitHub 当前主分支为准 |

> [!warning]
> [skills.sh](https://skills.sh/mattpocock/skills) 当前显示 53 个 Skill，与 GitHub 主分支实际 39 个 `SKILL.md` 不一致。可能包含历史发布、旧名称或索引缓存，原因 **uncertain**。

## 安装

### 可编辑副本

```bash
npx skills@latest add mattpocock/skills
```

适合希望选择部分 Skill、修改内容或纳入项目版本控制的场景。

### Claude Code 托管插件

```text
/plugin marketplace add mattpocock/skills
/plugin install mattpocock-skills@mattpocock
```

插件是只读、随作者更新的托管包。安装后，每个仓库先运行一次 `/setup-matt-pocock-skills`。

## 调用模型

该仓库把 Skill 分为两类：

- **用户显式调用**：只有用户输入名称才能启动；Claude 使用 `disable-model-invocation: true`，Codex 使用 `policy.allow_implicit_invocation: false`。
- **模型可调用**：模型或用户都能触发，description 会包含丰富的触发语义。

稳定的 28 个 Skill 正好是 **14 个用户显式调用 + 14 个模型可调用**。用户显式 Skill 可以调用模型可调用 Skill，但不能自动调用另一个用户显式 Skill。

来源：[Model-invoked vs user-invoked](https://github.com/mattpocock/skills/blob/main/.agents/invocation.md)

## 稳定工程 Skill：17 个

### 用户显式调用：9 个

| Skill | 作用 | 适用场景 |
|---|---|---|
| `ask-matt` | 推荐应该走哪个 Skill 或工作流。 | 不清楚下一步应 grill、spec、prototype 还是 implement |
| `setup-matt-pocock-skills` | 初始化 Issue Tracker、标签语义和领域文档目录。 | 每个仓库首次使用 |
| `grill-with-docs` | 深度追问方案，同时维护 `CONTEXT.md`、领域模型和 ADR。 | 重大功能或架构改动前 |
| `triage` | 按状态机处理外部 Issue 和 PR。 | 把原始问题整理成 Agent 可执行任务 |
| `improve-codebase-architecture` | 扫描深模块化机会并生成 HTML 报告。 | 定期治理架构和代码库熵增 |
| `to-spec` | 把已经讨论清楚的内容整理成 Spec 并发布。 | 对话已完成，只需沉淀规格 |
| `to-tickets` | 把计划拆成带阻塞边的 tracer-bullet tickets。 | 多任务、多人或多 Agent 执行 |
| `implement` | 按 Spec/Tickets 实现，在约定边界运行 TDD 和审查。 | 需求与任务已准备完成 |
| `wayfinder` | 用决策 Ticket 地图规划超大、多 Session 工作。 | 目标很大且关键未知很多 |

### 模型可调用：8 个

| Skill | 作用 | 适用场景 |
|---|---|---|
| `prototype` | 构建可丢弃原型回答设计问题。 | 状态、业务逻辑或 UI 方向无法只靠讨论确定 |
| `diagnosing-bugs` | 按复现、缩小、假设、插桩、修复、回归循环诊断。 | Bug、性能回退、偶发失败 |
| `research` | 后台检索高可信一手资料并生成带引用的 Markdown。 | API、框架或技术事实需要调查 |
| `tdd` | 按红—绿—重构完成垂直切片。 | 新功能或 Bug 适合测试先行 |
| `domain-modeling` | 建立和修正领域术语、场景和 ADR。 | 项目术语含糊或理解不一致 |
| `codebase-design` | 提供 deep module、小接口和干净接缝方法。 | 设计模块接口、边界和测试策略 |
| `code-review` | 并行检查 Standards 与 Spec 两个维度。 | 审查 PR、分支或工作区 Diff |
| `resolving-merge-conflicts` | 按双方原始意图逐块解决 merge/rebase 冲突。 | 已处于 Git 冲突状态 |

来源：[Engineering README](https://github.com/mattpocock/skills/blob/main/skills/engineering/README.md)

## 稳定效率 Skill：5 个

| Skill | 调用方式 | 作用 |
|---|---|---|
| `grill-me` | 用户显式 | 不依赖代码库，对计划和设计连续追问 |
| `grilling` | 模型可调用 | 自动触发的压力测试想法流程 |
| `handoff` | 用户显式 | 将当前会话压缩成交接文档 |
| `teach` | 用户显式 | 在当前目录建立多 Session 教学工作区 |
| `writing-great-skills` | 用户显式 | 编写和改进 Skill 的方法论参考 |

### `grill-me` 与 `grill-with-docs`

| 维度 | `grill-me` | `grill-with-docs` |
|---|---|---|
| 是否需要代码库 | 否 | 是 |
| 是否更新项目文档 | 否 | 是 |
| 是否维护领域模型 | 否 | 是 |
| 适用范围 | 通用想法和计划 | 工程功能与架构方案 |

## 稳定杂项 Skill：4 个

| Skill | 作用 | 判断 |
|---|---|---|
| `git-guardrails-claude-code` | 安装 Hook，阻止高风险 Git 命令。 | Claude Code 专用 |
| `setup-pre-commit` | 配置 Husky、lint-staged、Prettier、类型检查和测试。 | JS/TS 项目实用 |
| `scaffold-exercises` | 创建课程练习目录和模板。 | 主要适合课程作者 |
| `migrate-to-shoehorn` | 将测试中的类型断言迁移到 `@total-typescript/shoehorn`。 | 高度特定 |

## 稳定个人 Skill：2 个

| Skill | 作用 | 判断 |
|---|---|---|
| `edit-article` | 重构文章章节、提升清晰度并压缩冗余。 | 通用但较轻量 |
| `obsidian-vault` | 使用 wikilink 和索引页管理 Obsidian Vault。 | 通常需要适配个人 Vault 约定 |

## 开发中 Skill：7 个

这些 Skill 不进入正式插件与顶层 README，可能发生破坏性变化或被放弃。

| Skill | 作用 | 判断 |
|---|---|---|
| `loop-me` | 跨 Session 追问自己，逐步写出工作流 Spec。 | 定位仍偏实验 |
| `wizard` | 为人工安装或迁移生成交互式 Bash 向导。 | 涉及 `.env` 和 Secrets，需谨慎 |
| `claude-handoff` | 将当前对话直接交给新的 Claude 后台 Agent。 | Claude 专用 |
| `setup-ts-deep-modules` | 用 dependency-cruiser 强制 TS 包仅通过入口访问。 | 大型 TS Monorepo 可试用 |
| `writing-fragments` | 通过访谈采集观点、场景和句子。 | 写作探索阶段 |
| `writing-shape` | 将原始素材逐段塑造成文章。 | 写作收敛阶段 |
| `writing-beats` | 按叙事节拍组织素材。 | 适合叙事文 |

来源：[In Progress README](https://github.com/mattpocock/skills/blob/main/skills/in-progress/README.md)

## 已弃用 Skill：4 个

| Skill | 原作用 | 当前替代方向 |
|---|---|---|
| `design-an-interface` | 并行生成多个模块接口方案。 | `codebase-design` |
| `qa` | 对话式报告 Bug 并创建 Issue。 | `triage` |
| `request-refactor-plan` | 访谈并生成细粒度重构计划。 | `improve-codebase-architecture`、`to-spec`、`to-tickets` |
| `ubiquitous-language` | 从对话提取 DDD 统一语言。 | `domain-modeling`、`grill-with-docs` |

来源：[Deprecated README](https://github.com/mattpocock/skills/blob/main/skills/deprecated/README.md)

## 新旧名称迁移

| 旧名称 | 当前名称 | 变化 |
|---|---|---|
| `to-prd` | `to-spec` | 从 PRD 表述收敛为工程 Spec |
| `to-issues` | `to-tickets` | 强调 tracer bullet 和阻塞关系 |
| `review` | `code-review` | 明确为代码审查，并保留 Standards + Spec 双轴 |
| 无 | `research` | 新增一手资料后台研究流程 |
| `decision-mapping` | `wayfinder` | 升级为超大工作决策 Ticket 地图 |

## 推荐工作流

### 小型功能

```text
grill-with-docs → to-spec → implement → tdd → code-review
```

### 大型、多 Session 功能

```text
grill-with-docs → to-spec → to-tickets
→ 每张 Ticket 单独 implement → code-review
```

### 巨型、未知很多的项目

```text
wayfinder → research / prototype → 逐个解决决策 Ticket
→ to-spec → to-tickets → implement
```

### Bug

```text
diagnosing-bugs → tdd 写回归测试 → 修复 → code-review
```

### 架构治理

```text
improve-codebase-architecture → codebase-design
→ grill-with-docs → to-spec → implement
```

## 推荐安装子集

### 核心

- `setup-matt-pocock-skills`
- `grill-with-docs`
- `to-spec`
- `to-tickets`
- `implement`
- `tdd`
- `diagnosing-bugs`
- `code-review`
- `handoff`
- `research`

### 按需

- 大项目：`wayfinder`
- 架构治理：`improve-codebase-architecture`、`codebase-design`
- 领域语言：`domain-modeling`
- 原型验证：`prototype`
- Issue 收件箱：`triage`

### 可不装

- 高度特定：`migrate-to-shoehorn`、`scaffold-exercises`
- 个人用途：`edit-article`、`obsidian-vault`
- 全部 `in-progress`
- 全部 `deprecated`

## 核心判断

这套 Skill 最有价值的不是某个单独文件，而是形成一条可控工程循环：

```text
对齐 → 规格 → 任务切片 → 小步实现 → 自动反馈 → 双轴审查 → 架构持续治理
```

它与 [[Agent Skills 与 SKILL.md 工作流]] 的核心观点一致：Skill 应是可组合、可版本化、可测试的工作流资产，而不是更长的 Prompt。

## 原始材料

- [mattpocock/skills GitHub](https://github.com/mattpocock/skills)
- [skills.sh 页面](https://skills.sh/mattpocock/skills)
- [Engineering README](https://github.com/mattpocock/skills/blob/main/skills/engineering/README.md)
- [Invocation 设计](https://github.com/mattpocock/skills/blob/main/.agents/invocation.md)
- [In Progress README](https://github.com/mattpocock/skills/blob/main/skills/in-progress/README.md)
- [Deprecated README](https://github.com/mattpocock/skills/blob/main/skills/deprecated/README.md)

## 相关

- [[Agent Skills 与 SKILL.md 工作流]]
- [[pi-skills-handbook]]
