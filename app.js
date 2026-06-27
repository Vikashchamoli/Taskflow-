const columns = [
  { id: "todo", title: "To Do" },
  { id: "progress", title: "In Progress" },
  { id: "done", title: "Completed" }
];

let tasks = [
  { id: crypto.randomUUID(), title: "Finalize Client Pitch", status: "todo", priority: "High", project: "Client", person: "Alex", due: "today" },
  { id: crypto.randomUUID(), title: "Design UI Mockups", status: "todo", priority: "Medium", project: "LaunchX", person: "Maya", due: "tomorrow" },
  { id: crypto.randomUUID(), title: "API Integration", status: "progress", priority: "High", project: "LaunchX", person: "Nora", due: "today" },
  { id: crypto.randomUUID(), title: "Content Strategy Review", status: "progress", priority: "Medium", project: "Content", person: "Alex", due: "week" },
  { id: crypto.randomUUID(), title: "Launch Blog", status: "done", priority: "Low", project: "Content", person: "Maya", due: "today" },
  { id: crypto.randomUUID(), title: "Team Sync", status: "done", priority: "Low", project: "LaunchX", person: "Alex", due: "today" }
];

const weekly = [
  { day: "Sun", done: 29, progress: 12 },
  { day: "Mon", done: 47, progress: 33 },
  { day: "Tue", done: 43, progress: 29 },
  { day: "Wed", done: 35, progress: 26 },
  { day: "Thu", done: 64, progress: 32 },
  { day: "Fri", done: 54, progress: 30 },
  { day: "Sat", done: 35, progress: 27 }
];

const notifications = [
  { title: "Meeting starts at 2 PM", meta: "Calendar reminder" },
  { title: "Nora mentioned you in API Integration", meta: "Project LaunchX" },
  { title: "Proposal draft is ready", meta: "Client Pitch" }
];

const activity = [
  { who: "Alex and 2 new members", text: "Finalized Client Pitch.", time: "2 hours ago", avatar: "AJ" },
  { who: "Content", text: "Strategy Review | Blog.", time: "5 hours ago", avatar: "CT" },
  { who: "Alex and LaunchX", text: "Updated Project Milestones.", time: "1 day ago", avatar: "LX" }
];

let filter = "all";
let searchTerm = "";
let projectFilter = "";
let personFilter = "";

const columnsEl = document.querySelector("#columns");
const barChart = document.querySelector("#barChart");
const activityList = document.querySelector("#activityList");
const taskModal = document.querySelector("#taskModal");
const taskForm = document.querySelector("#taskForm");
const toast = document.querySelector("#toast");
const notificationDrawer = document.querySelector("#notificationDrawer");
const profileMenu = document.querySelector("#profileMenu");
const sidebar = document.querySelector("#sidebar");
const sceneCanvas = document.querySelector("#sceneCanvas");
const createButton = document.querySelector("#createButton");
const createMenu = document.querySelector("#createMenu");
const copilotButton = document.querySelector("#copilotButton");
const copilotPanel = document.querySelector("#copilotPanel");
const noteModal = document.querySelector("#noteModal");
const noteForm = document.querySelector("#noteForm");
const notes = [];

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function closeCreateMenu() {
  createMenu.classList.remove("open");
  createMenu.setAttribute("aria-hidden", "true");
  createButton.setAttribute("aria-expanded", "false");
}

function openCopilotPanel(mode = "automation") {
  const title = mode === "workflow" ? "Workflow builder" : "Copilot automation";
  const status = mode === "workflow"
    ? "Describe a workflow and Copilot will break it into tasks"
    : "Ready to plan your next workflow";

  document.querySelector("#copilotTitle").textContent = title;
  document.querySelector("#copilotStatus").textContent = status;
  copilotPanel.classList.add("open");
  copilotPanel.setAttribute("aria-hidden", "false");
  window.setTimeout(() => document.querySelector("#copilotPrompt").focus(), 120);
}

function closeCopilotPanel() {
  copilotPanel.classList.remove("open");
  copilotPanel.setAttribute("aria-hidden", "true");
}

