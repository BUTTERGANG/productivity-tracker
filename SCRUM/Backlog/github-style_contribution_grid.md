---
status: backlog
priority: P2
agent_claimed: null
claimed_at: null
updated: 2026-08-20
---

# GitHub-Style Contribution Grid

> **Repo:** productivity-tracker
> **Description:** Year-at-a-glance heatmap grid with color intensity by task count

---

## Context

The signature visual -- a full-year grid showing daily productivity with color intensity.

---

## Acceptance Criteria

- [ ] 365-day grid layout with month and weekday headers
- [ ] Color intensity from 0 to 10+ tasks per day with custom palette
- [ ] Year navigation and current-day highlight
- [ ] Tooltip on hover showing date and task count summary

---

## Technical Notes

- Pure CSS grid layout; SVG for optimal rendering; localStorage for year offset
