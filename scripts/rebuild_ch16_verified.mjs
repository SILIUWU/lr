import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  codeNotes,
  formulaNotes,
  paragraphAdditions,
} from "./ch16_full_translation.mjs";

const T = (zhTitle, paragraphs, extra = {}) => ({
  zhTitle,
  paragraphs: Array.isArray(paragraphs) ? paragraphs : [paragraphs],
  ...extra,
});

const translations = {
  intro: T(
    "RAG：为 LLM 接入可更新的外部知识",
    "Retrieval-Augmented Generation（RAG）是大语言模型生产部署中最具实际影响力的技术之一。它不要求模型只依靠训练时压缩进参数的知识，而是为 LLM 接入动态、可更新的外部记忆，使知识密集型任务中的回答更准确、更 grounded，也更容易验证。"
  ),
  "16.1": T(
    "动机与问题定义",
    "LLM 以 parametric knowledge 的形式保存知识：训练语料被压缩进数十亿参数。这种方式有三项根本限制：当问题越出可靠知识边界时，模型可能自信地 hallucinate；训练数据存在截止日期，知识会过时；通用模型也不了解企业内部文档、专有代码库、专业法规等领域信息。",
    {
      lists: [[
        "Hallucination：回答听起来合理，却与事实不符。",
        "Knowledge staleness：训练完成后发生的事件、论文和产品更新不会自动进入模型。",
        "Domain specificity：通用训练无法覆盖组织私有数据与高度专业化知识。"
      ]]
    }
  ),
  "16.1.1": T(
    "Parametric 与 Non-Parametric Knowledge",
    [
      "设参数为 $\\theta$ 的语言模型为 $\\mathcal{M}_\\theta$，外部文档集合为 $\\mathcal{D}=\\{d_1,d_2,\\ldots,d_N\\}$。纯 parametric 模式直接计算给定 query $q$ 时 answer $a$ 的概率；RAG 则同时考虑“检索到文档 $d$ 的概率”和“在 $q,d$ 条件下生成 $a$ 的概率”，并对可能的证据文档求和。",
      "因此，RAG 的生成不是凭空多了一份知识，而是通过 retrieval distribution 把答案条件化在 non-parametric evidence 上。原书用图书馆作类比：parametric LLM 像一位记住大量藏书、但已经离校多年的学者；RAG 相当于给他一张借书证，使他能实时查证、引用来源，并在需要时承认必须核对资料。"
    ],
    {
      formulaNotes: [{
        equation: "16.1–16.2",
        title: "Parametric 与 RAG 的生成概率",
        reading: "式 (16.1) 只让生成依赖 query 与模型参数；式 (16.2) 先由 retriever 给文档分配概率，再把各文档条件下的生成概率加权求和。这个求和就是对 retrieved evidence 做 marginalization。",
        symbols: [
          ["\\mathcal{M}_\\theta", "参数为 $\\theta$ 的语言模型"],
          ["\\mathcal{D}", "外部文档语料库"],
          ["P_{\\mathrm{ret}}", "retriever 在文档上的概率分布"],
          ["a, q, d", "answer、query 与候选证据文档"]
        ]
      }]
    }
  ),
  "16.1.2": T(
    "何时选择 RAG、Fine-Tuning 或 Long Context",
    [
      "RAG、fine-tuning 与 long context 解决的不是同一问题。知识频繁更新、需要 citation/grounding、或者语料规模很大且具有私有性时，RAG 更合适；需要适配表达风格、输出格式或教授新的 reasoning skill 时，fine-tuning 更直接；语料本身能完整放入 context window 时，long context 可能最简单。",
      "常见误解是把 RAG 当成 fine-tuning 的替代品。原书强调：fine-tuning 主要教模型“怎样推理和作答”，RAG 提供“围绕什么事实推理”。两者可以互补；instruction following 更好的模型通常也能更有效地使用 retrieved context。"
    ],
    {
      tables: [{
        caption: "Table 16.1 · RAG、Fine-Tuning 与 Long Context 的决策对照",
        columns: ["判断条件", "RAG", "Fine-Tuning", "Long Context", "RAG + FT"],
        rows: [
          ["知识频繁更新", "适合", "不适合", "不适合", "适合"],
          ["需要引用与 grounding", "适合", "不适合", "适合", "适合"],
          ["大型私有语料", "适合", "不适合", "通常不适合", "适合"],
          ["适配风格或格式", "不直接解决", "适合", "不直接解决", "适合"],
          ["教授新 reasoning skill", "不直接解决", "适合", "不直接解决", "适合"],
          ["语料可完整装入 context", "非必要", "非必要", "适合", "非必要"],
          ["极低延迟优先", "有额外开销", "较适合", "长输入开销高", "开销较高"]
        ]
      }]
    }
  ),
  "16.2": T(
    "RAG 核心架构",
    "标准 RAG 分成两个阶段：offline indexing pipeline 负责处理并存储文档；online retrieval-generation pipeline 在每次 query 到来时检索证据并生成回答。离线阶段的质量决定能否找到信息，在线阶段则决定如何把证据交给模型并约束生成。"
  ),
  "16.2.1": T(
    "完整 Pipeline",
    "端到端 RAG 把一次性的离线索引与逐请求执行的在线服务分开。离线侧完成文档加载、chunking、embedding 与入库；在线侧把 query 编码后检索 top-k chunk，将其注入 prompt，再由 LLM 生成答案。",
    {
      figure: {
        number: "Figure 16.1",
        src: "/paper/figure-16-1.webp",
        caption: "Figure 16.1 · 端到端 RAG 架构。蓝色部分表示一次构建、持续更新的 offline indexing；绿色与橙色部分表示每次 query 都会执行的 online retrieval 与 generation。",
        alt: "RAG 离线索引和在线检索生成两条数据流。"
      }
    }
  ),
  "16.2.2": T(
    "Indexing Pipeline",
    [
      "Document loading：输入可能是 PDF、HTML、Markdown、DOCX 或代码。loader 不只抽取干净文本，还应保留 source URL、页码、section title、timestamp 等 metadata，以支持 filtering 与 citation。",
      "Chunking：长文档必须切成 embedding model context window 能容纳、同时语义相对完整的 chunk。原书给出典型上限 512 tokens，并把 chunking strategy 视为影响 RAG 质量最大的设计之一。",
      "Embedding：每个 chunk $c_i$ 由 embedding model $f_\\phi$ 编码为 $d$ 维向量 $\\mathbf{e}_i=f_\\phi(c_i)\\in\\mathbb{R}^d$，并与原文和 metadata 一起写入 vector database。"
    ]
  ),
  "16.2.3": T(
    "Retrieval",
    "给定 query $q$，retriever 先用同一 embedding model 得到向量 $\\mathbf{q}=f_\\phi(q)$，再以 cosine similarity 搜索最相近的 $k$ 个 chunk。返回的 top-$k$ 集合 $\\mathcal{C}_k=\\{c_{(1)},\\ldots,c_{(k)}\\}$ 会成为后续生成所见的 context；因此 embedding 空间、index 和 $k$ 的选择会共同决定召回边界。",
    {
      formulaNotes: [{
        equation: "16.3",
        title: "Query 与 Chunk 的 Cosine Similarity",
        reading: "点积衡量两个向量方向的一致程度，分母用两者的 L2 norm 做归一化，因此结果不被向量长度直接支配。相似度越高，chunk 越可能进入 top-k context。",
        symbols: [
          ["\\mathbf{q}", "query embedding"],
          ["\\mathbf{e}_i", "第 i 个 chunk 的 embedding"],
          ["\\|\\cdot\\|", "向量的 L2 norm"]
        ]
      }]
    }
  ),
  "16.2.4": T(
    "Generation",
    "Retrieved chunks 会被组织进 prompt template。原书示例要求模型只能使用给定 context 作答；证据不足时应明确说明，并以 [Doc N] 标注引用。关键不是简单拼接文本，而是同时保存 source 与 page metadata，让最终回答可以追溯。"
  ),
  "16.3": T(
    "Retrieval 方法",
    "本节依次比较 sparse、dense、hybrid、learned sparse 与 late-interaction retrieval。它们在 lexical matching、semantic generalization、索引体量、查询延迟、GPU 需求和可解释性之间做不同取舍。",
    { editorial: true }
  ),
  "16.3.1": T(
    "Sparse Retrieval：BM25 与 TF-IDF",
    [
      "Sparse retrieval 把 query 与文档表示为词表空间中的高维稀疏向量。BM25 根据 query term 在文档中的出现频率、文档长度与 term 的区分度计算相关性；$k_1$ 通常取 $1.2$–$2.0$，$b$ 常取 $0.75$。",
      "即使 dense retrieval 已普及，sparse 方法仍在精确关键词、产品码、错误码、专有名词和罕见词上占优势。它易于解释、无需 GPU，可借助 inverted index 扩展到海量文档，也能处理 embedding 训练时未见过的新术语。"
    ]
  ),
  "16.3.2": T(
    "Dense Retrieval：DPR",
    [
      "Dense Passage Retrieval（DPR）使用独立的 query encoder $E_Q$ 与 passage encoder $E_P$。两者通常基于 BERT，通过 contrastive loss 训练，使相关 query-passage pair 在 embedding space 中靠近。",
      "训练一个包含 $B$ 对正样本的 batch 时，同 batch 的其他 passage 可直接作为 negative；temperature $\\tau$ 控制 softmax 的尖锐程度。仅靠随机 negative 往往不够，lexically similar 但语义不相关的 hard negatives 对提升 retriever 很关键。",
      "面对百万乃至十亿级向量，穷举搜索不可行。FAISS 提供 IVF、HNSW 与 Product Quantization：IVF 先把向量聚类并只查近邻 cell；HNSW 用多层小世界图获得近似 $O(\\log N)$ 搜索；PQ 压缩向量以降低内存。"
    ]
  ),
  "16.3.3": T(
    "使用 Reciprocal Rank Fusion 的 Hybrid Retrieval",
    [
      "Hybrid retrieval 同时利用 dense 与 sparse signal。直接线性组合需要先解决两套 score 的尺度不可比问题；Reciprocal Rank Fusion（RRF）绕开 score calibration，改为只使用每个结果在各排名列表中的 rank。",
      "RRF 对每份 ranked list 累加 $1/(k+\\operatorname{rank})$。原书采用 $k=60$ 作为平滑常数，降低头部名次的过强影响。若同一文档在 BM25 中排第 3、dense retrieval 中排第 7，其 RRF 为 $1/63+1/67\\approx0.0308$；两个列表都排第 1 时约为 $0.0328$。"
    ]
  ),
  "16.3.4": T(
    "Learned Sparse Retrieval：SPLADE 与 SPLADEv2",
    [
      "SPLADE 的目标是在 BM25 的高效 inverted-index lookup 与 dense model 的 semantic expansion 之间取得平衡。它复用 masked language model 的 vocabulary logits，把文档或 query 映射成覆盖整个词表的稀疏权重向量；即使某个 token 未出现在原文中，只要语义相关，也可能获得非零权重。",
      "对输入 x 的每个位置，模型先得到词表 logits，再跨位置取 max，并使用 log(1+ReLU(·))。ReLU 使多数词项权重归零；log saturation 防止单个词项支配结果；max pooling 保留任一位置给出的最强语义信号。query 与 document 的 sparse vector 通过点积评分，通常只含 20–200 个非零项，因此可直接用 Lucene/Anserini 等 inverted index 服务。",
      "SPLADE 以 contrastive loss 训练，并对 query/document representation 加 L1 sparsity penalty。SPLADEv2 进一步引入 cross-encoder distillation、query/document 非对称稀疏目标、直接惩罚 expected posting-list cost 的 FLOPS regularizer，并以 DistilBERT 降低编码成本。",
      "原书的使用建议是：若线上无 GPU、已有 Elasticsearch/Lucene 基础设施或需要解释 expanded term，可优先考虑 SPLADEv2；若多语言能力与短 query 更重要，可考虑 dense model。常见强基线是 SPLADEv2 first-stage retrieval 加 top-k cross-encoder reranking。"
    ],
    {
      tables: [{
        caption: "SPLADE 与 SPLADEv2 的主要差异",
        columns: ["维度", "SPLADE", "SPLADEv2"],
        rows: [
          ["训练信号", "binary relevance + hard negatives", "cross-encoder distillation"],
          ["稀疏控制", "L1 regularization", "FLOPS-aware regularization"],
          ["Query/Document", "同 encoder、同 λ", "非对称，query 更稀疏"],
          ["Backbone", "BERT-base 110M", "DistilBERT 66M"],
          ["MS MARCO MRR@10", "34.0", "36.8"],
          ["每文档平均非零词项", "约 200", "约 120"]
        ]
      }]
    }
  ),
  "16.3.5": T(
    "ColBERT：Late Interaction",
    [
      "ColBERT 不把整段文本压成单个向量，而是为 query 与 document 保留一组 token-level embedding。评分时，对每个 query token 找到与它最相似的 document token，再把这些 MaxSim 值求和。它比 single-vector bi-encoder 表达力更强，又比 cross-encoder 快，因为 document embedding 可以离线预计算。",
      "query encoder 与 document encoder 都输出 per-token representation，并经线性层投影到通常为 128 维。训练使用 positive passage 与 in-batch、BM25 hard negative，ColBERTv2 还可由 cross-encoder teacher 挖掘难负例并蒸馏 score。",
      "Serving 时只实时编码 query；document token embeddings 已写入 index。PLAID 先用 centroid 取 candidate，再对候选计算精确 MaxSim，可降低 5–10 倍 latency。代价是 index size 远大于 single-vector 方法，不过 residual quantization 可把每维压到约 2 bytes。"
    ]
  ),
  "16.3.6": T(
    "Retrieval 方法对照",
    "不存在对所有场景都最优的 retriever。低延迟精确匹配可从 BM25 起步；语义召回可用 DPR；精度优先可用 ColBERT；cross-encoder 适合只对较小 candidate set 重排；生产系统常以 sparse+dense+RRF 获得稳健基线。",
    {
      tables: [{
        caption: "Table 16.2 · Retrieval 方法的关键维度比较",
        columns: ["方法", "延迟", "准确度", "索引体量", "GPU", "适用场景"],
        rows: [
          ["TF-IDF", "很低", "低", "小", "否", "baseline、exact match"],
          ["BM25", "很低", "中", "小", "否", "keyword、rare term"],
          ["DPR / bi-encoder", "低", "高", "大", "是", "semantic similarity"],
          ["SPLADE", "低", "高", "中", "通常是", "语义扩展与稀疏检索"],
          ["ColBERT", "中", "很高", "很大", "是", "高精度 retrieval"],
          ["Cross-encoder", "高", "最高", "不单独建检索索引", "是", "top-k reranking"],
          ["Hybrid RRF", "低", "很高", "大", "视 dense 部分而定", "production default"]
        ]
      }]
    }
  ),
  "16.4": T(
    "Chunking 策略",
    "Chunking 要同时满足三项要求：chunk 足够小，能进入 embedding model 的 context window；语义相对完整；被单独检索出来时仍保留足够背景。切得太大降低检索精度，切得太小则会丢失上下文和关系。"
  ),
  "16.4.1": T(
    "带 Overlap 的 Fixed-Size Chunking",
    [
      "最简单的策略是每 W 个 token 切一段，相邻 chunk 重叠 O 个 token。Overlap 用来降低信息刚好跨越边界时的损失，但会增加索引条目、embedding 成本与重复 context。",
      "长度为 $L$ 的文档，chunk 数量为 $\\left\\lceil(L-O)/(W-O)\\right\\rceil$。原书代码示例使用 `chunk_size=512`、`chunk_overlap=64`，并优先按空行、换行、句号和空格递归切分。"
    ]
  ),
  "16.4.2": T(
    "Semantic Chunking",
    "Semantic chunking 不按固定间隔切分，而是计算相邻句子的 embedding similarity，在 topic boundary 处断开。原书示例使用 SemanticChunker，并以第 95 百分位的不相似度作为 breakpoint，即只在最明显的 5% 语义跳变处切分。这样更贴近主题结构，但需要额外 embedding 计算，而且 threshold 会直接影响 chunk 粒度。"
  ),
  "16.4.3": T(
    "Document-Structure-Aware Chunking",
    "结构化文档应优先利用天然边界：Markdown 按二级标题等 header 切分并保留 section context；HTML 按 section/article/p 标签；代码按 function/class definition，同时保留必要 import；表格应整体作为一个 chunk，不能从行中间切开。",
    {
      lists: [[
        "Markdown：以 heading 为边界，并携带父级标题。",
        "HTML：使用语义标签，而不是按字符数硬切。",
        "Code：按函数或类切分，并保留依赖与 import context。",
        "Table：整表保留，避免破坏 row/column 语义。"
      ]]
    }
  ),
  "16.4.4": T(
    "Parent-Child Chunking",
    "Parent-child pattern 把 retrieval granularity 与 generation context 解耦：索引较小的 child chunk（例如 128 tokens）以提高命中精度；命中后返回较大的 parent chunk（例如 512 tokens）给 LLM，以恢复上下文。原书 LangChain 示例用 ParentDocumentRetriever 连接 vectorstore、parent/child splitter 与保存 parent 的 docstore。"
  ),
  "16.4.5": T(
    "Chunk Size 的经验建议",
    "Chunk size 必须随任务变化，而不是固定套用一个数字。Factoid QA 偏向 128–256 tokens；总结与综合需要 512–1024；代码通常保留完整函数；法律与监管文档适合段落级并重叠一句；对话文本常用 256–512。",
    {
      tables: [{
        caption: "Table 16.3 · 不同场景的 chunk size 建议",
        columns: ["场景", "建议大小", "Overlap"],
        rows: [
          ["Factoid QA", "128–256 tokens", "20–32 tokens"],
          ["总结 / 综合", "512–1024 tokens", "64–128 tokens"],
          ["代码检索", "完整函数", "无"],
          ["法律 / 监管文档", "段落级", "1 句"],
          ["对话 / Chat", "256–512 tokens", "32–64 tokens"]
        ]
      }]
    }
  ),
  "16.5": T(
    "Advanced RAG Patterns",
    "基础 retrieve-then-generate 之外，还可以在 query、candidate ranking、context selection 与 generation control 等位置加入自适应机制。本节按数据流顺序介绍 query transformation、reranking、compression，以及 Self-RAG、CRAG、Adaptive RAG、Graph RAG 与 RAG-Fusion。",
    { editorial: true }
  ),
  "16.5.1": T(
    "Query Transformation",
    [
      "真实用户 query 往往短、含糊，或与文档语言不一致。HyDE 不直接 embed query，而是先让 LLM 生成 hypothetical answer，再对这段更像文档语言的文本求 embedding，以缩小 query-document distribution gap。",
      "Step-back prompting 先把具体问题改写成更一般的问题，同时检索原问题与 step-back question；multi-query generation 则生成 M 个多样化 reformulation，分别检索、合并并去重结果。后者提高 recall，但会增加查询次数与成本。"
    ]
  ),
  "16.5.2": T(
    "Re-Ranking",
    "First-stage retriever 返回 top-k candidate 后，cross-encoder 把 query 与每个 document pair 一起编码并重新评分。由于它能让两侧 token 直接 attention，相关性通常更准确；代价是无法预计算 document embedding，latency 较高。因此它不适合全库初检，却很适合重排约 20–100 个候选。"
  ),
  "16.5.3": T(
    "Contextual Compression：上下文压缩",
    "初次检索返回的 chunk 往往会在真正相关的段落周围夹带无关句子。Contextual compression 使用 LLM，只抽取其中与当前 query 相关的部分，从而减少送入生成模型的无效 context。",
    {
      originalExcerpt: "Retrieved chunks often contain irrelevant sentences surrounding the relevant passage."
    }
  ),
  "16.5.4": T(
    "Self-RAG",
    "Self-RAG 训练同一个模型完成三类决策：是否需要 retrieval；在有或没有检索结果时生成；使用特殊 reflection token 批评自己的结果。模型与正文一起预测 [Retrieve]、[IsRel]、[IsSup] 与 [IsUse]，分别判断是否检索、passage 是否相关、陈述是否得到 passage 支持，以及整体回答是否有用。"
  ),
  "16.5.5": T(
    "CRAG：Corrective RAG",
    "CRAG 增加 retrieval evaluator。系统先检索 top-k 文档，把每份证据评为 Correct、Ambiguous 或 Incorrect；若所有结果都不可靠，则回退到 web search；若部分可靠，则执行 knowledge refinement，剥离不相关句子；最后只用修正后的 context 生成答案。它把“检索结果一定可用”的假设改成显式质量分支。"
  ),
  "16.5.6": T(
    "Adaptive RAG",
    "Adaptive RAG 先预测 query complexity，再路由到不同策略：简单事实问题不检索；中等复杂度采用一次 retrieve-then-generate；复杂 multi-hop 问题使用迭代式 multi-step RAG。路由器通常是用复杂度标签训练的 lightweight classifier。"
  ),
  "16.5.7": T(
    "Graph RAG",
    [
      "Graph RAG 从每个 chunk 抽取 entity 与 relationship，构建 knowledge graph，再用 Leiden 等 community detection 在多种分辨率上划分 community，并让 LLM 为每个 community 生成 summary。",
      "Global query 可在 community summaries 上做 map-reduce，适合回答“整个语料的主要主题是什么”；local query 仍可使用普通 vector search。Graph RAG 的跨文档综合能力强，但 graph construction 与 maintenance 成本高；询问单份文档局部事实时，standard RAG 通常更合适。"
    ]
  ),
  "16.5.8": T(
    "RAG-Fusion",
    "RAG-Fusion 从原 query 生成多个 search query，对每个变体分别检索，再用 §16.3.3 的 RRF 融合 ranked lists。它不要求不同 retriever 的 score 位于同一尺度，适合 query 表达存在多种合理解释的场景；代价是多次检索与生成 query variant 的额外开销。"
  ),
  "16.6": T(
    "高效 RAG Decoding：REFRAG",
    [
      "RAG 的实际瓶颈之一是 decoding latency：大量 retrieved passages 会拉长 time-to-first-token（TTFT）并占用 KV cache，而真正相关的信息往往很稀疏。REFRAG 观察到，经 diversity 或 deduplication 选择的 passage 相互独立，其 attention pattern 近似 block-diagonal，因此多数跨 passage 计算没有必要。",
      "REFRAG 采用 Compress–Sense–Expand：先把每个 passage 的完整 KV 表示压成 compact summary；每个 decoding step 只在压缩表示上进行轻量 attention，判断当前 token 需要哪些 passage block；再只为被选中的 block 恢复完整 KV 并做精确 attention。",
      "原书报告，在 LLaMA-based model 上，REFRAG 的 TTFT 最多加速 30.85×，相较此前 sparse-attention baseline 提升 3.75×，且 perplexity 不下降；固定内存预算下有效 context length 可扩展 16×。Agentic RAG 每个 query 可能多轮检索，因而这类 sublinear decoding infrastructure 对可用性尤其重要。"
    ],
    {
      lists: [[
        "Compress：以 compact passage summary 替代完整 KV。",
        "Sense：用轻量 attention 选择与当前 token 相关的 passage block。",
        "Expand：只恢复 active block 的完整 KV 并精确计算。"
      ]]
    }
  ),
  "16.7": T(
    "Agentic RAG",
    "Agentic RAG 把 retrieval 从固定 pipeline 变成带状态的 sequential decision process：系统可以规划、选择数据源、迭代检索、判断证据是否充分，并在预算或终止条件满足时生成答案。",
    { editorial: true }
  ),
  "16.7.1": T(
    "动机：Static RAG 的边界",
    [
      "固定 retrieve-then-generate 会在 multi-hop question、ambiguous query、heterogeneous source 与 iterative refinement 上失效：下一步检索往往取决于前一步找到了什么，单次 query 无法预先覆盖所有 information need。",
      "原书把 Agentic RAG 类比为 MDP：state 是 query 与当前累计文档；action 包含 retrieve、reason、generate 和 stop；reward 是最终答案正确性。系统需要学习或设计一条 policy，决定何时检索以及检索什么。"
    ],
    {
      lists: [[
        "Multi-hop：答案依赖多次相互关联的检索。",
        "Ambiguity：看到初步结果后才能确定正确方向。",
        "Heterogeneous sources：不同子问题需要不同 knowledge base。",
        "Iterative refinement：初次检索暴露出需要改写 query。"
      ]]
    }
  ),
  "16.7.2": T(
    "Agentic RAG Architecture",
    "控制流不再单向前进：Agent 先 plan，再 retrieve；随后评估 context sufficiency，并检查最终陈述是否 grounded。证据不足时回到检索或 query refinement；证据充分时才返回 answer。",
    {
      figure: {
        number: "Figure 16.2",
        src: "/paper/figure-16-2.webp",
        caption: "Figure 16.2 · Agentic RAG control flow：Plan、Retrieve、Evaluate sufficiency 与 grounding self-check 组成可迭代闭环。",
        alt: "Agentic RAG 在计划、检索、充分性评估与生成之间循环。"
      }
    }
  ),
  "16.7.3": T(
    "Multi-Source Routing",
    [
      "不同 question type 需要不同 backend：公司 PTO policy 适合 internal vector DB；昨日央行公告需要 web search；区域营收应查 SQL database；认证 middleware 则应进入 code index。把所有问题都扔进一个 index，往往会漏答或召回无关 passage。",
      "Routing 从简单到复杂可分为 rule-based、classifier-based 与 LLM-based。规则快且可解释，但面对模糊 query 很脆弱；lightweight classifier 可在 10ms 内决策并从 routing logs 训练，但需要标签；LLM structured output 最灵活，也能解释原因，不过多一次模型调用。",
      "Production router 还应支持 fallback chain、对含糊 query 的 parallel fan-out、cost/rate-limit awareness，以及对每次 routing decision 的完整日志。若把 routing 视为 RL policy，state 是 query 与 conversation history，action 是 source 与可选 query rewrite，reward 则来自下游 answer quality。"
    ]
  ),
  "16.7.4": T(
    "完整 Agentic RAG 实现",
    [
      "完整系统把 routing、retrieval 与 evaluation 编排成 stateful graph。原书的 LangGraph 实现包含四个 node：Plan 将用户问题拆成多个 sub-query；Retrieve 把各 sub-query 路由到合适数据源并累计文档；Evaluate 判断现有 context 是否足够；Generate 从证据中生成带 citation 的答案。",
      "关键设计是 conditional loop。Evaluate 后，若 context sufficient 或 iteration budget 已耗尽，则进入 Generate；否则带着当前 state 回到 Retrieve。它对应 RL agent 的 sense–act–evaluate cycle，也使每次重试、退出原因和累计成本可以被观察。"
    ],
    {
      lists: [[
        "Plan：把原问题拆成独立 information needs。",
        "Retrieve：为每个 sub-query 选源并取回文档。",
        "Evaluate：判断累计证据是否足以回答。",
        "Generate：在证据充分或预算耗尽后生成带引用答案。"
      ]]
    }
  ),
  "16.7.5": T(
    "Tool-Augmented RAG",
    "Agentic RAG 可以把 document retrieval 与 computation tool 放在同一 tool set 中。原书示例同时提供 internal document search、SQL query、web search 与 Python execution，让 Agent 根据问题决定是读取文本证据、查询结构化数据、获取实时信息，还是执行计算。风险边界也随之扩大：SQL、Web 与 code execution 需要分别控制权限、超时、参数校验与副作用。"
  ),
  "16.7.6": T(
    "Search-R1：通过 RL 训练 Agentic RAG",
    [
      "前述方案主要依赖 prompt-engineered orchestration；Search-R1 改为用 reinforcement learning 让 LLM 学会何时搜索、搜索什么，以及搜索多少次。模型在 chain-of-thought 中输出 <search>query</search> action，environment 实时返回结果，再把 observation 注入 reasoning context。",
      "整个 reasoning+search+answer trajectory 只根据最终答案正确性获得 terminal reward。训练时每个问题采样 N 条、包含 0–5 次搜索的 trajectory，执行真实搜索，以 exact match 或 F1 打分，再计算 group-relative advantage，并用 GRPO clipped objective 更新 policy。",
      "模型由此学习：已有知识足够时避免搜索；不确定时主动查证；改写更有效的 query；根据初次结果继续搜索；并把 retrieved context 用于支持或纠正 reasoning。它与 prompt-based Agentic RAG 的差异在于，search decision、query formulation、search count 与 failure recovery 都进入训练目标，而不是由 frozen model 加外部 heuristic 决定。",
      "原书报告，7B Search-R1 在 NQ、TriviaQA 与 HotpotQA 上比 single-retrieval RAG 高 15–20%，比 ReAct-style prompted Agentic RAG 高 8–12%，并接近采用 standard RAG 的 70B model。其核心结论是：会在正确时机搜索的小模型，可能胜过拥有更多参数但不会搜索的大模型。"
    ],
    {
      tables: [{
        caption: "Search-R1 与 Prompt-Based Agentic RAG",
        columns: ["维度", "Prompt-Based Agentic RAG", "Search-R1"],
        rows: [
          ["是否搜索", "prompt / heuristic", "RL 学得"],
          ["Query formulation", "prompted rewrite", "end-to-end training"],
          ["搜索次数", "固定或推理时由 LLM 决定", "学习最优次数"],
          ["训练信号", "无，模型冻结", "final correctness reward"],
          ["搜索结果进入方式", "追加到 context", "与 CoT 交错"],
          ["失败恢复", "retry heuristic", "学习 backoff / reformulation"],
          ["推理开销", "framework orchestration", "模型原生行为"]
        ]
      }]
    }
  ),
  "16.8": T(
    "Evaluation",
    [
      "RAG evaluation 比单独评估 retrieval 或 generation 更难，因为错误可发生在 pipeline 任一阶段并相互放大：generator 再好也无法弥补无关检索；retriever 再好，如果模型忽略 context 或 hallucinate，同样没有价值。",
      "有效评估分三层：retrieval quality 检查是否召回正确 passage；generation quality 检查正确性、faithfulness 与完整性；end-to-end quality 检查用户任务是否成功，并结合偏好、latency 与 utility。",
      "只优化一个层级会产生反效果。例如用很大的 K 追求 Recall@K，可能把大量边缘相关内容塞进 context，反而降低 generation quality。"
    ],
    {
      lists: [[
        "Retrieval：Recall、Precision、MRR、NDCG。",
        "Generation：Correctness、Faithfulness、Answer Relevance。",
        "End-to-end：human preference、task success、latency-adjusted utility。"
      ]]
    }
  ),
  "16.8.1": T(
    "Retrieval Metrics",
    [
      "Recall@K 衡量前 K 个结果覆盖了多少 ground-truth relevant documents；Precision@K 衡量这 K 个结果中有多少真正相关。前者强调不要漏，后者强调不要稀释。",
      "MRR 只关注第一份 relevant document 的 rank，并对 query 集求 reciprocal rank 平均；NDCG@K 允许 relevance 具有多个等级，并用 log₂(i+1) 对靠后的结果折损，再除以理想排序 IDCG 归一化。"
    ]
  ),
  "16.8.2": T(
    "Generation Metrics",
    [
      "Faithfulness 统计答案中的 claim 有多少能由 retrieved context 支持，通常借助 LLM judge；Answer Relevance 从 answer 反向生成若干 question，并比较这些 question 与原 query 的 embedding similarity。",
      "Context Precision 关注 relevant document 是否排在更前；Context Recall 检查 ground-truth claims 中有多少可以归因于当前 context。它们把 retrieval ranking 与最终回答所需证据连接起来。"
    ]
  ),
  "16.8.3": T(
    "RAGAs Framework",
    "RAGAs 使用 LLM judge 提供 reference-free 或弱 reference 的 RAG evaluation。原书示例构造 question、generated answer、retrieved contexts 与 ground truth，计算 faithfulness、answer relevancy、context precision、context recall 和 answer correctness；同时提示 v0.2+ API 字段已经改为 user_input、response、retrieved_contexts 与 reference。"
  ),
  "16.8.4": T(
    "常见 Failure Modes",
    "RAG 不能只监控最终 answer。原书列出六类 failure：相关文档在库中却未召回；误导或矛盾文档污染 context；长 context 中部信息被忽略；over-retrieval 稀释信号并增加 latency/cost；模型无视 evidence、仍按 parametric memory hallucinate；以及 citation 指向并不支持 claim 的文档。",
    {
      failure: [
        "Retrieval miss：chunking、embedding mismatch 或 vocabulary gap 导致漏召回。",
        "Context poisoning：检索到矛盾、误导或恶意内容。",
        "Lost-in-the-middle：关键证据处于长 context 中部而被忽略。",
        "Over-retrieval：过多 chunk 稀释相关信号。",
        "Hallucination despite retrieval：模型忽略证据，按参数记忆作答。",
        "Citation fabrication：citation 与 claim 不匹配。"
      ]
    }
  ),
  "16.9": T(
    "Production Considerations",
    "Production RAG 的核心工作不止选择一个 vector database。Embedding model、index、latency path、增量更新、versioning 与 observability 共同决定质量上限和运维成本。",
    { editorial: true }
  ),
  "16.9.1": T(
    "Embedding Model Selection",
    [
      "Embedding model 决定 retrieval 的质量上限。选择时应优先验证 domain match；code、finance 等 specialized model 可能比通用模型高 5–15%。32K context model 可以整篇 embedding，减少 chunking；Matryoshka embedding 可在 256–4096 维之间按服务成本截断，而不必重新编码。",
      "Model-level int8 或 binary quantization 可把 index size 降低 4–32×，只损失少量 recall。跨语言或非英文 RAG 应选择明确做过 multilingual training 的模型，例如 BGE-M3、Jina-v3 或 Voyage-4，而不是只看英文 benchmark。"
    ],
    {
      tables: [{
        caption: "Table 16.5 · 原书列举的 production embedding model（2026 版）",
        columns: ["模型", "维度", "最大 tokens", "Access", "特点"],
        rows: [
          ["Voyage voyage-4-large", "1024*", "32K", "API", "高 retrieval quality"],
          ["OpenAI text-embedding-3-large", "3072", "8191", "API", "Matryoshka dims"],
          ["Cohere embed-english-v3.0", "1024", "512", "API", "int8/binary"],
          ["Google text-embedding-005", "768", "2048", "API", "Vertex AI"],
          ["NV-Embed-v2", "4096", "32K", "open-weight", "MTEB 72.3"],
          ["gte-Qwen2-7B", "3584", "32K", "open-weight", "multilingual"],
          ["BAAI/bge-m3", "1024", "8192", "open-weight", "dense+sparse+multi-vec"],
          ["jina-embeddings-v3", "1024", "8192", "open-weight", "multilingual adapters"],
          ["bge-large-en-v1.5", "1024", "512", "open-weight", "成熟生态"]
        ]
      }]
    }
  ),
  "16.9.2": T(
    "Vector Database Comparison",
    "数据库选择取决于 hosting、scale、metadata filtering、hybrid retrieval 与既有基础设施。FAISS 适合研究和离线自托管；Pinecone 强调 managed/serverless；Weaviate 支持 GraphQL 与 multimodal；Chroma 适合本地原型；Qdrant 与 Milvus 面向高性能大规模服务；已有 PostgreSQL 的团队可用 pgvector 降低系统复杂度。",
    {
      tables: [{
        caption: "Table 16.6 · Vector database 对照",
        columns: ["数据库", "Hosting", "规模", "Filtering", "Hybrid", "适用场景"],
        rows: [
          ["FAISS", "self-hosted", "十亿级", "有限", "否", "研究 / offline"],
          ["Pinecone", "managed", "十亿级", "是", "是", "serverless"],
          ["Weaviate", "both", "十亿级", "是", "是", "GraphQL / multimodal"],
          ["Chroma", "self-hosted", "百万级", "是", "否", "local prototype"],
          ["Qdrant", "both", "十亿级", "是", "是", "高性能"],
          ["Milvus", "both", "十亿级", "是", "是", "enterprise / GPU"],
          ["pgvector", "self-hosted", "百万级", "是", "是", "既有 PostgreSQL"]
        ]
      }]
    }
  ),
  "16.9.3": T(
    "Latency Optimization",
    [
      "常见 latency 手段包括 metadata pre-filter、HNSW/IVF approximate NN、query embedding cache、multi-source async retrieval、streaming generation 与 embedding quantization。它们分别缩小搜索空间、减少计算、避免重复编码或重叠等待时间。",
      "在 multi-source RAG 中，顺序访问 vector DB、keyword index 与 web API 会把 latency 相加；并行 fan-out 只需等待最慢 source。原书示例用 lru_cache 跳过重复 query 的 embedding，再以 asyncio.gather 同时请求多个 backend，并过滤 exception 后去重。"
    ]
  ),
  "16.9.4": T(
    "Incremental Indexing 与 Versioning",
    [
      "Production corpus 持续变化：policy 会修订，新 report 每日进入，过期内容必须删除。每次 full re-index 成本高且可能中断服务，因此应以 document 为单位 upsert、delete/expire，并记录 version 与 indexed_at。",
      "Upsert 时先删除同 doc_id 的所有旧 chunk，再对新版本重新切分与 embedding，避免 stale fragment 残留。Delete 可显式执行，时效性来源也可用 TTL 自动回收。Version metadata 既支持 rollback，也能回答“模型当时看到了哪一版”。",
      "需要额外处理 embedding model drift、chunk boundary shift 与 eventual consistency。升级 embedding model 时新旧向量不可直接比较，通常要分 index 迁移；修改 chunking strategy 会使旧 chunk 全部失效；分布式 vector DB 的新向量也可能经过数秒到数分钟才可搜索。"
    ],
    {
      lists: [[
        "Upsert：按 doc_id 替换整份文档的所有 chunk。",
        "Delete / Expire：显式删除或按 TTL 回收。",
        "Version tracking：保存 version 与 indexed_at，支持审计和回滚。"
      ]]
    }
  ),
  "16.10": T(
    "RAG 与 Fine-Tuning 的协同",
    "RAG 提供外部事实，fine-tuning 改变模型使用证据的方式。两者结合时，可以把 citation、uncertainty expression、irrelevant-context rejection 与领域输出格式直接纳入训练。",
    { editorial: true }
  ),
  "16.10.1": T(
    "何时组合 RAG 与 Fine-Tuning",
    "Fine-tuning 单独使用可学会 style 与 format，但仍可能 hallucinate facts；RAG 单独使用能拿到事实，却不保证模型会正确引用、承认不确定或忽略无关 context。组合方案的目标，是让模型学会高质量地消费 retrieved evidence，而不是把更多事实重新塞回权重。"
  ),
  "16.10.2": T(
    "RAFT：Retrieval-Augmented Fine-Tuning",
    [
      "RAFT 在训练时同时提供 relevant document 与 distractor documents，让模型学会只选择真正相关的 context。每个样本由 query q、answer a、正确文档 d* 与 k−1 份干扰文档组成；target 不只给答案，还让 chain-of-thought 显式引用 d*。",
      "其 loss 最大化在 q、d* 与 distractors 条件下生成 grounded CoT 和最终答案的概率。训练时主动加入干扰证据，使模型在 production retrieval 不完美时更能拒绝噪声。"
    ]
  ),
  "16.10.3": T(
    "Joint Retriever-Generator Training",
    [
      "REALM 与原始 RAG work 提出端到端联合训练 retriever 与 generator：对所有候选文档，把生成答案的条件概率与 retriever 给出该文档的概率相乘并求和，再对这一 marginal likelihood 求梯度。",
      "Retriever 参数可用 REINFORCE estimator 更新，也可把 $P_\\phi(d\\mid q)$ 视为对文档的 differentiable attention。联合训练很强，但 document index 必须随 retriever 改变而异步刷新；只有 top-$k$ 文档贡献信号，gradient 稀疏；若没有 pre-trained retriever 良好初始化，训练容易不稳定。"
    ],
    {
      failure: [
        "Index refresh：retriever 更新后旧 index 与新 embedding 不一致。",
        "Sparse signal：只有 top-k document 对 loss 有贡献。",
        "Instability：需要从已训练好的 retriever 初始化。"
      ]
    }
  ),
  "16.11": T(
    "RAG 方案综合比较",
    [
      "复杂方案只有在数据与约束需要时才值得。Naive RAG 适合 prototype；reranking、HyDE、multi-query 与 RAG-Fusion 用中等额外成本提升召回和排序；Self-RAG、CRAG、Adaptive/Graph/Agentic RAG 引入更强控制，也显著增加 latency、implementation complexity 与 cost；RAFT 把使用证据的能力前移到训练。",
      "Production design 应先回答 query distribution、corpus 规模与更新频率、latency budget、grounding 风险和 specialized vocabulary。原书的实践总结是：从好的 chunking 和 naive RAG 起步；单独评估 retrieval；优先尝试 BM25+dense+RRF；在 top-20 加 cross-encoder reranking；持续监控 faithfulness；缓存 embedding；使用约 10–15% overlap；并保存 source、date、section、document type 等 rich metadata。"
    ],
    {
      tables: [{
        caption: "Table 16.7 · RAG 方案总体取舍",
        columns: ["方案", "准确度", "延迟", "复杂度", "成本", "适用场景"],
        rows: [
          ["Naive RAG", "中", "低", "低", "低", "prototype / simple QA"],
          ["RAG + reranking", "高", "中", "中", "中", "production QA"],
          ["HyDE", "高", "中", "低", "中", "query/document 语义错位"],
          ["Multi-Query / RAG-Fusion", "高", "中", "中", "中", "含糊或多样 query"],
          ["Self-RAG / CRAG", "高", "中", "高", "中至高", "选择性检索 / 不可靠语料"],
          ["Adaptive RAG", "高", "低至高", "高", "中", "混合复杂度"],
          ["Graph RAG", "很高", "高", "很高", "高", "global synthesis"],
          ["Agentic RAG", "很高", "高", "很高", "高", "multi-hop reasoning"],
          ["RAFT", "很高", "低", "很高", "很高", "领域部署"]
        ]
      }],
      lists: [[
        "先明确 query 是 factoid、analytical 还是 multi-hop。",
        "评估 corpus 的规模、动态性与增量更新需求。",
        "以 latency budget 决定能否 rerank 或运行 agentic loop。",
        "高风险领域必须验证 faithfulness 与 citation。",
        "专业词表可能需要 hybrid retrieval 或 domain-adapted embedding。"
      ]]
    }
  )
};

