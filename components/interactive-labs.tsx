"use client";

import { useMemo, useState } from "react";
import type { LabKind } from "@/lib/types";

const labIntro: Record<LabKind, { eyebrow: string; title: string; copy: string }> = {
  architecture: {
    eyebrow: "LAB 01 · STACK EXPLORER",
    title: "一层出错，为什么整个 Agent 都像“变笨”了？",
    copy: "选择架构层，观察它向上提供什么能力、向下依赖什么约束，以及最常见的故障信号。",
  },
  rag: {
    eyebrow: "LAB 02 · RAG TRADE-OFF",
    title: "chunk 越小、top-k 越大，就一定越好吗？",
    copy: "调节两个参数，观察模拟的 recall、context noise 与 token cost。数值用于理解趋势，不是论文实验结果。",
  },
  memory: {
    eyebrow: "LAB 03 · MEMORY ROUTER",
    title: "一句“还记得吗”，到底应该去哪里找？",
    copy: "切换记忆类型，跟踪 write、index、retrieve、inject 的路径与适用边界。",
  },
  loop: {
    eyebrow: "LAB 04 · LOOP ENGINEERING",
    title: "ReAct 与 Plan-and-Execute，差别不只是一张计划表",
    copy: "在两类循环之间切换并逐步运行，比较局部反馈、全局协调和 recovery 行为。",
  },
  mcp: {
    eyebrow: "LAB 05 · MCP LIFECYCLE",
    title: "一次 tool call 在 MCP 里经历了什么？",
    copy: "逐步展开 initialization、capability negotiation、discovery、invocation 与 result handling。",
  },
  multiagent: {
    eyebrow: "LAB 06 · TOPOLOGY SIMULATOR",
    title: "多一个 Agent，不等于多一份线性能力",
    copy: "改变拓扑和 Agent 数量，观察通信边、token 成本与故障传播风险的相对变化。",
  },
};

function LabFrame({
  kind,
  children,
}: {
  kind: LabKind;
  children: React.ReactNode;
}) {
  const info = labIntro[kind];
  return (
    <section className="lab-frame" aria-labelledby={`lab-${kind}`}>
      <header>
        <span className="eyebrow">{info.eyebrow}</span>
        <h2 id={`lab-${kind}`}>{info.title}</h2>
        <p>{info.copy}</p>
      </header>
      {children}
      <footer>
        <span className="evidence explanation">解释 / 推导</span>
        <p>交互数值用于教学建模；请勿把它当成生产系统 benchmark。</p>
      </footer>
    </section>
  );
}

const architectureLayers = [
  {
    name: "Experience",
    zh: "交互界面",
    gives: "可见的进度、证据、批准点与恢复入口",
    depends: "稳定的状态模型与可解释事件",
    failure: "用户只看到等待动画，不知道系统正在做什么",
  },
  {
    name: "Coordination",
    zh: "协调与模式",
    gives: "任务分解、角色协作、并行与冲突处理",
    depends: "可追踪的消息、预算和 ownership",
    failure: "重复工作、循环委派、责任漂移",
  },
  {
    name: "Interoperability",
    zh: "协议互操作",
    gives: "MCP、Skills、A2A 的可组合连接",
    depends: "schema、capability 与 trust boundary",
    failure: "参数契约错位、权限过宽、身份不清",
  },
  {
    name: "Agent Runtime",
    zh: "Harness 与循环",
    gives: "context assembly、tool execution、state 与 recovery",
    depends: "模型、工具和环境都能返回可用信号",
    failure: "上下文腐化、工具重试风暴、停止条件失效",
  },
  {
    name: "Knowledge",
    zh: "RAG 与 Memory",
    gives: "外部证据与跨时间状态",
    depends: "可检索的表示、metadata 与访问边界",
    failure: "召回错误、过期记忆、事实与偏好混淆",
  },
  {
    name: "Model",
    zh: "LLM 与训练",
    gives: "生成、推理、策略选择与语言接口",
    depends: "数据、算力、alignment 与 evaluation",
    failure: "幻觉、reward hacking、分布外退化",
  },
];

