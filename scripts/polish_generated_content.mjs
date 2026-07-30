import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const replacements = [
  [/全代理/g, "完整 Agentic"],
  [/完完整 Agentic/g, "完整 Agentic"],
  [/AgenticRAG/g, "Agentic RAG"],
  [/代理性/g, "Agentic 特征"],
  [/代理人|代理商|特工/g, "Agent"],
  [/代理/g, "Agent"],
  [/议定书/g, "protocol"],
  [/寿命周期/g, "生命周期"],
  [/线线线/g, "连接"],
  [/线线/g, "连接"],
  [/子小区/g, "sub-query"],
  [/获取-?强化生成/g, "RAG"],
  [/检索增强生成/g, "RAG"],
  [/模型上下文协议/g, "MCP"],
  [/大型语言模型/g, "LLM"],
  [/变压器/g, "Transformer"],
  [/奖励模型/g, "Reward Model"],
  [/工具调用|工具呼叫/g, "tool calling"],
  [/上下文窗口/g, "context window"],
  [/奖励黑客/g, "reward hacking"],
  [/评价/g, "评估"],
  [/文件的引用/g, "文档引用"],
  [/检索到的文件/g, "检索到的文档"],
  [/错误和回收 UI/g, "错误与恢复 UI"],
  [/界面界面/g, "界面"],
  [/可选择选项/g, "可选项"],
  [/agent[’']s 的/gi, "Agent 的"],
  [/Client端/g, "Client"],
  [/Server端/g, "Server"],
  [/每MCP/g, "每个 MCP"],
  [/\bagents\b/gi, "Agents"],
  [/\bagent\b/gi, "Agent"],
  [/\bllms\b/gi, "LLMs"],
  [/\bllm\b/gi, "LLM"],
  [/\brag\b/gi, "RAG"],
  [/\bmcp\b/gi, "MCP"],
  [/\ba2a\b/gi, "A2A"],
  [/\blangchain\b/gi, "LangChain"],
  [/\bjson-rpc\b/gi, "JSON-RPC"],
  [/快速\)/g, "prompt）"],
  [/1。/g, "1. "],
  [/2。/g, "2. "],
  [/3。/g, "3. "],
  [/4。/g, "4. "],
  [/5。/g, "5. "],
];

const titleOverrides = new Map([
  ["When to Use RAG vs. Fine-Tuning vs. Long Context", "何时选择 RAG、Fine-Tuning 或 Long Context"],
  ["Full Pipeline Diagram", "完整 RAG Pipeline 图"],
  ["Indexing Pipeline", "索引 Pipeline"],
  ["Dense Retrieval: DPR", "Dense Retrieval：DPR"],
  ["Hybrid Retrieval with Reciprocal Rank Fusion", "使用 Reciprocal Rank Fusion 的 Hybrid Retrieval"],
  ["Learned Sparse Retrieval: SPLADE and SPLADEv2", "Learned Sparse Retrieval：SPLADE 与 SPLADEv2"],
  ["ColBERT: Late Interaction", "ColBERT：Late Interaction"],
  ["Chunking Strategies", "Chunking 策略"],
  ["Fixed-Size Chunking with Overlap", "带 overlap 的固定长度 Chunking"],
  ["Semantic Chunking", "Semantic Chunking"],
  ["Document-Structure-Aware Chunking", "面向文档结构的 Chunking"],
  ["Parent-Child Chunking", "Parent-Child Chunking"],
  ["Empirical Guidelines for Chunk Size", "Chunk Size 的经验指南"],
  ["Re-Ranking", "Re-Ranking"],
  ["Self-RAG", "Self-RAG"],
  ["RAG-Fusion", "RAG-Fusion"],
  ["Agentic RAG", "Agentic RAG"],
  ["Multi-Source Routing", "Multi-Source Routing"],
  ["Full Agentic RAG Implementation", "完整 Agentic RAG 实现"],
  ["Retrieval Metrics", "检索指标"],
  ["Generation Metrics", "生成指标"],
  ["Model Context Protocol (MCP)", "Model Context Protocol（MCP）"],
  ["Protocol Lifecycle", "Protocol 生命周期"],
  ["Error and Recovery UI", "错误与恢复 UI"],
]);

const blockTextOverrides = new Map([
  [
    "s-1-4-2-b8",
    "• Format tokens：特殊 token（如 <|user|> 与 <|assistant|>）用于标记对话角色，并引导模型生成与相应角色一致的内容。",
  ],
  [
    "s-1-6-3-b1",
    "FlashAttention 前向计算的分块设置：设 SRAM 容量为 M，块大小取 Br = ⌈M/(4d)⌉，Bc = min(⌈M/(4d)⌉, d)。",
  ],
  [
    "s-1-7-3-b1",
    "Hoffmann 等人 [140] 指出，compute-optimal training 必须同时平衡模型规模 N 与数据规模 D，两者都大致按总计算量 C 的平方根扩展。70B 模型的 Chinchilla-optimal 数据量约为 1.4T tokens。实际部署中常会让较小模型读取更多数据、进行 over-training，因为 inference cost 主要随模型参数量而不是训练 token 数增长；较小但训练更充分的模型通常更便宜。",
  ],
  [
    "s-1-9-3-b7",
    "这种方法把可训练参数量降到 LoRA 的约十分之一（每层只需 r+d 个参数），同时可达到 LoRA 约 90%–95% 的质量，适合需要维护数百个任务专用 adapter、又希望尽量节省存储的场景。以 70B 模型为例，full fine-tuning 约需 140 GB weights、280 GB optimizer state 和 140 GB gradients，共 560 GB；QLoRA 则通过量化基座权重与低秩更新显著降低训练显存。",
  ],
  [
    "s-1-10-4-b1",
    "原书比较了几类代表性 MoE：Switch Transformer 使用 128 个 expert、Top-1 routing，把超大规模 MoE 路由简化；Mixtral 8×7B 共有 47B 参数、每个 token 激活约 13B，以 Top-2 routing 获得接近 Llama-2 70B 的质量；DeepSeek-V2 采用 shared expert 与 routed expert 组合；Qwen-MoE 使用更细粒度的 expert 以提高效率。表格的核心是区分 total parameters、active parameters、expert 数量和 routing 方式。",
  ],
  [
    "s-2-1-1-b6",
    "深度学习负载主要由矩阵乘法构成：在 O(n²) 规模的数据上执行 O(n³) 次运算，天然适合大规模并行。以 70B 模型为例，单次 Transformer 前向计算每个 token 约需 140 TFLOP，正好能够利用 GPU 的高吞吐能力。",
  ],
  [
    "s-2-1-6-b9",
    "NVMe：Samsung 990 Pro 等 NVMe SSD 的顺序读取速度约为 7 GB/s。ZeRO-Infinity 可以把 optimizer state 卸载到 NVMe，但只有当计算与 I/O 的比值足够高时才可行，例如 batch 较大、单个训练 step 较慢的场景。",
  ],
  [
    "s-2-1-10-b33",
    "• FSDP/ZeRO：在通信阶段使用 AllGather 与 ReduceScatter。它与 Data Parallelism 的通信模式相近，但会进一步切分 optimizer state。",
  ],
  [
    "s-3-3-b10",
    "• Policy-Based 方法：直接参数化并优化策略 πθ(a|s)，更自然地适用于连续或高维动作空间。",
  ],
  [
    "s-3-5-b13",
    "6. 同步 target network：每隔 C 个 step 执行一次 θ̄ ← θ。",
  ],
  [
    "s-4-2-b2",
    "• State st=(x,y1,…,yt−1)：由输入 x 与截至当前已经生成的全部 token 构成的中间状态。",
  ],
  [
    "s-5-7-1-b11",
    "为什么要保存 log-probability？在 rollout 阶段把 log πθold(at|st) 保存为标量，优化时便无需再次运行冻结的旧策略网络。这样每个 mini-batch 可少做一次完整前向计算；对 70B 级模型而言，这一节省非常显著。",
  ],
  [
    "s-7-5-9-b3",
    "• binary_kl：当 token 的 πθ log(πθ/πold) 超过阈值 δ 时，将该 token mask 掉。",
  ],
  [
    "s-8-1-4-b1",
    "Offline DPO 使用静态 preference pairs，需要 policy 与 reference 两个模型，适合计算预算有限的快速 alignment。Online DPO 从当前策略 πθ 重新采样，并引入 Reward Model，适合离线 DPO 已进入平台期、需要继续探索的阶段。PPO 同样使用新鲜 sample，但还需要 value head 和 clipped objective，系统最复杂，适合追求更高上限且能够承担完整 RL infrastructure 的场景。",
  ],
  [
    "s-9-7-b24",
    "NDCG：当排序列表顶部的质量比尾部更重要时，适合使用这一指标。",
  ],
  [
    "s-11-6-1-b2",
    "• 对一个 4K-token、32 个 attention head 的序列，仅 attention matrix 就约需 4 GB 显存。",
  ],
  [
    "s-11-2-3-b9",
    "在进入下一个 Tensor Parallel layer 前，需要通过 AllGather 重新聚合被切分的 tensor。",
  ],
  [
    "s-11-11-1-b5",
    "1. 通信开销：FSDP 的 AllGather/ReduceScatter 在 64 张 GPU 规模下约占 10%–15%。",
  ],
  [
    "s-11-15-3-b1",
    "Adam 默认的 β₂=0.999 会为二阶矩估计保留很长的记忆，等效窗口约为 1000 个 step。RL 训练中，策略不断变化，1000 step 之前的梯度方差往往已失去参考价值。把 β₂ 调到 0.95 可将窗口缩短到约 20 step，使 adaptive learning rate 更快响应当前梯度统计。对于 batch 极小的在线 RL，β₂=0.95 可能让二阶矩估计过于嘈杂；此时可折中使用 0.99，或通过 gradient accumulation 增大有效 batch。",
  ],
  [
    "s-11-15-5-b1",
    "在 PPO 与 GRPO 中，reward signal 的方差可能很大，尤其在训练早期。一个异常 batch 就可能产生 norm 超过 100 的 gradient，从而破坏模型权重；因此 max_grad_norm=1.0 是常用设置。SFT 对 clipping 的依赖较弱，但仍建议保留。原书特别强调：RL 训练不应关闭 gradient clipping，因为策略更新的反馈环会放大一次失控更新的后果。",
  ],
  [
    "s-12-6-2-b14",
    "具体示例：“汇总上周 Project Alpha 的邮件，并创建一页状态更新 slide。”原书用这一任务把 POMDP 中的抽象量映射到真实执行：初始环境含 47 封相关邮件和一份 12 页的 Q3 status.pptx；Agent 先检索并读取最相关的邮件线程，归纳出截止日期、预算和供应商三项决定，再读取演示文稿末页，调用 PowerPoint 工具新增第 13 页。环境返回成功 observation，最终 reward 由任务完成度、信息质量、格式合规与执行效率共同组成，总分为 0.95。这个例子强调：state、observation、action、transition 和 reward 在工具型 Agent 中都有具体对应物。",
  ],
  [
    "s-13-4-3-b1",
    "o1 技术报告给出了一条清晰的 scaling law：在高难度推理任务上，增加 thinking tokens 会单调改善表现。系统用 thinking budget 控制隐藏推理 token 的最大数量；令 T 表示这一预算，经验曲线可写成趋向某个准确率上限的饱和函数。原书举例称，在 AIME 2024 上，o1 使用完整 thinking budget 时准确率约为 83%，而不扩展推理过程的 GPT-4o 约为 13%。",
  ],
  [
    "s-13-7-1-b1",
    "Reasoning model 的核心资源分配问题是：在固定总计算预算 Ctotal=Ctrain+N·Ctest 下，应怎样平衡 training compute 与每次 query 的 test-time compute？训练投入的改进可被 N 次请求摊销，而 test-time compute 只服务当前请求。最优点要求两边每增加一个 FLOP 带来的边际准确率收益相等；大规模部署通常更偏向训练投入，低频但高价值的困难请求则更适合增加 test-time search 或 thinking budget。",
  ],
  [
    "s-14-4-5-b5",
    "4. 对每个模型的得分报告 bootstrap confidence interval。",
  ],
  [
    "s-16-2-2-b2",
    "Chunking：长文档必须切分为既能放入 embedding model context window（通常为 512 tokens）、又保持语义一致的片段。Chunking 策略是 RAG 系统设计中影响最大的决策之一，详见 §16.4。",
  ],
  [
    "s-16-4-b1",
    "Chunking 是把文档拆分为若干片段的过程。这些片段需要同时满足三个条件：足够短，能够进入 embedding model 的 context window；语义上保持连贯；单独被检索出来时仍包含足够的上下文。",
  ],
  [
    "s-19-7-1-b16",
    "• Metric plateau：数值信号（如测试通过率或 validation loss）的改善幅度持续低于阈值 ε。",
  ],
  [
    "s-21-10-1-b2",
    "Long-Horizon-Terminal-Bench [386] 包含 21 个领域的 46 项复杂任务，用于检验 Agent 能否完成需要数小时而非数分钟的命令行操作。它的关键设计是 dense reward grading：每一步都评估中间进展，而不是只在终点判断成败。结果揭示，即使最强的 frontier model，也很难在连续执行约 15 条以上终端命令时不偏离轨道；long-horizon execution 仍是尚未解决的基础问题。",
  ],
  [
    "s-21-3-3-b1",
    "Computer use environment 让 Agent 通过 screenshot 和/或 accessibility API 观察完整桌面操作系统，并使用鼠标、键盘等动作进行控制。OSWorld [397] 在 Ubuntu、Windows 与 macOS 上提供 369 个任务，覆盖 LibreOffice、VS Code、Chrome、GIMP 等 productivity application。与结构化 API 环境相比，桌面环境的 observation 更不稳定，坐标、窗口状态、权限弹窗与长链副作用都会增加评估和恢复难度。",
  ],
  [
    "s-28-4-b180",
    "• Pipeline overlap：训练 step N 运行约 15 秒时，generation worker 可并行生成约 120 条用于 step N+1 的 response。",
  ],
  [
    "s-28-5-b19",
    "问题 24：“It Takes Two”显示 G=2 可以达到与 G=16 相近的效果，为什么？关键在于，GRPO 的有效性不完全依赖高精度 advantage estimation，而来自隐式的 contrastive objective。G=2 且 reward 为二元值时，若一条回答正确、另一条错误，归一化后可得到 Âcorrect=+1、Âwrong=−1；优化会提高正确回答的概率并压低错误回答的概率，近似形成 DPO 风格的对比损失。相较 G=16，G=2 可将 generation compute 降低约 8 倍；若生成占训练时间约 60%，整体训练可加速约 4 倍。限制是：通过率在 30%–70% 时最合适；若低于 10%，两条 sample 很可能都失败而不给出有效信号，此时困难问题仍需要更大的 G。",
  ],
  [
    "s-28-11-b11",
    "• Gating mechanism（⊙W₃x）允许网络有选择地抑制或放大不同维度。",
  ],
  [
    "s-28-15-b1",
    "问：Mixtral 8×7B 有 47B 总参数，但每个 token 只激活约 13B 参数，为什么？答：每个 FFN layer 被替换为 8 个并行 expert FFN，router 对每个 token 只选择 Top-2 experts。Attention layer 共享，约占 5B；8 个 FFN expert 合计约 42B，因此总量约 47B。推理时只激活共享 attention 与 2 个 expert，计算量约等于 13B dense model，但模型容量接近更大的 47B 模型。因此它能以约 13B 的计算成本取得接近更大模型的质量；不过全部 47B 参数仍须加载到内存，节省的是 compute，而不是 model memory。",
  ],
  [
    "s-29-8-b1",
    "RAG 的常用公式包括：Cosine similarity，sim(q,d)=(q·d)/(‖q‖·‖d‖)（Eq.29.17）；检索集合，Dk=top-k d∈C sim(embed(q),embed(d))（Eq.29.18）；生成概率，P(y|q)=PLLM(y|q,Dk)（Eq.29.19）；Chunking stride=chunk_size−overlap（Eq.29.20）；cross-encoder reranker 的 score(q,d)=MLP(BERT([q;d]))（Eq.29.21）。",
  ],
]);

const figureTextOverrides = new Map([
  [
    "s-1-9-1-b9",
    "Figure 1.10：LoRA 把权重更新 ΔW 分解为两个低秩矩阵 B×A。原始权重 W 保持冻结，仅 B 与 A 接收梯度；推理时可把 BA 合并回 W，因此不增加额外运行开销。",
  ],
  [
    "s-3-8-2-b1",
    "Figure 3.3：GAE 中的 bias–variance trade-off 由 λ 控制。较小 λ 更多依赖 bootstrap，bias 较高而 variance 较低；较大 λ 更接近完整 Monte Carlo return，bias 较低而 variance 较高。实践中 λ∈[0.9,0.95] 常用于平衡训练稳定性与长程 credit assignment。",
  ],
  [
    "s-11-2-4-b3",
    "Figure 11.7：Pipeline bubble 对比。仅一个 microbatch 的朴素 pipeline 会产生大量空闲时间；增加 microbatch 数量可让相邻 stage 重叠工作，当 M 远大于 pipeline stage 数 P 时，bubble fraction 接近零。",
  ],
  [
    "s-12-6-1-b1",
    "Figure 12.2：Productivity copilot 架构。LLM Agent 接收用户意图并调用多个 application API；任务成功、用户反馈与执行效率共同构成 reward signal，用于持续改进策略。",
  ],
]);

const blockReplacementOverrides = new Map([
  [
    "s-1-15-2-source-note",
    {
      type: "table",
      origin: "source_translation",
      title: "Speculative decoding 方法比较",
      caption:
        "原书 Table 1.19 从 draft source、speedup 与 key idea 三个维度比较主流路线。",
      columns: ["方法", "Draft source", "典型加速", "关键机制"],
      rows: [
        ["Standard", "1–7B 小模型", "2–3×", "独立 draft model 先生成候选"],
        ["Medusa", "并行 LM heads", "2–3×", "额外 prediction heads 同时预测未来 token"],
        ["EAGLE-2", "context-aware feature draft", "3–4×", "动态 draft tree 按置信度扩展"],
        ["N-gram Lookup", "N-gram cache", "1.5–2×", "复用重复文本，无需额外模型"],
        ["Lookahead", "Jacobi iteration", "2–2.5×", "target model 自身并行提出并验证候选"],
      ],
    },
  ],
  [
    "s-2-2-8-source-note",
    {
      type: "callout",
      origin: "source_translation",
      title: "vLLM architecture overview",
      text: "原书把 vLLM 描述为一套端到端 serving stack：PagedAttention 管理 KV cache block，continuous batching 调度正在 prefill、decode 或等待的请求，prefix caching 与 speculative decoding 复用计算，tensor parallelism 切分模型。紧接的 §2.2.9 再把这一架构拆成 API Server、Scheduler、Worker 与 block manager 等核心组件。",
    },
  ],
  [
    "s-29-20-b1",
    {
      type: "formula",
      origin: "source_translation",
      title: "Agentic RL 公式速查",
      expression:
        "Âᵢ=(R(τᵢ)−μG)/σG；R=w₁Rtask+w₂Refficiency+w₃Rsafety；L=Σ min(rtÂt, clip(rt)Ât)",
      latex:
        "\\hat A_i=\\frac{R(\\tau_i)-\\mu_G}{\\sigma_G},\\quad R=w_1R_{task}+w_2R_{efficiency}+w_3R_{safety},\\quad L=\\sum_{t\\in agent\\ tokens}\\min(r_t\\hat A_t,\\operatorname{clip}(r_t)\\hat A_t)",
      reading:
        "Eq.29.23–29.26 依次汇总 trajectory-level GRPO advantage、由任务完成度/效率/安全组成的 Agent reward、只在 Agent token 上计算的 clipped loss，以及 Pass@k。",
      symbols: [
        ["τᵢ", "第 i 条 Agent trajectory"],
        ["μG / σG", "同组 trajectory reward 的均值与标准差"],
        ["Refficiency", "按实际 step 数相对预算 Nmax 计算的效率项"],
      ],
    },
  ],
]);

const extractionArtifactPattern =
  /QQ|XX|×{3,}||(?:otherwise\s*){4,}|([\u3400-\u9fff])\1{3,}|\u0001/u;

function polish(value, chapter) {
  if (typeof value !== "string") return value;
  let output = value;
  for (const [pattern, replacement] of replacements) {
    output = output.replace(pattern, replacement);
  }
  if (chapter >= 3 && chapter <= 13) {
    output = output.replace(/滚动/g, "rollout");
  }
  if (chapter === 16) {
    output = output
      .replace(/小区/g, "sub-query")
      .replace(/文件/g, "文档");
  }
  if (chapter === 22) {
    output = output
      .replace(/客户/g, "Client")
      .replace(/服务器/g, "Server")
      .replace(/主机/g, "Host");
  }
  return output
    .replace(/\s+([，。；：！？])/g, "$1")
    .replace(/([，。；：！？])([A-Za-z])/g, "$1 $2")
    .replace(/ {2,}/g, " ")
    .trim();
}

function walk(value, chapter, key = "") {
  if (Array.isArray(value)) {
    return value.map((item) => walk(item, chapter, key));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        walk(childValue, chapter, childKey),
      ]),
    );
  }
  if (
    typeof value === "string" &&
    !["code", "expression", "latex", "originalExcerpt", "url", "src"].includes(
      key,
    )
  ) {
    return polish(value, chapter);
  }
  return value;
}