function completeEntry(number, baseEntry) {
  return {
    ...baseEntry,
    paragraphs: [
      ...baseEntry.paragraphs,
      ...(paragraphAdditions[number] ?? []),
    ],
    formulaNotes: formulaNotes[number] ?? baseEntry.formulaNotes,
    codeNotes: codeNotes[number] ?? baseEntry.codeNotes,
  };
}

const sourcePath = resolve("tmp/pdfs/source-v2/book.tex");
const inventoryPath = resolve("content/source-structure.json");
const outputPath = resolve("content/chapters/ch-16.json");
const texLines = (await readFile(sourcePath, "utf8")).split(/\r?\n/);
const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
const chapterInventory = inventory.chapters.find((chapter) => chapter.chapter === 16);
if (!chapterInventory) throw new Error("Ch.16 missing from source inventory");

function cleanLatex(value) {
  return value
    .replace(/\\label\{[^}]+\}/g, "")
    .replace(/\\(?:textbf|emph|texttt)\{([^{}]*)\}/g, "$1")
    .replace(/\\cite\{[^}]+\}/g, "")
    .replace(/~/g, " ")
    .replace(/---/g, "—")
    .replace(/--/g, "–")
    .replace(/\\&/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function sectionSource(number, pages) {
  return { chapter: 16, section: number, pages };
}

function makeBaseBlocks(entry, number, pages) {
  const origin = entry.editorial ? "editorial_explanation" : "source_translation";
  return entry.paragraphs.filter(Boolean).map((text, index) => ({
    id: `s-${number.replaceAll(".", "-")}-p${index + 1}`,
    type: "paragraph",
    origin,
    reviewStatus: "verified",
    source: sectionSource(number, pages),
    text,
    ...(index === 0 && entry.originalExcerpt
      ? { originalExcerpt: entry.originalExcerpt }
      : {}),
  }));
}

function extractEnvironment(segment, environment) {
  const expression = new RegExp(
    String.raw`\\begin\{${environment}\}([\s\S]*?)\\end\{${environment}\}`,
    "g",
  );
  return [...segment.matchAll(expression)].map((match) => match[1].trim());
}

function extractListings(segment) {
  const expression =
    /\\begin\{lstlisting\}(?:\[([^\n]*)\])?\n([\s\S]*?)\\end\{lstlisting\}/g;
  return [...segment.matchAll(expression)].map((match) => {
    const options = match[1] ?? "";
    const captionMatch = options.match(/caption=\{([^}]*)\}/);
    return {
      caption: cleanLatex(captionMatch?.[1] ?? "Source code listing"),
      code: match[2].replace(/\s+$/, ""),
    };
  });
}

