/**
 * Ch.16 full-rendition supplements.
 *
 * The base translation in rebuild_ch16_verified.mjs preserves the teaching
 * structure and native figures/tables. These additions restore details that
 * were previously compressed: derivation steps, concrete examples, training
 * signals, implementation flow, measured results, and explicit limitations.
 */
export const paragraphAdditions = {
  intro: [
    "这里的“外部记忆”不是把检索结果永久写回模型参数，而是在推理时把可更新的资料带入 context。这样，知识更新不必重新训练模型，回答也能保留来源，因而特别适合事实密集、需要审计且资料持续变化的生产任务。",
  ],
  "16.1": [
    "三类限制分别对应不同的系统后果：hallucination 使模型在越过可靠知识边界时仍可能给出肯定回答；knowledge staleness 让训练截止日之后的事件、论文与产品变化不可见；domain specificity 则意味着通用模型无法天然掌握组织内部代码、文档、监管细则和企业数据。RAG 的目标不是消灭模型误差，而是为这些问题提供可更新、可追溯的证据通道。",
  ],
  "16.1.1": [
    "从概率形式看，纯 parametric model 只建模 $P_{\\mathcal M_\\theta}(a\\mid q)$；RAG 还要考虑每份文档被检索到的概率，并把“基于该文档生成答案”的条件概率加权求和。也就是说，retriever 不只是前置搜索工具，它定义了 generator 实际能够看到的 evidence distribution；漏检的文档即使存在于语料库，也不会对最终答案产生贡献。",
  ],
  "16.1.2": [
    "决策表中的边界需要整体理解：若知识频繁变化、语料很大或必须给 citation，优先使用 RAG；若目标是改变 style、format 或推理行为，fine-tuning 更直接；若全部资料能够稳定装入 context window，long context 可以省去索引与检索。低延迟场景往往更偏向 fine-tuning，因为 RAG 和 long context 都会增加在线输入与检索成本。",
  ],
  "16.2": [
    "两条 pipeline 的时间尺度不同：offline indexing 负责把异构文档转成可搜索表示，可以批量执行并持续更新；online retrieval-generation 则在每个请求上运行，需要受 latency、并发和 token budget 约束。前者决定“能不能找到”，后者决定“找到后怎样交给模型并形成可验证回答”。",
  ],
  "16.2.1": [
    "Figure 16.1 把数据流拆成两部分：离线侧依次执行 document loading、chunking、embedding 与 vector storage；在线侧将 query 编码，在索引中取回 top-k chunks，把这些 evidence 注入 prompt，再由 LLM 生成答案。蓝色路径可反复增量更新，绿色与橙色路径则会随每次 query 重新执行。",
  ],
  "16.2.2": [
    "Document loader 的职责不止是抽取正文。source URL、页码、section title 和 timestamp 必须与 chunk 一同保存，否则后续难以做 metadata filtering、citation 或版本审计。Chunk 必须同时满足 embedding model 的输入上限和语义完整性；书中给出的典型上限是 512 tokens，但实际大小应随任务调整。",
    "Embedding 阶段由 $f_\\phi$ 把每个 chunk $c_i$ 映射到 $d$ 维向量 $\\mathbf e_i\\in\\mathbb R^d$。Vector database 保存的不应只有向量，还要保留原始文本和 metadata；检索返回向量 ID 后，生成环节需要依靠这些字段还原证据与来源。",
  ],
  "16.2.3": [
    "在线检索必须使用与建库兼容的 embedding model 将 query 编码成 $\\mathbf q$，再以 cosine similarity 对 chunk vector 排序。Cosine 会用两侧向量的 norm 做归一化，因此主要比较方向而不是模长。最终返回的 $\\mathcal C_k$ 是排序后的 top-k context，$k$ 太小会漏证据，太大则会引入噪声与额外 token 成本。",
  ],
  "16.2.4": [
    "Prompt template 明确规定只能依据给定 context 作答；资料不足时应直接说明，而不能用参数记忆补全。每个 chunk 以 `[Doc N]` 编号并保留 source 与 page，最终 citation 才能回指原文。这个约束并不自动保证 faithfulness，但为后续核验建立了最小结构。",
  ],
  "16.3": [
    "Retrieval 方法的差别首先在表示与交互粒度：sparse method 依赖词项匹配，dense bi-encoder 把整段压成单向量，SPLADE 学习可解释的稀疏扩展，ColBERT 保留 token-level interaction，cross-encoder 则让 query 与 document 完整联合编码。越靠后通常表达力越强，但索引、GPU 与 latency 成本也越高。",
  ],
  "16.3.1": [
    "BM25 对 query 中每个 term 累加贡献。$f(t_i,d)$ 表示 term frequency，$|d|/\\mathrm{avgdl}$ 用于校正文档长度，IDF 让稀有词获得更高权重；$k_1$ 控制词频饱和速度，通常为 1.2–2.0，$b=0.75$ 控制长度归一化。词项反复出现不会无限线性增益，这正是分母中 saturation 项的作用。",
    "Sparse retrieval 的强项不是“语义理解”，而是精确且可解释的 lexical evidence。产品型号、错误码、专有名词、罕见词和 embedding 训练后出现的新术语，常常更适合 inverted index；它也不需要 GPU，并能扩展到十亿级文档。相应限制是同义改写或 query-document vocabulary gap 会直接造成漏召回。",
  ],
  "16.3.2": [
    "DPR 的 bi-encoder 分别计算 $E_Q(q)$ 与 $E_P(p)$，相关度是两者点积。Document embedding 可以离线预计算，因此在线只需编码 query 并执行近邻搜索；代价是 query 与 passage 在编码阶段不能进行 token-level cross-attention，表达力弱于 cross-encoder。",
    "In-batch negatives 使一个含 $B$ 个正对的 batch 同时提供 $B-1$ 个负 passage，显著减少显式负例成本。Temperature $\\tau$ 越小，softmax 越尖锐，对近邻差异越敏感。Hard negative 通常由 BM25 等检索器产生：它们在词面上很像，却在语义上不能回答 query，因此比随机负例更能训练决策边界。",
    "大规模 serving 不能遍历所有向量。IVF 将向量划入 Voronoi cells，只搜索 query 附近的 cell；HNSW 构建分层小世界图，近似搜索复杂度约为 $O(\\log N)$；Product Quantization 把向量分段量化以降低内存。三者分别在召回率、速度和存储之间取舍。",
  ],
  "16.3.3": [
    "线性 hybrid score 用 $\\alpha$ 在 dense 与 sparse score 之间插值，但两套系统的数值范围和分布往往不同，直接相加需要校准。RRF 不读取原始 score，只读取 rank，因此可以稳定融合 BM25、dense 或其他 ranked lists。",
    "RRF 的 $k=60$ 是平滑常数：它让第 1 与第 2 名仍有差异，却不至于让某一个列表的头部结果压倒所有其他 evidence。数值例子表明，第 3/第 7 名文档得分约 0.0308，而在两个列表都排第 1 的文档约 0.0328；多列表中持续靠前的文档会自然累积更高分。",
  ],
  "16.3.4": [
    "SPLADE 的核心不是简单把 BM25 与 dense score 相加，而是让 masked language model 直接产生词表维度上的稀疏权重。MLM head 已经学到某个位置与哪些词语义相关，SPLADE 将这些 logits 重新解释为 term importance，因此“neural networks”文档可以为 “deep learning”“AI”或“backpropagation”分配非零权重。",
    "聚合式中的 ReLU 将负 logit 截为 0，max pooling 为每个词项保留所有位置上的最强 evidence，$\\log(1+x)$ 则抑制单一 term 过度支配。得到的 query/document vector 虽然维度等于完整词表，实际通常只有 20–200 个非零项，所以仍可由 Lucene 或 Anserini 的 posting list 高效计算点积。",
    "如果没有 sparsity penalty，contrastive learning 会倾向于激活更多词项，最终得到近似 dense representation，失去 inverted-index 的效率。SPLADE 用 query 与 document 的 $L_1$ penalty 约束这一点；SPLADEv2 改用更贴近实际 retrieval cost 的 FLOPS regularizer，重点惩罚在大量文档中频繁激活、会形成超长 posting list 的词。",
    "SPLADEv2 还以 cross-encoder teacher 的 soft score 蒸馏相关性，让训练信号不再局限于 binary label；它让 query 比 document 更稀疏，因为 query 在线计算而 document 可离线处理，并以 DistilBERT 将 backbone 从约 110M 参数降到 66M。原书表格报告 MS MARCO MRR@10 从 34.0 提升到 36.8，平均每文档非零词项从约 200 降到约 120。",
  ],
  "16.3.5": [
    "MaxSim 对每个 query token 分别寻找最相似的 document token，再把最佳相似度相加。这样，“每个 query 词由文档中的哪个 token 支持”仍可被定位；它比 single-vector 表示保留更多细粒度交互，又避免了 cross-encoder 对全库逐对联合编码的不可承受成本。",
    "Query/document encoder 输出每个 token 的 representation，再投影到通常为 128 维。Pairwise softmax loss 同时比较正 passage 与一组 negatives；in-batch negative 免费且数量多，BM25 hard negative 提供词面相似但语义错误的案例，ColBERTv2 还用 cross-encoder teacher 挖掘更困难的 negative 并蒸馏 score。",
    "Index time 会预计算全部 document token embeddings。PLAID 先按 centroid 粗召回 candidate，再只对 candidate 计算精确 MaxSim，可获得约 5–10 倍 latency 降低。代价是每个文档存储 $|d|\\times128$ 个数，索引远大于单向量；ColBERTv2 的 residual quantization 可把每维压缩到约 2 bytes。",
  ],
  "16.3.6": [
    "表格中的 latency 是相对量级，不等于固定服务时间。TF-IDF/BM25 几乎不需 GPU，适合作为精确匹配 baseline；DPR 与 SPLADE 用较低 latency 换取更高语义召回；ColBERT 的 token-level index 更大；cross-encoder 质量最高但只能承担 top-k reranking。Hybrid RRF 同时维护 sparse/dense index，却通常是生产系统更稳健的默认方案。",
  ],
  "16.4": [
    "Chunking 的三个约束彼此冲突：更小的 chunk 往往提高定位精度，却可能把定义、条件和结论拆开；更大的 chunk 保留上下文，却会稀释 embedding signal 并增加生成 token。好的策略不是追求统一长度，而是让被检索的片段在脱离原文后仍足以支撑回答。",
  ],
  "16.4.1": [
    "固定窗口的有效步长是 $W-O$。因此 overlap 越大，边界信息保留得越多，但 chunk 数量按 $\\lceil(L-O)/(W-O)\\rceil$ 增长，重复 embedding、索引容量和最终 context 也随之增加。示例 splitter 按空行、换行、句号、空格到字符逐级回退，比完全按 token 硬切更少破坏自然边界。",
  ],
  "16.4.2": [
    "SemanticChunker 先计算相邻句子的 embedding similarity，再把最显著的不连续点作为 topic boundary。示例选择 percentile 模式并把 threshold 设为 95，意味着只在不相似度最高的 5% 位置切分；也可以使用 standard deviation 规则。它能产生主题更完整的 chunk，但多了一轮 embedding 成本，threshold 过高或过低也会造成片段过大或过碎。",
  ],
  "16.4.3": [
    "结构感知切分的共同原则是保留语义容器：Markdown chunk 应携带父级 heading，HTML 应尊重 section/article/p 标签，代码 chunk 要以 function/class 为单位并补上必要 import，table 必须保留完整行列关系。只按字符数处理这些格式，会破坏读者本来依赖的结构信息。",
  ],
  "16.4.4": [
    "ParentDocumentRetriever 将小 child chunk 的 vector 与其 parent ID 建立映射。查询时先用 child 的细粒度 representation 提高召回，随后从 docstore 取回更大的 parent；因此 vectorstore 负责“定位”，docstore 负责“恢复上下文”。示例使用较大的 2000 字符 parent 和 400 字符 child，具体数值应按 tokenizer 与文档结构调整。",
  ],
  "16.4.5": [
    "经验表不是硬性标准，而是初始搜索空间：factoid QA 重视精确定位，适合 128–256 tokens；summarization 需要跨句综合，适合 512–1024；代码若拆开函数会丢掉控制流；法律文本应保留完整段落并重叠一句；对话则在 turn continuity 与检索精度之间折中。最终选择应通过 retrieval 和 generation evaluation 联合验证。",
  ],
  "16.5": [
    "Advanced pattern 分别干预不同环节：query transformation 修正输入表达，reranking 改善候选顺序，contextual compression 删除 chunk 内部噪声，Self-RAG/CRAG/Adaptive RAG 决定是否或如何检索，Graph RAG 改变知识表示，RAG-Fusion 则融合多次查询结果。它们不能互相替代，也不应一次全部叠加。",
  ],
  "16.5.1": [
    "HyDE 生成的 hypothetical answer 不要求事实正确，它的作用是把短 query 改写成更接近真实文档的语言分布，再对这段文本求 embedding。Step-back example 将“2 atm 下乙醇沸点是多少”提升为“哪些因素影响液体沸点”，从具体事实与一般原理两路检索。MultiQueryRetriever 示例还会保留原 query，生成三个变体，分别取 top-5 后去重。",
  ],
  "16.5.2": [
    "Cross-encoder 的输入是拼接后的 `[q;d]`，query token 与 document token 能直接 attention，因此它能识别 bi-encoder 中被压平的细粒度关系。示例用 BGE reranker 为所有 pair 打分，再排序取 top-n。因为每个 candidate 都需要一次联合前向计算，合理做法是让便宜的 first-stage retriever 先把全库缩到约 20–100 条。",
  ],
  "16.5.3": [
    "LLMChainExtractor 不是重新检索，而是在 base retriever 已返回的文档中抽取与 query 相关的句子；ContextualCompressionRetriever 将两者串联。这样可以减少生成模型需要阅读的 token，也降低 irrelevant sentence 对答案的干扰。代价是每份候选文档可能增加一次模型调用，并存在 compression 删除关键限定词的风险。",
  ],
  "16.5.4": [
    "[Retrieve] 控制是否追加 passage，[IsRel] 评价 passage 与 query 的相关性，[IsSup] 检查生成陈述是否由 passage 支持，[IsUse] 评价整体响应是否有用。模型在训练时同时预测正文和这些 reflection tokens，所以 inference 可以按 token score 选择检索、过滤 evidence 并自评，而不是把所有控制交给外部 pipeline。",
  ],
  "16.5.5": [
    "CRAG 的 evaluator 把每份 retrieved document 分成 Correct、Ambiguous 或 Incorrect。若结果全部错误或含糊，系统转向 web search；若至少存在正确文档，则通过 knowledge refinement 删除不相关句子。最终 generator 只接收修正后的 context。这个流程提高了对不可靠 corpus 的韧性，但 evaluator 误判会触发错误分支，web fallback 也增加成本与新的信任边界。",
  ],
  "16.5.6": [
    "Adaptive RAG 的 router 先用带 complexity label 的 lightweight classifier 判断问题层级。No-retrieval 避免简单问题的额外成本，single-step RAG 处理一般事实查询，multi-step RAG 则为复杂 multi-hop 问题迭代搜索。它优化的是平均成本，而不是让所有 query 都走最强、最昂贵的路径；错误的 complexity classification 会造成过度检索或证据不足。",
  ],
  "16.5.7": [
    "Graph RAG 的构建顺序是 entity/relationship extraction、建立 $G=(V,E)$、以 Leiden algorithm 做多分辨率 community detection、为每个 community 生成 summary。Global query 对 community summaries 执行 map-reduce，local query 仍可回到普通 vector search。",
    "它擅长回答跨越许多文档的总体问题，因为 community summary 提供了高层组织；代价是 entity extraction、graph construction、community 更新和 summary maintenance 都很昂贵。若问题只是“文档 X 对主题 Y 怎么说”，standard RAG 更直接，也更容易维护。",
  ],
  "16.5.8": [
    "原书代码把流程明确分成四步：生成 query variants；对原 query 和所有 variants 分别检索；用 RRF 对 document ID 累加 reciprocal rank；取融合结果前五条生成答案。RAG-Fusion 改善了单一措辞造成的漏召回，但每个 variant 都会增加 retrieval 请求；若变体高度重复，成本增加却不会带来新的 evidence。",
  ],
  "16.6": [
    "REFRAG 的出发点是 retrieved passages 经过去重或多样性选择后通常来自相互独立的来源，cross-passage attention 多数接近 0，因此完整 KV cache 和全量 attention 中有大量无效计算。Compress 阶段以每个 passage block 的 mean-pooled keys/values 等紧凑表示替代完整 KV；Sense 阶段按当前生成 token 选择相关 block；Expand 只恢复 active blocks 并做精确 attention。",
    "实验结果不只针对单次 RAG：30.85× 的最高 TTFT speedup、相对既有 sparse-attention baseline 的 3.75× 改进和固定内存下 16× 的有效 context 扩展，也在 multi-turn conversation 与 long-document summarization 中保持。Agentic RAG 会重复多轮 retrieve-reason-generate，因此每轮 decoding 若不能随 active context 稀疏化，latency 会被迭代次数成倍放大。",
  ],
  "16.7": [
    "Agentic RAG 的本质是让 retrieval 成为推理过程中的 action，而不是生成前只执行一次的固定步骤。系统需要保存已检索文档、当前子问题、充分性判断和 iteration budget，并根据 observation 决定继续查证、改写 query、调用其他 source、生成或停止。",
  ],
  "16.7.1": [
    "书中的 multi-hop 例子是：“谁创办了那家在 2023 年收购 OpenAI 主要竞争者的公司？”它要求先识别竞争者及收购事件，再追溯收购方，最后查创始人；下一跳 query 依赖上一跳 observation，无法由一次 retrieval 预先完成。",
    "把流程写成 MDP 后，state 是原 query 加累计 evidence，action 是 retrieve/reason/generate/stop，reward 是最终答案正确性。Policy 因而同时决定何时搜索、搜索什么以及何时停止；如果 state 没有保存已见证据，agent 会重复检索或在多跳链路中丢失前提。",
  ],
  "16.7.2": [
    "Figure 16.2 中的控制流包含两次显式判断：retrieval 后先评估 evidence 是否 sufficient，不足则继续 plan/retrieve；答案形成前再执行 grounding self-check，验证 claim 是否由 context 支持。只有通过这两个门槛才返回，否则系统应回到检索或修正阶段。",
  ],
  "16.7.3": [
    "金融分析助手的四个 query 展示了 routing 的必要性：PTO policy 属于内部文档，昨日 Fed 公告依赖实时 web，区域营收位于 SQL records，auth middleware 应查 code index。单一 flat index 要么找不到答案，要么返回不相关 passage。",
    "Rule-based routing 以关键词和 URL pattern 触发，最快、最透明，却难以处理含糊表达；classifier-based routing 可用 fine-tuned BERT 或 query embedding 上的 logistic regression，latency 可低于 10ms，但需要标注；LLM structured output 最灵活，能处理新类型并说明理由，却增加一次 LLM call。",
    "实际 router 还要设计 fallback chain、对不确定 query 的 parallel fan-out、API cost/rate limit awareness，以及完整 decision log。若把 routing 升级为 RL policy，state 还包含 conversation history，action 可以同时选择 source 与 query rewrite，reward 来自最终 answer quality。",
  ],
  "16.7.4": [
    "LangGraph state 明确保存 query、sub_queries、累计 retrieved_docs、context_sufficient、answer、iterations 与 max_iterations。`Annotated[list, operator.add]` 让新文档追加到既有 state，而不是每轮覆盖；Plan 初始化子问题，Retrieve 逐个路由并累积结果，Evaluate 调用充分性判别，Generate 根据全部证据生成 citation。",
    "`should_retrieve` 同时检查两个退出条件：context 已充分时生成；达到最大迭代数时也停止检索，并用现有 evidence 尽力生成。否则返回 Retrieve 形成 conditional edge。Iteration budget 防止无限循环，但“预算耗尽后仍生成”必须在产品层向用户暴露 evidence insufficiency，不能伪装成高置信答案。",
  ],
  "16.7.5": [
    "示例把 `search_documents`、`query_database`、`web_search` 与 `execute_python` 注册成同一个 tool set。AgentExecutor 根据问题选择语义检索、结构化查询、实时搜索或数值计算；这使 RAG 从“读取文档”扩展为“收集并处理 evidence”。",
    "四种工具的副作用和信任等级不同：SQL 必须限制只读语句与表权限，web 结果需要来源验证，Python execution 需要 sandbox/timeout，内部文档检索要执行访问控制。Tool calling 能力扩大了可回答范围，也扩大了 prompt injection、数据泄露和执行风险。",
  ],
  "16.7.6": [
    "Search-R1 的 trajectory 将 reasoning、search action、搜索结果 observation 与最终 answer 交错在同一生成序列中。模型输出 `<search>query</search>` 后，environment 执行真实搜索并把结果插回 context；因此下一段 reasoning 可以依据新 evidence 决定是否继续搜索。",
    "每个问题采样 $N$ 条含 0–5 次搜索的 trajectory，只以最终 exact match 或 F1 形成 terminal reward，再按组内均值 $\\mu_G$ 和标准差 $\\sigma_G$ 计算 advantage。GRPO 会强化那些在正确时机、用有效 query 获得证据的轨迹，而不是单独监督每次 search action。",
    "与 prompt-based Agentic RAG 相比，Search-R1 把 search decision、query phrasing、调用次数和 failure recovery 都纳入训练。原书用“考试中发现卡住才查资料”的学生作类比：传统 pipeline 在答题前统一查一次，Search-R1 则在 reasoning 暴露具体知识缺口时再有针对性地查证。",
  ],
  "16.8": [
    "三层指标必须联合解释。Retrieval quality 回答“正确 passage 是否被找到”，generation quality 回答“模型是否正确、完整且忠于 evidence”，end-to-end quality 才衡量用户任务是否成功。一个层级的最优点不一定是全系统最优点，例如增大 $K$ 提升 Recall 可能同时稀释相关 signal、增加 latency，并使 generator 更容易忽略关键句。",
  ],
  "16.8.1": [
    "令 $\\mathcal R_K$ 为前 $K$ 个 retrieved documents，$\\mathcal R^*$ 为所有 relevant documents。Recall@K 的分母是 relevant set 大小，因此关注漏召回；Precision@K 的分母是 $K$，因此关注返回结果的纯度。两者需要一起看，不能只用更大的 $K$ 人为提高 Recall。",
    "MRR 对每个 query 只取第一份 relevant document 的 reciprocal rank，再在 query set 上平均，适合“首个正确结果是否尽早出现”的任务。NDCG@K 支持 0、1、2 等 graded relevance，并用 $\\log_2(i+1)$ 对靠后结果折损；再除以理想排序 IDCG，使不同 query 的得分可比较。",
  ],
  "16.8.2": [
    "Faithfulness 先把 answer 拆成 claims，再计算其中能由 context 支持的比例；它不直接等同于 factual correctness，因为 context 本身也可能错误。Answer Relevance 则从 answer 反向生成 $N$ 个可能问题，比较这些问题与原 query 的 embedding cosine，用来识别答非所问。",
    "Context Precision 是一个 rank-aware 指标：只在第 $k$ 个 document relevant 时累计到该位置的 Precision@k，因此把相关文档放得越靠前越好。Context Recall 计算 ground-truth claims 中有多少能归因到当前 context，反映 evidence 是否覆盖完整答案。两者把 retrieval 输出与 generation 所需事实连接起来。",
  ],
  "16.8.3": [
    "RAGAs 示例把 questions、generated answers、retrieved contexts 和 reference answers 组织成 Dataset，同时计算 faithfulness、answer relevancy、context precision、context recall 与 answer correctness。它减少了为每个指标手写 judge prompt 的工作，但结果仍依赖 judge model、prompt 和样本分布，不能替代人工抽查。",
    "代码使用的是 v0.1 字段；v0.2+ 改为 `user_input`、`response`、`retrieved_contexts` 与 `reference`。这类 API 迁移说明 evaluation pipeline 也需要版本固定和回归测试，否则指标字段变化可能导致 silent failure 或不可比较的历史数据。",
  ],
  "16.8.4": [
    "六类 failure 对应不同修复位置：retrieval miss 要查 chunking、embedding 与 vocabulary gap；context poisoning 要做来源治理、冲突检测和内容安全；lost-in-the-middle 要调整 evidence 排序或缩短 context；over-retrieval 要控制 $K$ 与压缩；retrieval 后仍 hallucinate 要加强 evidence use；citation fabrication 则必须逐 claim 验证引用。",
    "这些问题不能只通过最终 answer correctness 识别。例如 citation 看似完整，但文档并不支持 claim；context 中也可能同时存在互相矛盾的资料。Production monitoring 应保留 query、候选排序、最终 context、answer claims 和 citation mapping，才能定位 failure 位于哪一层。",
  ],
  "16.9": [
    "Production 约束把研究原型中的一次性选择变成持续系统：embedding model 决定质量上限，vector database 决定扩展与过滤能力，latency optimization 决定在线可用性，incremental indexing/versioning 决定知识是否及时且可审计。任何一项失配都可能让离线 benchmark 的优势在上线后消失。",
  ],
  "16.9.1": [
    "原书表格把 managed API 与 open-weight model 放在同一成本—质量谱上。Managed model 降低运维负担；self-hosted model 提供数据控制与定制能力，但需要 GPU、批处理和版本管理。MTEB average 跨 retrieval、classification、clustering 与 STS，并不等于特定领域 retrieval quality，最终仍需在真实 query/corpus 上验证。",
    "Domain match 可能带来 5–15% 提升；32K context model 可整篇编码，减少 chunking，却增加输入成本；Matryoshka embedding 允许在 serving 时截为 256–4096 维而不重新编码；int8/binary quantization 可把索引缩小约 4–32 倍；跨语言任务应优先选择明确经过 multilingual training 的模型。",
  ],
  "16.9.2": [
    "表格比较 hosting、scale、metadata filtering、hybrid support 与典型用途：FAISS 适合 research/offline，Pinecone 强调 managed serverless，Weaviate 支持 GraphQL 和 multimodal，Chroma 面向本地 prototype，Qdrant/Milvus 服务高性能或 enterprise 规模，pgvector 适合已有 PostgreSQL 的团队。",
    "“可扩展到十亿向量”不代表所有系统都需要独立 vector database。若数据量只有百万级且强依赖 relational metadata 与事务，pgvector 可能降低总体复杂度；若需要跨地域托管、自动扩缩容或成熟 hybrid retrieval，managed service 的运维价值可能高于单纯 benchmark latency。",
  ],
  "16.9.3": [
    "六类 latency 手段作用在不同阶段：metadata pre-filter 先缩小候选空间；HNSW/IVF 以约 1% recall loss 换取可达 10× 的搜索加速；query embedding cache 避免重复编码；async retrieval 重叠多个 backend 的等待；streaming generation 改善首 token 体验；quantization 降低内存带宽与存储。",
    "Async 示例用 `lru_cache(maxsize=1024)` 缓存 query embedding，并为每个 source 创建 task；`asyncio.gather(..., return_exceptions=True)` 让单个 backend 失败时其他结果仍可返回。随后过滤 exception、合并并按内容去重。并行 latency 近似由最慢 source 决定，而不是所有 source latency 相加。",
  ],
  "16.9.4": [
    "Incremental indexing 以 document 为原子更新。Upsert 必须先删除同一 `doc_id` 的所有旧 chunk，再对新内容重新切分并写入；Delete/Expire 可以显式删除，也可按 TTL 回收新闻或市场数据；每个 chunk 保存 `version` 与 `indexed_at`，既支持 rollback，也能回答一次生成使用了哪个版本。",
    "一致性有三类典型问题。Embedding model 升级后新旧 vector 不可比较，应维护分版本 index 并后台迁移；chunking strategy 变化会使原有 chunk boundary 全部失效；分布式 vector DB 通常是 eventual consistency，新写入内容可能数秒到数分钟后才可查。",
    "示例 `RAGIndexManager` 把 upsert 与 expiry 封装在统一层：vectorstore 承担按 metadata 删除和写入，chunker 重新切分，metadata 为每个 chunk 复制 version/timestamp。代码中的 embedder 虽被保存但由 vectorstore 内部调用，实际实现应明确 embedding 的唯一责任方，避免重复编码。",
  ],
  "16.10": [
    "RAG 与 fine-tuning 的协同目标不是把外部事实再次记进参数，而是训练模型更可靠地消费 retrieved evidence：按要求引用、在证据不足时表达不确定性、忽略 distractor，并遵循领域输出格式。知识更新仍由 RAG 处理，行为适配由训练处理。",
  ],
  "16.10.1": [
    "Fine-tuning alone 能学习 style/format，却仍可能 hallucinate；RAG alone 能提供事实，却不保证模型会选择正确片段、拒绝无关 context 或承认资料不足。Combined approach 用训练样本显式教授这些 evidence-use behaviors，使同一 retriever 输出在 generator 侧得到更稳定的使用。",
  ],
  "16.10.2": [
    "RAFT 的每个训练样本由 $(q,a,d^*)$ 加 $k-1$ 个 distractor documents 构成。Input 同时包含正确文档与干扰文档，target 是明确引用 $d^*$ 的 chain-of-thought 加最终答案；模型因而不能只学会“看见 context 就复述”，而要先判断哪份 evidence 真正相关。",
    "Loss 对 grounded CoT 与 answer 的联合序列取 negative log-likelihood，条件中保留 query、正确文档和全部 distractors。Production retriever 很少完美，RAFT 通过在训练时模拟这种噪声，让 generator 学会忽略词面相似但无关的 passage，并把答案落在正确来源上。",
  ],
  "16.10.3": [
    "Joint training 最大化的是对所有 document latent choice 做 marginalization 后的 answer likelihood：generator 的 $P_\\theta(a\\mid q,d)$ 与 retriever 的 $P_\\phi(d\\mid q)$ 相乘，再对文档求和。Answer loss 因而能够反向影响哪些 document 应获得更高 retrieval probability。",
    "Retriever 可用 REINFORCE estimator 更新，也可把 $P_\\phi(d\\mid q)$ 当作 differentiable attention。工程难点是 $\\phi$ 一变化，离线 document embedding/index 就开始过时，需要 asynchronous index refresh；top-k 之外没有训练信号；若没有 pre-trained retriever 初始化，联合优化容易不稳定。",
  ],
  "16.11": [
    "综合表强调没有免费的最优方案。Naive RAG latency/complexity 最低；reranking、HyDE、Multi-Query 与 RAG-Fusion 用中等成本提高质量；Self-RAG、CRAG、Adaptive RAG 增加控制；Graph/Agentic RAG 面向全局综合或 multi-hop，但 latency、cost 和故障面最高；RAFT 把 evidence-use 能力前移到昂贵的训练阶段。",
    "五个设计问题必须在选型前回答：query 以 factoid、analytical 还是 multi-hop 为主；corpus 有多大、更新多频繁；服务 latency 是否允许 reranking/agentic loop；grounding 是否属于医疗、法律、金融等高风险要求；词表是否专业到需要 hybrid 或 domain-adapted embedding。",
    "原书的最佳实践不是堆叠组件：先用好的 chunking 建立 naive baseline；把 retrieval 与 generation 分开评估；优先尝试 BM25+dense+RRF；对 top-20 加 cross-encoder；持续监控 faithfulness；缓存 document/query embedding；用约 10–15% overlap 防边界丢失；保存 source、date、section、document type 等 metadata 以支持 pre-filter 与 citation。",
  ],
};

