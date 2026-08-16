"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { sampleNotes } from "@/lib/demo";
import type { AnalyzeResult, Suggestion, SuggestionKind, TaskPriority } from "@/lib/types";

const labels: Record<SuggestionKind, string> = {
  decision: "Decision",
  action: "Action item",
  question: "Open question",
  assumption: "Assumption",
};

const icons: Record<SuggestionKind, string> = {
  decision: "✓",
  action: "→",
  question: "?",
  assumption: "≈",
};

type Project = {
  id: string;
  name: string;
  notes: string;
  analysis: AnalyzeResult | null;
  accepted: Suggestion[];
  dismissed: string[];
  completedActionIds: string[];
};

const exampleProject: Project = {
  id: "example-launch-planning",
  name: "Example: Launch planning",
  notes: sampleNotes,
  analysis: null,
  accepted: [],
  dismissed: [],
  completedActionIds: [],
};

export function Workspace() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"notes" | "todo" | "memory">("notes");
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [shareLabel, setShareLabel] = useState("Share");
  const [taskDraft, setTaskDraft] = useState<Suggestion | null>(null);

  const project = projects.find((item) => item.id === activeProjectId) ?? null;

  const pending = useMemo(() => {
    if (!project?.analysis) return [];

    const dismissedIds = new Set(project.dismissed);
    const acceptedIds = new Set(project.accepted.map((item) => item.id));

    return project.analysis.suggestions.filter(
      (item) => !dismissedIds.has(item.id) && !acceptedIds.has(item.id),
    );
  }, [project]);

  const actionItems = useMemo(
    () => project?.accepted.filter((item) => item.kind === "action") ?? [],
    [project],
  );

  const memoryItems = useMemo(
    () => project?.accepted.filter((item) => item.kind !== "action") ?? [],
    [project],
  );

  function updateProject(changes: Partial<Project>) {
    if (!activeProjectId) return;
    setProjects((current) =>
      current.map((item) =>
        item.id === activeProjectId ? { ...item, ...changes } : item,
      ),
    );
  }

  function selectProject(id: string) {
    setActiveProjectId(id);
    setTab("notes");
    setError(null);
  }

  // Re-running analysis replaces stale suggestions from the current note.
  async function analyze() {
    if (!project) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: project.notes }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Analysis failed");
      updateProject({ analysis: body, dismissed: [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  function accept(item: Suggestion) {
    if (!project) return;
    updateProject({ accepted: [...project.accepted, item] });
  }

  // Fill sensible defaults here, but let the user change them before saving.
  function reviewTask(item: Suggestion) {
    setTaskDraft({
      ...item,
      owner: item.owner ?? "Alisha",
      priority: item.priority ?? "medium",
    });
  }

  function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || !taskDraft) return;
    const cleaned: Suggestion = {
      ...taskDraft,
      title: taskDraft.title.trim(),
      owner: taskDraft.owner?.trim() || undefined,
      due: taskDraft.due?.trim() || undefined,
    };
    updateProject({ accepted: [...project.accepted, cleaned] });
    setTaskDraft(null);
  }

  function dismiss(id: string) {
    if (!project) return;
    updateProject({ dismissed: [...project.dismissed, id] });
  }

  function toggleAction(id: string) {
    if (!project) return;
    const completed = project.completedActionIds.includes(id);
    updateProject({
      completedActionIds: completed
        ? project.completedActionIds.filter((item) => item !== id)
        : [...project.completedActionIds, id],
    });
  }

  function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newProjectName.trim();
    if (!name) return;

    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "project"}-${Date.now()}`;
    const newProject: Project = {
      id,
      name,
      notes: `${new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      })} — ${name}\n\nStart writing meeting notes, decisions, questions, and follow-ups here.`,
      analysis: null,
      accepted: [],
      dismissed: [],
      completedActionIds: [],
    };

    setProjects((current) => [...current, newProject]);
    setActiveProjectId(id);
    setTab("notes");
    setShowNewProject(false);
    setNewProjectName("");
    setError(null);
  }


  async function shareProject() {
    if (!project) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareLabel("Copied");
      window.setTimeout(() => setShareLabel("Share"), 1400);
    } catch {
      setShareLabel("Copy failed");
      window.setTimeout(() => setShareLabel("Share"), 1400);
    }
  }

  function createExampleProject() {
    const id = `${exampleProject.id}-${Date.now()}`;
    const projectCopy = { ...exampleProject, id };
    setProjects((current) => [...current, projectCopy]);
    setActiveProjectId(id);
    setTab("notes");
    setError(null);
  }
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brandMark">D</span><span>DecisionTrail</span></div>
        <div className="workspaceLabel">Alisha&apos;s workspace</div>
        <nav className="nav" aria-label="Projects">
          {projects.map((item, index) => (
            <button
              key={item.id}
              className={`navItem ${item.id === activeProjectId ? "active" : ""}`}
              onClick={() => selectProject(item.id)}
            >
              <span>{index === 0 ? "⌂" : "◇"}</span> {item.name}
            </button>
          ))}
          <button className="navItem" onClick={() => setShowNewProject(true)}><span>+</span> New project</button>
        </nav>
        <div className="sidebarBottom">
          <div className="principle">AI suggests.<br />Humans decide.</div>
          <div className="tiny">Every extracted item keeps its source.</div>
        </div>
      </aside>

      <section className="content">
        {!project ? (
          <section className="firstRun">
            <div className="firstRunCard">
              <div className="firstRunMark">D</div>
              <div className="eyebrow">WELCOME TO DECISIONTRAIL</div>
              <h1>Turn scattered notes into clear next steps.</h1>
              <p>Create a project to start capturing notes, extracting action items, and building a traceable record of decisions.</p>
              <div className="firstRunActions">
                <button className="primary" onClick={() => setShowNewProject(true)}>Create your first project</button>
                <button onClick={createExampleProject}>Try an example project</button>
              </div>
              <div className="firstRunTrust">AI suggests. You decide what becomes part of the project.</div>
            </div>
          </section>
        ) : (<>
        <header className="topbar">
          <div>
            <div className="eyebrow">PROJECT</div>
            <h1>{project.name}</h1>
          </div>
          <div className="people" aria-label="Collaborators">
            <span>AR</span><span>PS</span><span>AK</span><button type="button" onClick={shareProject}>{shareLabel}</button>
          </div>
        </header>

        <div className="tabs">
          <button className={tab === "notes" ? "selected" : ""} onClick={() => setTab("notes")}>Notes</button>
          <button className={tab === "todo" ? "selected" : ""} onClick={() => setTab("todo")}>To-do <span className="count">{actionItems.length}</span></button>
          <button className={tab === "memory" ? "selected" : ""} onClick={() => setTab("memory")}>Memory <span className="count">{memoryItems.length}</span></button>
        </div>

        {tab === "notes" ? (
          <div className="workgrid">
            <section className="editorPane">
              <div className="editorMeta">
                <span>Meeting notes</span>
                <span>Autosaved locally</span>
              </div>
              <textarea
                aria-label="Project notes"
                value={project.notes}
                onChange={(event) => updateProject({ notes: event.target.value, analysis: null, dismissed: [] })}
                spellCheck="true"
              />
              <div className="editorFooter">
                <span>{project.notes.trim() ? project.notes.trim().split(/\s+/).length : 0} words</span>
                <button className="analyzeButton" onClick={analyze} disabled={loading || !project.notes.trim()}>
                  <span className="spark">✦</span>{loading ? "Analyzing…" : "Find decisions & actions"}
                </button>
              </div>
            </section>

            <aside className="analysisPane">
              <div className="analysisHeader">
                <div>
                  <div className="eyebrow">AI REVIEW</div>
                  <h2>Suggested updates</h2>
                </div>
                {project.analysis && <span className="modeBadge">{project.analysis.mode === "ai" ? "Live AI" : "Demo mode"}</span>}
              </div>

              {!project.analysis && !loading && (
                <div className="emptyState">
                  <div className="emptyIcon">✦</div>
                  <h3>Turn notes into memory</h3>
                  <p>DecisionTrail finds decisions, action items, assumptions, and unanswered questions — with evidence.</p>
                  <div className="trustRow"><span>✓</span><p>Nothing is added until you approve it.</p></div>
                </div>
              )}

              {loading && (
                <div className="loadingState">
                  <div className="pulseLine wide" /><div className="pulseLine" /><div className="pulseCard" /><div className="pulseCard" />
                </div>
              )}

              {error && <div className="errorBox">{error}</div>}

              {project.analysis && !loading && (
                <>
                  <p className="summary">{project.analysis.summary}</p>
                  <div className="suggestions">
                    {pending.map((item) => (
                      <article className="suggestionCard" key={item.id}>
                        <div className="cardTop">
                          <span className={`kind kind-${item.kind}`}><b>{icons[item.kind]}</b>{labels[item.kind]}</span>
                          <span className="confidence">{Math.round(item.confidence * 100)}% confidence</span>
                        </div>
                        <h3>{item.title}</h3>
                        {item.detail && <p className="detail">{item.detail}</p>}
                        {(item.owner || item.due || item.priority) && (
                          <div className="metadata">
                            {item.owner && <span><small>OWNER</small>{item.owner}</span>}
                            {item.due && <span><small>DUE</small>{item.due}</span>}
                            {item.priority && <span><small>PRIORITY</small>{item.priority}</span>}
                          </div>
                        )}
                        <div className="evidence"><span>Source</span><q>{item.evidence}</q></div>
                        <div className="cardActions">
                          <button onClick={() => dismiss(item.id)}>Dismiss</button>
                          <button className="accept" onClick={() => item.kind === "action" ? reviewTask(item) : accept(item)}>{item.kind === "action" ? "Review task" : "Accept"}</button>
                        </div>
                      </article>
                    ))}
                    {pending.length === 0 && (
                      <div className="emptyResolved"><span>✓</span><h3>Review complete</h3><p>Every suggestion has been resolved.</p></div>
                    )}
                  </div>
                </>
              )}
            </aside>
          </div>
        ) : tab === "todo" ? (
          <section className="todoPane">
            <div className="memoryIntro">
              <div className="eyebrow">ACTION ITEMS</div>
              <h2>Your project to-do list</h2>
              <p>Action items you approve from your notes land here. Check them off as you finish them.</p>
            </div>
            {actionItems.length === 0 ? (
              <div className="memoryEmpty"><span>✓</span><h3>No to-dos yet</h3><p>Analyze your notes and add an action item to your to-do list.</p><button onClick={() => setTab("notes")}>Review notes</button></div>
            ) : (
              <div className="todoList">
                {actionItems.map((item) => {
                  const completed = project.completedActionIds.includes(item.id);
                  return (
                    <label key={item.id} className={`todoItem ${completed ? "completed" : ""}`}>
                      <input type="checkbox" checked={completed} onChange={() => toggleAction(item.id)} />
                      <span className="todoCheck" aria-hidden="true">{completed ? "✓" : ""}</span>
                      <span className="todoContent">
                        <strong>{item.title}</strong>
                        <span className="todoMeta">
                          {item.owner && <small>Owner: {item.owner}</small>}
                          {item.due && <small>Due: {item.due}</small>}
                          <small className={`priorityPill priority-${item.priority ?? "medium"}`}>{item.priority ?? "medium"} priority</small>
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <section className="memoryPane">
            <div className="memoryIntro">
              <div className="eyebrow">ORGANIZATIONAL MEMORY</div>
              <h2>What the team has agreed on</h2>
              <p>Accepted items stay connected to the exact notes they came from.</p>
            </div>
            {memoryItems.length === 0 ? (
              <div className="memoryEmpty"><span>◇</span><h3>No accepted items yet</h3><p>Analyze your notes and approve a suggestion to build the project memory.</p><button onClick={() => setTab("notes")}>Review notes</button></div>
            ) : (
              <div className="memoryList">
                {memoryItems.map((item) => (
                  <article key={item.id} className="memoryItem">
                    <div className={`memoryIcon memory-${item.kind}`}>{icons[item.kind]}</div>
                    <div>
                      <div className="memoryKind">{labels[item.kind]}</div>
                      <h3>{item.title}</h3>
                      <p className="sourceLine">From “{project.name} · Meeting notes”</p>
                      <details><summary>Show source evidence</summary><q>{item.evidence}</q></details>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
        </>)}
      </section>

      {taskDraft && (
        <div className="modalBackdrop" role="presentation" onMouseDown={() => setTaskDraft(null)}>
          <div className="modal taskModal" role="dialog" aria-modal="true" aria-labelledby="task-review-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modalIcon">✓</div>
            <h2 id="task-review-title">Review task</h2>
            <p>AI pulled this from your notes. Adjust anything that is missing or wrong before it joins your to-do list.</p>
            <form onSubmit={saveTask}>
              <label htmlFor="task-title">Task</label>
              <input id="task-title" value={taskDraft.title} onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })} />
              <div className="taskFields">
                <div>
                  <label htmlFor="task-owner">Owner</label>
                  <input id="task-owner" value={taskDraft.owner ?? ""} onChange={(event) => setTaskDraft({ ...taskDraft, owner: event.target.value })} placeholder="Unassigned" />
                </div>
                <div>
                  <label htmlFor="task-due">Due</label>
                  <input id="task-due" value={taskDraft.due ?? ""} onChange={(event) => setTaskDraft({ ...taskDraft, due: event.target.value })} placeholder="e.g. Friday" />
                </div>
              </div>
              <label htmlFor="task-priority">Priority</label>
              <select id="task-priority" value={taskDraft.priority ?? "medium"} onChange={(event) => setTaskDraft({ ...taskDraft, priority: event.target.value as TaskPriority })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <div className="taskSource"><small>FROM YOUR NOTES</small><q>{taskDraft.evidence}</q></div>
              <div className="modalActions">
                <button type="button" onClick={() => setTaskDraft(null)}>Cancel</button>
                <button className="primary" type="submit" disabled={!taskDraft.title.trim()}>Add to to-do</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewProject && (
        <div className="modalBackdrop" role="presentation" onMouseDown={() => setShowNewProject(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="new-project-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modalIcon">◇</div>
            <h2 id="new-project-title">Create a new project</h2>
            <p>Give this workspace a focused name. You can start with notes and let the memory grow from there.</p>
            <form onSubmit={createProject}>
              <label htmlFor="project-name">Project name</label>
              <input
                id="project-name"
                autoFocus
                value={newProjectName}
                onChange={(event) => setNewProjectName(event.target.value)}
                placeholder="e.g. Mobile onboarding"
              />
              <div className="modalActions">
                <button type="button" onClick={() => setShowNewProject(false)}>Cancel</button>
                <button className="primary" type="submit" disabled={!newProjectName.trim()}>Create project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