function chineseCharacters(value) {
  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + chineseCharacters(item), 0);
  }
  if (value && typeof value === "object") {
    return Object.entries(value).reduce((total, [key, child]) => {
      if (
        [
          "originalExcerpt",
          "code",
          "expression",
          "latex",
          "source",
          "glossary",
          "metrics",
        ].includes(key)
      ) {
        return total;
      }
      return total + chineseCharacters(child);
    }, 0);
  }
  if (typeof value === "string") {
    return value.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  }
  return 0;
}

function editorialGuide(section) {
  const title = `${section.enTitle} ${section.zhTitle}`.toLowerCase();
  const subject = section.number
    ? `§${section.number}「${section.zhTitle}」`
    : `本章导入「${section.zhTitle}」`;
  if (/architecture|pipeline|system|workflow|stack|架构|系统|流程/.test(title)) {
    return `阅读 ${subject} 时，先按“输入—状态—控制流—输出”还原原书描述，再追踪每个组件由谁执行、数据写到哪里、失败会怎样向下游传播。这样可以避免只记住组件名称，却无法解释完整运行路径。`;
  }
  if (/train|optim|objective|loss|gradient|reward|训练|优化|目标/.test(title)) {
    return `阅读 ${subject} 时，把训练数据、优化目标、更新信号、reference 或 baseline、计算代价和稳定性约束放在同一张因果图里。算法名称本身不是结论，真正需要核对的是它改变了哪一个信号，以及为此引入了什么偏差。`;
  }
  if (/evaluat|metric|benchmark|assess|评估|指标|基准/.test(title)) {
    return `阅读 ${subject} 时，明确被评估的对象是单次输出、完整 trajectory 还是系统行为；随后分别记录数据来源、metric、judge、聚合方式和置信边界。一个分数只有在测量对象与失败类型对应时才有解释力。`;
  }
  if (/implement|code|api|sdk|example|实践|实现|示例/.test(title)) {
    return `阅读 ${subject} 的实现时，不只看 happy path。请同时标出 state schema、外部依赖、权限边界、重试与终止条件、可观测字段和可能产生副作用的 action；代码能运行，并不等于系统已经具备可恢复性。`;
  }
  if (/failure|challenge|risk|safety|security|error|失败|风险|安全|错误/.test(title)) {
    return `阅读 ${subject} 时，把每个 failure mode 拆成触发条件、可观测信号、影响范围、缓解措施和剩余风险。原书给出的警告不是附录信息，而是决定系统是否能进入生产环境的设计约束。`;
  }
  if (/comparison|compare|versus| vs|when to|trade-off|比较|选择/.test(title)) {
    return `阅读 ${subject} 时，不要寻找脱离场景的“最佳方案”。应在质量、latency、计算与存储成本、数据要求、可控性和运维复杂度上逐项比较，并保留原书说明的适用前提与例外。`;
  }
  if (/memory|context|retriev|rag|knowledge|记忆|上下文|检索|知识/.test(title)) {
    return `阅读 ${subject} 时，沿信息生命周期追踪：内容何时写入、采用什么表示、怎样检索、如何进入 context、何时更新或删除。保存更多信息并不自动带来更好结果，选择机制和冲突处理同样重要。`;
  }
  if (/agent|tool|protocol|mcp|a2a|communication|orchestrat|智能体|工具|协议|通信|编排/.test(title)) {
    return `阅读 ${subject} 时，区分 model 产生的决策、Harness 负责的执行、protocol 规定的消息边界，以及环境返回的 observation。把这些责任混在一起，会让权限、错误恢复和审计问题无法定位。`;
  }
  return `阅读 ${subject} 时，以页面标注的原文范围为证据边界：先确认术语定义，再追踪机制、前提、例子与限制，最后检查结论能否迁移到不同规模或不同数据条件。以下译述保留这些层次，不把编者判断混入原文。`;
}