function visibleTasks() {
  return tasks.filter((task) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch = !q || [task.title, task.project, task.person, task.priority].some((value) => value.toLowerCase().includes(q));
    const matchesFilter = filter === "all" || task.priority.toLowerCase() === filter || task.due === filter;
    const matchesProject = !projectFilter || task.project === projectFilter;
    const matchesPerson = !personFilter || task.person === personFilter;
    return matchesSearch && matchesFilter && matchesProject && matchesPerson;
  });
}

function renderColumns() {
  const currentTasks = visibleTasks();
  columnsEl.innerHTML = columns.map((column) => {
    const cards = currentTasks
      .filter((task) => task.status === column.id)
      .map(taskTemplate)
      .join("");

    return `
      <section class="task-column ${column.id}" data-column="${column.id}">
        <div class="column-title">
          <span>${column.title}</span>
          <button class="ghost-button" type="button" data-menu="${column.id}" aria-label="${column.title} column menu">...</button>
        </div>
        <div class="task-list" data-dropzone="${column.id}">${cards || emptyState(column.id)}</div>
        <button class="add-inline" type="button" data-add-status="${column.id}">+ Add Task</button>
      </section>
    `;
  }).join("");

  document.querySelectorAll(".task-card").forEach((card) => {
    card.addEventListener("dragstart", () => card.classList.add("dragging"));
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
  });
}

function taskTemplate(task) {
  const done = task.status === "done";
  return `
    <article class="task-card" draggable="true" data-task-id="${task.id}">
      <div class="task-title">${escapeHtml(task.title)}</div>
      <div class="task-meta">
        <button class="check ${done ? "done" : ""}" type="button" data-toggle-task="${task.id}" aria-label="Toggle ${escapeHtml(task.title)}"></button>
        <span class="priority ${task.priority}">${task.priority}</span>
        <span class="mini-avatar">${initials(task.person)}</span>
      </div>
    </article>
  `;
}

function emptyState(status) {
  return `<div class="task-card empty" data-empty="${status}">No matching tasks</div>`;
}

function initials(name) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function renderCharts() {
  barChart.innerHTML = weekly.map((item) => {
    const total = item.done + item.progress;
    return `
      <div class="bar" title="${item.day}: ${item.done} completed, ${item.progress} in progress">
        <div class="bar-fill" style="height:${total}%">
          <div class="bar-completed" style="height:${(item.done / total) * 100}%"></div>
        </div>
        <span class="bar-label">${item.day}</span>
      </div>
    `;
  }).join("");

  const completed = tasks.filter((task) => task.status === "done").length;
  const completion = Math.round((completed / Math.max(tasks.length, 1)) * 100);
  document.querySelector("#completionText").textContent = `${completion}%`;
  document.querySelector("#donutChart").style.background = `conic-gradient(var(--teal) 0 ${completion}%, #3837bd ${completion}% 86%, #ff643b 86% 100%)`;
}

function renderActivity() {
  const dynamicActivity = [
    ...activity,
    { who: "Task Board", text: `${tasks.length} tasks tracked across ${columns.length} stages.`, time: "just now", avatar: "TB" }
  ];
  activityList.innerHTML = dynamicActivity.map((item) => `
    <div class="activity-item">
      <span class="avatar">${item.avatar}</span>
      <span class="activity-copy">
        <strong>${escapeHtml(item.who)} ${escapeHtml(item.text)}</strong>
        <small>${item.time}</small>
      </span>
    </div>
  `).join("");
}

function renderNotifications() {
  document.querySelector("#notificationBadge").textContent = notifications.length;
  document.querySelector("#notificationBadge").style.display = notifications.length ? "grid" : "none";
  document.querySelector("#notificationList").innerHTML = notifications.map((item) => `
    <div class="notification-row">
      <strong>${escapeHtml(item.title)}</strong>
      <small>${escapeHtml(item.meta)}</small>
    </div>
  `).join("") || `<div class="notification-row"><strong>All caught up</strong><small>No unread notifications</small></div>`;
}

function renderAll() {
  renderColumns();
  renderCharts();
  renderActivity();
  renderNotifications();
}

function setView(button) {
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");

  const label = button.querySelector("span:nth-child(2)").textContent;
  document.querySelector("#activeViewLabel").textContent = label;
  document.querySelector("#viewSubtitle").textContent = viewSubtitle(button.dataset.view);
  showToast(`${label} opened`);
}