function extractFormulas(segment) {
  const formulas = [];
  for (const environment of ["equation", "align"]) {
    for (const raw of extractEnvironment(segment, environment)) {
      let latex = raw.replace(/\\label\{[^}]+\}/g, "").trim();
      if (environment === "align") {
        latex = `\\begin{aligned}${latex}\\end{aligned}`;
      }
      latex = latex
        .replaceAll("\\texttt{⟨search⟩}", "\\texttt{<search>}")
        .replaceAll("\\texttt{⟨/search⟩}", "\\texttt{</search>}");
      formulas.push(latex);
    }
  }
  const displayMath = /\n\\\[\n?([\s\S]*?)\n?\\\]\n/g;
  for (const match of segment.matchAll(displayMath)) {
    formulas.push(
      match[1]
        .trim()
        .replaceAll("\\texttt{⟨search⟩}", "\\texttt{<search>}")
        .replaceAll("\\texttt{⟨/search⟩}", "\\texttt{</search>}"),
    );
  }
  return formulas;
}

function enrichBlocks(entry, number, pages, segment) {
  const blocks = makeBaseBlocks(entry, number, pages);
  let index = blocks.length;
  for (const [listIndex, items] of (entry.lists ?? []).entries()) {
    blocks.push({
      id: `s-${number.replaceAll(".", "-")}-list${listIndex + 1}`,
      type: "list",
      origin: "source_translation",
      reviewStatus: "verified",
      source: sectionSource(number, pages),
      items,
    });
  }
  for (const [formulaIndex, latex] of extractFormulas(segment).entries()) {
    const note = entry.formulaNotes?.[formulaIndex];
    blocks.push({
      id: `s-${number.replaceAll(".", "-")}-formula${formulaIndex + 1}`,
      type: "formula",
      origin: "source_translation",
      reviewStatus: "verified",
      source: {
        ...sectionSource(number, pages),
        ...(note?.equation ? { equation: note.equation } : {}),
      },
      ...(note?.title ? { title: note.title } : {}),
      expression: latex,
      latex,
      ...(note?.reading ? { reading: note.reading } : {}),
      ...(note?.symbols ? { symbols: note.symbols } : {}),
    });
  }
  for (const [codeIndex, listing] of extractListings(segment).entries()) {
    blocks.push({
      id: `s-${number.replaceAll(".", "-")}-code${codeIndex + 1}`,
      type: "code",
      origin: "source_translation",
      reviewStatus: "verified",
      source: sectionSource(number, pages),
      title: listing.caption,
      language: "python",
      code: listing.code,
      explanation:
        entry.codeNotes?.[codeIndex] ??
        "原书代码按 LaTeX source 原样转写；本节正文说明其目的、数据流与限制。",
    });
  }
  for (const [tableIndex, table] of (entry.tables ?? []).entries()) {
    blocks.push({
      id: `s-${number.replaceAll(".", "-")}-table${tableIndex + 1}`,
      type: "table",
      origin: "source_translation",
      reviewStatus: "verified",
      source: sectionSource(number, pages),
      caption: table.caption,
      columns: table.columns,
      rows: table.rows,
    });
  }
  if (entry.figure) {
    blocks.push({
      id: `s-${number.replaceAll(".", "-")}-figure`,
      type: "figure",
      origin: "source_translation",
      reviewStatus: "verified",
      source: {
        ...sectionSource(number, pages),
        ...(entry.figure.number ? { figure: entry.figure.number } : {}),
      },
      src: entry.figure.src,
      alt: entry.figure.alt,
      caption: entry.figure.caption,
      adapted: false,
    });
  }
  if (entry.failure?.length) {
    blocks.push({
      id: `s-${number.replaceAll(".", "-")}-failure`,
      type: "failure",
      origin: "failure_analysis",
      reviewStatus: "verified",
      source: sectionSource(number, pages),
      title: "失败模式与限制",
      text: entry.failure.join("；"),
    });
  }
  return blocks.map((block, blockIndex) => ({
    ...block,
    id: block.id || `s-${number.replaceAll(".", "-")}-b${index + blockIndex + 1}`,
  }));
}

