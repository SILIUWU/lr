import type { ChapterContent, ReadingBlock } from "./types";
import { chapterReadings } from "./reading-content";
import chapter01 from "@/content/chapters/ch-01.json";
import chapter02 from "@/content/chapters/ch-02.json";
import chapter03 from "@/content/chapters/ch-03.json";
import chapter04 from "@/content/chapters/ch-04.json";
import chapter05 from "@/content/chapters/ch-05.json";
import chapter06 from "@/content/chapters/ch-06.json";
import chapter07 from "@/content/chapters/ch-07.json";
import chapter08 from "@/content/chapters/ch-08.json";
import chapter09 from "@/content/chapters/ch-09.json";
import chapter10 from "@/content/chapters/ch-10.json";
import chapter11 from "@/content/chapters/ch-11.json";
import chapter12 from "@/content/chapters/ch-12.json";
import chapter13 from "@/content/chapters/ch-13.json";
import chapter14 from "@/content/chapters/ch-14.json";
import chapter15 from "@/content/chapters/ch-15.json";
import chapter16 from "@/content/chapters/ch-16.json";
import chapter17 from "@/content/chapters/ch-17.json";
import chapter18 from "@/content/chapters/ch-18.json";
import chapter19 from "@/content/chapters/ch-19.json";
import chapter20 from "@/content/chapters/ch-20.json";
import chapter21 from "@/content/chapters/ch-21.json";
import chapter22 from "@/content/chapters/ch-22.json";
import chapter23 from "@/content/chapters/ch-23.json";
import chapter24 from "@/content/chapters/ch-24.json";
import chapter25 from "@/content/chapters/ch-25.json";
import chapter26 from "@/content/chapters/ch-26.json";
import chapter27 from "@/content/chapters/ch-27.json";
import chapter28 from "@/content/chapters/ch-28.json";
import chapter29 from "@/content/chapters/ch-29.json";
import chapter30 from "@/content/chapters/ch-30.json";

const importedChapters = [
  chapter01, chapter02, chapter03, chapter04, chapter05, chapter06,
  chapter07, chapter08, chapter09, chapter10, chapter11, chapter12,
  chapter13, chapter14, chapter15, chapter16, chapter17, chapter18,
  chapter19, chapter20, chapter21, chapter22, chapter23, chapter24,
  chapter25, chapter26, chapter27, chapter28, chapter29, chapter30,
] as unknown as ChapterContent[];