export const formulaNotes = {
  "16.1.1": [
    {
      equation: "16.1–16.2",
      title: "Parametric 与 RAG 的生成概率",
      reading:
        "第一式只让答案依赖 query 与模型参数；第二式先由 retriever 给文档分配概率，再把每份文档条件下的生成概率加权求和。这个求和是在 document latent variable 上做 marginalization。",
      symbols: [
        ["\\mathcal M_\\theta", "参数为 $\\theta$ 的语言模型"],
        ["\\mathcal D", "外部文档语料库"],
        ["P_{\\mathrm{ret}}", "query 条件下的 retrieval distribution"],
        ["a,q,d", "答案、问题与候选证据文档"],
      ],
    },
  ],
  "16.2.3": [
    {
      equation: "16.3",
      title: "Cosine Similarity",
      reading:
        "分子是 query 与 chunk embedding 的点积，分母用两侧 L2 norm 归一化。结果主要反映方向一致性，数值越大越可能进入 top-k context。",
      symbols: [
        ["\\mathbf q", "query embedding"],
        ["\\mathbf e_i", "第 $i$ 个 chunk embedding"],
        ["\\|\\cdot\\|", "L2 norm"],
      ],
    },
  ],
  "16.3.1": [
    {
      title: "BM25 相关度",
      reading:
        "每个 query term 的贡献由 IDF、文档内词频和长度归一化共同决定。$k_1$ 控制词频饱和，$b$ 控制文档长度惩罚；稀有词和精确标识符通常获得更强信号。",
      symbols: [
        ["f(t_i,d)", "词项 $t_i$ 在文档 $d$ 中的频次"],
        ["|d|/\\mathrm{avgdl}", "相对平均文档长度"],
        ["k_1,b", "词频饱和与长度归一化超参数"],
      ],
    },
  ],
  "16.3.2": [
    {
      title: "DPR Bi-Encoder 相似度",
      reading:
        "Query encoder 与 passage encoder 分别产生向量，点积越大表示越相关。Passage 向量可离线预计算，在线只编码 query。",
    },
    {
      title: "DPR In-Batch Contrastive Loss",
      reading:
        "分子是 query 与对应 positive passage 的指数相似度，分母包含 batch 内全部 passages。最小化 loss 会拉近正对并推远其他 passages；temperature $\\tau$ 控制分布尖锐度。",
    },
  ],
  "16.3.3": [
    {
      title: "Dense 与 Sparse 的线性融合",
      reading:
        "$\\alpha$ 控制 dense score 权重，$1-\\alpha$ 控制 sparse score 权重。使用前必须校准两种 score 的尺度，否则某一路会仅因数值范围更大而主导结果。",
    },
    {
      equation: "16.6",
      title: "Reciprocal Rank Fusion",
      reading:
        "对文档在每个 ranked list 中的 reciprocal rank 求和。$k$ 用于平滑头部差异；该方法只依赖名次，不要求不同 retriever 的 score 可比。",
    },
    {
      title: "RRF 数值例子",
      reading:
        "文档分别排第 3 与第 7 时得到 $1/63+1/67\\approx0.0308$；若两路都排第 1，则约为 0.0328。多路持续靠前的结果会积累更高分。",
    },
  ],
  "16.3.4": [
    {
      title: "SPLADE 词项权重",
      reading:
        "对每个词表 token，先取所有输入位置上的最大 MLM logit，再经 ReLU 与 $\\log(1+x)$。ReLU 产生稀疏性，max pooling 保留最强 evidence，log 抑制单词过度支配。",
    },
    {
      title: "Sparse Query–Document Score",
      reading:
        "Query 与 document 的稀疏词表向量做点积。只有两侧均非零的词项参与，因此可直接由 inverted index 的 posting lists 高效计算。",
    },
    {
      title: "SPLADE Contrastive + Sparsity Loss",
      reading:
        "Contrastive loss 学相关性，query/document 两侧的 $L_1$ penalty 抑制非零词项数量；没有这两个 penalty，模型会退化成高成本的近 dense representation。",
    },
    {
      title: "Cross-Encoder Distillation",
      reading:
        "对 student 与 teacher 的 score distribution 做 KL divergence。Soft score 提供比 binary relevance 更细的排序监督。",
    },
    {
      title: "非对称 Query/Document 稀疏目标",
      reading:
        "$\\lambda_q>\\lambda_d$ 使在线 query 更稀疏、lookup 更快；document 可稍密，因为其表示在离线阶段预计算。",
    },
    {
      title: "FLOPS-Aware Regularizer",
      reading:
        "对 batch 中每个词项的平均 activation 平方求和，重点惩罚在大量文档中激活的词项，因为它们会形成更长、更慢的 posting list。",
    },
  ],
  "16.3.5": [
    {
      equation: "16.7",
      title: "ColBERT MaxSim",
      reading:
        "每个 query token 在 document tokens 中选择最大点积，再对 query tokens 求和。它保留 token-level evidence，同时允许 document embedding 离线建立索引。",
    },
    {
      title: "Token Embedding 投影",
      reading:
        "Query 与 document encoder 的每个 token 输出经线性层压到 128 维。降低维度能显著控制 token-level index 的体量。",
    },
    {
      title: "ColBERT Pairwise Softmax Loss",
      reading:
        "正 passage 的 MaxSim score 与所有 negative scores 共同归一化。Loss 推高正例概率；hard negatives 越接近真实混淆项，训练信号越有效。",
    },
  ],
  "16.4.1": [
    {
      title: "带 Overlap 的 Chunk 数量",
      reading:
        "首个 chunk 覆盖 $W$ tokens，之后每次只前进 $W-O$。Overlap 越大越不易丢边界信息，但 chunk 数、embedding 成本与重复 context 都会增加。",
    },
  ],
  "16.5.1": [
    {
      title: "HyDE Query Representation",
      reading:
        "先由 LLM 为 query 生成 hypothetical document $\\hat d$，再对 $\\hat d$ 求 embedding。它利用文档式语言缩小短 query 与真实 corpus 的表示差距。",
    },
  ],
  "16.5.2": [
    {
      title: "Cross-Encoder Re-Ranking",
      reading:
        "Cross-encoder 联合编码 query 与 document，让两侧 token 直接 attention 后输出相关度。质量较高，但每个 candidate 都需单独前向计算，因此只适合小规模 top-k 重排。",
    },
  ],
  "16.7.6": [
    {
      title: "Reasoning 与 Search 交错的 Trajectory",
      reading:
        "模型在 reasoning 中输出 search action，环境返回 observation，再继续思考，直到产生 answer。整个轨迹只由最终答案正确性获得 terminal reward。",
    },
  ],
  "16.8.1": [
    {
      title: "Recall@K",
      reading:
        "前 $K$ 个结果覆盖 relevant set 的比例。它回答“该找的证据找回了多少”，但可通过增大 $K$ 提升，因此必须与 Precision 一起看。",
    },
    {
      title: "Precision@K",
      reading:
        "前 $K$ 个结果中真正 relevant 的比例。它衡量 context 纯度；过低会让 generator 阅读大量噪声。",
    },
    {
      title: "Mean Reciprocal Rank",
      reading:
        "每个 query 只看第一份 relevant document 的 rank，并对 reciprocal rank 求平均。首个正确结果越靠前，MRR 越高。",
    },
    {
      title: "NDCG@K",
      reading:
        "DCG 支持 graded relevance，并以 $\\log_2(i+1)$ 折损靠后结果；除以理想排序 IDCG 后归一化到可跨 query 比较的尺度。",
    },
  ],
  "16.8.2": [
    {
      title: "Faithfulness",
      reading:
        "把 answer 拆成 claims，计算其中由 retrieved context 支持的比例。它衡量 grounding，而不保证 context 本身正确。",
    },
    {
      title: "Answer Relevance",
      reading:
        "从 answer 生成 $N$ 个可能的问题，与原 query 做 embedding cosine 后取平均。生成内容若偏离问题，得分会降低。",
    },
    {
      title: "Context Precision 与 Context Recall",
      reading:
        "Context Precision 奖励 relevant document 排在更前；Context Recall 衡量 ground-truth claims 中有多少能由当前 context 支持。",
    },
  ],
  "16.10.2": [
    {
      title: "RAFT 训练目标",
      reading:
        "在 query、正确文档与 distractors 条件下，最大化 grounded chain-of-thought 加最终 answer 的 likelihood。模型被训练成识别并引用正确 evidence，而不是平均使用所有 context。",
    },
  ],
  "16.10.3": [
    {
      title: "Joint Retriever–Generator Objective",
      reading:
        "对 document latent variable 求和：generator likelihood 与 retriever probability 相乘后 marginalize。Answer loss 因而能同时训练生成参数 $\\theta$ 与检索参数 $\\phi$。",
    },
  ],
};

