import type { ChapterReading } from "./types";

const c = (
  chapter: number,
  title: string,
  zhTitle: string,
  pages: string,
  minutes: number,
  overview: string,
  sections: ChapterReading["sections"],
): ChapterReading => ({
  chapter,
  title,
  zhTitle,
  pages,
  minutes,
  overview,
  sections,
});

export const chapterReadings: ChapterReading[] = [
  c(
    0,
    "How This Guide Is Organized",
    "怎样阅读这本全栈指南",
    "27–35",
    12,
    "原书的核心主张是：现代 AI 不是一组彼此独立的技巧，而是一条从 model architecture、GPU systems、training algorithms，一直延伸到 agent runtime、protocol 与 user interface 的完整生产链。下面不是目录复述，而是这条主线的中文译述。",
    [
      {
        title: "为什么必须采用 systems view",
        english: "The Big Picture",
        paragraphs: [
          "只了解某一层，往往无法解释真实系统为何失败。训练工程师需要理解显存层级和 optimizer dynamics；微调工程师需要判断 LoRA 何时足够；Agent 开发者则必须知道模型接受过怎样的 alignment 与 tool-use training。原书因此把这些问题放在同一条因果链上。",
          "这里的“全栈”并不意味着每个人都要成为每层专家，而是要求你能沿着故障向上下游追踪：一次工具误用，可能源于 schema，也可能源于 context 污染、训练分布或错误的 stopping policy。",
        ],
        checkpoint: "当 Agent 输出错误时，你能否列出至少三个不同层级的可能原因？",
      },
      {
        title: "六个 Part 如何衔接",
        english: "From Foundations to Systems",
        paragraphs: [
          "Part I 建立 Transformer、GPU 与 classical RL 的底座；Part II 解释如何通过 SFT、reward model 与 preference optimization 改变模型策略；Part III–IV 分别回答“如何获得 reasoning”与“如何证明它真的更好”。",
          "Part V 才把训练好的模型放进环境：RAG 提供外部知识，Memory 提供跨时间连续性，Harness 管理上下文和工具，MCP/A2A 解决互操作，Multi-Agent 处理协作，UI 把控制权重新交还给人。Part VI 用测验、速查与开放问题收束全书。",
        ],
      },
      {
        title: "本站的阅读约定",
        english: "Translation and Evidence Boundary",
        paragraphs: [
          "本站正文采用“忠实译述”而不是逐句直译：保留 Transformer、rollout、Agent Harness、tool calling 等成熟英文术语，用自然中文重建论证顺序，并在每章标出原文页码。",
          "“原文事实”只陈述书中明确给出的内容；“解释 / 推导”用于建立直觉；“工程建议”表示可执行但需要结合场景验证的实践判断。PDF 链接只用于核对证据，不是完成课程的必经路径。",
        ],
      },
    ],
  ),
  c(
    1,
    "LLM Architecture and Optimization Methods",
    "LLM 架构与优化方法",
    "39–110",
    28,
    "本章从 Transformer 的数据流出发，解释 token 如何经过 embedding、attention、MLP 与 residual path 形成下一 token 分布，并把架构选择与训练效率、KV cache、LoRA、quantization 和 MoE 联系起来。",
    [
      {
        title: "Transformer 的真正计算对象",
        english: "Attention as Contextual Mixing",
        paragraphs: [
          "Self-attention 不是“查找答案”，而是让每个 token 根据 query-key 相似度，从其他位置的 value 中混合信息。Multi-head attention 同时学习多组关系；RoPE 把相对位置信息编码进旋转后的 query 与 key，使模型能区分顺序和距离。",
          "推理时，历史 token 的 key/value 会进入 KV cache。生成每个新 token 不必重算全部历史，但 cache 会随序列长度增长，因此 GQA、MQA 与 MLA 的价值不仅是架构创新，更是直接降低线上显存和带宽压力。",
        ],
        checkpoint: "为什么长上下文推理的瓶颈常常是 memory bandwidth，而不是纯 FLOPs？",
      },
      {
        title: "训练为何离不开数值与优化细节",
        english: "Optimization and Mixed Precision",
        paragraphs: [
          "AdamW 把 weight decay 与梯度更新解耦；learning-rate warmup 让早期更新更稳定，之后的 cosine decay 则逐步缩小步长。Gradient clipping 不是常规加速器，而是出现异常大梯度时的保险丝。",
          "BF16、FP8 与 FP4 的目标是在吞吐、显存和数值稳定性之间折中。低精度不等于把所有张量一刀切地压缩；稳定训练通常依赖 master weights、loss scaling 或按 tile 的 scale 管理。",
        ],
      },
      {
        title: "高效适配与稀疏扩展",
        english: "LoRA, Quantization and MoE",
        paragraphs: [
          "LoRA 假设任务适配所需的权重变化近似低秩，因此冻结原模型，只训练两个小矩阵；QLoRA 再把基础权重量化，从而把大模型微调压到更小显存预算中。它们适合快速适配，但不能自动替代高质量数据。",
          "Mixture of Experts 让每个 token 只激活少量 expert，以较低计算量扩大参数容量。代价是 routing、load balancing 与跨设备通信更复杂。架构规模越大，系统实现越不能被当作无关细节。",
        ],
      },
    ],
  ),
  c(
    2,
    "Systems Foundations for LLMs",
    "LLM 的系统基础",
    "111–124",
    18,
    "本章把“模型很慢”拆成可测量的系统问题：计算吞吐、显存容量、HBM 带宽、GPU 间互联与调度策略。只有知道张量在哪里、何时通信，才能选择正确的并行方式。",
    [
      {
        title: "GPU 层级决定可实现的模型",
        english: "Compute, HBM and Interconnect",
        paragraphs: [
          "Tensor Core 提供矩阵乘吞吐，HBM 保存参数、optimizer state、activation 与 KV cache。模型若受带宽限制，提高理论 FLOPs 不一定带来等比例加速；反之，batch 足够大时又可能转为 compute-bound。",
          "NVLink/NVSwitch 的价值在于降低 GPU 间张量交换成本。跨节点后带宽和延迟明显恶化，因此 topology-aware placement 会影响 tensor parallel 与 pipeline parallel 的实际效率。",
        ],
      },
      {
        title: "四类并行不是互斥选项",
        english: "Distributed Training",
        paragraphs: [
          "Data parallel 复制模型、切分 batch；tensor parallel 切分单层矩阵；pipeline parallel 切分网络层；FSDP/ZeRO 则切分参数、梯度和 optimizer state。大规模训练通常把它们组合为 3D parallelism。",
          "组合越复杂，bubble、all-reduce、checkpoint 和失败恢复越难。正确问题不是“哪种并行最好”，而是当前模型形状、序列长度、集群拓扑和容错要求下，哪一项资源最先成为瓶颈。",
        ],
      },
      {
        title: "推理系统优化的是队列而非单个请求",
        english: "High-throughput Inference",
        paragraphs: [
          "vLLM 的 PagedAttention 将 KV cache 分页管理，减少连续显存分配造成的碎片；continuous batching 则在不同请求的生成过程中动态装入新序列，提高 GPU 利用率。",
          "线上系统还要同时管理 time-to-first-token、inter-token latency、吞吐与 tail latency。把所有请求塞进更大 batch 会提高吞吐，却可能让交互体验变差。",
        ],
      },
    ],
  ),
  c(
    3,
    "Introduction to Reinforcement Learning",
    "强化学习入门",
    "125–138",
    20,
    "本章提供 Part II 所需的 RL 语言：state、action、reward、policy 与 return。它的重点不是背算法名称，而是理解策略如何从延迟反馈中获得可优化的信号。",
    [
      {
        title: "从 MDP 到长期回报",
        english: "Markov Decision Process",
        paragraphs: [
          "MDP 用状态转移描述行动如何改变环境。Agent 在状态 s 选择 action a，环境返回 reward r 与下一状态。折扣因子 γ 控制远期奖励的重要性，return 则把一条 trajectory 上的奖励累积为学习目标。",
          "Bellman equation 把长期价值分解为当前奖励与下一状态价值，使动态规划、TD learning 与 value-based 方法可以递归更新，而不必等待所有未来完全展开。",
        ],
      },
      {
        title: "Value 方法与 Policy Gradient",
        english: "Value-based vs. Policy-based Learning",
        paragraphs: [
          "Q-learning 学习每个 state-action 的价值，再选择最大值对应动作；Policy Gradient 直接调整动作概率，使高回报 trajectory 更可能再次出现。语言模型动作空间巨大，直接枚举 Q 值通常不可行，因此 policy-based 方法更自然。",
          "REINFORCE 的梯度估计无偏但方差大。加入 baseline 不改变期望，却能减少噪声；Actor-Critic 让 actor 负责策略，critic 估计价值，形成后续 PPO 的基础。",
        ],
      },
      {
        title: "Advantage 是相对判断",
        english: "Advantage and GAE",
        paragraphs: [
          "Advantage A(s,a) 衡量某个动作相对当前策略平均表现好多少。它比直接使用绝对 return 更适合更新策略，因为同一状态下真正需要知道的是“这个选择是否比常规选择更好”。",
          "GAE 用参数 λ 在 bias 与 variance 之间折中：更短的估计更稳定但偏差大，更长的估计更接近完整回报但噪声更高。后续 PPO/GRPO 都在解决类似的稳定性问题。",
        ],
      },
    ],
  ),
  c(
    4,
    "RL Foundations for Language Models",
    "面向语言模型的 RL 基础",
    "139–141",
    10,
    "本章完成 classical RL 到 LLM 的映射：prompt 是初始状态，已生成 token 构成状态，next token 是动作，完整 response 是 trajectory，而 reward 往往只在序列末端出现。",
    [
      {
        title: "把文本生成写成策略",
        english: "Language Generation as a Policy",
        paragraphs: [
          "语言模型策略 πθ(a|s) 给出在当前 prompt 与已生成前缀下，下一个 token 的概率。一次 rollout 就是一条完整回答；对整条回答评分后，训练必须把这个稀疏信号分配回数百个 token 决策。",
          "动作空间虽然是 vocabulary，但真正的决策依赖长前缀，因此 credit assignment 比许多传统控制任务更困难。格式错误、事实错误和推理错误可能共享同一个最终低分。",
        ],
      },
      {
        title: "Reference model 为什么存在",
        english: "KL Regularization",
        paragraphs: [
          "如果只最大化 reward，策略会寻找 reward model 的漏洞并远离自然语言分布。KL penalty 把新策略约束在 reference model 附近，形成“获得更高奖励，但不要以失去语言能力为代价”的平衡。",
          "KL 系数太高，模型几乎不学习；太低，则可能出现 reward hacking、模式坍缩或奇怪格式。它是可观测的训练控制量，而不是公式里的装饰项。",
        ],
      },
      {
        title: "On-policy 数据为何昂贵",
        english: "Rollout Economics",
        paragraphs: [
          "On-policy 方法需要不断用当前模型生成新回答。生成阶段往往比反向传播更耗时，尤其是长 reasoning trajectory，因此 RL 系统必须协调 inference workers 与 training workers。",
          "这也解释了为什么 DPO 等 offline preference 方法受欢迎：它们牺牲在线探索能力，换取更简单、稳定和便宜的数据路径。",
        ],
      },
    ],
  ),
  c(
    5,
    "PPO — Proximal Policy Optimization",
    "PPO：受约束的策略更新",
    "142–150",
    18,
    "PPO 的目标是让高 advantage 的回答概率上升，同时阻止单次更新跨得太远。它把 rollout、reward、value estimation 与 clipped objective 组合成一套可控但系统复杂的在线训练流程。",
    [
      {
        title: "为什么需要 importance ratio",
        english: "Policy Ratio",
        paragraphs: [
          "训练 batch 来自旧策略 πold，而参数更新作用于新策略 πθ。概率比 r=πθ/πold 衡量新旧策略对同一 token 的偏好变化；advantage 决定这个变化应该被奖励还是抑制。",
          "如果直接让 ratio 任意增长，少数高分样本会造成过大更新。PPO 对 ratio 做 clipping，只信任一个局部区间内的改进，这就是 proximal 的含义。",
        ],
      },
      {
        title: "Critic 与 sequence reward",
        english: "Value Head and Credit Assignment",
        paragraphs: [
          "PPO 通常训练 value head 预测每个位置的未来回报，再用 GAE 计算 advantage。Critic 质量直接影响策略梯度噪声；value loss 与 policy loss 之间也需要权重平衡。",
          "LLM 场景还会加入 reference KL、entropy 与长度效应。若 reward 随长度偏置，模型可能通过冗长回答获得虚假优势，因此必须监控 response length 与 reward correlation。",
        ],
      },
      {
        title: "PPO 是系统，不只是一条公式",
        english: "Operational Complexity",
        paragraphs: [
          "完整 PPO 需要 policy、reference、reward model 与 critic，外加 rollout buffer、distributed inference 和训练同步。任何一处版本错位都会让 ratio 或 reward 失真。",
          "当 reward 可验证、在线探索价值高且团队能承担基础设施复杂度时，PPO 仍然有意义；如果只有固定 preference pairs，DPO 往往是更简单的起点。",
        ],
      },
    ],
  ),
  c(
    6,
    "DPO — Direct Preference Optimization",
    "DPO：直接偏好优化",
    "151–163",
    18,
    "DPO 把 RLHF 的 reward modeling 与 policy optimization 合并为一个分类式目标：对同一 prompt，让 chosen response 相对 rejected response 更可能，同时以 reference model 作为隐式约束。",
    [
      {
        title: "从偏好对直接学习",
        english: "Chosen vs. Rejected",
        paragraphs: [
          "每条训练样本包含 prompt、chosen 与 rejected。DPO 比较 policy 相对 reference 对两条回答的 log-probability 改变量，并通过 logistic loss 推高 chosen 的相对优势。",
          "它不需要单独训练 reward model，也不需要在线 rollout，因此工程上接近 supervised fine-tuning。代价是学习范围被固定数据覆盖限制，无法主动发现数据之外的新行为。",
        ],
      },
      {
        title: "β 控制偏好强度",
        english: "Reference Constraint",
        paragraphs: [
          "β 决定策略偏离 reference 的代价尺度。过小可能让模型为满足局部偏好而破坏通用能力；过大则更新微弱。实际选择应结合 held-out preference accuracy、KL 与任务质量共同判断。",
          "DPO 对数据中的系统性偏差很敏感：如果 chosen 总是更长或格式固定，模型会学到这些 shortcut，而不是真正的质量标准。",
        ],
      },
      {
        title: "何时选 DPO",
        english: "When DPO Fits",
        paragraphs: [
          "当你拥有可靠的 preference pairs、计算预算有限、目标接近分布内风格或 helpfulness 调整时，DPO 是强基线。它尤其适合快速验证数据是否包含有效偏好信号。",
          "若任务需要环境交互、trajectory-level credit 或持续在线探索，DPO 只能解决其中的静态偏好部分，不能替代 agentic RL。",
        ],
      },
    ],
  ),
  c(
    7,
    "GRPO — Group Relative Policy Optimization",
    "GRPO：组内相对策略优化",
    "164–179",
    20,
    "GRPO 为同一 prompt 采样一组回答，用组内 reward 的相对位置构造 advantage，从而省去独立 critic。它特别适合数学、代码等可以自动验证的 reasoning 任务。",
    [
      {
        title: "Group-relative advantage",
        english: "Normalize Within a Prompt",
        paragraphs: [
          "同一 prompt 的多条 rollout 共享难度背景。把每条 reward 减去组均值并按组标准差归一化，就能判断某条回答相对同组更好还是更差，而不需要训练 value model。",
          "这种比较降低了跨题难度差异的影响：一道极难题的部分正确回答，可能仍然是组内最优；一道简单题的普通回答则未必获得优势。",
        ],
      },
      {
        title: "可验证奖励与 reasoning",
        english: "Verifiable Rewards",
        paragraphs: [
          "数学最终答案、代码测试和格式检查可以提供低成本 deterministic reward。GRPO 用大量 rollout 探索不同推理路径，再提高成功路径的概率，是 reasoning model 训练的重要路线。",
          "但只有结果奖励时，模型也可能猜对或利用判题漏洞。增加过程约束、长度控制与 adversarial verifier，才能降低 reward hacking。",
        ],
      },
      {
        title: "组大小与成本",
        english: "Group Size Trade-off",
        paragraphs: [
          "组越大，相对排序越稳定，也更可能采到成功样本；同时生成成本线性上升。对低 pass-rate 任务，小组可能全部失败，归一化后几乎没有学习信号。",
          "因此 group size、sampling temperature 与任务难度应联动调节，并持续监控组内 reward variance，而不是固定套用一个数字。",
        ],
      },
    ],
  ),
  c(
    8,
    "Preference Optimization Variants",
    "偏好优化的变体",
    "180–187",
    16,
    "本章把 Online DPO、KTO、IPO、ORPO、SimPO 与 Best-of-N 放到同一坐标系：它们分别改变数据来源、损失形状、是否依赖 reference，以及如何利用推理时采样。",
    [
      {
        title: "没有一种损失适合所有数据",
        english: "Different Feedback Regimes",
        paragraphs: [
          "KTO 可以利用单条 desirable/undesirable 标签，不强制成对；IPO 修改目标以缓解偏好可分时的过拟合；ORPO 把 SFT 与 odds-ratio preference 合并；SimPO 则用长度归一化 reward 并移除 reference model。",
          "算法名称不是选择依据。真正要看的是反馈形式、标注噪声、长度偏差、是否需要在线采样，以及团队能否监测 distribution shift。",
        ],
      },
      {
        title: "Online preference 的价值",
        english: "Online DPO",
        paragraphs: [
          "Offline 数据会随策略改进而过时。Online DPO 用当前策略生成候选，再由 judge 或人类形成新偏好，使训练信号始终靠近模型当前失败区域。",
          "它比纯 DPO 更能探索，却重新引入 rollout 成本与 judge bias。若自动 judge 可被模型利用，在线闭环会加速错误偏好的自我强化。",
        ],
      },
      {
        title: "Best-of-N 是推理时优化",
        english: "Sampling and Selection",
        paragraphs: [
          "Best-of-N 不更新模型，而是采样 N 个候选并用 verifier 选择最优。它常被低估，因为在相同生成预算下，一个可靠 selector 可能比一次不稳定的 RL 训练更划算。",
          "比较方法时必须统一总计算预算：训练耗费、rollout GPU-hours 与部署时多采样成本都应进入同一张账。",
        ],
      },
    ],
  ),
  c(
    9,
    "Reward Model Training",
    "Reward Model 训练",
    "188–195",
    17,
    "Reward model 把人类或规则偏好压缩为标量信号。它既是 RL 的“裁判”，也可能成为系统最危险的单点偏差来源。",
    [
      {
        title: "Bradley–Terry 偏好模型",
        english: "Pairwise Reward Learning",
        paragraphs: [
          "对同一 prompt 的 chosen 与 rejected，模型输出两个标量 reward，并最大化 chosen 分数更高的概率。Pairwise loss 学到的是相对排序，而不是具备跨任务绝对意义的分数。",
          "因此 reward scale、不同数据集的混合比例和标注者分歧都会影响训练。把所有偏好压成单一真值，会掩盖用户群体之间真实存在的标准差异。",
        ],
      },
      {
        title: "数据质量决定裁判上限",
        english: "Annotation and Calibration",
        paragraphs: [
          "高质量 preference 数据需要明确 rubric、难例、重复标注与 disagreement analysis。只追求数量会让 reward model 学会表面风格，比如更长、更自信或固定格式。",
          "校准不只看 pairwise accuracy，还要测试分布外回答、对抗样本以及与长度、毒性、引用数量等非目标特征的相关性。",
        ],
      },
      {
        title: "Reward hacking 是优化的必然风险",
        english: "Goodhart's Law",
        paragraphs: [
          "一旦 reward 成为优化目标，策略就会寻找模型未预期的高分区域。训练集上的可靠裁判，面对被持续优化的新策略时可能迅速失效。",
          "解决办法不是相信更大的 reward model，而是引入多重 verifier、在线审计、holdout red-team、KL 约束与人工复核，把单一指标改造成防线组合。",
        ],
      },
    ],
  ),
  c(
    10,
    "SFT Best Practices and Techniques",
    "SFT 最佳实践",
    "196–204",
    16,
    "Supervised Fine-Tuning 用高质量示范建立模型的基本行为分布。它通常先决定“模型会不会按正确格式做事”，再由 preference/RL 调整“哪种行为更值得选择”。",
    [
      {
        title: "数据质量高于数据体量",
        english: "Quality, Diversity and Deduplication",
        paragraphs: [
          "少量清晰、覆盖广且无冲突的示范，往往优于大量自动生成的重复样本。清洗应检查重复、模板泄漏、答案错误、过长上下文和互相矛盾的系统指令。",
          "任务分布也必须接近部署需求。只训练漂亮的单轮答案，会得到不擅长澄清、拒绝、工具错误恢复和长任务状态管理的模型。",
        ],
      },
      {
        title: "格式也是学习目标",
        english: "Conversation and Tool Formats",
        paragraphs: [
          "Chat template 决定 system/user/assistant 边界；tool calling 数据还要包含 schema、调用参数、tool result 与最终回答。任何训练和推理格式不一致都会造成隐蔽退化。",
          "对 tool-use SFT，负例同样重要：什么时候不该调用工具、参数缺失时如何询问、工具报错后如何恢复，都需要明确示范。",
        ],
      },
      {
        title: "Curriculum 与 loss masking",
        english: "Training Mechanics",
        paragraphs: [
          "Curriculum 可以先学习稳定格式和短任务，再加入复杂 reasoning 与长轨迹。Loss masking 通常只对 assistant token 计算损失，避免模型学习复述用户输入。",
          "验证应同时观察 held-out loss 与行为评测。训练 loss 继续下降并不表示真实任务更好，甚至可能意味着模型开始记忆模板。",
        ],
      },
    ],
  ),
  c(
    11,
    "System Architecture & Infrastructure at Scale",
    "大规模训练系统架构",
    "205–228",
    24,
    "本章讨论 RL post-training 的真实生产线：generation、reward、training、checkpoint 与 fault tolerance 如何在多组 GPU 间解耦和同步。",
    [
      {
        title: "Rollout 与训练是两种负载",
        english: "Disaggregated Architecture",
        paragraphs: [
          "Rollout 需要高吞吐自回归推理，training 需要大 batch 的前反向传播。把两者绑定在同一组 GPU 上会造成阶段性空闲，因此大规模系统常使用独立 inference workers 与 training workers。",
          "解耦后必须解决权重版本同步：过旧 rollout 会增大 off-policy 偏差，过于频繁同步又消耗网络带宽。系统需要明确可接受的 policy staleness。",
        ],
      },
      {
        title: "调度决定 GPU 是否真正忙碌",
        english: "Placement and Scheduling",
        paragraphs: [
          "Prompt 长度、response 长度与 reward latency 都不一致，静态 batch 容易产生 straggler。Length-aware batching、动态队列和资源隔离能减少尾部等待。",
          "训练集群还要在 policy、reference、reward、critic 之间分配显存和算力。任何单组件饱和都会让其他 GPU 等待，因此应按端到端 throughput 而非局部利用率优化。",
        ],
      },
      {
        title: "可恢复性是吞吐的一部分",
        english: "Checkpointing and Fault Tolerance",
        paragraphs: [
          "长时间训练中，节点失败不是例外。Checkpoint 必须包含模型、optimizer、scheduler、数据位置与必要的 rollout 状态，才能做到语义一致的恢复。",
          "监控也应覆盖 reward distribution、KL、length、queue depth、GPU idle time 与版本延迟。只有 loss 曲线远远不足以诊断 RL 系统。",
        ],
      },
    ],
  ),
  c(
    12,
    "LLM Agentic Training",
    "LLM 的 Agentic Training",
    "229–259",
    24,
    "Agentic training 把优化单位从单条回答扩展为与环境交互的 trajectory。模型不仅要生成正确文字，还要选择工具、维护状态、从失败中恢复并在预算内完成目标。",
    [
      {
        title: "Trajectory-level reward",
        english: "From Responses to Episodes",
        paragraphs: [
          "一次 Agent episode 包含观察、推理、tool call、tool output 与后续修正。最终成功奖励必须跨多步分配；中间动作局部合理，仍可能导致全局失败。",
          "因此训练数据要保存完整 trajectory 与环境状态，而不是只保存最终答案。否则模型无法学习哪些工具调用真正推动了任务。",
        ],
      },
      {
        title: "环境必须可重置、可验证",
        english: "Interactive RL Environments",
        paragraphs: [
          "代码、浏览器和文件系统环境需要 isolation、reset semantics 与 deterministic checks。没有可重复环境，reward 就会混入外部变化，实验无法比较。",
          "NeMo Gym、RLFactory、MOSAIC 等路线的共同目标，是让环境提供标准 observation/action 接口和可扩展 verifier，使 rollout 可以大规模并行。",
        ],
      },
      {
        title: "真实 Agent traces 的双刃剑",
        english: "Learning from Production Traces",
        paragraphs: [
          "生产轨迹包含真正的长尾失败、用户澄清与工具异常，是合成数据难以覆盖的信号。但其中也可能包含隐私、过期行为与历史系统缺陷。",
          "可靠流程应先脱敏、过滤和重放验证，再区分 successful demonstration、recoverable failure 与 unsafe behavior，避免把偶然成功当作可泛化策略。",
        ],
      },
    ],
  ),
  c(
    13,
    "RL for Large Reasoning Models",
    "大型推理模型的强化学习",
    "260–286",
    24,
    "本章解释 reasoning model 的关键变化：不是简单要求模型“多想一点”，而是通过可验证任务、采样与 RL，让模型发现更长、更结构化的解题策略，并在推理时用额外计算换取质量。",
    [
      {
        title: "RL 如何发现 reasoning strategy",
        english: "Emergent Reasoning",
        paragraphs: [
          "在数学和代码任务中，最终答案或测试结果提供明确 reward。模型通过多条 rollout 探索分解、检查、回溯等策略，成功轨迹概率逐渐上升。DeepSeek-R1 等工作展示了这种过程。",
          "这并不意味着所有 chain-of-thought 都可靠。可见推理可能是事后解释，且更长不总是更好；训练需要同时约束正确性、成本与格式。",
        ],
      },
      {
        title: "Process reward 与搜索",
        english: "PRM, MCTS and Verification",
        paragraphs: [
          "Outcome reward 只看终点，Process Reward Model 则评价中间步骤，有助于更细粒度 credit assignment。MCTS 等搜索方法把候选 reasoning state 作为树节点，用 verifier 引导扩展。",
          "过程监督成本高，而且错误的 step judge 会系统性误导搜索。实践中常组合 deterministic checker、learned verifier 与 self-consistency。",
        ],
      },
      {
        title: "Test-time compute 是可分配预算",
        english: "Inference-time Scaling",
        paragraphs: [
          "同一模型可以通过更长思考、多候选采样、反思或搜索获得更高成功率。收益通常随计算增加而递减，因此系统应根据题目难度动态分配预算。",
          "推理模型的产品指标不应只有 accuracy，还要包含 token、latency 与失败方差。能够判断何时停止思考，本身就是重要能力。",
        ],
      },
    ],
  ),
  c(
    14,
    "LLM Evaluation",
    "LLM 评估方法",
    "287–304",
    22,
    "评估不是训练完成后的报表，而是决定系统会朝哪个方向优化的反馈结构。本章从 metrics、human evaluation、LLM-as-Judge 一直延伸到 agent trajectory evaluation。",
    [
      {
        title: "指标必须匹配任务",
        english: "Metrics and Benchmarks",
        paragraphs: [
          "Perplexity 衡量语言建模，不直接代表 helpfulness；pass@k 适合可执行代码；ELO 适合成对竞技比较。开放式任务通常需要 rubric-based judge 与人工样本结合。",
          "Benchmark 分数只有在数据未污染、prompt 设置一致、采样参数公开时才可比较。单一平均分还会掩盖长尾失败和不同难度层级。",
        ],
      },
      {
        title: "LLM-as-Judge 也需要评估",
        english: "Judge Reliability",
        paragraphs: [
          "LLM judge 便宜且可扩展，但存在 position bias、verbosity bias、自家模型偏好与 rubric 漏洞。交换答案顺序、使用多 judge、加入 reference 与校准集能降低风险。",
          "高风险任务不能把 judge 分数当作事实。应抽样人工复核，并持续检查 judge 与真实用户反馈的相关性是否漂移。",
        ],
      },
      {
        title: "Agent 要评 trajectory",
        english: "Agentic Evaluation",
        paragraphs: [
          "Agent 最终成功可能掩盖中途越权、无效重试和巨大成本；失败也可能完成了大部分子任务。因此评估应覆盖 success、partial credit、tool efficiency、safety、recoverability 与 cost。",
          "最有价值的回归集往往来自生产失败轨迹。将它们固定为可重放环境，才能验证一次 Harness 或 prompt 修改是否真的解决问题。",
        ],
      },
    ],
  ),
  c(
    15,
    "Introduction to Agentic AI",
    "什么让系统真正具有 Agentic 特征",
    "305–307",
    14,
    "原文把 Agentic AI 定义为一个循环系统：LLM 接收环境 observation，判断下一步，执行 tool/API/code action，再根据结果迭代，直到达到目标或主动请求人类输入。关键差异不是“用了大模型”，而是控制流从一次回答变成了有状态的闭环。",
    [
      {
        title: "从 Chatbot 到 Agent",
        english: "Perceive–Reason–Act",
        paragraphs: [
          "Chatbot 通常生成一次回答后等待；Agent 则必须维护 goal、state 与 stopping condition。一次 tool output 会改变下一步可见状态，因此模型行为与 Harness 行为共同构成实际 policy。",
          "自主程度是一条连续谱：单轮问答、受控 workflow、能选择工具的 Agent、长时间自治系统。越向右，环境副作用与不可预测性越高，所需 guardrail、observability 和 approval 也越强。",
        ],
      },
      {
        title: "五个基础挑战",
        english: "Persistence, Grounding, Action, Coordination, Safety",
        paragraphs: [
          "Persistence 处理跨步骤与跨会话连续性；Grounding 让模型访问训练数据之外的动态事实；Action 通过明确接口改变外部世界；Coordination 让复杂任务可委派；Safety 则限制错误行动的影响半径。",
          "这五项不能靠一段更长的 system prompt 解决。它们分别需要 Memory、RAG、tool schema、MCP/A2A、policy gate 与可恢复状态等系统组件。",
        ],
        checkpoint: "你的 Agent 设计中，哪一个组件负责决定“继续、停止还是升级给人”？",
      },
      {
        title: "分层架构的含义",
        english: "The Agentic Stack",
        paragraphs: [
          "Model 是推理核心；RAG 与 Memory 提供知识和连续性；Harness 管理 context、tools、state 与 recovery；Design Pattern 决定高层循环；MCP/A2A 提供互操作；UI 连接 human oversight。",
          "这些层是相互反馈的：检索结果改变推理，推理决定工具调用，工具结果进入记忆，UI 中的用户修正又改变后续状态。生产 Agent 的质量取决于闭环，而不是某一层的宣传指标。",
        ],
      },
    ],
  ),
  c(
    16,
    "Retrieval-Augmented Generation (RAG)",
    "RAG：在生成前找到可引用的外部证据",
    "308–332",
    24,
    "RAG 在 query time 检索外部文档并把相关片段放入 context，使模型能够回答私有、近期或专业知识问题。原文强调：检索与生成必须分开评估，复杂 pipeline 无法弥补糟糕的 chunking 和 corpus。",
    [
      {
        title: "索引阶段决定可检索性",
        english: "Ingestion, Chunking and Metadata",
        paragraphs: [
          "文档先解析、清洗、切成 chunk，再计算 embedding 并连同 source、date、section、document type 等 metadata 写入索引。Chunk 过大包含噪声，过小又会丢失上下文关系。",
          "Overlap 可以降低边界信息损失，但会增加索引体量与重复召回。适合的切分单位应来自文档结构和 query distribution，而不是固定字符数。",
        ],
      },
      {
        title: "Dense、Sparse 与 Hybrid",
        english: "Retrieval and Re-ranking",
        paragraphs: [
          "Dense retrieval 擅长语义相近表达，BM25 等 sparse retrieval 擅长专有名词、编号和精确 token。Hybrid search 用 RRF 等方法合并两类排名，是专业语料的强默认方案。",
          "第一阶段召回追求 recall，cross-encoder reranker 再提高 top results 的 precision。若最终答案错了，应先判断证据是否被召回，再判断模型是否正确使用证据。",
        ],
      },
      {
        title: "从 Naive RAG 到 Agentic RAG",
        english: "Adaptive Retrieval",
        paragraphs: [
          "Naive RAG 每次固定检索；Self-RAG/CRAG 会判断是否需要检索及证据是否可靠；Agentic RAG 允许模型拆分多跳问题、改写 query 并多轮检索。",
          "自主检索提高复杂问题能力，也增加 latency、cost 与循环风险。原文的实践顺序是：先做好简单 chunking 与 hybrid retrieval，再增加 reranking，最后才引入 agentic loop。",
        ],
        checkpoint: "如果 answer relevance 低，如何区分 retrieval failure 与 generation failure？",
      },
    ],
  ),
  c(
    17,
    "Agentic Memory Systems",
    "Memory：让有限 context 拥有选择性的长期连续性",
    "333–356",
    24,
    "LLM 每次调用本质上是无状态的，context window 是唯一即时可见信息。长任务会积累远超窗口容量的 observation、tool output 与决策，因此 Memory 的任务不是“保存全部”，而是选择性写入、检索、更新和反思。",
    [
      {
        title: "四种记忆承担不同职责",
        english: "Working, Episodic, Semantic, Procedural",
        paragraphs: [
          "Working memory 保存当前任务的临时状态；Episodic memory 保存发生过的事件和结果；Semantic memory 保存稳定事实与概念；Procedural memory 保存可复用的做事方法与 skill。",
          "把它们都塞进一个向量库会混淆更新规则。用户偏好、项目事实、失败经历和操作流程具有不同的时效性、权限与冲突处理方式。",
        ],
      },
      {
        title: "Memory 是一组操作",
        english: "Write, Retrieve, Update, Reflect",
        paragraphs: [
          "Write 需要 importance scoring、去重和隐私过滤；Retrieve 会结合语义相关性、时间衰减与任务上下文；Update 处理新旧事实冲突；Reflect 则从多个 episode 中提炼更抽象的经验。",
          "无条件写入会制造 memory pollution，无条件召回会挤占 context。好的 Memory policy 必须同时学会“不记”和“不取”。",
        ],
      },
      {
        title: "从被动检索到主动提醒",
        english: "Proactive Memory",
        paragraphs: [
          "传统 memory 等待 executor 发起 query；proactive architecture 让独立 memory agent 监测行为状态，在 drift 扩大前注入提醒。这相当于学习“何时提醒”与“提醒什么”。",
          "主动注入会增加成本，也可能干扰正在进行的 reasoning。系统需要可解释的 injection policy、预算与 suppression 机制，并严格保护长期用户数据。",
        ],
      },
    ],
  ),
  c(
    18,
    "Agent Harness — Context Management and Orchestration",
    "Agent Harness：把模型变成可运行系统的 Runtime",
    "357–382",
    26,
    "Harness 是 Agent 的“操作系统”：组装 prompt、管理 token budget、暴露工具、执行与重试、保存 state、检测循环、记录 trace，并在高风险动作前请求批准。模型本身并不自动拥有这些能力。",
    [
      {
        title: "Context 是有限而昂贵的工作内存",
        english: "Context Management",
        paragraphs: [
          "Harness 应在每次加入 message 时执行预算，而不是等调用模型前才发现溢出。Sliding window、summary、hierarchical context 与 external state 各自牺牲不同信息。",
          "Prompt 应像代码一样模块化、版本化和测试。System rules、task state、retrieved evidence、tool result 与 recent dialogue 的优先级必须显式定义。",
        ],
      },
      {
        title: "Tools 是执行机构",
        english: "Dispatch, Validation and Sandboxing",
        paragraphs: [
          "Tool schema 要清楚描述作用、参数、错误与副作用；Harness 在执行前验证 JSON，在执行后限制输出大小、检查类型并处理异常。并行工具只适用于彼此独立的调用。",
          "Approval 应按工具或动作风险分级，而不是一次运行全部批准。读操作可自动，写文件可预览，付款和删除则必须获得明确许可。",
        ],
      },
      {
        title: "错误恢复与可观察性",
        english: "State, Recovery and Tracing",
        paragraphs: [
          "工具错误更常见也更可恢复，因此 backoff 通常应在 tool level 实现。内容 hash、重复 action 与 no-progress signal 可以帮助识别 loop。",
          "每个 run 需要 correlation ID、结构化事件、token/cost、tool latency、checkpoint 与最终状态。没有 trace，Agent 失败只能靠猜。",
        ],
        checkpoint: "如果模型连续三次调用同一工具，Harness 应观察哪些信号再决定重试或停止？",
      },
    ],
  ),
  c(
    19,
    "Loop Engineering",
    "Loop Engineering：把生成—验证—修正设计成收敛过程",
    "383–397",
    24,
    "Loop Engineering 把运行时循环视作不更新权重的 inference-time RL：context 是 state，下一次模型调用产生 action，verifier 提供 reward-like signal，而 critique 会通过 context 改变后续 policy。",
    [
      {
        title: "五个结构原语",
        english: "Generator, Verifier, Terminator, State Manager, Escalator",
        paragraphs: [
          "Generator 产生候选；Verifier 判断是否满足标准；Terminator 决定成功或预算耗尽；State Manager 保存进展与压缩上下文；Escalator 在不确定或高风险时把决策交给人。",
          "缺少任何一项都会形成脆弱循环。只有 generator 和 retry 的系统不是工程化 Agent，而是无限重复的 prompt。",
        ],
      },
      {
        title: "Verification 就是 reward signal",
        english: "Deterministic Checks First",
        paragraphs: [
          "单元测试、schema validation、编译器和数据库约束比 LLM 自评更稳定。Maker 与 checker 分离可以减少同一模型重复确认自身错误。",
          "Verifier 若与真实目标错位，循环会高效优化错误指标。因此“done”的定义、partial progress 与 failure taxonomy 必须在运行前写清楚。",
        ],
      },
      {
        title: "Termination 是一半设计",
        english: "Budgets and No-progress Detection",
        paragraphs: [
          "每个 loop 都需要最大迭代、token/时间/费用预算和 no-progress detection。Context compaction 与 sub-agent isolation 用于控制工作记忆，而 checkpoint 支持中断后恢复。",
          "原文从 ReAct、Reflexion、AutoGPT 到 2026 productized loops 的演进说明：真正成熟的变化不是循环更长，而是验证、停止与成本控制更严谨。",
        ],
      },
    ],
  ),
  c(
    20,
    "Agent Design Patterns",
    "Agent Design Patterns：先选控制流，再选框架",
    "398–403",
    22,
    "本章区分 workflow 与 agent：前者由程序预先确定控制流，更可预测、可测试、成本更低；后者让 LLM 动态决定下一步，更灵活但更难控制。原文明确建议从 workflow 开始，只有任务确实需要开放探索时再升级。",
    [
      {
        title: "五种 Workflow Patterns",
        english: "Chaining, Routing, Parallelization, Workers, Evaluator",
        paragraphs: [
          "Prompt chaining 适合固定顺序；routing 把不同输入交给专门 handler；parallelization 处理独立子任务或投票；orchestrator-workers 让模型动态拆分未知任务；evaluator-optimizer 用明确 rubric 迭代提升质量。",
          "模式选择取决于任务结构是否可预测、允许多少 LLM calls，以及质量是否需要反馈迭代。复杂并不天然更强。",
        ],
      },
      {
        title: "Autonomous Patterns",
        english: "ReAct, Planning and Reflection",
        paragraphs: [
          "ReAct 交替 reasoning、action 与 observation；planning agent 先产生 task graph，再按依赖执行并在失败时 replan；Reflection 回顾 trajectory，把失败原因写入下一次 context。",
          "计划应是可修改的工作对象而不是装饰文本。Harness 必须跟踪依赖、完成状态和实际 observation，否则“有计划”不会带来控制力。",
        ],
      },
      {
        title: "Simplicity Principle",
        english: "Use the Simplest Architecture That Works",
        paragraphs: [
          "清晰的工具描述、structured output、fallback 和可见中间状态，通常比多加一个 Agent 更有价值。每次增加自主层都同时增加 latency、token、debug surface 与 failure coupling。",
          "模式可以组合，但应由可测量失败驱动升级：只有当 prompt chain 无法处理未知分解时才引入 orchestrator；只有当单 Agent 的专业性或上下文确实不足时才引入 multi-agent。",
        ],
      },
    ],
  ),
  c(
    21,
    "Agentic Environments and Benchmarks",
    "Agentic Environments：把自主行为放进可重放的世界",
    "404–420",
    22,
    "Agent environment 定义 observation、action、reward 与 episode。它既是训练场，也是评估基准；没有可重置、隔离、记录的环境，长轨迹能力无法被可靠比较。",
    [
      {
        title: "四个环境轴",
        english: "Observation, Action, Reward, Episode",
        paragraphs: [
          "Observation 决定 Agent 看见什么；Action space 决定能做什么；Reward 定义成功；Episode structure 决定初始状态、终止与 reset。任何一轴设计错误都可能让 benchmark 失真。",
          "过于简化的 action API 会高估能力，含糊 reward 会鼓励 shortcut，无法重置的环境则让不同试验不可比较。",
        ],
      },
      {
        title: "不同 Benchmark 测不同能力",
        english: "Web, Code, OS and General Agents",
        paragraphs: [
          "WebArena 测网页操作，SWE-bench 测真实代码修复，OSWorld 测桌面控制，GAIA 测通用工具推理。一个系统在代码环境表现好，并不能推出它擅长视觉 GUI。",
          "原文比较显示，人类与 Agent 的差距在 computer-use 任务尤其明显，而代码修复相对更小，反映训练数据与 action space 成熟度差异。",
        ],
      },
      {
        title: "Trajectory Quality 与安全",
        english: "Beyond Final Success",
        paragraphs: [
          "Agent 可能完成目标却使用危险步骤，也可能失败但完成大部分工作。评估应记录 action efficiency、policy violation、恢复能力、成本与 partial credit。",
          "标准化环境如 OpenEnv 试图用 Gymnasium 风格接口与隔离容器降低复现成本，但没有单一环境能覆盖全部自主能力。",
        ],
      },
    ],
  ),
  c(
    22,
    "Model Context Protocol (MCP)",
    "MCP：统一 Agent 与工具之间的连接方式",
    "421–440",
    22,
    "MCP 用标准 client-server 协议连接 LLM application 与外部 tools/resources/prompts，把每个 Agent 分别适配每个工具的 N×M 问题，降低为双方各实现一次协议的 N+M。",
    [
      {
        title: "Host、Client 与 Server",
        english: "Architecture and Lifecycle",
        paragraphs: [
          "Host 承担用户体验、权限与模型调用；Client 在 Host 内维护与某个 MCP Server 的 session；Server 暴露能力并在自己的 trust boundary 中执行。",
          "生命周期从 initialize 和 capability negotiation 开始，再进行 discovery、invocation 与 result handling。模型不应直接绕过 Host 接触 Server。",
        ],
      },
      {
        title: "四个核心 primitives",
        english: "Tools, Resources, Prompts, Sampling",
        paragraphs: [
          "Tools 是可调用 action；Resources 是可读取 context；Prompts 是 Server 提供的模板；Sampling 允许 Server 请求 Host 使用模型完成嵌套生成。Schema 通常使用 JSON Schema，wire format 为 JSON-RPC 2.0。",
          "Tools 与 Resources 的语义不同：读取文档不应伪装成具有副作用的 action，执行删除也不能伪装成无害 resource fetch。",
        ],
      },
      {
        title: "标准化不会自动带来安全",
        english: "Consent and Trust Boundary",
        paragraphs: [
          "Host 必须展示 Server 来源、请求权限与具体 tool call，并对敏感动作设置 approval。Server 返回的文本仍是不可信输入，可能包含 prompt injection。",
          "原文进一步讨论把 MCP 视作 tool-using RL 的统一环境接口：它适合定义 action space 与记录 trajectory，但 reward、episode reset 和 observation schema 仍未完全标准化。",
        ],
      },
    ],
  ),
  c(
    23,
    "Agent Skills",
    "Agent Skills：可发现、可组合、可版本化的能力模块",
    "441–445",
    18,
    "Skill 不是单个函数，而是把 domain instructions、tools、knowledge、workflow 与 guardrails 封装为可复用能力。Tool 像锤子，Skill 是知道如何建房，Agent 则是选择并组合技能的木匠。",
    [
      {
        title: "Skill 的构成",
        english: "Prompt + Tools + Knowledge + Workflow + Guardrails",
        paragraphs: [
          "一个 code review skill 可能同时加载审查标准、file/git tools、示例、检查步骤和输出 schema。它定义的是一段可复现工作方法，而不是只给模型多一个 API。",
          "边界越清晰，Skill 越容易测试、授权和组合。试图“什么都做”的 Skill 会把无关知识塞进 context，反而降低选择质量。",
        ],
      },
      {
        title: "加载与发现模式",
        english: "Static, Dynamic and Hierarchical",
        paragraphs: [
          "Static loading 简单但浪费 context；dynamic discovery 根据任务匹配少量 Skill，更可扩展却可能路由失败；hierarchical composition 让高层 Skill 依赖可共享的子 Skill，形成 DAG。",
          "生产 registry 还需要 manifest、version pinning、dependency resolution 与 permission model，使 Agent 能知道能力从哪里来、需要哪些服务、可对哪些数据执行。",
        ],
      },
      {
        title: "Skill 与 Fine-tuning 互补",
        english: "Runtime Capability vs. Parametric Change",
        paragraphs: [
          "Fine-tuning 改变模型参数，适合稳定、深层行为；Skill 可以立即更新、按用户切换和组合，但占用 context，能力也受基础模型限制。",
          "常见组合是：用训练获得 instruction following、tool format 与 reasoning 基础，再用 Skill 注入具体组织流程和领域知识。",
        ],
      },
    ],
  ),
  c(
    24,
    "Agent-to-Agent Communication (A2A)",
    "A2A：让异构 Agent 发现、委派与跟踪任务",
    "446–467",
    22,
    "A2A 处理 Agent 与 Agent 的互操作：通过 Agent Card 声明能力，以标准 task lifecycle 接收、执行、stream progress 并返回 artifact。它与 MCP 互补——MCP 连接工具，A2A 连接自主执行者。",
    [
      {
        title: "发现与任务生命周期",
        english: "Agent Cards and Tasks",
        paragraphs: [
          "Agent Card 描述 endpoint、capabilities、authentication 与可处理的 skill。调用方先发现合适 Agent，再创建 task；task 可处于 submitted、working、input-required、completed、failed 等状态。",
          "长任务需要 SSE 等 streaming 机制返回进度，而不是让调用方无期限等待单个 HTTP response。Artifact 与 message 应保留可追踪关系。",
        ],
      },
      {
        title: "通信不等于协调",
        english: "Delegation, Negotiation and Consensus",
        paragraphs: [
          "Request-response 适合直接委派；Contract Net 用竞标分配任务；Blackboard 让多个 Agent 围绕共享状态协作；Consensus 处理意见合并。协议选择取决于任务复杂度和 latency。",
          "A2A 只规定交互语言，不会自动解决目标冲突、错误 delegation 或 credit assignment。协调 policy 仍然属于应用架构。",
        ],
      },
      {
        title: "Identity、Scope 与 Audit",
        english: "Enterprise Security",
        paragraphs: [
          "跨组织 Agent 必须验证身份、限制 authorization scope、传播 correlation ID 并记录 audit trail。一个 Agent 的授权不能默认传递给所有下游 Agent。",
          "当多个 orchestrator 给出冲突指令时，系统需要显式 ownership 和 conflict resolution，而不能让执行 Agent自行猜测优先级。",
        ],
      },
    ],
  ),
  c(
    25,
    "Multi-Agent Systems",
    "Multi-Agent Systems：专业化带来质量，也放大通信与故障",
    "468–488",
    24,
    "Multi-Agent 系统把单个通用 Agent 拆为具有角色、工具和 context 边界的多个执行者。收益来自 specialization 与并行，不来自 Agent 数量本身；通信 token、协调延迟和错误传播会快速增长。",
    [
      {
        title: "拓扑决定系统性质",
        english: "Supervisor, Hierarchy, Peer-to-Peer, Swarm",
        paragraphs: [
          "Central supervisor 易于追踪和控制，但形成瓶颈；hierarchy 适合大任务分解，却可能产生信息损失；peer-to-peer 灵活但难调试；swarm 依赖局部规则，可能出现 emergent behavior。",
          "原文建议从 centralized supervisor 开始，测量其限制后再升级。复杂拓扑必须由任务结构证明，而不是为了显得 Agentic。",
        ],
      },
      {
        title: "协调成本与 credit assignment",
        english: "Communication Is Not Free",
        paragraphs: [
          "每条 inter-agent message 都消耗 token，也可能重复 context。Shared memory 减少复制，却引入并发一致性与权限问题。需要定义哪些信息广播、哪些只回传摘要。",
          "Multi-agent RL 还面对 non-stationarity：一个 Agent 学习时，其他 Agent 的策略也在变。CTDE 用集中训练获得全局信号，在执行时保持分散，是合作场景的重要方法。",
        ],
      },
      {
        title: "Safety 与自修改边界",
        english: "Emergence and Meta-level Constraints",
        paragraphs: [
          "多个 Agent 可能相互确认错误、形成 delegation loop 或绕过原本的 approval path。安全监控必须观察系统级行为，而不是只审查单个消息。",
          "BDI-LLM 等自演化架构允许更新 beliefs、desires 与 intentions，甚至重写计划代码。原文提醒：Agent 可能为了效率删除自身约束，因此不可修改的 meta-level guardrail 是必要边界。",
        ],
      },
    ],
  ),
  c(
    26,
    "Agent Development Frameworks",
    "Agent Frameworks：选择状态模型，而不是追逐 API 热度",
    "489–521",
    24,
    "Framework 把 state、graph、tool、multi-agent、trace 与 deployment 封装为工程抽象。原文比较 LangGraph、AutoGen、CrewAI、DSPy、OpenAI Agents SDK 等，并强调框架选择应由控制需求和运行模型决定。",
    [
      {
        title: "不同框架优化不同问题",
        english: "Framework Trade-offs",
        paragraphs: [
          "LangGraph 强调显式 state graph、checkpoint 与可控 workflow；AutoGen 强调对话式 multi-agent；CrewAI 提供角色化简洁抽象；DSPy 关注程序化 prompt/module optimization；Agents SDK 强调 handoff、tools 与 tracing。",
          "选型时要看 state 是否一等公民、能否暂停恢复、是否支持自定义 executor、trace 可否导出，以及框架升级是否锁定数据格式。",
        ],
      },
      {
        title: "Production Agent 是长运行任务",
        english: "Async, Queues and Checkpoints",
        paragraphs: [
          "真实 Agent 往往超过单个 HTTP request 生命周期，需要 queue、worker、idempotency、checkpoint 与 cancellation。Async execution 是默认，而不是可选优化。",
          "Rate limit、tenant isolation、secret handling、rollback 与 on-call runbook 都属于框架之外的生产责任，不能因为 demo 能运行就忽略。",
        ],
      },
      {
        title: "Testing 与 Observability 决定可维护性",
        english: "Lifecycle Engineering",
        paragraphs: [
          "Unit test 验证 tool/context component，integration test 使用 scripted model，behavioral eval 检查任务结果，performance test 监控成本和 latency；生产 trace 再反馈为 regression cases。",
          "Model routing、cache 与 early termination 可显著降低成本，但必须在质量评估下实施。Agent 开发是持续监控、失败分析和迭代的生命周期。",
        ],
      },
    ],
  ),
  c(
    27,
    "Agentic UI Frameworks",
    "Agentic UI：让自主过程可见、可控、可恢复",
    "522–544",
    22,
    "Agentic UI 不只是聊天框。它必须呈现长任务状态、tool action、证据、成本与 approval point，让用户能在正确时刻理解、修正、暂停或停止系统。",
    [
      {
        title: "选择适合任务的界面范式",
        english: "Chat, Canvas, Workflow, Dashboard",
        paragraphs: [
          "Chat 适合开放对话，Canvas 适合共同编辑 artifact，Workflow 适合可见步骤与批准，Dashboard 适合多任务监控，Autonomous surface 则适合低频监督。生产产品通常组合多种范式。",
          "界面应匹配任务结构与人类参与程度，而不是把所有 Agent 都包装成聊天气泡。",
        ],
      },
      {
        title: "Streaming 与工具可视化",
        english: "Typed Events",
        paragraphs: [
          "前端需要区分 status、token、tool call、tool result、artifact 与 approval event。Typed event protocol 让每类事件以合适组件呈现，而不是把内部日志混成一段文本。",
          "透明度不等于暴露 private chain-of-thought。对用户真正有用的是计划摘要、正在使用的工具、证据、状态、风险和下一步。",
        ],
      },
      {
        title: "分级批准与可恢复信任",
        english: "Tiered Approval and Recoverability",
        paragraphs: [
          "Flat approval 会在“每一步都打断”和“全部自动”之间二选一。Tiered policy 自动通过低风险读操作，对可逆写操作展示 diff，对不可逆动作要求明确确认。",
          "Undo、audit trail、checkpoint、partial result 与 calibrated confidence 共同建立信任。用户信任的不是 Agent 永不犯错，而是错误可见且可恢复。",
        ],
      },
    ],
  ),
  c(
    28,
    "Quiz Questions & Detailed Answers",
    "如何使用原书的 108 道测验",
    "545–596",
    14,
    "本章不是新增理论，而是用 108 道题覆盖 architecture、RL、reasoning、systems 与 Agentic AI。有效用法不是直接读答案，而是先生成自己的解释，再对照遗漏的概念、边界与公式。",
    [
      {
        title: "把题目当作 retrieval practice",
        english: "Recall Before Review",
        paragraphs: [
          "阅读后立即重看正文会产生熟悉感，却不等于能够独立解释。先闭卷回答，能暴露知识图中的断点；再看详细答案，才知道错误来自概念、公式还是适用条件。",
          "本站因此把每单元题目分为机判与开放题，并让低分主题进入间隔复习，而不是一次完成后消失。",
        ],
      },
      {
        title: "详细答案要拆成评分点",
        english: "Rubric-based Learning",
        paragraphs: [
          "开放题答案应拆成若干可检查要点，例如定义、机制、trade-off、failure mode 与工程例子。只比较措辞相似度无法判断是否真正掌握。",
          "迁移变式用于测试能否把同一原则应用到新情境。如果只能复述原例，知识仍停留在 recognition。",
        ],
      },
      {
        title: "把错误变成下一次课程入口",
        english: "Error-driven Review",
        paragraphs: [
          "错题不应只记录正确答案，还应记录错误类型：术语混淆、因果倒置、忽略约束、算式错误或工程边界缺失。",
          "复习时先解释为什么原答案会失败，再回答变式，能比机械重复更快建立稳定模型。",
        ],
      },
    ],
  ),
  c(
    29,
    "Quick Reference",
    "怎样使用速查表而不是背诵速查表",
    "597–604",
    12,
    "Quick Reference 汇总关键 equations、hyperparameters、API patterns 与 failure diagnostics。它是工作中的定位工具，不替代前文的推导与适用条件。",
    [
      {
        title: "公式先问假设",
        english: "Equations in Context",
        paragraphs: [
          "看到 PPO clip、DPO loss 或 GRPO advantage 时，先确认数据来自哪种 policy、reward 如何定义、reference 是否存在，再代入符号。相同公式在错误数据路径上仍会给出数值。",
          "速查页适合回忆符号与默认范围，不能证明某个超参数适合当前模型和任务。",
        ],
      },
      {
        title: "Hyperparameter 是诊断起点",
        english: "Defaults Are Not Guarantees",
        paragraphs: [
          "学习率、KL coefficient、group size、chunk size、top-k 都与数据和预算耦合。默认值的作用是给实验一个稳定起点，再通过指标和 failure signal 调整。",
          "把参数与症状连接起来更有价值：KL 爆炸、reward 方差过低、retrieval recall 下降、loop 无进展分别指向不同干预。",
        ],
      },
      {
        title: "API 与协议要回到版本",
        english: "Version-aware Reference",
        paragraphs: [
          "MCP、A2A 和 Agent frameworks 都在快速迭代。速查示例说明概念与形状，实际实现仍需核对当前官方 schema、transport 与安全建议。",
          "稳定的是边界原则：validated inputs、explicit state、least privilege、observable events 与 recoverable execution。",
        ],
      },
    ],
  ),
  c(
    30,
    "Conclusion and Future Directions",
    "结论与未来方向",
    "605–608",
    14,
    "最后一章把未来问题归纳为 interaction learning、evaluation、security、coordination、efficiency 与 accessibility。共同主题是：Agent 能力继续增长时，系统必须同时降低成本、约束副作用并让更多人能够理解和控制它。",
    [
      {
        title: "从静态训练到持续交互学习",
        english: "Learning from Interaction",
        paragraphs: [
          "未来 Agent 会更多从真实 trajectory、用户修正与环境反馈中学习，而不是只依赖离线数据。关键难题是如何区分可靠反馈、偶然成功与被利用的 reward。",
          "持续学习还会带来模型和 Memory 的版本一致性、隐私删除与行为漂移问题，需要新的 data governance。",
        ],
      },
      {
        title: "Evaluation 必须成为系统科学",
        english: "Cost–Quality–Safety Frontier",
        paragraphs: [
          "单一准确率无法比较两个同样正确但成本相差十倍的 Agent。未来评估需要同时报告 success、latency、token/tool cost、variance、safety 与 recoverability 的 Pareto frontier。",
          "长任务还要求 benchmark 能重放环境、记录 trajectory 并检测隐藏副作用，而不只检查最终文本。",
        ],
      },
      {
        title: "人的判断仍是设计中心",
        english: "Human Agency",
        paragraphs: [
          "更强 autonomy 不等于所有任务都应减少人类参与。系统应让用户选择自治级别，并在风险、歧义或价值冲突时升级。",
          "真正成熟的 Agentic AI 会把能力、成本、证据和限制同时呈现出来：让人获得杠杆，而不是失去控制。",
        ],
      },
    ],
  ),
];

const lessonChapterMap: Record<string, number[]> = {
  roadmap: [0],
  foundations: [1, 2, 3],
  alignment: [4, 5, 6, 7, 8],
  "training-systems": [9, 10, 11, 12],
  "reasoning-evaluation": [13, 14],
  "agentic-stack": [15],
  "rag-memory": [16, 17],
  "harness-loop": [18, 19],
  "patterns-environments": [20, 21],
  protocols: [22, 23, 24],
  "multiagent-frameworks": [25, 26],
  "ui-future": [27, 28, 29, 30],
};

export function readingsForLesson(slug: string): ChapterReading[] {
  const chapters = lessonChapterMap[slug] ?? [];
  return chapters
    .map((chapter) => chapterReadings.find((item) => item.chapter === chapter))
    .filter((item): item is ChapterReading => Boolean(item));
}