const curatedBlocks: Record<string, ReadingBlock[]> = {
  "16:s-16-3-6": [
    {
      id: "s-16-3-6-retrieval-table",
      type: "table",
      origin: "source_translation",
      source: {
        chapter: 16,
        section: "16.3.6",
        pages: "314",
        table: "Retrieval method comparison",
      },
      title: "Retrieval 方法不是同一维度上的单一排名",
      caption: "原书对 sparse、dense、hybrid 与 late-interaction 路线的比较重排。",
      columns: ["方法", "匹配信号", "优势", "典型失效"],
      rows: [
        ["BM25 / TF-IDF", "词项重合", "便宜、透明、适合精确实体", "同义改写和语义表达召回不足"],
        ["Dense Retrieval", "embedding 相似度", "能处理语义近似和自然语言问题", "对领域漂移、embedding 选择敏感"],
        ["Hybrid + RRF", "稀疏与稠密排序融合", "同时保留 lexical 与 semantic signal", "需要维护两套索引和融合参数"],
        ["ColBERT", "token-level late interaction", "细粒度匹配质量较高", "索引体量、延迟和部署复杂度更高"],
      ],
    },
  ],
  "15:s-15-architecture-stack": [
    {
      id: "s-15-architecture-stack-adapted-map",
      type: "figure",
      origin: "source_translation",
      source: { chapter: 15, pages: "306", figure: "Figure 15.1" },
      src: "/paper/figure-15-1.webp",
      alt: "Agentic AI architecture stack，从模型层向上连接知识、记忆、工具、Harness、协议、多 Agent 与用户体验。",
      caption:
        "原书用分层架构说明：LLM 只是底座；可靠的 Agentic system 还需要 knowledge、memory、tools、Harness、protocol、multi-agent coordination 与 user experience。",
      adapted: false,
    },
    {
      id: "s-15-architecture-stack-editor-note",
      type: "callout",
      origin: "editorial_explanation",
      source: { chapter: 15, pages: "306" },
      title: "不要把分层图理解成物理隔离",
      text:
        "这些层是责任边界，不是互不相干的盒子。一次 context 压缩可能同时改变推理质量、tool selection、成本和 trace 可解释性；调试时应沿数据与控制流跨层追踪。",
    },
  ],
  "17:s-17-2": [
    {
      id: "s-17-2-memory-taxonomy",
      type: "table",
      origin: "source_translation",
      source: {
        chapter: 17,
        section: "17.2",
        pages: "334",
        table: "Memory taxonomy",
      },
      title: "四类 Memory 解决的是不同时间尺度的问题",
      columns: ["Memory 类型", "保存内容", "典型读写路径", "主要风险"],
      rows: [
        ["Working Memory", "当前任务的临时 state 与中间结果", "直接进入 active context", "挤占 token budget、被旧 observation 污染"],
        ["Episodic Memory", "过去发生过的 event 与 trajectory", "按时间、实体或相似经历检索", "把偶然经历误当成普遍规律"],
        ["Semantic Memory", "抽象事实、概念和关系", "embedding / graph / structured lookup", "知识过期、冲突和来源不明"],
        ["Procedural Memory", "技能、workflow 与执行规则", "按任务意图选择并调用", "版本漂移或把不适用流程机械复用"],
      ],
    },
    {
      id: "s-17-2-editorial-boundary",
      type: "callout",
      origin: "editorial_explanation",
      source: { chapter: 17, section: "17.2", pages: "334" },
      title: "分类的价值在于决定写入与检索策略",
      text:
        "不要只给同一个 vector store 打四个标签。Working Memory 的核心约束是 context budget，Episodic Memory 需要保留时间和因果线索，Semantic Memory 需要冲突合并，而 Procedural Memory 还必须处理版本与权限。",
    },
  ],
  "16:s-16-7-4": [
    {
      id: "s-16-7-4-pipeline",
      type: "example",
      origin: "source_translation",
      source: { chapter: 16, section: "16.7.4", pages: "322-323" },
      title: "完整 Agentic RAG 的四节点闭环",
      scenario:
        "系统接收一个需要多个信息来源才能回答的问题，并把检索过程建模为带状态的 graph。",
      steps: [
        "Plan：把原始问题拆成与不同 information need 对应的 sub-query。",
        "Retrieve：把每个 sub-query 路由到合适的数据源并取回文档。",
        "Evaluate：判断累计 context 是否足以回答原问题。",
        "Generate：在证据充分或迭代预算耗尽后，生成带引用的最终回答。",
      ],
      result:
        "Evaluate 节点决定结束还是带着改写后的 query 回到 Retrieve，形成可观测、可限额的条件循环。",
      limitation:
        "若没有 iteration budget、证据充分性判据和重复检索检测，循环可能增加成本却不增加信息量。",
    },
    {
      id: "s-16-7-4-engineering",
      type: "failure",
      origin: "engineering_extension",
      source: { chapter: 16, section: "16.7.4", pages: "322-323" },
      title: "工程延伸：先定义退出条件",
      text:
        "生产实现至少记录 query revision、retrieved document IDs、context sufficiency score、iteration count 与 citation coverage。退出条件应同时包含“证据足够”和“预算耗尽”，不能只依赖模型口头声称已经足够。",
    },
  ],
  "18:s-18-5-1": [
    {
      id: "s-18-5-1-react-equation",
      type: "formula",
      origin: "source_translation",
      source: {
        chapter: 18,
        section: "18.5.1",
        pages: "367",
        equation: "18.10",
      },
      title: "ReAct loop",
      expression:
        "Thought_t → Action_t → Observation_t → Thought_{t+1} → …",
      latex:
        "\\mathrm{Thought}_t \\rightarrow \\mathrm{Action}_t \\rightarrow \\mathrm{Observation}_t \\rightarrow \\mathrm{Thought}_{t+1} \\rightarrow \\cdots",
      reading:
        "模型先形成当前判断，选择一个 action；Harness 执行动作并把 observation 写回 context，下一轮判断因此建立在真实环境反馈上。",
      symbols: [
        ["Thoughtₜ", "第 t 轮根据当前 context 形成的判断"],
        ["Actionₜ", "工具调用、环境操作或直接回答"],
        ["Observationₜ", "工具或环境返回的可验证结果"],
      ],
    },
    {
      id: "s-18-5-1-figure",
      type: "figure",
      origin: "source_translation",
      source: { chapter: 18, section: "18.5.1", pages: "367", figure: "Figure 18.5" },
      src: "/paper/figure-18-2.webp",
      alt: "ReAct 循环在 Thought、Action、Observation 之间迭代，直到满足终止条件。",
      caption:
        "ReAct 把 reasoning 与 acting 交错起来。真正执行工具、写回 observation 和判断停止条件的是 Harness，而不是模型权重本身。",
      adapted: false,
    },
  ],
  "22:s-22-2-3": [
    {
      id: "s-22-2-3-lifecycle",
      type: "list",
      origin: "source_translation",
      source: { chapter: 22, section: "22.2.3", pages: "423-424" },
      title: "MCP protocol lifecycle",
      items: [
        "Initialize：Client 与 Server 协商 protocol version 和双方 capability。",
        "Discover：Client 请求 tools、resources 或 prompts 的可用清单及 schema。",
        "Invoke：Host 依据模型选择发送结构化请求，Server 执行受控能力。",
        "Return：Server 返回 content、structured result 或 protocol error。",
        "Close：会话结束时释放 transport、进程和会话级资源。",
      ],
    },
    {
      id: "s-22-2-3-boundary",
      type: "failure",
      origin: "editorial_explanation",
      source: { chapter: 22, section: "22.2.3", pages: "423-424" },
      title: "协议标准化不等于自动安全",
      text:
        "MCP 统一消息和能力发现，但不会替应用决定哪些工具应该被信任。Host 仍需执行权限收敛、参数验证、用户审批、超时、审计和结果净化。",
    },
  ],
  "22:s-22-2-2": [
    {
      id: "s-22-2-2-transport-table",
      type: "table",
      origin: "source_translation",
      source: {
        chapter: 22,
        section: "22.2.2",
        pages: "423",
        table: "MCP transport comparison",
      },
      title: "Transport 选择决定进程边界与运维成本",
      columns: ["Transport", "适用场景", "优势", "需要处理"],
      rows: [
        ["stdio", "本机工具、IDE extension、受控子进程", "配置少、进程隔离直接", "进程生命周期、stderr、权限继承"],
        ["HTTP / streaming", "远程或共享 Server", "跨主机部署、便于集中运营", "认证、TLS、网络失败、断线恢复与限流"],
      ],
    },
  ],
  "27:s-27-3-6": [
    {
      id: "s-27-3-6-failure-ui",
      type: "failure",
      origin: "source_translation",
      source: { chapter: 27, section: "27.3.6", pages: "527" },
      title: "错误与恢复必须成为一等 UI 状态",
      text:
        "Agentic UI 不能只显示“失败”。它应指出失败发生在哪一步、哪些 tool call 已成功、是否发生外部副作用、系统准备如何重试，以及用户可以重试、修改输入、回滚还是终止。隐藏中间状态会让恢复操作本身成为新的风险。",
    },
    {
      id: "s-27-3-6-engineering",
      type: "callout",
      origin: "engineering_extension",
      source: { chapter: 27, section: "27.3.6", pages: "527" },
      title: "工程延伸：恢复动作必须与幂等性配套",
      text:
        "当失败发生在付款、发信、删改文件等有副作用的工具之后，界面上的“重试”按钮只有在系统能确认 action 是否已经生效时才安全。应展示 operation ID、执行状态和可撤销范围。",
    },
  ],
  "25:s-25-10": [
    {
      id: "s-25-10-topology-table",
      type: "table",
      origin: "source_translation",
      source: {
        chapter: 25,
        section: "25.10",
        pages: "486-487",
        table: "Architecture comparison",
      },
      title: "Topology 决定通信路径，也决定故障如何传播",
      columns: ["Topology", "控制方式", "优势", "主要 failure mode"],
      rows: [
        ["Centralized supervisor", "一个 manager 分派和汇总", "容易观察、约束和停止", "supervisor 成为瓶颈与单点故障"],
        ["Peer-to-peer", "Agent 直接协商", "灵活、无单一中心", "通信增长快、责任归属模糊"],
        ["Hierarchical", "多级 manager 与 specialist", "可扩展复杂分工", "层级失真、延迟和目标逐级漂移"],
        ["Swarm", "局部规则与分布式协调", "并行性高、对单点失效更稳健", "涌现行为难以预测和审计"],
      ],
    },
    {
      id: "s-25-10-failure-propagation",
      type: "failure",
      origin: "engineering_extension",
      source: { chapter: 25, section: "25.10", pages: "486-487" },
      title: "增加 Agent 之前先画错误传播图",
      text:
        "每条 message edge 都会增加 token、延迟和错误复制机会。生产设计应明确谁能修改 shared state、谁负责最终判断、错误会被多少下游节点消费，以及怎样撤销已经并行执行的副作用。",
    },
  ],
};

