import type {
  ChapterMapItem,
  CoursePart,
  LabKind,
  Lesson,
  MultipleChoiceQuiz,
  OpenQuiz,
  Quiz,
  SourceRef,
} from "./types";

const PDF = "https://arxiv.org/pdf/2606.24937";

export const courseParts: CoursePart[] = [
  { id: 1, roman: "I", title: "Foundations", zh: "基础底座", chapterRange: "Ch.1–3" },
  { id: 2, roman: "II", title: "RL Methods for LLMs", zh: "LLM 强化学习", chapterRange: "Ch.4–12" },
  { id: 3, roman: "III", title: "Reasoning", zh: "推理模型", chapterRange: "Ch.13" },
  { id: 4, roman: "IV", title: "Evaluation", zh: "评估方法", chapterRange: "Ch.14" },
  { id: 5, roman: "V", title: "Agentic AI", zh: "智能体系统", chapterRange: "Ch.15–27" },
  { id: 6, roman: "VI", title: "Assessment & Reference", zh: "测验与速查", chapterRange: "Ch.28–30" },
];

export const chapterMap: ChapterMapItem[] = [
  { chapter: 1, title: "LLM Architecture and Optimization Methods", lessonSlug: "foundations" },
  { chapter: 2, title: "Systems Foundations for LLMs", lessonSlug: "foundations" },
  { chapter: 3, title: "Introduction to Reinforcement Learning", lessonSlug: "foundations" },
  { chapter: 4, title: "RL Foundations for Language Models", lessonSlug: "alignment" },
  { chapter: 5, title: "PPO — Proximal Policy Optimization", lessonSlug: "alignment" },
  { chapter: 6, title: "DPO — Direct Preference Optimization", lessonSlug: "alignment" },
  { chapter: 7, title: "GRPO — Group Relative Policy Optimization", lessonSlug: "alignment" },
  { chapter: 8, title: "Preference Optimization Variants", lessonSlug: "alignment" },
  { chapter: 9, title: "Reward Model Training", lessonSlug: "training-systems" },
  { chapter: 10, title: "SFT Best Practices and Techniques", lessonSlug: "training-systems" },
  { chapter: 11, title: "System Architecture & Infrastructure at Scale", lessonSlug: "training-systems" },
  { chapter: 12, title: "LLM Agentic Training", lessonSlug: "training-systems" },
  { chapter: 13, title: "RL for Large Reasoning Models", lessonSlug: "reasoning-evaluation" },
  { chapter: 14, title: "LLM Evaluation", lessonSlug: "reasoning-evaluation" },
  { chapter: 15, title: "Introduction to Agentic AI", lessonSlug: "agentic-stack" },
  { chapter: 16, title: "Retrieval-Augmented Generation (RAG)", lessonSlug: "rag-memory" },
  { chapter: 17, title: "Agentic Memory Systems", lessonSlug: "rag-memory" },
  { chapter: 18, title: "Agent Harness — Context Management and Orchestration", lessonSlug: "harness-loop" },
  { chapter: 19, title: "Loop Engineering", lessonSlug: "harness-loop" },
  { chapter: 20, title: "Agent Design Patterns", lessonSlug: "patterns-environments" },
  { chapter: 21, title: "Agentic Environments and Benchmarks", lessonSlug: "patterns-environments" },
  { chapter: 22, title: "Model Context Protocol (MCP)", lessonSlug: "protocols" },
  { chapter: 23, title: "Agent Skills", lessonSlug: "protocols" },
  { chapter: 24, title: "Agent-to-Agent Communication (A2A)", lessonSlug: "protocols" },
  { chapter: 25, title: "Multi-Agent Systems", lessonSlug: "multiagent-frameworks" },
  { chapter: 26, title: "Agent Development Frameworks", lessonSlug: "multiagent-frameworks" },
  { chapter: 27, title: "Agentic UI Frameworks", lessonSlug: "ui-future" },
  { chapter: 28, title: "Quiz Questions & Detailed Answers", lessonSlug: "ui-future" },
  { chapter: 29, title: "Quick Reference", lessonSlug: "ui-future" },
  { chapter: 30, title: "Conclusion and Future Directions", lessonSlug: "ui-future" },
];

const source = (label: string, section: string, pages: string): SourceRef => ({
  label,
  section,
  pages,
  url: PDF,
});

const mcq = (
  id: string,
  topic: string,
  prompt: string,
  options: string[],
  answer: number,
  explanation: string,
): MultipleChoiceQuiz => ({
  id,
  type: "mcq",
  topic,
  prompt,
  options,
  answer,
  explanation,
});

const open = (
  id: string,
  topic: string,
  prompt: string,
  hints: [string, string, string],
  answer: string,
  variant: string,
  rubric: string,
): OpenQuiz => ({
  id,
  type: "open",
  topic,
  prompt,
  hints,
  answer,
  variant,
  rubric,
});

const five = (
  slug: string,
  data: [
    Omit<MultipleChoiceQuiz, "id" | "type">,
    Omit<MultipleChoiceQuiz, "id" | "type">,
    Omit<MultipleChoiceQuiz, "id" | "type">,
    Omit<OpenQuiz, "id" | "type">,
    Omit<OpenQuiz, "id" | "type">,
  ],
): Quiz[] => [
  mcq(`${slug}-m1`, data[0].topic, data[0].prompt, data[0].options, data[0].answer, data[0].explanation),
  mcq(`${slug}-m2`, data[1].topic, data[1].prompt, data[1].options, data[1].answer, data[1].explanation),
  mcq(`${slug}-m3`, data[2].topic, data[2].prompt, data[2].options, data[2].answer, data[2].explanation),
  open(`${slug}-o1`, data[3].topic, data[3].prompt, data[3].hints, data[3].answer, data[3].variant, data[3].rubric),
  open(`${slug}-o2`, data[4].topic, data[4].prompt, data[4].hints, data[4].answer, data[4].variant, data[4].rubric),
];

type LessonSeed = Omit<Lesson, "quizzes"> & { quizzes: Parameters<typeof five>[1] };
const lesson = (seed: LessonSeed): Lesson => ({
  ...seed,
  quizzes: five(seed.slug, seed.quizzes),
});

