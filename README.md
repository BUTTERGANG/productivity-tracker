# 365 Day Productivity Tracker

A GitHub-style contribution grid for personal productivity. Track daily tasks, build streaks, and visualize your year at a glance.

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

```bash
npm run build   # production build → dist/
npm run preview # preview the production build locally
```

---

## Features

### Grid View
- **GitHub-style heatmap** — 365 dots laid out as 52 weeks × 7 days
- **Color scale** — dot color reflects daily completion level:
  | Color | Meaning |
  |-------|---------|
  | Dark  | No tasks |
  | Orange | Tasks added, none completed |
  | Yellow | 1–2 tasks completed |
  | Green | 3–4 tasks completed |
  | Bright green | 5+ tasks completed |
- **Click** any dot to open that day's task panel
- **Drag** across dots to bulk-select multiple days
- **Year navigation** — browse past years with ‹ › controls
- **Category filter** — filter the grid to show only one category's tasks

### Task Panel
- Add tasks to any day with a name and category
- **Inline editing** — double-click a task name (or click ✎) to rename; Enter to save, Escape to cancel
- **Recurring tasks** — check "Repeat weekly for rest of year" to add the task to every same weekday through Dec 31
- **Day notes** — free-text scratchpad per day for context, blockers, or reflections
- **Undo delete** — a toast appears for 5 seconds after deletion with an Undo button

### Bulk Add (Drag-select)
- Click and drag across grid cells to select multiple days
- A bulk-add panel opens: enter a task name + category → added to all selected days

### Search
- Search bar in the toolbar (or press **⌘K** / **Ctrl+K** to focus)
- Searches task names across all days in real time
- Results show date, category color dot, and highlighted match text
- Click any result to open that day's panel

### Analytics
- **Weekly activity chart** — bar chart of all 52 weeks; bar height = task volume, color = completion rate (Recharts)
- **Category breakdown** — donut chart showing task distribution across categories
- **Day-of-week productivity** — horizontal bar chart showing which weekdays you're most productive

### Themes
- **Light + Dark mode** — toggle in the header, preference persists via localStorage

### Goals & Achievements
12 unlockable badges tracked automatically:

| Badge | Criteria |
|-------|----------|
| 🌱 First Steps | Add your first task |
| ✅ Done! | Complete your first task |
| 🔥 On a Roll | 3-day completion streak |
| ⚡ Week Warrior | 7-day completion streak |
| 💪 Monthly Master | 30-day completion streak |
| ⭐ Getting Started | Complete 10 tasks |
| 🏆 Productivity Pro | Complete 50 tasks |
| 💯 Century Club | Complete 100 tasks |
| 📅 Regular | Active on 7 different days |
| 🗓 Consistent | Active on 30 different days |
| 🎯 Dedicated | Active on 100 different days |
| ✨ Perfect Day | Complete all tasks in a day (3+ tasks) |

### Export & Import
- **Export** — downloads a `.json` file containing all tasks and notes (`↓ Export` button, top right)
- **Import** — restores from a previously exported file (`↑ Import` button); replaces all current data after confirmation

### Mobile Layout
On screens narrower than 640px, the grid switches to a **month calendar view** with large tappable cells. Navigate months with ‹ › and see task counts per day.

---

## Task Categories

| Category | Color |
|----------|-------|
| Work | Blue `#58a6ff` |
| Personal | Purple `#bc8cff` |
| Health | Green `#3fb950` |
| Learning | Orange `#f78166` |
| Other | Gray `#8b949e` |

## Theme Customization

Update `src/theme.js` to tweak the palette, typography, and component overrides. Heatmap colors are exposed as CSS variables (`--heatmap-0` through `--heatmap-4`) so you can align grid colors with the active theme.

---

## Data Storage

All data is stored in **browser localStorage** — no account or server required.

| Key | Contents |
|-----|----------|
| `productivity-tracker-data` | Tasks for every day |
| `productivity-tracker-notes` | Day notes |

> **Tip:** Use Export regularly to back up your data. localStorage can be cleared when browser data is wiped.

---

## Project Structure

```
src/
├── App.jsx                  # Root component, global state
├── App.css
├── constants.js             # Categories, achievements, shared utilities
├── theme.js                 # MUI theme factory
├── hooks/
│   ├── useTaskData.js       # Task CRUD + localStorage persistence
│   └── useNoteData.js       # Per-day notes persistence
└── components/
    ├── ContributionGrid     # Desktop year heatmap (drag-select)
    ├── MonthGrid            # Mobile month calendar
    ├── TaskPanel            # Day task panel (add/edit/delete/notes)
    ├── StatsBar             # Top stats (tasks done, streaks, etc.)
    ├── YearNav              # Year ‹ › navigation
    ├── CategoryFilter       # Category chip filter
    ├── SearchBar            # Cross-day task search (⌘K)
    ├── AnalyticsDashboard   # Recharts analytics (weekly, donut, day-of-week)
    ├── GoalsPanel           # Achievement badges
    └── UndoToast            # 5-second undo-delete toast
```

---

## Tech Stack

- [React 18](https://react.dev/) — UI
- [Vite](https://vitejs.dev/) — build tool & dev server
- [MUI](https://mui.com/) — design system + theming
- [Recharts](https://recharts.org/) — analytics charts
- [Framer Motion](https://www.framer.com/motion/) — micro-interactions
- Vanilla CSS — component styling
- localStorage — persistence