function withCuratedBlocks(chapter: ChapterContent): ChapterContent {
  const guide = chapterReadings.find((item) => item.chapter === chapter.chapter);
  const isSourceBacked = (block: ReadingBlock) =>
    ["source_translation", "source_definition"].includes(block.origin);
  const isPublishable = (block: ReadingBlock) =>
    block.reviewStatus === "verified";
  const countChinese = (block: ReadingBlock) => {
    const values =
      block.type === "paragraph"
        ? [block.title, block.text]
        : block.type === "list"
          ? [block.title, ...block.items]
          : block.type === "formula"
            ? [block.title, block.reading]
            : block.type === "code"
              ? [block.title, block.explanation]
              : block.type === "figure"
                ? [block.title, block.caption]
                : block.type === "table"
                  ? [
                      block.title,
                      block.caption,
                      ...block.columns,
                      ...block.rows.flat(),
                    ]
                  : block.type === "example"
                    ? [
                        block.title,
                        block.scenario,
                        ...block.steps,
                        block.result,
                        block.limitation,
                      ]
                    : [block.title, block.text];
    return values.reduce(
      (total, value) =>
        total + (value?.match(/[\u3400-\u9fff]/g)?.length ?? 0),
      0,
    );
  };
  const sections = chapter.sections.map((section) => {
    const additions = curatedBlocks[`${chapter.chapter}:${section.id}`] ?? [];
    return {
      ...section,
      blocks: [...additions, ...section.blocks].filter(isPublishable),
    };
  });
  const verifiedSourceBlocks = sections.flatMap((section) =>
    section.blocks.filter(
      (block) => isSourceBacked(block) && block.reviewStatus === "verified",
    ),
  );
  const coverage = sections.reduce(
    (result, section, index) => {
      const hasVerifiedSource = section.blocks.some(
        (block) => isSourceBacked(block) && block.reviewStatus === "verified",
      );
      const hasChildren = sections[index + 1]?.level > section.level;
      if (hasVerifiedSource || !hasChildren) result.denominator += 1;
      if (hasVerifiedSource) result.numerator += 1;
      return result;
    },
    { numerator: 0, denominator: 0 },
  );
  const visibleBlockCount = sections.reduce(
    (total, section) => total + section.blocks.length,
    0,
  );
  return {
    ...chapter,
    zhTitle: guide?.zhTitle ?? chapter.zhTitle,
    overview:
      verifiedSourceBlocks.length > 0
        ? chapter.overview
        : (guide?.overview ?? chapter.overview),
    status: chapter.status,
    sections,
    metrics: {
      ...chapter.metrics,
      chineseCharacters: verifiedSourceBlocks.reduce(
        (total, block) => total + countChinese(block),
        0,
      ),
      sourceCoverage:
        coverage.denominator === 0
          ? 0
          : Math.round((coverage.numerator / coverage.denominator) * 100),
      blockCount: visibleBlockCount,
    },
  };
}