export const lessons: Lesson[] = [
  lesson({
    index: 0,
    slug: "roadmap",
    part: 0,
    partLabel: "Start Here",
    title: "先看地图，再决定从哪里上车",
    subtitle: "一部 636 页手册，不该只用一种顺序阅读",
    chapters: "全书导览",
    pageRange: "pp. 27–35",
    minutes: 22,
    summary:
      "这份指南的主线不是“把所有名词背下来”，而是理解从模型能力到自主系统的层层约束：LLM 提供预测能力，RL 塑造策略，Harness 把模型接入环境，协议让工具与其他 Agent 可组合，评估与 UI 负责让系统可控。",
    objectives: [
      "说出全书六个 Part 的逻辑关系，而不是只记目录",
      "根据自己的背景选择基础、工程或 Agentic 快车道",
      "区分论文事实、本站解释、工程建议与原文未说明",
    ],
    prerequisites: ["基本编程经验", "知道 LLM 是按 token 生成文本即可"],
    terms: [
      { term: "Agentic AI", zh: "智能体式 AI", meaning: "能在环境中循环感知、规划、行动并根据结果继续调整的系统。" },
      { term: "Full stack", zh: "全栈", meaning: "从模型、训练、推理到工具、协议、评估和人机界面的完整链路。" },
      { term: "Evidence boundary", zh: "证据边界", meaning: "明确哪些话来自原文，哪些是解释或推断。" },
    ],
    facts: [
      "原书包含 30 章、六个 Part；Part V 的 Ch.15–27 集中讨论 Agentic AI。",
      "作者把 LLM architecture、RL、systems、evaluation 与 agent engineering 放在同一条生产链上。",
      "v2 提交于 2026-07-27，封面版本号为 1.3。",
    ],
    explanations: [
      "把 Agent 想成一辆车：模型是发动机，Harness 是底盘与控制器，tools 是执行机构，memory 是行车记录，evaluation 是仪表盘，UI 是驾驶员和车辆交互的界面。",
      "类比的边界在于：真实 Agent 的组件不是物理分离的。一次 context 压缩会同时影响推理、工具选择、成本与可观察性。",
    ],
    practice: [
      "零基础路线：0 → 1 → 2 → 4 → 5–11。",
      "工程路线：0 → 1 → 3 → 5–11。",
      "已熟悉 LLM/RL：0 → 5–11，再按薄弱点回查 1–4。",
    ],
    pitfalls: [
      "把“Agent”理解成带 system prompt 的聊天机器人。",
      "只看框架 API，不理解 context、loop、tool failure 与 evaluation。",
      "把作者的经验性建议误当作已有严格实验支持的结论。",
    ],
    takeaways: [
      "Agentic AI 是系统工程问题，不是单一 prompting 技巧。",
      "先建立依赖图，再按任务回查细节，比线性硬读 636 页更有效。",
      "任何新概念都要追问：它解决了哪个失败模式，又带来了什么成本。",
    ],
    sources: [source("How This Guide Is Organized", "Preface", "28–35")],
    labs: [],
    quizzes: [
      {
        topic: "全书结构",
        prompt: "全书中直接覆盖 RAG、Memory、MCP、A2A 和 Multi-Agent 的主体是？",
        options: ["Part I", "Part II", "Part V", "Part VI"],
        answer: 2,
        explanation: "Part V（Ch.15–27）是 Agentic AI 主体。",
      },
      {
        topic: "系统边界",
        prompt: "下面哪项最接近 Agent Harness 的职责？",
        options: ["训练 tokenizer", "管理 context、state、tools 与 loop", "制造 GPU", "只负责绘制聊天气泡"],
        answer: 1,
        explanation: "Harness 是模型与环境之间的运行时控制层。",
      },
      {
        topic: "证据",
        prompt: "当原书没有给出某个生产参数时，最专业的处理是？",
        options: ["按行业常见值补上", "写成作者推荐值", "明确标注原文未说明", "删掉整个主题"],
        answer: 2,
        explanation: "保持证据边界比填满每个空白更重要。",
      },
      {
        topic: "学习路线",
        prompt: "请用“模型 → 训练 → Harness → 外部系统 → 人”串起一条 Agentic AI 全栈链路。",
        hints: ["先给每层写一个动词。", "训练改变策略；Harness 管理运行；外部系统提供知识和行动。", "最后补上 evaluation 与 human oversight 的闭环。"],
        answer:
          "模型产生候选动作；SFT/RL 让动作更符合目标；Harness 管理 context、state、tools、重试与预算；RAG、Memory、MCP tools 和其他 agents 提供外部能力；UI、evaluation 与 human-in-the-loop 观察并纠正系统，反馈再进入下一轮。",
        variant: "如果没有 Harness，只剩模型和 tools，最先出现的三个生产问题是什么？",
        rubric: "覆盖五层得 3 分；说明闭环得 1 分；指出失败模式或成本得 1 分。",
      },
      {
        topic: "证据边界",
        prompt: "为什么学习网页必须把“原文事实”和“本站解释”分开？",
        hints: ["想想读者以后引用这句话时会发生什么。", "原书观点、作者自述与本站推导的证据强度不同。", "再补上快速变化领域中的时效性。"],
        answer:
          "分开标注能防止二次解释被误引为作者结论，也让读者知道哪些数字可回查、哪些只是一种教学类比。Agentic AI 变化快，框架和实践建议可能过时，而原书版本与页码仍可验证。",
        variant: "如果一条工程建议来自原书案例而非对照实验，应如何标注？",
        rubric: "指出可追溯性、证据强度和时效性三点各 1 分；给出具体标注方式 2 分。",
      },
    ],
  }),
  lesson({
    index: 1,
    slug: "foundations",
    part: 1,
    partLabel: "Part I · Foundations",
    title: "模型、GPU 与 RL：Agent 的三块地基",
    subtitle: "Transformer 负责表示，系统负责跑动，RL 负责从结果中学习",
    chapters: "Ch.1–3",
    pageRange: "pp. 39–137",
    minutes: 48,
    summary:
      "Agentic 系统仍然受 Transformer、显存带宽和 RL 稳定性的约束。理解 self-attention、KV cache、Flash Attention、vLLM 与 MDP，才能判断一次长轨迹为什么昂贵、一次工具调用为什么需要状态，以及训练信号为何必须被谨慎设计。",
    objectives: ["解释 attention 与 KV cache 的成本", "用 roofline 视角区分 memory-bound 与 compute-bound", "把文本生成写成 MDP"],
    prerequisites: ["矩阵乘法与 softmax 的直觉", "概率分布的基本概念"],
    terms: [
      { term: "Self-attention", zh: "自注意力", meaning: "让每个 token 根据相关性从其他 token 聚合信息。" },
      { term: "KV cache", zh: "键值缓存", meaning: "保存历史 token 的 key/value，避免解码时重复计算。" },
      { term: "MDP", zh: "马尔可夫决策过程", meaning: "用 state、action、transition、reward 描述连续决策。" },
    ],
    facts: [
      "标准 attention 的 score matrix 随序列长度呈二次增长；KV cache 随长度线性增长。",
      "Flash Attention 通过 tiling 与 online softmax 减少高带宽内存读写，并不改变精确 attention 的数学结果。",
      "书中把 token 生成视为 MDP：context 是 state，下一个 token 或工具动作是 action。",
    ],
    explanations: [
      "长上下文的困难不只是“模型能不能看见”，还包括缓存能否放下、每步能否及时读完，以及 Agent 的无效历史会不会稀释真正相关的信息。",
      "RL 的 reward 是方向盘，不是成绩单。一个容易钻空子的 reward 会训练出看似高分、实际偏离目标的行为。",
    ],
    practice: [
      "估算服务成本时同时看参数读取、KV cache 和网络通信。",
      "设计 Agent state 时保存足以决定下一步的信息，不要把所有日志无差别塞回 context。",
      "先用小环境验证 reward，再扩大轨迹和并发规模。",
    ],
    pitfalls: ["把 Flash Attention 当作近似 attention", "把更长 context 等同于更好记忆", "把 reward 当作客观真理"],
    formula: {
      expression: "Attention(Q,K,V) = softmax(QKᵀ / √dₖ)V",
      reading: "Q 与 K 决定“看谁”，softmax 把分数变成权重，V 决定“取回什么”。",
      symbols: [["Q", "当前 token 想查找的内容"], ["K", "历史 token 可被匹配的索引"], ["V", "匹配后实际聚合的信息"], ["dₖ", "key 的维度，用于缩放数值"]],
    },
    takeaways: ["Agent 的每一步仍由 token 计算承载。", "上下文、带宽与 reward 共同决定可扩展性。", "系统优化不能脱离算法语义。"],
    sources: [
      source("LLM Architecture and Optimization Methods", "Ch.1", "39–110"),
      source("Systems Foundations for LLMs", "Ch.2", "111–124"),
      source("Introduction to Reinforcement Learning", "Ch.3", "125–137"),
    ],
    labs: [],
    quizzes: [
      {
        topic: "Attention",
        prompt: "Flash Attention 的核心收益来自？",
        options: ["删掉一半 token", "减少 HBM 往返读写", "把 softmax 换成 sigmoid", "取消 causal mask"],
        answer: 1,
        explanation: "它利用 tiling 和 online softmax 改善 IO，而保持精确结果。",
      },
      {
        topic: "KV cache",
        prompt: "在其他条件不变时，KV cache 对序列长度的增长关系通常是？",
        options: ["常数", "线性", "二次", "指数"],
        answer: 1,
        explanation: "每个新 token 会追加一组 K/V，因此主要是线性增长。",
      },
      {
        topic: "MDP",
        prompt: "把 Agent 写成 MDP 时，tool result 最自然地属于？",
        options: ["下一步 observation/state 更新", "固定模型参数", "tokenizer 词表", "GPU kernel"],
        answer: 0,
        explanation: "工具结果改变 Agent 接下来可见的状态。",
      },
      {
        topic: "成本诊断",
        prompt: "一个长上下文 Agent 延迟突然升高，请给出从模型到系统的诊断顺序。",
        hints: ["先区分 prefill 与 decoding。", "检查 KV cache、参数读取与网络通信。", "最后看是否有无效历史和重复工具结果。"],
        answer:
          "先拆分 prefill 与逐 token decoding 延迟；再检查 KV cache 占用、缓存命中、内存带宽、batch、并行通信；然后检查 context 中是否存在重复日志、过长工具输出或无法复用的 prefix；最后才考虑更换模型或缩短任务。",
        variant: "如果 GPU 利用率很低但延迟很高，你更怀疑 compute 还是 memory/communication？",
        rubric: "区分阶段 1 分；覆盖缓存/带宽/通信 2 分；覆盖 context 质量 1 分；给出验证信号 1 分。",
      },
      {
        topic: "Reward design",
        prompt: "构造一个“任务得分提高，但真实目标变差”的 reward hacking 例子。",
        hints: ["选择一个可量化但不完整的代理指标。", "让 Agent 学会优化这个指标的漏洞。", "说明如何加入约束或多指标修正。"],
        answer:
          "例如客服 Agent 只按“平均处理时长越短越好”奖励，它可能快速关闭复杂工单，分数上升但问题未解决。应加入一次解决率、用户确认、重开率与违规惩罚，并对极端策略做人工审查。",
        variant: "把例子换成代码 Agent：只奖励测试通过率会出现什么漏洞？",
        rubric: "明确代理指标 1 分；具体投机行为 2 分；真实损失 1 分；修正方案 1 分。",
      },
    ],
  }),
  lesson({
    index: 2,
    slug: "alignment",
    part: 2,
    partLabel: "Part II · RL Methods",
    title: "PPO、DPO、GRPO：三种不同的“往好处推”",
    subtitle: "不要背缩写，先看每种方法需要什么数据、付出什么代价",
    chapters: "Ch.4–8",
    pageRange: "pp. 139–186",
    minutes: 45,
    summary:
      "PPO 用在线 rollout 与 critic 做稳定策略更新；DPO 把成对偏好转成直接的分类式目标；GRPO 用同一 prompt 的组内相对奖励省去独立 critic。它们不是简单的先进/落后关系，而是数据、成本与控制能力之间的选择。",
    objectives: ["比较 PPO、DPO、GRPO 的训练信号", "解释 KL 约束和 clipping 的作用", "根据任务选择对齐方法"],
    prerequisites: ["policy gradient", "log probability", "SFT 基本流程"],
    terms: [
      { term: "PPO", zh: "近端策略优化", meaning: "限制单次 policy 更新幅度的 on-policy RL 方法。" },
      { term: "DPO", zh: "直接偏好优化", meaning: "用 chosen/rejected 对直接训练 policy，无需显式 reward model rollout。" },
      { term: "GRPO", zh: "组相对策略优化", meaning: "用同一 prompt 多个回答的组内相对奖励形成 advantage。" },
    ],
    facts: [
      "PPO 的 clipped objective 用 min 操作阻止策略通过过大概率比获得虚假收益。",
      "DPO 依赖偏好对与 reference policy，把 KL-regularized reward optimization 改写为监督式目标。",
      "GRPO 的关键是 group-relative baseline；同组采样质量直接影响 advantage 的可辨别性。",
    ],
    explanations: [
      "PPO 像带护栏的在线试车；DPO 像看两份答案学习偏好；GRPO 像同一道题让一组选手比赛，再按组内名次更新。",
      "KL 不是“越小越好”。过小意味着学不到新行为，过大则可能遗忘基础能力或走向 reward model 的漏洞。",
    ],
    practice: ["只有离线偏好对时优先从 DPO 类方法开始。", "存在可验证 reward 且能并行采样时考虑 GRPO。", "需要细粒度在线控制且能承担 critic/rollout 成本时使用 PPO。"],
    pitfalls: ["把 DPO 说成完全不需要 reference", "组内奖励方差接近零仍强行做 GRPO", "只看平均 reward，不监控 KL 与能力回退"],
    formula: {
      expression: "Lᴾᴾᴼ = E[min(rₜAₜ, clip(rₜ,1−ε,1+ε)Aₜ)]",
      reading: "新旧策略概率比 rₜ 被限制在邻域内；即便 advantage 很大，也不允许一步走得过远。",
      symbols: [["rₜ", "新 policy 与旧 policy 对动作概率的比值"], ["Aₜ", "该动作相对基线的优势"], ["ε", "允许单次更新偏离的范围"]],
    },
    takeaways: ["方法选择首先是数据与反馈选择。", "稳定性来自约束、基线与可观察指标。", "可验证 reward 并不自动等于无漏洞 reward。"],
    sources: [source("RL Foundations through Preference Variants", "Ch.4–8", "139–186")],
    labs: [],
    quizzes: [
      {
        topic: "PPO",
        prompt: "PPO clipping 主要限制什么？",
        options: ["序列长度", "单次策略更新幅度", "GPU 数量", "偏好数据数量"],
        answer: 1,
        explanation: "clipping 限制新旧策略概率比，降低更新失稳风险。",
      },
      {
        topic: "DPO",
        prompt: "DPO 最典型的数据形式是？",
        options: ["只有无标签网页", "chosen/rejected 回答对", "GPU trace", "工具 schema"],
        answer: 1,
        explanation: "DPO 从成对偏好直接学习。",
      },
      {
        topic: "GRPO",
        prompt: "当同一 prompt 的所有采样 reward 几乎相同时，GRPO 会遇到？",
        options: ["组内 advantage 信号弱", "tokenizer 崩溃", "KV cache 翻倍", "MCP 断开"],
        answer: 0,
        explanation: "组内无差异就难以判断应该提高哪个回答的概率。",
      },
      {
        topic: "方法选择",
        prompt: "为“有自动测试的代码生成”选择 PPO、DPO 或 GRPO，并说明条件。",
        hints: ["测试结果可以形成可验证 reward。", "同题可生成多个候选并行比较。", "同时考虑采样成本和 reward hacking。"],
        answer:
          "若能对同一问题并行生成多个候选，并用隔离测试稳定判分，GRPO 是自然起点；若只有历史优劣答案对，则先用 DPO；若需要逐步工具交互和精细 credit assignment，且能承担 critic 与在线 rollout，则考虑 PPO。",
        variant: "如果测试只覆盖 happy path，选择会改变吗？为什么？",
        rubric: "选择与数据匹配 2 分；说明成本 1 分；指出测试漏洞 1 分；给出监控项 1 分。",
      },
      {
        topic: "KL",
        prompt: "为什么把 KL 一味压到零不是好目标？",
        hints: ["KL 衡量新旧策略差异。", "完全不变就无法学习新偏好。", "同时说明 KL 过大的另一端风险。"],
        answer:
          "KL 接近零意味着 policy 几乎没有离开 reference，训练可能没有获得有用新行为；KL 过大又会导致基础能力漂移、风格极化或追逐 reward 漏洞。合理目标是受控改变，而非零改变。",
        variant: "如果任务是纠正一个严重安全漏洞，合理 KL 区间会不会与风格微调相同？",
        rubric: "解释 KL 含义 1 分；说明过小与过大风险各 1 分；提出受控权衡 2 分。",
      },
    ],
  }),
  lesson({
    index: 3,
    slug: "training-systems",
    part: 2,
    partLabel: "Part II · Training Systems",
    title: "Reward、SFT 与大规模 Agentic Training",
    subtitle: "模型要学会长轨迹，系统先要装得下、跑得稳、记得住",
    chapters: "Ch.9–12",
    pageRange: "pp. 188–257",
    minutes: 50,
    summary:
      "Reward model 决定什么被视为好结果，SFT 建立可用的初始行为，分布式架构承担 policy、reference、reward、value 等模型副本，Agentic training 再把反馈从单轮回答扩展到 trajectory。算法和系统在这里真正绑在一起。",
    objectives: ["区分 outcome 与 process reward", "解释 sequence packing 与 completion-only masking", "识别长轨迹训练的基础设施瓶颈"],
    prerequisites: ["PPO/DPO/GRPO 差异", "基本分布式训练概念"],
    terms: [
      { term: "Outcome reward", zh: "结果奖励", meaning: "只根据最终结果判分，便宜但 credit assignment 粗。" },
      { term: "Process reward", zh: "过程奖励", meaning: "对中间步骤评分，信号更密但标注和可靠性更难。" },
      { term: "Trajectory", zh: "轨迹", meaning: "Agent 从初始 observation 到结束的一串状态、动作和反馈。" },
    ],
    facts: [
      "Bradley–Terry 模型用两份回答的 reward 差映射偏好概率。",
      "completion-only masking 只对 assistant 目标 token 计算 SFT loss，避免让模型学习预测用户输入。",
      "PPO/RLHF 训练常同时涉及 policy、reference、reward 与 value 四类模型状态。",
    ],
    explanations: [
      "Outcome reward 像只看终点成绩；process reward 像看每个解题步骤。后者更容易定位错误，也更容易把评分器自身偏见一路注入。",
      "长轨迹的瓶颈不仅是 token 多，还包括环境速度不一致、失败重试、权重同步、过期 trajectory 与 sandbox 状态。",
    ],
    practice: ["SFT 先保证格式和工具调用基本正确，再用 RL 扩展探索。", "对昂贵 reward model 做校准、反事实与对抗测试。", "训练日志同时记录 task success、token cost、KL、长度和失败类型。"],
    pitfalls: ["用格式漂亮代替任务正确", "sequence packing 时泄漏样本边界", "只统计完成轨迹而忽略被丢弃的失败轨迹"],
    takeaways: ["SFT 质量决定 RL 的起跑线。", "Reward 的可攻击面必须像 API 一样测试。", "长轨迹训练需要算法-系统协同。"],
    sources: [source("Reward Model, SFT, Infrastructure and Agentic Training", "Ch.9–12", "188–257")],
    labs: [],
    quizzes: [
      {
        topic: "Reward",
        prompt: "只根据最终答案是否正确判分属于？",
        options: ["Process reward", "Outcome reward", "KL penalty", "Context compression"],
        answer: 1,
        explanation: "它不评价中间步骤，只评价终局。",
      },
      {
        topic: "SFT",
        prompt: "completion-only masking 的主要目的？",
        options: ["只训练 assistant 输出", "只训练 system prompt", "取消 attention", "压缩模型权重"],
        answer: 0,
        explanation: "它避免把 user/system 部分也当作预测目标。",
      },
      {
        topic: "Infrastructure",
        prompt: "传统 PPO/RLHF 中常见的四模型组合不包括？",
        options: ["Policy", "Reference", "Reward", "DNS server"],
        answer: 3,
        explanation: "前三者加 value/critic 构成常见四模型内存挑战。",
      },
      {
        topic: "Credit assignment",
        prompt: "一个 Agent 经过 80 次工具调用才成功，如何改善 credit assignment？",
        hints: ["先找可验证的中间事件。", "不要把最终 reward 平均撒给所有动作。", "考虑过程奖励、回溯和因果消融。"],
        answer:
          "记录关键子目标、工具错误与状态转换；对可验证中间结果提供稠密 reward；用 return/advantage 把反馈向前传播；对关键动作做移除或替换实验估计贡献；同时保留最终 outcome，防止只优化局部步骤。",
        variant: "如果过程评分器偏爱更长的轨迹，会出现什么新问题？",
        rubric: "中间事件 1 分；回传机制 1 分；因果或反事实 1 分；防局部最优 1 分；指出评分器风险 1 分。",
      },
      {
        topic: "系统权衡",
        prompt: "为什么异步 rollout 会提高吞吐，却可能伤害 on-policy 性质？",
        hints: ["生成 trajectory 使用的是某个 policy 版本。", "训练更新进行时，慢轨迹仍在环境里运行。", "比较生成数据的 policy 与当前 policy。"],
        answer:
          "异步让快环境不必等待慢环境，因此吞吐更高；但慢轨迹返回时，当前 policy 可能已更新多轮，数据来自旧 policy，产生 staleness。需要版本标记、importance weighting、丢弃阈值或受控同步。",
        variant: "如果只保留最快完成的轨迹，会引入哪种选择偏差？",
        rubric: "吞吐解释 1 分；staleness 2 分；至少一种修正 1 分；选择偏差 1 分。",
      },
    ],
  }),
  lesson({
    index: 4,
    slug: "reasoning-evaluation",
    part: 3,
    partLabel: "Parts III–IV",
    title: "Reasoning 与 Evaluation：更会想，不等于已经证明",
    subtitle: "Test-time compute、verifiable reward 与可信评测必须一起看",
    chapters: "Ch.13–14",
    pageRange: "pp. 260–302",
    minutes: 43,
    summary:
      "Reasoning model 通过 RLVR、self-consistency、search 与更高 test-time compute 改善多步问题表现；评估则要回答指标是否匹配目标、数据是否污染、judge 是否可靠，以及成本是否可接受。单个榜单分数不能替代系统证据。",
    objectives: ["解释 test-time scaling", "区分 process 与 outcome evaluator", "设计包含质量、成本和稳定性的评估"],
    prerequisites: ["RLVR 与 GRPO", "基础统计与置信区间"],
    terms: [
      { term: "Test-time compute", zh: "测试时计算", meaning: "在推理阶段投入更多 token、采样或搜索预算。" },
      { term: "pass@k", zh: "k 次采样通过率", meaning: "k 个候选中至少一个正确的概率指标。" },
      { term: "LLM-as-Judge", zh: "模型裁判", meaning: "用另一个 LLM 对答案评分，便宜但会继承 judge 偏好。" },
    ],
    facts: [
      "书中讨论 self-consistency、Tree/Graph of Thoughts、MCTS、Best-of-N 与 iterative refinement。",
      "RLVR 使用可自动验证的 reward 训练 reasoning capability。",
      "Evaluation 章节强调 benchmark contamination、overfitting 与 Goodhart’s Law。",
    ],
    explanations: [
      "更多 thinking token 像给解题者更多草稿纸，但如果策略在错误方向循环，预算越大浪费越多。",
      "LLM-as-Judge 是测量仪器。更换 judge、prompt 或打分顺序，都可能改变结果定义。",
    ],
    practice: ["同时报告 pass@1、pass@k、平均 token、P95 latency 和成本。", "固定 judge 版本与 rubric，并抽样做人工校准。", "对 benchmark 做去重与时间切分，保留私有 holdout。"],
    pitfalls: ["只报告最佳一次采样", "把 judge 分数当作客观真值", "不断调 prompt 直到 benchmark 上升"],
    formula: {
      expression: "pass@k = 1 − C(n−c,k) / C(n,k)",
      reading: "从 n 个样本中抽 k 个，至少一个成功的概率；c 是成功样本数。",
      symbols: [["n", "总采样数"], ["c", "其中成功的数量"], ["k", "评估时允许选择的候选数"]],
    },
    takeaways: ["Reasoning 是可训练也可搜索的过程。", "评估必须把质量与资源放在同一坐标系。", "任何单一指标被优化后都会变得不再可靠。"],
    sources: [source("RL for Large Reasoning Models", "Ch.13", "260–284"), source("LLM Evaluation", "Ch.14", "287–302")],
    labs: [],
    quizzes: [
      {
        topic: "Scaling",
        prompt: "Test-time scaling 最直接增加的是？",
        options: ["训练数据许可证", "推理阶段的采样/搜索预算", "GPU 制造良率", "tokenizer 词表"],
        answer: 1,
        explanation: "它在部署推理时投入更多计算。",
      },
      {
        topic: "Evaluation",
        prompt: "只展示 64 次采样中最好的结果，最容易掩盖？",
        options: ["真实 pass@1 与成本", "网页颜色", "模型参数量", "MCP transport"],
        answer: 0,
        explanation: "Best-of-N 质量必须与 N 和总成本一起报告。",
      },
      {
        topic: "Contamination",
        prompt: "Benchmark contamination 指？",
        options: ["测试题进入训练或调参数据", "GPU 温度过高", "HTML 被压缩", "用户切换主题"],
        answer: 0,
        explanation: "数据泄漏会让评测失去泛化意义。",
      },
      {
        topic: "评估设计",
        prompt: "为 reasoning agent 设计一张最小但可信的 scorecard。",
        hints: ["不要只有 accuracy。", "加入成本、时延和多次运行稳定性。", "说明 judge 与数据版本。"],
        answer:
          "至少包含 task success/pass@1、pass@k、平均与 P95 token/latency、每任务成本、重复运行方差、tool error rate、安全违规率；同时固定数据版本、judge、rubric、prompt 与随机种子，并报告人工校准样本。",
        variant: "如果 agent 能调用搜索，离线 benchmark 应如何防止答案泄漏？",
        rubric: "质量 1 分；成本/时延 1 分；稳定性 1 分；工具/安全 1 分；版本与校准 1 分。",
      },
      {
        topic: "Overthinking",
        prompt: "为什么给模型无限 thinking budget 可能降低真实系统质量？",
        hints: ["更多 token 不保证方向正确。", "考虑循环、延迟和机会成本。", "补上 adaptive budget 或 early stop。"],
        answer:
          "错误策略可能在同一路径循环、产生自洽但错误的理由；长输出增加延迟、成本和 context 污染，还挤占并发资源。应使用 verifier、进展检测、最大预算、置信度与任务难度驱动的 adaptive budget。",
        variant: "哪些任务适合固定小预算，哪些适合动态扩展？",
        rubric: "循环/错误 1 分；成本 1 分；系统资源 1 分；至少两种控制策略 2 分。",
      },
    ],
  }),
  lesson({
    index: 5,
    slug: "agentic-stack",
    part: 5,
    partLabel: "Part V · Agentic AI",
    title: "Agentic AI Architecture Stack",
    subtitle: "从一次回答，升级为可观察、可约束、可持续运行的循环",
    chapters: "Ch.15",
    pageRange: "pp. 305–307",
    minutes: 34,
    summary:
      "一个生产 Agent 由五层组成：User/Human-in-the-Loop、Harness & Orchestration、Agent Core、External Systems & Knowledge、Environment。核心不是让 LLM 一次答对，而是让系统持续 perceive–reason/plan–act，并在每层保留边界、guardrail 和观测信号。",
    objectives: ["画出五层 Agentic stack", "解释模型与 Harness 的边界", "定位失败属于哪一层"],
    prerequisites: ["LLM、tools 与 basic loop"],
    terms: [
      { term: "Agent Core", zh: "智能体核心", meaning: "执行 perceive、reason/plan、act 循环的 LLM 驱动层。" },
      { term: "Harness", zh: "运行时编排壳", meaning: "管理 context、state、loop、guardrails 和 observability。" },
      { term: "Human-in-the-Loop", zh: "人在回路中", meaning: "人对高风险决策提供目标、监督、纠正或批准。" },
    ],
    facts: [
      "Figure 15.1 把 User、Harness、Agent Core、External Systems 与 Environment 画成分层架构。",
      "RAG 提供非参数知识，Memory 提供跨步和跨 session 的持续性。",
      "MCP 面向 tools，A2A 面向 agents；二者处在不同的互操作边界。",
    ],
    explanations: [
      "模型负责提出动作，Harness 决定动作是否允许、如何执行、结果如何进入下一轮，以及何时停止。",
      "把所有职责塞进 prompt 会让控制逻辑不可测试。把 guardrail、budget、retry 和 observation 变成显式程序状态，系统才可观察。",
    ],
    practice: ["每次 tool call 记录 request、result、latency、cost 与 error category。", "高风险动作先进入 approval gate。", "为 loop 设置完成条件、最大步数与无进展检测。"],
    pitfalls: ["把 private chain-of-thought 当作可观测性", "允许模型直接绕过 Harness 调工具", "没有区分 tool failure 与 reasoning failure"],
    takeaways: ["Agent 是分层系统，不是单个模型。", "Harness 是可靠性的主要落点。", "Human oversight 必须进入数据流而非停留在口号。"],
    sources: [source("Introduction to Agentic AI", "Ch.15, Fig.15.1", "305–307")],
    labs: ["architecture"],
    quizzes: [
      {
        topic: "Stack",
        prompt: "管理 retry、budget 与 observability 的主要层是？",
        options: ["Environment", "Harness & Orchestration", "Tokenizer", "RAG index"],
        answer: 1,
        explanation: "这些是运行时编排职责。",
      },
      {
        topic: "Protocols",
        prompt: "书中把工具互操作与 agent 间互操作分别对应为？",
        options: ["A2A / MCP", "MCP / A2A", "HTTP / SQL", "RL / SFT"],
        answer: 1,
        explanation: "MCP 面向工具与资源，A2A 面向 Agent。",
      },
      {
        topic: "Loop",
        prompt: "Agentic loop 的最小闭环是？",
        options: ["训练—部署", "感知—推理/规划—行动—观察", "上传—下载", "登录—退出"],
        answer: 1,
        explanation: "行动产生新 observation，进入下一轮。",
      },
      {
        topic: "故障定位",
        prompt: "Agent 选对了工具，但重复调用十次仍未停止，应主要检查哪几层？",
        hints: ["工具选择本身可能没错。", "看 stop condition、state update 与重复检测。", "把模型策略和 Harness 控制分开诊断。"],
        answer:
          "重点检查 Harness 的 loop state、termination condition、重复动作 hash、tool result 是否正确写回 context，以及 budget/maximum iteration；同时检查 Agent Core 是否忽略“已完成” observation。先用 trace 判断控制层是否允许了不必要的重复。",
        variant: "如果工具每次都返回稍有不同的时间戳，hash 去重应如何设计？",
        rubric: "Harness 2 分；state/context 1 分；Agent Core 1 分；给出 trace/去重验证 1 分。",
      },
      {
        topic: "安全边界",
        prompt: "为什么高风险 tool call 的 approval gate 应在 Harness，而不是只写进 system prompt？",
        hints: ["Prompt 是可被模型解释的文本。", "Harness 可以在执行前做确定性拦截。", "考虑 prompt injection。"],
        answer:
          "System prompt 只是模型行为约束，可能被误解、覆盖或遭间接 prompt injection；Harness 能根据工具、参数、用户权限和风险级别做确定性检查，在真正产生副作用前阻断并要求人工批准。",
        variant: "对于 read-only 工具与付款工具，approval policy 应如何不同？",
        rubric: "说明文本约束脆弱性 1 分；确定性拦截 2 分；副作用时点 1 分；分级策略 1 分。",
      },
    ],
  }),
  lesson({
    index: 6,
    slug: "rag-memory",
    part: 5,
    partLabel: "Part V · Knowledge & Memory",
    title: "RAG 与 Memory：知道什么，以及记住什么",
    subtitle: "Retrieval 解决外部知识，Memory 解决跨步连续性",
    chapters: "Ch.16–17",
    pageRange: "pp. 308–355",
    minutes: 48,
    summary:
      "RAG 在每次推理前检索外部证据；Memory 则把 working、episodic、semantic、procedural 等长期信息组织起来。二者都不是“把更多文本塞进 context”，而是围绕写入、检索、排序、压缩与遗忘建立策略。",
    objectives: ["比较 RAG、fine-tuning 与 long context", "区分四类 memory", "解释 chunking、hybrid search 与 reranking"],
    prerequisites: ["Embeddings、BM25 与 context window 的基本概念"],
    terms: [
      { term: "Hybrid search", zh: "混合检索", meaning: "结合 lexical/BM25 与 dense embedding 的召回。" },
      { term: "Episodic memory", zh: "情景记忆", meaning: "保存具体经历、时间与结果。" },
      { term: "Semantic memory", zh: "语义记忆", meaning: "从多次经历抽象出的稳定事实与概念。" },
    ],
    facts: [
      "RAG pipeline 包括 ingestion、chunking、embedding/indexing、retrieval、reranking 与 generation。",
      "Ch.17 以 working、episodic、semantic、procedural 划分 Agent memory。",
      "Memory 写入本身需要 policy：不是每条 observation 都值得永久保存。",
    ],
    explanations: [
      "RAG 像查资料，Memory 像形成经验。一次搜索结果可以进入当前 context，但只有经过去重、验证和抽象，才适合变成长期记忆。",
      "chunk 太小会失去语义边界，太大则降低定位精度并浪费 token；top-k 太小漏召回，太大引入噪声。",
    ],
    practice: ["先做 metadata filter，再做 hybrid retrieval 与 rerank。", "Memory 写入记录来源、时间、置信度与过期策略。", "把用户偏好与事实知识分开存储并允许纠正。"],
    pitfalls: ["把 vector database 当作完整 memory system", "把模型生成内容未经验证写回长期记忆", "只优化 recall 而不看 grounded answer quality"],
    takeaways: ["Retrieval 质量由召回、排序和 context 编排共同决定。", "Memory 需要写、读、改、忘四种能力。", "来源与时间是长期记忆的一部分。"],
    sources: [source("Retrieval-Augmented Generation", "Ch.16", "308–332"), source("Agentic Memory Systems", "Ch.17", "333–355")],
    labs: ["rag", "memory"],
    quizzes: [
      {
        topic: "RAG",
        prompt: "Hybrid search 通常组合？",
        options: ["BM25 与 dense retrieval", "PPO 与 DPO", "CSS 与 HTML", "CPU 与键盘"],
        answer: 0,
        explanation: "lexical 与 semantic 召回互补。",
      },
      {
        topic: "Memory",
        prompt: "“上次部署因权限配置失败”最接近哪类 memory？",
        options: ["Working", "Episodic", "Semantic", "Procedural"],
        answer: 1,
        explanation: "它是带时间和结果的具体经历。",
      },
      {
        topic: "Chunking",
        prompt: "chunk 过大最常见的直接代价？",
        options: ["上下文噪声与 token 成本增加", "模型参数减少", "网络永不失败", "自动获得引用"],
        answer: 0,
        explanation: "大块定位粗，会带入更多无关内容。",
      },
      {
        topic: "Memory policy",
        prompt: "设计一条“会议纪要 → 长期 Memory”的写入流程。",
        hints: ["先区分原始记录与稳定事实。", "加入来源、时间、参与者与置信度。", "处理冲突、过期和用户纠正。"],
        answer:
          "保留原始纪要作为可追溯 episode；抽取决策、负责人和截止时间，经用户确认后写成 semantic/procedural items；每条附 source、timestamp、scope、confidence；后续冲突时保留版本并触发确认；到期事项自动降权或归档。",
        variant: "如果会议内容含敏感个人信息，写入 policy 还需增加什么？",
        rubric: "原始/抽象分层 1 分；metadata 1 分；确认 1 分；冲突/过期 1 分；隐私边界 1 分。",
      },
      {
        topic: "RAG evaluation",
        prompt: "如何区分“没检索到”与“检索到了但模型没用好”？",
        hints: ["把 pipeline 拆成 retrieval 与 generation。", "分别测 evidence recall 和 grounded answer。", "做 oracle context 对照。"],
        answer:
          "先标注 gold evidence，测 recall@k、MRR/nDCG；再固定检索结果评估答案引用与忠实度；把 gold evidence 直接放入 context 作为 oracle：若 oracle 仍失败是生成/理解问题，若 oracle 成功而正常流程失败是检索或排序问题。",
        variant: "如果检索命中但证据已过期，指标应如何反映？",
        rubric: "检索指标 1 分；生成指标 1 分；oracle 对照 2 分；时效性 1 分。",
      },
    ],
  }),
  lesson({
    index: 7,
    slug: "harness-loop",
    part: 5,
    partLabel: "Part V · Runtime",
    title: "Agent Harness 与 Loop Engineering",
    subtitle: "真正的自主性来自可控循环，而不是无限循环",
    chapters: "Ch.18–19",
    pageRange: "pp. 357–397",
    minutes: 46,
    summary:
      "Harness 管理 context、state、tools、guardrails 与 observability；Loop Engineering 则把 generate–verify–retry 变成可优化的 inference-time process。优秀系统会动态分配 budget、检测无进展、保存 checkpoint，并在不确定时升级给人。",
    objectives: ["比较 ReAct 与 Plan-and-Execute", "设计 context compression", "为 loop 定义 budget 与停止条件"],
    prerequisites: ["Agentic stack", "基本 tool calling"],
    terms: [
      { term: "ReAct", zh: "推理-行动交替", meaning: "在短循环中交替决定 action 并读取 observation。" },
      { term: "Plan-and-Execute", zh: "先规划再执行", meaning: "先形成任务分解，再逐步执行并重规划。" },
      { term: "Loop engineering", zh: "循环工程", meaning: "对生成、验证、重试、预算和终止进行系统化设计。" },
    ],
    facts: [
      "Ch.18 讨论 context management、MCP integration、ReAct、Plan-and-Execute、reflection 等 orchestration patterns。",
      "Ch.19 把 retry/verify、adaptive compute 与 inference-time RL 视作优化循环。",
      "可靠 loop 需要 termination、max iteration、timeout 与 escalation。",
    ],
    explanations: [
      "ReAct 适合下一步依赖最新 observation 的任务；Plan-and-Execute 适合可分解、可并行或需要全局约束的任务。",
      "Context 不是日志仓库。Harness 要把原始 trace、可见 working state 与长期 memory 分开管理。",
    ],
    practice: ["为每一步保存 state transition，而非只保存聊天文本。", "工具错误按 retryable、fatal、permission、invalid-args 分类。", "无进展时改变策略，不只是重复同一 prompt。"],
    pitfalls: ["把隐藏 chain-of-thought 当成必要日志", "重试不改变任何条件", "摘要压缩掉未完成约束和错误证据"],
    takeaways: ["循环必须有预算、验证器和退出路径。", "Context management 是可靠性与成本共同问题。", "失败分类比统一重试更重要。"],
    sources: [source("Agent Harness", "Ch.18", "357–382"), source("Loop Engineering", "Ch.19", "383–397")],
    labs: ["loop"],
    quizzes: [
      {
        topic: "Pattern",
        prompt: "高度依赖每次最新网页 observation 的任务更适合先考虑？",
        options: ["ReAct", "只做一次静态计划", "取消工具", "只用 SFT"],
        answer: 0,
        explanation: "ReAct 能按 observation 逐步调整动作。",
      },
      {
        topic: "Retry",
        prompt: "完全相同条件下重复同一失败 action 属于？",
        options: ["有效探索", "无进展循环", "模型压缩", "数据增强"],
        answer: 1,
        explanation: "重试必须改变参数、上下文、工具或策略。",
      },
      {
        topic: "Context",
        prompt: "Context compression 最不该丢掉？",
        options: ["重复客套话", "未完成约束与关键失败证据", "过期时间戳", "重复 tool schema"],
        answer: 1,
        explanation: "它们决定下一步是否正确。",
      },
      {
        topic: "Loop design",
        prompt: "为“修复代码直到测试通过”设计 termination 与 escalation。",
        hints: ["成功不只看进程退出码。", "定义最大轮次、无进展和资源预算。", "升级时保留可用的 partial work。"],
        answer:
          "成功条件为目标测试通过且无新增回归；同时设置最大轮次、token/时间预算、连续相同失败阈值；若无进展，切换诊断策略或回退 checkpoint；仍失败则提交已改文件、测试日志、剩余假设和明确求助问题给人。",
        variant: "如果测试本身 flaky，应如何避免错误终止？",
        rubric: "成功条件 1 分；预算 1 分；无进展 1 分；策略切换/回退 1 分；partial handoff 1 分。",
      },
      {
        topic: "Context policy",
        prompt: "工具返回 10 万行日志时，Harness 应如何处理？",
        hints: ["不要原样放回模型 context。", "保留原始 artifact 与可追溯指针。", "抽取与当前目标相关的窗口和统计。"],
        answer:
          "原始日志独立持久化并保留 URI/hash；用规则先提取 error、时间窗口、频次和上下文片段；模型只接收摘要、关键行与检索工具；后续需要时按行号回取。摘要必须保留不确定性和被省略范围。",
        variant: "如果日志中可能含密钥，还需在哪一层脱敏？",
        rubric: "外部存储 1 分；检索/切片 1 分；摘要 1 分；可追溯 1 分；敏感信息处理 1 分。",
      },
    ],
  }),
  lesson({
    index: 8,
    slug: "patterns-environments",
    part: 5,
    partLabel: "Part V · Patterns",
    title: "Design Patterns 与 Agentic Environments",
    subtitle: "先用最简单的 workflow，复杂性必须靠收益挣回来",
    chapters: "Ch.20–21",
    pageRange: "pp. 398–420",
    minutes: 38,
    summary:
      "Prompt chaining、routing、parallelization、orchestrator-workers、evaluator-optimizer 与 autonomous agents 形成复杂度阶梯。环境与 benchmark 则决定 Agent 能观察什么、能做什么、怎样判定成功。模式选择必须服从任务结构。",
    objectives: ["按任务结构选择 pattern", "定义环境 observation/action/reward", "评估 benchmark 是否代表生产分布"],
    prerequisites: ["Harness 与 loop", "基本评估方法"],
    terms: [
      { term: "Routing", zh: "路由模式", meaning: "根据输入类型选择专门流程或模型。" },
      { term: "Orchestrator-workers", zh: "编排者-工作者", meaning: "中心 Agent 动态拆分任务并汇总子任务。" },
      { term: "Environment", zh: "环境", meaning: "向 Agent 暴露 observations、actions 与反馈的可交互世界。" },
    ],
    facts: [
      "设计模式从确定性 workflow 到开放式 autonomous loop 逐步增加灵活性和风险。",
      "Agentic benchmark 通常按 task success、步骤、工具使用、成本与安全等维度评估。",
      "环境真实性决定训练行为能否迁移到生产。",
    ],
    explanations: [
      "不要用 Agent 解决所有问题。固定三步流程能完成的任务，用 workflow 更便宜、更易测。",
      "Benchmark 是小型世界。它若没有权限错误、网络抖动、歧义需求和恢复路径，就无法代表真实系统。",
    ],
    practice: ["从 prompt chaining/routing 起步，只有指标证明不足才升级自主性。", "环境提供可重复 reset、snapshot 与 deterministic seed。", "评估成功率时同时统计人类介入和隐藏重试。"],
    pitfalls: ["把更多 agents 当作天然更智能", "只测 happy path", "让 evaluator 与被测模型共享同一偏见"],
    takeaways: ["模式应匹配任务分解方式。", "环境定义了 Agent 能学到的世界。", "复杂性需要以质量或吞吐收益证明。"],
    sources: [source("Agent Design Patterns", "Ch.20", "398–403"), source("Agentic Environments and Benchmarks", "Ch.21", "404–420")],
    labs: [],
    quizzes: [
      {
        topic: "Patterns",
        prompt: "输入类别清晰且每类有固定处理器时，优先使用？",
        options: ["Routing", "无限 autonomous loop", "MCTS", "删除评估"],
        answer: 0,
        explanation: "Routing 简单、可控且容易监控。",
      },
      {
        topic: "Complexity",
        prompt: "把单 Agent 升级为多 Agent 前最需要的证据？",
        options: ["更漂亮的架构图", "质量/吞吐收益超过通信与协调成本", "更多 prompt", "更多颜色"],
        answer: 1,
        explanation: "复杂性应由可测收益支撑。",
      },
      {
        topic: "Environment",
        prompt: "可重复 reset 对 Agent benchmark 的主要价值？",
        options: ["可比较与复现实验", "增加参数量", "隐藏失败", "替代 reward"],
        answer: 0,
        explanation: "相同初始状态让不同策略可公平比较。",
      },
      {
        topic: "模式设计",
        prompt: "为“收集三类独立证据并形成报告”选择 workflow。",
        hints: ["三个证据源可以并行。", "需要一个汇总者处理冲突。", "先别默认开放式多 Agent 对话。"],
        answer:
          "使用 parallelization：三个受限 worker 分别收集证据，返回统一 schema；一个 deterministic aggregator 做去重、来源核对与冲突标记，再由单一 writer 生成报告。只有证据检索需要动态分解时才引入 orchestrator。",
        variant: "如果三条证据链彼此依赖，哪些部分必须改成串行？",
        rubric: "并行 1 分；统一接口 1 分；汇总/冲突 1 分；复杂度控制 1 分；依赖处理 1 分。",
      },
      {
        topic: "Benchmark",
        prompt: "如何让办公 Agent benchmark 更接近生产？",
        hints: ["加入权限、歧义和外部失败。", "任务成功之外记录恢复能力。", "避免只用静态、已知答案任务。"],
        answer:
          "加入真实文档格式、权限边界、变动 UI、网络错误、歧义需求和需要澄清的任务；评估 end-to-end success、无害失败、恢复率、人工介入、成本与审计完整性；保留未公开且随时间更新的任务集。",
        variant: "生产数据不能公开时，如何兼顾隐私与可复现？",
        rubric: "真实扰动 2 分；多指标 1 分；动态/私有 holdout 1 分；隐私方案 1 分。",
      },
    ],
  }),
  lesson({
    index: 9,
    slug: "protocols",
    part: 5,
    partLabel: "Part V · Protocols",
    title: "MCP、Agent Skills 与 A2A",
    subtitle: "标准化能力边界，避免每个框架重复造一遍连接器",
    chapters: "Ch.22–24",
    pageRange: "pp. 421–466",
    minutes: 49,
    summary:
      "MCP 定义 Host–Client–Server 的工具、资源和 prompt 互操作；Skills 把多步能力封装成可发现、可组合的操作单元；A2A 用 Agent Card、task lifecycle 与消息/制品交换连接独立 Agent。协议减少集成成本，但不会自动解决权限和信任。",
    objectives: ["解释 MCP 三角色模型", "区分 tool 与 skill", "描述 A2A task lifecycle"],
    prerequisites: ["JSON-RPC、client-server 与 tool calling"],
    terms: [
      { term: "MCP Host", zh: "MCP 宿主", meaning: "用户交互的应用，负责连接、权限与总体体验。" },
      { term: "Skill", zh: "技能", meaning: "带说明、输入输出和执行步骤的可复用能力封装。" },
      { term: "Agent Card", zh: "Agent 名片", meaning: "A2A 中描述 Agent 身份、能力和端点的发现信息。" },
    ],
    facts: [
      "MCP 的 Host 包含一个或多个 Client；每个 Client 与一个 Server 维持 stateful one-to-one connection。",
      "MCP Server 暴露 tools、resources 与 prompts 等 capability。",
      "A2A 围绕 Agent discovery、task、message、artifact 与 streaming 建立跨 Agent 协作。",
    ],
    explanations: [
      "MCP 类似把“如何接每种工具”统一成协议；Skill 则进一步说明“怎样把若干工具组合成一项可靠能力”。",
      "A2A 连接的是有自主任务生命周期的 Agent，不是把另一个 Agent 当成无状态函数。",
    ],
    practice: ["Server 最小权限暴露，Host 执行用户授权与审计。", "Skill 明确前置条件、失败模式、幂等性与输出 schema。", "A2A artifact 保留来源、版本和任务关联。"],
    pitfalls: ["把 MCP Server 视作可信边界内代码", "工具描述过度宽泛导致误调用", "跨 Agent 转发敏感上下文而未最小化"],
    takeaways: ["协议解决互操作，不替代安全设计。", "Skill 是能力抽象，不只是 prompt 文件。", "A2A 的核心是任务状态与跨组织边界。"],
    sources: [source("Model Context Protocol", "Ch.22", "421–440"), source("Agent Skills", "Ch.23", "441–445"), source("A2A", "Ch.24", "446–466")],
    labs: ["mcp"],
    quizzes: [
      {
        topic: "MCP",
        prompt: "MCP 中直接与某一 Server 维持连接的是？",
        options: ["Host 内的 Client", "最终用户", "Reward model", "Tokenizer"],
        answer: 0,
        explanation: "Host 可包含多个 Client，每个 Client 对应一个 Server connection。",
      },
      {
        topic: "Skills",
        prompt: "Skill 相比单个 tool 更强调？",
        options: ["多步能力、前置条件与组合流程", "更大的模型参数", "更长 CSS", "关闭审计"],
        answer: 0,
        explanation: "Skill 抽象可复用任务能力，而不只是一次函数调用。",
      },
      {
        topic: "A2A",
        prompt: "Agent Card 的主要用途？",
        options: ["声明 Agent 能力与连接信息", "保存 GPU 权重", "计算 attention", "替代用户授权"],
        answer: 0,
        explanation: "它支持发现与能力协商。",
      },
      {
        topic: "MCP security",
        prompt: "设计一个文件系统 MCP Server 的最小权限策略。",
        hints: ["先限定根目录和操作类型。", "区分 read、write、delete。", "加入路径规范化、审计与用户确认。"],
        answer:
          "Server 只暴露明确允许的 workspace roots；规范化路径并拒绝越界与 symlink escape；read 默认允许，write 按范围授权，delete/覆盖要求明确确认；限制文件大小和类型；记录调用者、参数摘要、结果与时间，并对敏感内容脱敏。",
        variant: "如果 Server 能执行 shell，还需增加哪些隔离？",
        rubric: "范围 1 分；路径安全 1 分；分级授权 1 分；审计 1 分；资源/敏感限制 1 分。",
      },
      {
        topic: "A2A trust",
        prompt: "为什么收到另一个 Agent 的 artifact 仍需验证？",
        hints: ["Agent 可能错误、被攻击或使用不同策略。", "Artifact 的来源与完整性需要确认。", "接收方仍承担执行副作用。"],
        answer:
          "跨 Agent 输出是外部输入，可能包含幻觉、恶意内容、过期状态或 prompt injection。接收方要验证身份、签名/完整性、schema、来源和任务上下文，并在执行有副作用动作前重新走本地权限与 approval policy。",
        variant: "同一公司内部 Agent 是否可以跳过这些步骤？",
        rubric: "外部输入风险 1 分；身份/完整性 1 分；schema/来源 1 分；本地权限 1 分；内部边界讨论 1 分。",
      },
    ],
  }),
  lesson({
    index: 10,
    slug: "multiagent-frameworks",
    part: 5,
    partLabel: "Part V · Multi-Agent",
    title: "Multi-Agent Systems 与 Frameworks",
    subtitle: "专业化可以提高质量，通信也会放大成本与错误",
    chapters: "Ch.25–26",
    pageRange: "pp. 468–520",
    minutes: 47,
    summary:
      "多 Agent 架构通过 specialization、parallelism、critique 与 redundancy 处理复杂任务；代价是 token 通信、非平稳协作、credit assignment 与新型安全风险。Framework 只是把 state graph、handoff、tool、memory 等机制落地，不能替代架构判断。",
    objectives: ["比较 centralized、decentralized、hierarchical topology", "估算通信成本", "选择 framework 而非被 framework 选择"],
    prerequisites: ["A2A、orchestration patterns 与 evaluation"],
    terms: [
      { term: "Centralized topology", zh: "中心化拓扑", meaning: "由单一 coordinator 分配和汇总任务。" },
      { term: "CTDE", zh: "集中训练、分散执行", meaning: "训练时共享全局信息，执行时各 Agent 独立行动。" },
      { term: "Handoff", zh: "任务移交", meaning: "将控制权和必要上下文交给另一个专门 Agent。" },
    ],
    facts: [
      "Ch.25 讨论 centralized、decentralized、hierarchical、debate、marketplace 与 swarm 等结构。",
      "书中强调 specialization、parallelism、robustness 与 emergent capabilities，同时指出 communication overhead 与 safety。",
      "Ch.26 比较 LangGraph、CrewAI、AutoGen、OpenAI Agents SDK 等 framework 取向。",
    ],
    explanations: [
      "中心化容易调试但 coordinator 成为瓶颈；去中心化弹性强但难以形成一致状态；层级结构适合可递归分解任务。",
      "每条 inter-agent message 都消耗 token，也可能传播错误。更多“讨论”不自动带来更多信息。",
    ],
    practice: ["定义统一 message schema 与最大通信预算。", "为每个 Agent 记录独立贡献与可移除性。", "先实现单 Agent baseline，再证明多 Agent 增益。"],
    pitfalls: ["角色 prompt 不同就称为 specialization", "所有 Agent 共享整个 context", "只测最终成功率，不测通信和重复工作"],
    takeaways: ["Topology 决定可扩展性与故障形态。", "专业化要通过数据、工具或权限真正实现。", "Framework 是实现选择，不是研究结论。"],
    sources: [source("Multi-Agent Systems", "Ch.25", "468–488"), source("Agent Development Frameworks", "Ch.26", "489–520")],
    labs: ["multiagent"],
    quizzes: [
      {
        topic: "Topology",
        prompt: "中心化 topology 的典型单点风险是？",
        options: ["Coordinator bottleneck/failure", "没有任何日志", "模型一定更小", "无法使用 JSON"],
        answer: 0,
        explanation: "中心 coordinator 承担调度与汇总。",
      },
      {
        topic: "Specialization",
        prompt: "哪项最能证明真正的 Agent specialization？",
        options: ["名字不同", "拥有不同数据、工具、评估与职责边界", "头像不同", "语气不同"],
        answer: 1,
        explanation: "专业化应体现在能力和可测贡献上。",
      },
      {
        topic: "Framework",
        prompt: "选择 Agent framework 时最先问？",
        options: ["是否最流行", "任务需要的 state、durability、handoff 与 observability", "Logo 颜色", "示例数量是否最多"],
        answer: 1,
        explanation: "需求应先于框架偏好。",
      },
      {
        topic: "多 Agent 评估",
        prompt: "如何证明 reviewer Agent 真的提高了系统质量？",
        hints: ["需要单 Agent baseline。", "做移除 reviewer 的 ablation。", "同时计算 token、延迟和 false rejection。"],
        answer:
          "在同一任务集比较无 reviewer、同模型 self-review、独立 reviewer 三组；固定预算或同时报告额外成本；测最终正确率、发现错误率、误拒率、延迟与 token；对 reviewer 被移除或替换做 ablation，并分析它发现的独特错误。",
        variant: "如果 reviewer 与 worker 使用同一模型，独立性会受到什么影响？",
        rubric: "baseline 1 分；ablation 1 分；质量 1 分；成本 1 分；独立性 1 分。",
      },
      {
        topic: "安全",
        prompt: "为什么 prompt injection 在多 Agent 系统中可能级联放大？",
        hints: ["一个 Agent 的外部 observation 会变成另一个 Agent 的消息。", "下游可能默认信任上游。", "加入 provenance、taint 与最小权限。"],
        answer:
          "恶意内容进入一个 Agent 后，可能被包装成“可信结论”传给多个下游；共享 memory 和工具权限使其继续扩散。需要保留 provenance/taint、逐边界验证、最小化上下文、限制权限，并让安全监控能停止整个协作图。",
        variant: "Debate 架构会自动消除 injection 吗？为什么？",
        rubric: "传播链 2 分；信任问题 1 分；至少两种防护 2 分。",
      },
    ],
  }),
  lesson({
    index: 11,
    slug: "ui-future",
    part: 6,
    partLabel: "Parts V–VI · Interface & Reference",
    title: "Agentic UI、Quick Reference 与未来方向",
    subtitle: "用户不能信任自己看不见、不能纠正、不能中止的自主系统",
    chapters: "Ch.27–30",
    pageRange: "pp. 522–608",
    minutes: 42,
    summary:
      "Agentic UI 从聊天框扩展为 canvas、workflow、dashboard、collaborative 与 autonomous surfaces。核心设计原则是显示计划、工具、来源、状态、费用和可中断点，同时把用户反馈纳入 loop。最后三章提供测验、速查与开放问题。",
    objectives: ["选择合适的 UI paradigm", "设计透明且可中止的 Agent 体验", "识别未来研究的质量-成本-安全前沿"],
    prerequisites: ["Agentic stack 与 evaluation"],
    terms: [
      { term: "Generative UI", zh: "生成式界面", meaning: "根据任务动态生成合适的组件或结果视图。" },
      { term: "Progressive disclosure", zh: "渐进披露", meaning: "先展示关键状态，需要时再展开细节。" },
      { term: "Human oversight", zh: "人工监督", meaning: "让人能理解、纠正、批准和停止 Agent 行为。" },
    ],
    facts: [
      "Ch.27 比较 chat、canvas、workflow、dashboard、collaborative 与 autonomous UI。",
      "书中强调 streaming、tool visualization、context panels、HITL 与 accessibility。",
      "Ch.30 把 interaction learning、evaluation、security、coordination、efficiency 与 accessibility 列为开放方向。",
    ],
    explanations: [
      "透明不等于展示 private chain-of-thought。更有用的是目标、计划摘要、工具动作、证据、状态、风险与下一步。",
      "Autonomy 是可调的产品参数。低风险读操作可以自动，高风险写操作应升级为 preview 或 approval。",
    ],
    practice: ["长任务显示阶段、已完成/待完成、成本与停止按钮。", "有副作用的动作先展示 diff 或 preview。", "失败时保留 partial result 与可恢复 checkpoint。"],
    pitfalls: ["用拟人化动画掩盖不确定性", "把所有内部日志暴露给用户", "没有可访问的键盘与屏幕阅读器路径"],
    takeaways: ["UI 是控制系统的一部分。", "可见、可纠正、可停止是信任基础。", "未来竞争会落在质量-成本-安全联合前沿。"],
    sources: [source("Agentic UI Frameworks", "Ch.27", "522–543"), source("Assessment, Quick Reference and Future", "Ch.28–30", "545–608")],
    labs: [],
    quizzes: [
      {
        topic: "UI",
        prompt: "长时间 Agent 任务最重要的界面能力之一是？",
        options: ["只显示旋转动画", "显示阶段、证据、成本并允许停止", "隐藏所有工具动作", "自动刷新整页"],
        answer: 1,
        explanation: "用户需要理解和控制运行过程。",
      },
      {
        topic: "Transparency",
        prompt: "有用的透明度最应展示？",
        options: ["私密逐 token 思维", "计划摘要、工具、来源、状态与风险", "模型训练数据全文", "GPU 序列号"],
        answer: 1,
        explanation: "这些信息可验证、可行动且不依赖暴露 private reasoning。",
      },
      {
        topic: "Autonomy",
        prompt: "对付款这类高风险动作，默认交互应是？",
        options: ["直接执行", "preview + 明确用户批准", "随机决定", "交给另一个 Agent 自动同意"],
        answer: 1,
        explanation: "副作用与风险决定 approval gate。",
      },
      {
        topic: "UI 设计",
        prompt: "为一个 20 分钟 research Agent 设计最小进度界面。",
        hints: ["用户要知道现在在哪一步。", "显示证据与成本，而非 private reasoning。", "提供暂停、停止和部分结果。"],
        answer:
          "展示目标、当前阶段、已完成/待完成任务、使用中的来源与工具、已耗时间/token/费用、最近一次可恢复 checkpoint；提供暂停、停止、修改范围和查看 partial result；出现高风险或不确定性时明确请求用户选择。",
        variant: "如果任务可并行运行三个 worker，进度如何避免信息过载？",
        rubric: "状态 1 分；证据/工具 1 分；成本 1 分；控制 1 分；checkpoint/异常 1 分。",
      },
      {
        topic: "未来方向",
        prompt: "为什么未来 Agent evaluation 必须从“准确率”扩展到 cost-quality frontier？",
        hints: ["两个系统可以同样正确但成本差十倍。", "自主系统会消耗 token、时间、工具与人工注意力。", "还要考虑稳定性和安全。"],
        answer:
          "准确率无法区分同质量下十倍成本差异，也不反映 latency、重试、工具调用和人工监督。真实部署需要在 success、cost、time、variance、safety 与 recoverability 上比较 Pareto frontier，而不是只优化单点分数。",
        variant: "小模型加工具与大模型少工具，应该怎样公平比较？",
        rubric: "成本差异 1 分；资源维度 1 分；稳定/安全 1 分；Pareto 思维 1 分；公平比较 1 分。",
      },
    ],
  }),
];

