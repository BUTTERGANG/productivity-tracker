---
status: backlog
priority: P2
agent_claimed: null
claimed_at: null
updated: 2026-08-20
---

# Streak Tracking and Achievements

> **Repo:** productivity-tracker
> **Description:** Current streak, longest streak, and milestone badges

---

## Context

Gamification to keep users coming back daily. Track current streak, all-time longest streak, and award badges at milestones.

---

## Acceptance Criteria

- [ ] Current streak counter with freeze protection (1 skip day)
- [ ] Longest streak record with date range display
- [ ] Milestone badges at 7/14/30/60/90/180/365 days
- [ ] Shareable streak card for social media or iMessage

---

## Technical Notes

- Streak calculation in SQL window functions; badge generation with canvas; share sheet API