export const chapters = importedChapters.map(withCuratedBlocks);

export const chapterCatalog = chapters.map(
  ({ chapter, title, zhTitle, pages, minutes, status, metrics }) => ({
    chapter,
    title,
    zhTitle,
    pages,
    minutes,
    status,
    metrics,
  }),
);

export function chapterSlug(chapter: number) {
  return `ch-${String(chapter).padStart(2, "0")}`;
}

export function getChapterContent(slugOrNumber: string | number) {
  const chapter =
    typeof slugOrNumber === "number"
      ? slugOrNumber
      : Number(slugOrNumber.replace(/^ch-/, ""));
  return chapters.find((item) => item.chapter === chapter);
}

export function chapterHref(chapter: number, sectionId?: string) {
  const base = `/read/${chapterSlug(chapter)}`;
  return sectionId ? `${base}#${sectionId}` : base;
}

export const readerMetrics = chapters.reduce(
  (total, chapter) => ({
    chapters: total.chapters + 1,
    sections: total.sections + chapter.metrics.sectionCount,
    blocks: total.blocks + chapter.metrics.blockCount,
    chineseCharacters:
      total.chineseCharacters + chapter.metrics.chineseCharacters,
  }),
  { chapters: 0, sections: 0, blocks: 0, chineseCharacters: 0 },
);
