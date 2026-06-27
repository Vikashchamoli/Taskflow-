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

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2400);
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
          <button class="ghost-button" data-menu="${column.id}" aria-label="${column.title} column menu">...</button>
        </div>
        <div class="task-list" data-dropzone="${column.id}">${cards || emptyState(column.id)}</div>
        <button class="add-inline" data-add-status="${column.id}">+ Add Task</button>
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
        <button class="check ${done ? "done" : ""}" data-toggle-task="${task.id}" aria-label="Toggle ${escapeHtml(task.title)}">${done ? "✓" : ""}</button>
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

function openTaskModal(status = "todo") {
  document.querySelector("#taskStatus").value = status;
  taskModal.showModal();
  window.setTimeout(() => document.querySelector("#taskTitle").focus(), 80);
}

document.querySelector("#addTaskTop").addEventListener("click", () => openTaskModal("todo"));

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
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    if (button.classList.contains("has-toggle")) {
      button.classList.toggle("open");
      const sub = button.dataset.view === "projects" ? "#projectsSub" : "#teamSub";
      document.querySelector(sub).classList.toggle("open");
    }

    const label = button.querySelector("span:nth-child(2)").textContent;
    document.querySelector("#activeViewLabel").textContent = label;
    document.querySelector("#viewSubtitle").textContent = viewSubtitle(button.dataset.view);
    showToast(`${label} opened`);
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
  projectFilter = projectFilter === button.dataset.project ? "" : button.dataset.project;
  personFilter = "";
  renderColumns();
  showToast(projectFilter ? `Filtered by ${projectFilter}` : "Project filter cleared");
});

document.querySelector("#teamSub").addEventListener("click", (event) => {
  const button = event.target.closest("[data-person]");
  if (!button) return;
  personFilter = personFilter === button.dataset.person ? "" : button.dataset.person;
  projectFilter = "";
  renderColumns();
  showToast(personFilter ? `Filtered by ${personFilter}` : "Team filter cleared");
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
    sidebar.classList.remove("open");
  }
});

renderAll();
