# 技术阅读雷达 · AI Daily Digest

维护自己的技术信息源，从 RSS/Atom 中筛选近期文章，生成便于阅读和归档的 Markdown 精选报告。

关注 AI 与 Agent、系统工程、数据库与存储、安全、开发工具和长期思考。订阅目录独立存放在 [sources.json](sources.json)，可以直接增删来源、修正地址和调整启用状态，无需修改采集代码。

## 当前能力

- **订阅源维护**：使用稳定 ID 管理来源，校验必填字段、HTTP(S) 地址、重复 ID、网站和订阅地址。
- **RSS/Atom 采集**：读取启用且标记为“可读取”的 RSS/Atom 或 RSSHub 来源，按时间窗口筛选文章。
- **AI 筛选与摘要**：从相关性、质量、时效性三个维度评分，生成分类、关键词、摘要与推荐理由，支持中文或英文输出。
- **Markdown 报告**：包含看点总结、重点文章、分类列表、统计图表和来源覆盖说明。
- **模型接口配置**：支持 Gemini 与 OpenAI 兼容接口；同时配置两者时，Gemini 调用失败后切换到兼容接口。

截至 **2026-10-31**，目录包含 **101 条来源：86 条 RSS/Atom、15 条网页来源**。这是维护快照，后续以 `sources.json` 为准。

网页来源保留在目录中，但当前脚本不会采集其内容；运行日志和生成的报告会列出这部分未覆盖来源。`health: "可读取"` 是维护状态，不代表本次运行已经通过联网检查或解析测试。

## 快速开始

需要 Bun 运行时。生成报告还需要可访问订阅源与模型接口的网络，以及至少一个可用的模型 API Key。

### 1. 获取仓库

```bash
git clone https://github.com/CherryYang05/ai-daily-digest.git
cd ai-daily-digest
```

### 2. 校验订阅目录

```bash
bun scripts/digest.ts --check-sources
```

此命令只检查目录结构与重复条目，显示 RSS 与网页来源数量；不联网抓取，不调用模型，也不需要 API Key。

### 3. 配置模型并生成报告

以下示例读取最近 7 天的文章，精选最多 5 篇并输出中文报告。

**PowerShell：**

```powershell
$env:OPENAI_API_KEY = "<API_KEY>"
$env:OPENAI_API_BASE = "<兼容接口的基础地址，以 /v1 结尾>"
$env:OPENAI_MODEL = "<服务商支持的模型名称>"
bun scripts/digest.ts --hours 168 --top-n 5 --lang zh --output ./output/digest.md
```

**Bash / Zsh：**

```bash
export OPENAI_API_KEY="<API_KEY>"
export OPENAI_API_BASE="<兼容接口的基础地址，以 /v1 结尾>"
export OPENAI_MODEL="<服务商支持的模型名称>"
bun scripts/digest.ts --hours 168 --top-n 5 --lang zh --output ./output/digest.md
```

将占位符替换为自己的配置。也可以只设置 `GEMINI_API_KEY` 使用脚本中的 Gemini 接口；模型是否可用取决于服务商和账号权限。

### 命令参数

| 参数 | 用途 | 脚本默认值 |
| --- | --- | --- |
| `--hours` | 文章时间窗口，单位为小时 | `48` |
| `--top-n` | 精选文章数量上限 | `15` |
| `--lang` | 输出语言，`zh` 或 `en` | `zh` |
| `--output` | Markdown 输出路径 | `./digest-YYYYMMDD.md` |
| `--check-sources` | 只校验订阅目录 | 不开启 |
| `--help` | 查看帮助 | — |

上面的每周阅读示例显式使用 `168` 小时和 `5` 篇；它不会改变脚本默认值，也不会创建定时任务。

### 环境变量

| 变量 | 用途 |
| --- | --- |
| `GEMINI_API_KEY` | Gemini 凭据；设置后优先使用 |
| `OPENAI_API_KEY` | OpenAI 兼容接口凭据；可单独使用，也可作为备用 |
| `OPENAI_API_BASE` | 兼容接口基础地址；脚本会追加 `/chat/completions` |
| `OPENAI_MODEL` | 兼容接口模型名称，建议显式设置 |

省略接口或模型参数时，脚本使用代码中的默认配置，见 [scripts/digest.ts](scripts/digest.ts)。命令行入口从环境变量读取凭据，不会自动保存 API Key 或读取 Skill 的历史配置文件。