function ArchitectureLab() {
  const [selected, setSelected] = useState(3);
  const layer = architectureLayers[selected];
  return (
    <LabFrame kind="architecture">
      <div className="architecture-lab">
        <div className="stack-selector" role="list" aria-label="Agentic AI 架构层">
          {architectureLayers.map((item, index) => (
            <button
              key={item.name}
              type="button"
              className={selected === index ? "active" : ""}
              onClick={() => setSelected(index)}
              aria-pressed={selected === index}
            >
              <span>0{architectureLayers.length - index}</span>
              <strong>{item.name}</strong>
              <small>{item.zh}</small>
            </button>
          ))}
        </div>
        <div className="lab-inspector" aria-live="polite">
          <span className="inspector-count">
            LAYER {String(architectureLayers.length - selected).padStart(2, "0")}
          </span>
          <h3>{layer.name}</h3>
          <dl>
            <div>
              <dt>向上提供</dt>
              <dd>{layer.gives}</dd>
            </div>
            <div>
              <dt>向下依赖</dt>
              <dd>{layer.depends}</dd>
            </div>
            <div>
              <dt>故障信号</dt>
              <dd>{layer.failure}</dd>
            </div>
          </dl>
        </div>
      </div>
    </LabFrame>
  );
}

function Meter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="meter">
      <div>
        <span>{label}</span>
        <strong>{Math.round(value)}</strong>
      </div>
      <div className="meter-track">
        <span className={tone} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

function RagLab() {
  const [chunk, setChunk] = useState(480);
  const [topK, setTopK] = useState(5);
  const metrics = useMemo(() => {
    const chunkFit = 100 - Math.abs(chunk - 560) / 7;
    const recall = Math.min(96, 38 + topK * 7 + chunkFit * 0.2);
    const noise = Math.min(98, 9 + topK * 7 + Math.max(0, chunk - 650) / 9);
    const cost = Math.min(100, (chunk * topK) / 90);
    return { recall, noise, cost };
  }, [chunk, topK]);
  return (
    <LabFrame kind="rag">
      <div className="controls-grid">
        <label>
          <span>
            chunk size <strong>{chunk} tokens</strong>
          </span>
          <input
            type="range"
            min="120"
            max="1200"
            step="40"
            value={chunk}
            onChange={(event) => setChunk(Number(event.target.value))}
          />
        </label>
        <label>
          <span>
            top-k <strong>{topK} passages</strong>
          </span>
          <input
            type="range"
            min="1"
            max="12"
            value={topK}
            onChange={(event) => setTopK(Number(event.target.value))}
          />
        </label>
      </div>
      <div className="rag-dashboard" aria-live="polite">
        <Meter label="模拟 Recall" value={metrics.recall} tone="good" />
        <Meter label="Context Noise" value={metrics.noise} tone="warn" />
        <Meter label="Token Cost" value={metrics.cost} tone="cost" />
      </div>
      <p className="lab-conclusion">
        {metrics.noise > 70
          ? "召回已接近饱和，但噪声正在吞噬有效 attention。下一步应先做 reranking，而非继续增大 top-k。"
          : metrics.recall < 65
            ? "当前 retrieval budget 偏小；可以增加 top-k，或改善 query / embedding，而非只加长 prompt。"
            : "当前处于相对平衡区间。真实系统仍需用 answer relevance 与 citation accuracy 验证。"}
      </p>
      <button className="text-button" type="button" onClick={() => { setChunk(480); setTopK(5); }}>
        重置实验
      </button>
    </LabFrame>
  );
}