function setSubmenu(menuName, isOpen = true) {
  const isProjects = menuName === "projects";
  const navButton = document.querySelector(`[data-view="${menuName}"]`);
  const subList = document.querySelector(isProjects ? "#projectsSub" : "#teamSub");
  const otherButton = document.querySelector(`[data-view="${isProjects ? "team" : "projects"}"]`);
  const otherSubList = document.querySelector(isProjects ? "#teamSub" : "#projectsSub");

  navButton.classList.toggle("open", isOpen);
  subList.classList.toggle("open", isOpen);
  otherButton.classList.remove("open");
  otherSubList.classList.remove("open");
}

function closeSubmenus() {
  document.querySelectorAll(".nav-item.has-toggle").forEach((button) => button.classList.remove("open"));
  document.querySelectorAll(".sub-list").forEach((list) => list.classList.remove("open"));
}

function setSubSelection(listSelector, value, attr) {
  document.querySelectorAll(`${listSelector} button`).forEach((button) => {
    button.classList.toggle("active", button.dataset[attr] === value);
  });
}

function openTaskModal(status = "todo") {
  document.querySelector("#taskStatus").value = status;
  taskModal.showModal();
  window.setTimeout(() => document.querySelector("#taskTitle").focus(), 80);
}

document.querySelector("#addTaskTop").addEventListener("click", () => openTaskModal("todo"));

copilotButton.addEventListener("click", () => {
  closeCreateMenu();
  openCopilotPanel("automation");
});

createButton.addEventListener("click", (event) => {
  event.stopPropagation();
  const isOpen = createMenu.classList.toggle("open");
  createMenu.setAttribute("aria-hidden", String(!isOpen));
  createButton.setAttribute("aria-expanded", String(isOpen));
});

createMenu.addEventListener("click", (event) => {
  const action = event.target.closest("[data-create-action]")?.dataset.createAction;
  if (!action) return;
  closeCreateMenu();

  if (action === "quick") {
    openTaskModal("todo");
    showToast("Quick capture opened");
  }

  if (action === "note") {
    noteModal.showModal();
    window.setTimeout(() => document.querySelector("#noteTitle").focus(), 80);
  }

  if (action === "workflow") {
    openCopilotPanel("workflow");
  }

  if (action === "copilot") {
    openCopilotPanel("automation");
  }
});

document.querySelector("#searchInput").addEventListener("input", (event) => {
  searchTerm = event.target.value;
  renderColumns();
});

document.querySelectorAll(".segmented button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".segmented button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    filter = button.dataset.filter;
    renderColumns();
    showToast(`Showing ${filter === "all" ? "all tasks" : filter + " tasks"}`);
  });
});

columnsEl.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-status]");
  const toggleButton = event.target.closest("[data-toggle-task]");
  const menuButton = event.target.closest("[data-menu]");

  if (addButton) openTaskModal(addButton.dataset.addStatus);

  if (toggleButton) {
    const task = tasks.find((item) => item.id === toggleButton.dataset.toggleTask);
    task.status = task.status === "done" ? "todo" : "done";
    renderAll();
    showToast(`${task.title} moved to ${task.status === "done" ? "Completed" : "To Do"}`);
  }

  if (menuButton) showToast(`${menuButton.dataset.menu} options opened`);
});

columnsEl.addEventListener("dragover", (event) => {
  event.preventDefault();
});

columnsEl.addEventListener("drop", (event) => {
  const dropzone = event.target.closest("[data-dropzone]");
  const dragging = document.querySelector(".task-card.dragging");
  if (!dropzone || !dragging) return;
  const task = tasks.find((item) => item.id === dragging.dataset.taskId);
  task.status = dropzone.dataset.dropzone;
  renderAll();
  showToast(`${task.title} moved to ${columns.find((column) => column.id === task.status).title}`);
});

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = document.querySelector("#taskTitle").value.trim();
  if (!title) return;

  tasks.unshift({
    id: crypto.randomUUID(),
    title,
    status: document.querySelector("#taskStatus").value,
    priority: document.querySelector("#taskPriority").value,
    project: document.querySelector("#taskProject").value.trim() || "General",
    person: "Alex",
    due: "today"
  });

  taskForm.reset();
  taskModal.close();
  renderAll();
  showToast("Task created");
});

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    const isToggle = button.classList.contains("has-toggle");
    const shouldOpen = isToggle ? !button.classList.contains("open") : false;
    setView(button);
    if (isToggle) {
      setSubmenu(button.dataset.view, shouldOpen);
    } else {
      closeSubmenus();
    }
  });
});