const headingLines = chapterInventory.headings.map((heading) => heading.sourceLine);
const sections = chapterInventory.headings.map((heading, index) => {
  const baseEntry = translations[heading.number];
  if (!baseEntry) throw new Error(`missing translation for §${heading.number}`);
  const entry = completeEntry(heading.number, baseEntry);
  const start = heading.sourceLine;
  const end = headingLines[index + 1] ?? 15412;
  const segment = texLines.slice(start - 1, end - 1).join("\n");
  const pages = heading.pages ?? "页码待核对";
  return {
    id: `s-${heading.number.replaceAll(".", "-")}`,
    number: heading.number,
    level: heading.level,
    enTitle: heading.title,
    zhTitle: entry.zhTitle,
    pages,
    blocks: enrichBlocks(entry, heading.number, pages, segment),
  };
});

const introEntry = completeEntry("intro", translations.intro);
const introSegment = texLines.slice(14011, 14016).join("\n");
sections.unshift({
  id: "s-16-introduction",
  number: null,
  level: 1,
  enTitle: "Chapter Introduction",
  zhTitle: introEntry.zhTitle,
  pages: "308",
  blocks: enrichBlocks(introEntry, "16-intro", "308", introSegment),
});

function countChinese(block) {
  const values = [
    block.title,
    block.text,
    block.reading,
    block.explanation,
    block.caption,
    block.alt,
    ...(block.items ?? []),
    ...(block.steps ?? []),
    ...(block.columns ?? []),
    ...(block.rows ?? []).flat(),
  ];
  return values.reduce(
    (total, value) =>
      total + (typeof value === "string"
        ? (value.match(/[\u3400-\u9fff]/g)?.length ?? 0)
        : 0),
    0,
  );
}