## 维护订阅源

编辑 [sources.json](sources.json) 中的条目，然后运行校验命令并提交修改。来源 ID 用于跨系统对齐，修改名称或 URL 时应保留已有 ID。

```json
{
  "id": "example-blog",
  "name": "Example Blog",
  "htmlUrl": "https://example.com/",
  "xmlUrl": "https://example.com/feed.xml",
  "enabled": true,
  "health": "可读取",
  "fetchMethod": "RSS/Atom",
  "type": "个人博客",
  "topics": ["工程", "系统"]
}
```

| 字段 | 含义 |
| --- | --- |
| `id` | 稳定且唯一的来源标识 |
| `name` | 显示名称 |
| `htmlUrl` | 网站或栏目地址 |
| `xmlUrl` | RSS/Atom 订阅地址；无订阅地址时为 `null` |
| `enabled` | 是否启用 |
| `health` | 维护时记录的健康状态；仅“可读取”参与采集 |
| `fetchMethod` | `RSS/Atom`、`RSSHub`、`网页` 或 `待验证` |
| `type` | 来源类型，例如个人博客、官方技术博客、社区 |
| `topics` | 主题标签，用于目录组织 |

只有同时满足以下条件的条目会进入 RSS 采集流程：`enabled` 为 `true`、`health` 为 `可读取`、抓取方式为 `RSS/Atom` 或 `RSSHub`，并提供订阅地址。RSSHub 来源需自行提供可用的 feed URL，本仓库不部署 RSSHub 服务。

`type` 和 `topics` 用于描述目录；当前脚本不会根据这些字段自动定制 AI 评分规则。来源抓取失败时会记录日志并继续处理其他来源，不会自动删除或修改目录。

## 报告与覆盖范围

处理流程为：

```text
读取与校验清单 → RSS/Atom 采集 → 时间筛选 → AI 评分与分类 → 摘要与推荐 → Markdown 报告
```

报告包含看点总结、最多 3 篇重点展示、分类文章列表、来源与文章统计，以及 Mermaid / 文本图表。分类包括 AI/ML、安全、工程、工具、观点与其他。

当前摘要依据 feed 中提供的标题和描述生成，脚本没有逐篇抓取全文。统计中的成功来源指返回了文章的来源，不等于完整覆盖或独立健康检查。AI 评分和摘要是阅读辅助，关键论点仍需结合原文核实。

## 与 Notion、定时任务的配合

本仓库提供来源目录与报告生成脚本；**不内置 Notion 写入、定时调度或跨期文章去重机制**。

外部任务可以读取本 fork 的 [sources.json](https://github.com/CherryYang05/ai-daily-digest/blob/main/sources.json)，按稳定来源 ID 与 Notion 对齐，再负责文章去重、阅读状态保留和报告归档。网页来源需要外部任务另行读取或实现采集适配。

“每期新增最多 20 篇、精选最多 5 篇”属于个人阅读任务的规则；仓库脚本只通过 `--top-n` 控制报告精选数量。更新仓库不会自动修改 ChatGPT 中已有任务的配置。

仓库还保留 [SKILL.md](SKILL.md)，供支持 Skill 的 Agent 读取和执行。`/digest` 是 Agent 使用入口，不是命令行子命令；交互和配置持久化由 Agent 执行，不能视为脚本自动完成的功能。

## 项目结构

```text
sources.json              个人维护的订阅目录
scripts/
  digest.ts               采集、筛选、AI 摘要与报告生成
  sources.ts              清单加载、校验与采集来源选择
  sources.test.mjs         清单加载与筛选测试
SKILL.md                  Agent 使用说明
```

本地检查：

```bash
bun scripts/digest.ts --check-sources
node --test scripts/sources.test.mjs
```

测试命令使用支持直接执行 TypeScript 的 Node.js，本仓库已在 Node.js 24.13.0 下验证。以上检查不调用模型，也不能代替所有来源的端到端联网测试。

## 项目来源

本项目 fork 自 [vigorX777/ai-daily-digest](https://github.com/vigorX777/ai-daily-digest)，保留上游提交历史与代码来源。早期博客目录参考 [Hacker News Popularity Contest 2025](https://refactoringenglish.com/tools/hn-popularity/)；当前清单已独立扩充、清理和维护。