function viewSubtitle(view) {
  const copy = {
    dashboard: "Here is your day.",
    tasks: "All your active work is ready to scan.",
    calendar: "Meetings and milestones are lined up.",
    projects: "Project filters are active.",
    reminders: "Nothing important slips past today.",
    team: "Team activity is front and center.",
    reports: "Progress and completion data are updated.",
    settings: "Your workspace preferences are ready."
  };
  return copy[view] || copy.dashboard;
}

document.querySelector("#projectsSub").addEventListener("click", (event) => {
  const button = event.target.closest("[data-project]");
  if (!button) return;
  projectFilter = button.dataset.project;
  personFilter = "";
  setSubSelection("#projectsSub", projectFilter, "project");
  setSubSelection("#teamSub", "", "person");
  setView(document.querySelector('[data-view="projects"]'));
  setSubmenu("projects", true);
  renderColumns();
  showToast(projectFilter ? `Filtered by ${projectFilter}` : "Showing all projects");
});

document.querySelector("#teamSub").addEventListener("click", (event) => {
  const button = event.target.closest("[data-person]");
  if (!button) return;
  personFilter = button.dataset.person;
  projectFilter = "";
  setSubSelection("#teamSub", personFilter, "person");
  setSubSelection("#projectsSub", "", "project");
  setView(document.querySelector('[data-view="team"]'));
  setSubmenu("team", true);
  renderColumns();
  showToast(personFilter ? `Filtered by ${personFilter}` : "Showing all members");
});

document.querySelectorAll(".reminder-item").forEach((item) => {
  item.addEventListener("click", () => showToast(`${item.dataset.reminder} added to focus list`));
});

document.querySelectorAll("[data-menu]").forEach((button) => {
  button.addEventListener("click", () => showToast(`${button.dataset.menu} menu opened`));
});

document.querySelector("#notificationButton").addEventListener("click", () => {
  notificationDrawer.classList.add("open");
  notificationDrawer.setAttribute("aria-hidden", "false");
});

document.querySelector("#closeNotifications").addEventListener("click", () => {
  notificationDrawer.classList.remove("open");
  notificationDrawer.setAttribute("aria-hidden", "true");
});

document.querySelector("#closeCopilot").addEventListener("click", closeCopilotPanel);

copilotPanel.addEventListener("click", (event) => {
  if (event.target === copilotPanel) closeCopilotPanel();
});

notificationDrawer.addEventListener("click", (event) => {
  if (event.target === notificationDrawer) {
    notificationDrawer.classList.remove("open");
    notificationDrawer.setAttribute("aria-hidden", "true");
  }
});

document.querySelector("#clearNotifications").addEventListener("click", () => {
  notifications.length = 0;
  renderNotifications();
  showToast("Notifications marked as read");
});

document.querySelector("#closeTaskModal").addEventListener("click", () => taskModal.close());
document.querySelector("#cancelTask").addEventListener("click", () => taskModal.close());
document.querySelector("#closeNoteModal").addEventListener("click", () => noteModal.close());
document.querySelector("#cancelNote").addEventListener("click", () => noteModal.close());

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = document.querySelector("#noteTitle").value.trim();
  const body = document.querySelector("#noteBody").value.trim();
  if (!title) return;

  notes.unshift({ title, body, createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) });
  noteForm.reset();
  noteModal.close();
  showToast(`Note saved: ${title}`);
});

document.querySelector("#suggestWorkflow").addEventListener("click", () => {
  document.querySelector("#copilotPrompt").value = "Create follow-up tasks for high priority work, remind the team tomorrow, and summarize project risks.";
  document.querySelector("#copilotStatus").textContent = "Suggested workflow is ready to review";
  showToast("Workflow suggestion added");
});