const root = process.cwd();
const catalog = [];
for (let number = 1; number <= 30; number += 1) {
  const slug = `ch-${String(number).padStart(2, "0")}`;
  const path = resolve(root, "content", "chapters", `${slug}.json`);
  const source = JSON.parse(await readFile(path, "utf8"));
  const chapter = walk(source, number);
  chapter.sections = chapter.sections.map((section, sectionIndex) => {
    const override = titleOverrides.get(section.enTitle);
    const suspicious =
      /[×X]\d|春|苏丹解放军|迟到的互动|重击|车站列表|弹簧|小区|回收/.test(
        section.zhTitle,
      );
    const useEnglishCoreHeading =
      number >= 15 && number <= 27 && Boolean(section.number);
    section.zhTitle =
      override ??
      (useEnglishCoreHeading || suspicious ? section.enTitle : section.zhTitle);
    const guideId = `${section.id}-editorial-reading-guide`;
    const normalizedChapterTitle = chapter.title
      .replace(/[^A-Za-z0-9]/g, "")
      .toLowerCase();
    const blocks = section.blocks
      .filter((block) => {
        if (block.id === guideId) return false;
        if (block.type !== "paragraph" || !block.originalExcerpt) return true;
        const normalizedExcerpt = block.originalExcerpt
          .replace(/[^A-Za-z0-9]/g, "")
          .toLowerCase();
        return normalizedExcerpt !== normalizedChapterTitle;
      })
      .map((block) => {
        const replacement = blockReplacementOverrides.get(block.id);
        if (replacement) {
          return {
            ...block,
            ...replacement,
            source: {
              ...block.source,
              equation:
                replacement.type === "formula"
                  ? "29.23–29.26"
                  : block.source.equation,
            },
          };
        }
        const text = blockTextOverrides.get(block.id);
        if (text) return { ...block, origin: "source_translation", text };
        const figureText = figureTextOverrides.get(block.id);
        if (figureText && block.type === "figure") {
          return { ...block, alt: figureText, caption: figureText };
        }
        if (
          block.type === "paragraph" &&
          extractionArtifactPattern.test(block.text ?? "")
        ) {
          return {
            ...block,
            origin: "source_unspecified",
            text: "这一段原文包含从 PDF 抽取的公式、符号或表格结构，自动转写无法可靠恢复其数学排版。为避免把受损字符当作正文，网页保留了可折叠英文原文与具体页码；中文公式化改写仍处于人工校订中。",
          };
        }
        if (
          block.type === "formula" &&
          extractionArtifactPattern.test(block.expression ?? "")
        ) {
          return {
            id: block.id,
            type: "callout",
            origin: "source_unspecified",
            source: block.source,
            title: "公式转写校订中",
            text: "该公式的 PDF 文本层无法可靠恢复数学符号。为避免展示错误公式，本区块暂只保留原书页码；完成逐符号核对后再以 KaTeX/MathML 发布。",
          };
        }
        return block;
      });
    const chapterBlocks =
      number === 15
        ? [
            ...blocks.filter(
              (block) =>
                block.type !== "paragraph" ||
                block.origin !== "source_translation",
            ),
            {
              id: `${section.id}-source-translation`,
              type: "paragraph",
              origin: "source_translation",
              source: {
                chapter: number,
                pages: section.pages,
              },
              text: blocks
                .filter(
                  (block) =>
                    block.type === "paragraph" &&
                    block.origin === "source_translation",
                )
                .map((block) => block.text)
                .join(" "),
              originalExcerpt: blocks
                .filter(
                  (block) =>
                    block.type === "paragraph" &&
                    block.origin === "source_translation",
                )
                .map((block) => block.originalExcerpt)
                .filter(Boolean)
                .join(" ")
                .slice(0, 360),
            },
          ]
        : blocks;
    const nextNumber = chapter.sections[sectionIndex + 1]?.number;
    const isStructuralParent =
      Boolean(section.number) &&
      Boolean(nextNumber?.startsWith(`${section.number}.`));
    const hasSourceBlock = chapterBlocks.some((block) =>
      ["source_translation", "source_definition"].includes(block.origin),
    );
    const ensuredBlocks =
      isStructuralParent && !hasSourceBlock
        ? [
            {
              id: `${section.id}-structure-note`,
              type: "callout",
              origin: "source_definition",
              source: {
                chapter: number,
                section: section.number,
                pages: section.pages,
              },
              title: "原书结构说明",
              text: `§${section.number} 在原书中是父级目录节，具体论证由紧随其后的子节展开。本站保留这一锚点和来源页码，以维持与原书目录的一一对应，不把目录标题扩写成不存在的正文。`,
            },
            ...chapterBlocks,
          ]
        : chapterBlocks;
    return {
      ...section,
      blocks: [
        {
          id: guideId,
          type: "callout",
          origin: "editorial_explanation",
          source: {
            chapter: number,
            section: section.number,
            pages: section.pages,
          },
          title: "编者阅读提示",
          text: editorialGuide(section),
        },
        ...ensuredBlocks,
      ],
    };
  }).filter(
    (section) =>
      !section.id.endsWith("-introduction") ||
      section.blocks.some((block) =>
        ["source_translation", "source_definition"].includes(block.origin),
      ),
  );
  const firstParagraphs = chapter.sections
    .flatMap((section) => section.blocks)
    .filter(
      (block) => block.type === "paragraph" && block.origin === "source_translation",
    )
    .map((block) => block.text)
    .filter(Boolean);
  if (firstParagraphs.length) {
    chapter.overview = firstParagraphs[0];
    chapter.summary = firstParagraphs.slice(0, 3);
  }
  chapter.metrics.blockCount = chapter.sections.reduce(
    (total, section) => total + section.blocks.length,
    0,
  );
  chapter.metrics.sectionCount = chapter.sections.length;
  chapter.metrics.chineseCharacters = chineseCharacters({
    overview: chapter.overview,
    sections: chapter.sections,
    summary: chapter.summary,
  });
  await writeFile(path, `${JSON.stringify(chapter, null, 2)}\n`, "utf8");
  catalog.push(
    Object.fromEntries(
      ["chapter", "title", "zhTitle", "pages", "minutes", "status", "metrics"].map(
        (key) => [key, chapter[key]],
      ),
    ),
  );
}

await writeFile(
  resolve(root, "content", "catalog.json"),
  `${JSON.stringify(catalog, null, 2)}\n`,
  "utf8",
);

const totals = catalog.reduce(
  (result, chapter) => ({
    chapters: result.chapters + 1,
    sections: result.sections + chapter.metrics.sectionCount,
    blocks: result.blocks + chapter.metrics.blockCount,
    chineseCharacters:
      result.chineseCharacters + chapter.metrics.chineseCharacters,
  }),
  { chapters: 0, sections: 0, blocks: 0, chineseCharacters: 0 },
);
console.log(JSON.stringify(totals, null, 2));