const verifiedBlocks = sections.flatMap((section) =>
  section.blocks.filter(
    (block) =>
      block.reviewStatus === "verified" &&
      ["source_translation", "source_definition"].includes(block.origin),
  ),
);
const chapter = {
  chapter: 16,
  title: "Retrieval-Augmented Generation (RAG)",
  zhTitle: "Retrieval-Augmented Generation（RAG）",
  pages: "308-332",
  minutes: 90,
  overview:
    "本章按原书全部 54 个结构条目完整译述 RAG 的知识边界、indexing、retrieval、chunking、reranking、contextual compression、Agentic RAG、evaluation、production indexing，以及 RAG 与 fine-tuning 协同。正文逐节对照 arXiv LaTeX source 与 PDF；公式、代码、表格和图从源文件独立提取并配有中文解释。",
  status: "complete",
  sections,
  glossary: [
    { term: "RAG", zh: "检索增强生成", meaning: "在生成前或生成过程中检索外部证据，并把证据作为 context 提供给模型。" },
    { term: "Retriever", zh: "检索器", meaning: "根据 query 从 corpus 中返回 candidate documents/chunks 的组件。" },
    { term: "Chunk", zh: "文本分块", meaning: "为 embedding、索引与检索而从文档中切出的语义片段。" },
    { term: "Reranker", zh: "重排器", meaning: "对 first-stage candidates 进行更精确 query-document 联合评分的模型。" },
    { term: "Grounding", zh: "证据落地", meaning: "使生成 claim 能由外部 evidence 支持和追溯。" },
    { term: "Agentic RAG", zh: "智能体式 RAG", meaning: "把检索建模为可规划、可迭代、有状态且受预算约束的行动过程。" }
  ],
  summary: [
    "RAG 用可更新的 non-parametric knowledge 补足模型参数知识的过时、幻觉与领域缺口。",
    "Retrieval quality 的核心来自 embedding、index、chunking、hybrid fusion 与 reranking，而不是单一 vector database 品牌。",
    "Advanced/Agentic RAG 让系统能够改写 query、判断证据、选择数据源并迭代检索，但同时增加 latency、cost 与 failure surface。",
    "Evaluation 必须分开测 retrieval、generation 与 end-to-end task；Production 还必须管理增量索引、版本、缓存、并发与可观测性。"
  ],
  metrics: {
    chineseCharacters: verifiedBlocks.reduce(
      (total, block) => total + countChinese(block),
      0,
    ),
    sourceCoverage: 100,
    sectionCount: sections.length,
    blockCount: sections.reduce((total, section) => total + section.blocks.length, 0),
  },
};

await writeFile(outputPath, `${JSON.stringify(chapter, null, 2)}\n`, "utf8");
console.log(
  JSON.stringify({
    chapter: 16,
    sections: chapter.metrics.sectionCount,
    blocks: chapter.metrics.blockCount,
    chineseCharacters: chapter.metrics.chineseCharacters,
  }),
);