document.querySelector("#runAutomation").addEventListener("click", () => {
  const prompt = document.querySelector("#copilotPrompt").value.trim();
  if (!prompt) {
    showToast("Add a workflow request first");
    return;
  }

  tasks.unshift({
    id: crypto.randomUUID(),
    title: "Review Copilot automation plan",
    status: "todo",
    priority: "High",
    project: "LaunchX",
    person: "Alex",
    due: "today"
  });
  document.querySelector("#copilotStatus").textContent = "Automation plan created and added to tasks";
  renderAll();
  showToast("Automation plan added to task board");
});

function toggleProfileMenu() {
  profileMenu.classList.toggle("open");
  profileMenu.setAttribute("aria-hidden", String(!profileMenu.classList.contains("open")));
}

document.querySelector("#avatarButton").addEventListener("click", toggleProfileMenu);
document.querySelector("#profileButton").addEventListener("click", toggleProfileMenu);

profileMenu.addEventListener("click", (event) => {
  const action = event.target.closest("[data-profile-action]")?.dataset.profileAction;
  if (!action) return;
  if (action === "theme") {
    sidebar.classList.toggle("dark");
    showToast("Sidebar theme toggled");
  } else if (action === "status") {
    document.querySelector("#greeting").textContent = "Focus Mode, Alex";
    showToast("Focus status set");
  } else {
    showToast("Demo sign out clicked");
  }
  profileMenu.classList.remove("open");
});

document.querySelector("#openSidebar").addEventListener("click", () => sidebar.classList.add("open"));
document.querySelector("#closeSidebar").addEventListener("click", () => sidebar.classList.remove("open"));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    profileMenu.classList.remove("open");
    notificationDrawer.classList.remove("open");
    closeCopilotPanel();
    closeCreateMenu();
    sidebar.classList.remove("open");
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".create-wrap")) closeCreateMenu();
});

function setupScene() {
  if (!sceneCanvas) return;
  const context = sceneCanvas.getContext("2d");
  const shapes = Array.from({ length: 18 }, (_, index) => ({
    x: (index * 97) % 1000,
    y: 42 + ((index * 71) % 260),
    z: 0.55 + ((index % 5) * 0.13),
    size: 20 + ((index * 11) % 34),
    color: ["#2869ff", "#05a99d", "#ff7b3b", "#8c56d7"][index % 4],
    speed: 0.18 + (index % 4) * 0.05
  }));

  function resize() {
    const box = sceneCanvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    sceneCanvas.width = Math.max(1, Math.floor(box.width * ratio));
    sceneCanvas.height = Math.max(1, Math.floor(box.height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function drawCube(x, y, size, color) {
    const depth = size * 0.48;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + size, y + depth);
    context.lineTo(x, y + depth * 2);
    context.lineTo(x - size, y + depth);
    context.closePath();
    context.fillStyle = color;
    context.globalAlpha = 0.22;
    context.fill();

    context.beginPath();
    context.moveTo(x - size, y + depth);
    context.lineTo(x, y + depth * 2);
    context.lineTo(x, y + depth * 3.15);
    context.lineTo(x - size, y + depth * 2.15);
    context.closePath();
    context.fillStyle = "#12326d";
    context.globalAlpha = 0.12;
    context.fill();

    context.beginPath();
    context.moveTo(x + size, y + depth);
    context.lineTo(x, y + depth * 2);
    context.lineTo(x, y + depth * 3.15);
    context.lineTo(x + size, y + depth * 2.15);
    context.closePath();
    context.fillStyle = color;
    context.globalAlpha = 0.16;
    context.fill();
    context.globalAlpha = 1;
  }

  function frame(time) {
    const width = sceneCanvas.clientWidth;
    const height = sceneCanvas.clientHeight;
    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(width * 0.06, 0);

    shapes.forEach((shape, index) => {
      const float = Math.sin(time * 0.001 * shape.speed + index) * 9;
      const x = (shape.x % Math.max(width, 1)) + Math.sin(time * 0.0002 + index) * 18;
      const y = shape.y * shape.z + float;
      drawCube(x, y, shape.size * shape.z, shape.color);
    });

    context.restore();
    window.requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize);
  window.requestAnimationFrame(frame);
}

setSubSelection("#projectsSub", "", "project");
setSubSelection("#teamSub", "", "person");
setupScene();
renderAll();