export const codeNotes = {
  "16.2.4": [
    "代码先为每个 chunk 分配 `[Doc N]`，同时写入 source 与 page，再把 context、question 和只能依据 context 作答的 system instruction 组合成 prompt。Evidence 不足时要求显式说明，从接口层为 citation 与拒答建立约束。",
  ],
  "16.4.1": [
    "RecursiveCharacterTextSplitter 以 512 为目标大小、64 为 overlap，并按段落、换行、句子、空格到字符逐级寻找边界。这里的 `length_function=len` 按字符而非 tokenizer 计数，真实系统应改用目标 embedding model 的 token counter。",
  ],
  "16.4.2": [
    "SemanticChunker 用 embedding 判断相邻句子的语义跳变。Percentile=95 表示在不相似度最高的 5% 边界切分；若语料主题变化缓慢，应重新标定 threshold，而不是直接复用示例数值。",
  ],
  "16.4.4": [
    "ParentDocumentRetriever 将小 child chunks 写入 vectorstore，将大 parent chunks 写入 docstore。命中 child 后按映射取回 parent，从而同时获得精确检索与充足生成上下文。示例大小按字符设置，部署时应改用 token 和文档结构共同控制。",
  ],
  "16.5.1": [
    "MultiQueryRetriever 保留原 query，并由带 temperature 的 LLM 生成三个变体；每个变体分别取 top-5，最后按文档身份去重。Query 数量提高 recall，也会线性增加 retrieval 请求与后端负载。",
  ],
  "16.5.2": [
    "代码把 query 与每个 candidate 拼成 pair，交给 BGE cross-encoder 评分，再按 score 排序取 top-n。应在 first-stage retrieval 后调用；若直接对全库执行，无法利用预计算索引，latency 会不可接受。",
  ],
  "16.5.3": [
    "ContextualCompressionRetriever 先调用 base retriever，再让 LLMChainExtractor 从每份候选文档中抽取 query-relevant spans。它减少输入 token，但应记录压缩前文本与抽取范围，以便审计是否丢失否定词、条件或例外。",
  ],
  "16.5.8": [
    "实现先生成 variants，再对原 query 与全部 variants 检索；`reciprocal_rank_fusion` 按 document ID 累加 $1/(k+rank)$，融合后取前五条生成答案。Production 还需要并行执行、稳定去重键、超时与单路失败降级。",
  ],
  "16.7.3": [
    "Router 用 Enum 限定五类 knowledge source，并通过 Pydantic structured output 同时返回 source、refined_query 与 reasoning。这样 routing decision 可校验和记录；调用具体 backend 前仍需权限检查、费用预算和 fallback。",
  ],
  "16.7.4": [
    "LangGraph 将 Plan、Retrieve、Evaluate、Generate 写成 stateful nodes。Conditional edge 在 evidence sufficient 或达到 max_iterations 时进入生成，否则回到检索。`retrieved_docs` 的 reducer 负责跨轮累计；上线前还需去重、预算计量和低证据置信度提示。",
  ],
  "16.7.5": [
    "四个 `@tool` 分别暴露内部文档、SQL、Web 与 Python execution，AgentExecutor 负责选择调用。示例省略了生产安全层：SQL 只读限制、参数 schema、Web 来源过滤、Python sandbox、timeout 和审计日志都必须在工具实现外包围。",
  ],
  "16.8.3": [
    "RAGAs 示例构造统一 Dataset 并批量计算 retrieval/generation metrics。字段是 v0.1 API；升级到 v0.2+ 时需迁移为 `user_input`、`response`、`retrieved_contexts` 与 `reference`，并用固定样本做版本回归。",
  ],
  "16.9.3": [
    "`lru_cache` 跳过重复 query 的 embedding；`asyncio.create_task` 并行请求多个 source；`gather(return_exceptions=True)` 允许部分后端失败；最后过滤异常并按内容去重。真实服务还应分别设置 timeout、并发上限和 source priority。",
  ],
  "16.9.4": [
    "`RAGIndexManager.upsert_document` 先按 `doc_id` 删除旧 chunks，再切分新版本并为每个 chunk 写入 version/indexed_at；`expire_old_documents` 按 TTL 删除过期数据。实现假设 vectorstore 支持 metadata filter，且时间字段采用可比较的统一时区格式。",
  ],
};