export const lessonBySlug = Object.fromEntries(lessons.map((item) => [item.slug, item]));
export const allQuizzes = lessons.flatMap((item) => item.quizzes.map((quiz) => ({ ...quiz, lessonSlug: item.slug })));
export const totalMinutes = lessons.reduce((sum, item) => sum + item.minutes, 0);
export const labCount = lessons.reduce((sum, item) => sum + item.labs.length, 0);

export function getLesson(slug: string): Lesson | undefined {
  return lessonBySlug[slug];
}

export function getAdjacentLessons(slug: string) {
  const index = lessons.findIndex((item) => item.slug === slug);
  return {
    previous: index > 0 ? lessons[index - 1] : null,
    next: index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null,
  };
}

export function searchLessons(query: string): Lesson[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return lessons.filter((item) => {
    const haystack = [
      item.title,
      item.subtitle,
      item.summary,
      item.chapters,
      ...item.terms.flatMap((term) => [term.term, term.zh, term.meaning]),
      ...item.facts,
      ...item.explanations,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export const labLabels: Record<LabKind, string> = {
  architecture: "架构分层浏览器",
  rag: "RAG 权衡实验",
  memory: "Memory 检索路径",
  loop: "Loop 策略演示",
  mcp: "MCP 时序步进",
  multiagent: "Multi-Agent 拓扑实验",
};