const memoryTypes = [
  {
    key: "working",
    name: "Working",
    zh: "当前任务状态",
    path: ["观察输入", "放入 active context", "参与下一步推理", "任务结束后淘汰"],
    example: "这次代码修改中尚未完成的测试清单",
  },
  {
    key: "episodic",
    name: "Episodic",
    zh: "过去的经历",
    path: ["记录事件", "压缩为 episode", "按情境召回", "作为经验注入"],
    example: "上次部署因环境变量缺失而失败",
  },
  {
    key: "semantic",
    name: "Semantic",
    zh: "事实与概念",
    path: ["抽取事实", "建立索引", "按实体/语义检索", "与当前证据合并"],
    example: "项目使用 PostgreSQL 16 与 pgvector",
  },
  {
    key: "procedural",
    name: "Procedural",
    zh: "如何做",
    path: ["定义步骤/skill", "匹配任务意图", "加载操作约束", "执行并校验"],
    example: "生产发布必须先跑 smoke test 再切流量",
  },
];

function MemoryLab() {
  const [selected, setSelected] = useState("episodic");
  const memory = memoryTypes.find((item) => item.key === selected)!;
  return (
    <LabFrame kind="memory">
      <div className="segmented-control" role="group" aria-label="选择记忆类型">
        {memoryTypes.map((item) => (
          <button
            key={item.key}
            type="button"
            className={selected === item.key ? "active" : ""}
            onClick={() => setSelected(item.key)}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="memory-path" aria-live="polite">
        {memory.path.map((step, index) => (
          <div key={step}>
            <span>{index + 1}</span>
            <p>{step}</p>
            {index < memory.path.length - 1 && <b aria-hidden="true">→</b>}
          </div>
        ))}
      </div>
      <div className="example-callout">
        <small>{memory.name} Memory · {memory.zh}</small>
        <p>例：{memory.example}</p>
      </div>
    </LabFrame>
  );
}

const loops = {
  react: {
    label: "ReAct",
    steps: [
      ["Observe", "读取任务与当前环境反馈"],
      ["Think", "选择下一步最有信息量的动作"],
      ["Act", "调用搜索或工具"],
      ["Observe", "检查真实结果与错误"],
      ["Revise", "更新局部策略，继续循环"],
    ],
  },
  plan: {
    label: "Plan-and-Execute",
    steps: [
      ["Plan", "生成显式任务图与成功条件"],
      ["Assign", "把可执行步骤交给 worker"],
      ["Execute", "按依赖关系运行步骤"],
      ["Evaluate", "聚合结果并检查全局目标"],
      ["Replan", "局部失败时修改剩余计划"],
    ],
  },
};

function LoopLab() {
  const [mode, setMode] = useState<keyof typeof loops>("react");
  const [step, setStep] = useState(0);
  const loop = loops[mode];
  const changeMode = (next: keyof typeof loops) => {
    setMode(next);
    setStep(0);
  };
  return (
    <LabFrame kind="loop">
      <div className="segmented-control" role="group" aria-label="选择循环模式">
        {(Object.keys(loops) as Array<keyof typeof loops>).map((key) => (
          <button
            key={key}
            type="button"
            className={mode === key ? "active" : ""}
            onClick={() => changeMode(key)}
          >
            {loops[key].label}
          </button>
        ))}
      </div>
      <ol className="stepper" aria-live="polite">
        {loop.steps.map(([name, description], index) => (
          <li key={`${mode}-${name}-${index}`} className={index <= step ? "active" : ""}>
            <span>{index + 1}</span>
            <div>
              <strong>{name}</strong>
              <p>{description}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="step-actions">
        <button type="button" className="secondary-button" onClick={() => setStep(0)}>
          重新开始
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={() => setStep((value) => (value + 1) % loop.steps.length)}
        >
          下一步 <span>→</span>
        </button>
      </div>
    </LabFrame>
  );
}

const mcpSteps = [
  ["01", "Initialize", "Client 与 Server 交换 protocol version、implementation info。"],
  ["02", "Negotiate", "双方声明 resources、prompts、tools、logging 等 capabilities。"],
  ["03", "Discover", "Client 请求 tools/list，获得 name、description 与 inputSchema。"],
  ["04", "Select", "模型根据任务与 schema 选择工具并构造 arguments。"],
  ["05", "Invoke", "Client 发送 tools/call；Server 在自身 trust boundary 内执行。"],
  ["06", "Return", "结构化结果回到 Client，Harness 处理错误并加入 context。"],
];

function McpLab() {
  const [active, setActive] = useState(0);
  return (
    <LabFrame kind="mcp">
      <div className="mcp-sequence" aria-live="polite">
        <div className="mcp-party">MCP CLIENT</div>
        <div className="mcp-wire">
          {mcpSteps.map(([number, name], index) => (
            <button
              key={name}
              type="button"
              className={index === active ? "active" : ""}
              onClick={() => setActive(index)}
              aria-label={`步骤 ${number}：${name}`}
            >
              <span>{number}</span>
              <b>{index % 2 === 0 ? "→" : "←"}</b>
              <small>{name}</small>
            </button>
          ))}
        </div>
        <div className="mcp-party">MCP SERVER</div>
      </div>
      <div className="sequence-detail">
        <small>STEP {mcpSteps[active][0]}</small>
        <h3>{mcpSteps[active][1]}</h3>
        <p>{mcpSteps[active][2]}</p>
      </div>
      <div className="step-actions">
        <button
          type="button"
          className="secondary-button"
          disabled={active === 0}
          onClick={() => setActive((value) => Math.max(0, value - 1))}
        >
          上一步
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={() => setActive((value) => (value + 1) % mcpSteps.length)}
        >
          下一步 <span>→</span>
        </button>
      </div>
    </LabFrame>
  );
}

type Topology = "hub" | "mesh" | "hierarchy";

function MultiAgentLab() {
  const [topology, setTopology] = useState<Topology>("hub");
  const [agents, setAgents] = useState(5);
  const metrics = useMemo(() => {
    const links =
      topology === "mesh"
        ? (agents * (agents - 1)) / 2
        : topology === "hub"
          ? agents - 1
          : Math.max(1, agents - 1);
    const cost = Math.min(100, links * 4 + agents * 5);
    const propagation =
      topology === "mesh" ? Math.min(96, 25 + agents * 8) : topology === "hub" ? 72 : 38;
    return { links, cost, propagation };
  }, [topology, agents]);
  return (
    <LabFrame kind="multiagent">
      <div className="controls-grid">
        <div>
          <span className="control-label">拓扑</span>
          <div className="segmented-control" role="group" aria-label="选择通信拓扑">
            {(["hub", "mesh", "hierarchy"] as Topology[]).map((item) => (
              <button
                key={item}
                className={topology === item ? "active" : ""}
                type="button"
                onClick={() => setTopology(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <label>
          <span>
            Agent 数量 <strong>{agents}</strong>
          </span>
          <input
            type="range"
            min="2"
            max="12"
            value={agents}
            onChange={(event) => setAgents(Number(event.target.value))}
          />
        </label>
      </div>
      <div className={`topology-view topology-${topology}`} aria-label={`${topology} 拓扑，${agents} 个 Agent`}>
        <div className="topology-center">O</div>
        {Array.from({ length: agents }).map((_, index) => (
          <span
            key={index}
            style={
              {
                "--agent-angle": `${(360 / agents) * index}deg`,
                "--agent-index": index,
              } as React.CSSProperties
            }
          >
            A{index + 1}
          </span>
        ))}
      </div>
      <div className="topology-metrics" aria-live="polite">
        <div><span>通信边</span><strong>{metrics.links}</strong></div>
        <div><span>相对 Token Cost</span><strong>{Math.round(metrics.cost)}</strong></div>
        <div><span>故障传播风险</span><strong>{Math.round(metrics.propagation)}%</strong></div>
      </div>
    </LabFrame>
  );
}

export function InteractiveLab({ kind }: { kind: LabKind }) {
  if (kind === "architecture") return <ArchitectureLab />;
  if (kind === "rag") return <RagLab />;
  if (kind === "memory") return <MemoryLab />;
  if (kind === "loop") return <LoopLab />;
  if (kind === "mcp") return <McpLab />;
  return <MultiAgentLab />;
}
