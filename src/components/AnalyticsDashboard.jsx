import { useMemo } from 'react'
import { useTheme } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, CartesianGrid } from 'recharts'
import { CATEGORIES, computeStats, formatDate } from '../constants'
import './AnalyticsDashboard.css'

function getWeeklyData(taskData, year) {
  const weeks = []
  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year, 11, 31)
  const startPad = (yearStart.getDay() + 6) % 7
  const d = new Date(yearStart)
  d.setDate(d.getDate() - startPad)

  while (d <= yearEnd) {
    const week = { total: 0, completed: 0 }
    for (let i = 0; i < 7; i++) {
      if (d.getFullYear() === year) {
        const tasks = taskData[formatDate(d)] || []
        week.total += tasks.length
        week.completed += tasks.filter(t => t.completed).length
      }
      d.setDate(d.getDate() + 1)
    }
    weeks.push(week)
  }

  return weeks.map((week, index) => {
    const rate = week.total > 0 ? week.completed / week.total : -1
    let fill = '#9ca3af'
    if (rate < 0) fill = '#21262d'
    else if (rate === 0) fill = 'var(--heatmap-1)'
    else if (rate < 0.5) fill = 'var(--heatmap-2)'
    else if (rate < 1) fill = 'var(--heatmap-3)'
    else fill = 'var(--heatmap-4)'
    return { ...week, index, rate, fill }
  })
}

function WeeklyChart({ weeks }) {
  const theme = useTheme()

  return (
    <div className="weekly-chart">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={weeks} margin={{ top: 6, right: 12, left: -18, bottom: 10 }}>
          <CartesianGrid stroke={theme.palette.divider} vertical={false} strokeDasharray="4 4" />
          <XAxis dataKey="index" tick={false} axisLine={false} />
          <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: theme.palette.action.hover }}
            contentStyle={{
              background: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 8,
              color: theme.palette.text.primary,
              fontSize: 12,
            }}
            formatter={(value, name, props) => {
              if (name === 'total') return [value, 'Tasks']
              return [value, name]
            }}
            labelFormatter={(label, payload) => {
              const week = payload?.[0]?.payload
              if (!week) return `Week ${label + 1}`
              const pct = week.total > 0 ? Math.round((week.completed / week.total) * 100) : 0
              return `Week ${label + 1} · ${pct}% complete`
            }}
          />
          <Bar dataKey="total" radius={[4, 4, 0, 0]}>
            {weeks.map((entry) => (
              <Cell key={`cell-${entry.index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function DonutChart({ categoryTotals }) {
  const theme = useTheme()
  const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0)
  if (total === 0) return <p className="no-data">No task data yet</p>

  const slices = Object.entries(CATEGORIES)
    .map(([key, cat]) => ({ key, label: cat.label, color: cat.color, value: categoryTotals[key] || 0 }))
    .filter(s => s.value > 0)

  return (
    <div className="donut-container">
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie data={slices} dataKey="value" nameKey="label" innerRadius={52} outerRadius={80} paddingAngle={2}>
            {slices.map(slice => (
              <Cell key={slice.key} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 8,
              color: theme.palette.text.primary,
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="donut-legend">
        {slices.map(s => (
          <div key={s.key} className="donut-legend-item">
            <span className="donut-dot" style={{ background: s.color }} />
            <span className="donut-legend-label">{s.label}</span>
            <span className="donut-count">{s.value}</span>
          </div>
        ))}
        <div className="donut-total">{total} total</div>
      </div>
    </div>
  )
}

function DayOfWeekChart({ taskData, year }) {
  const theme = useTheme()
  const dayData = useMemo(() => {
    const days = Array(7).fill(null).map((_, idx) => ({ day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx], total: 0, completed: 0 }))
    Object.entries(taskData).forEach(([dateStr, tasks]) => {
      if (!dateStr.startsWith(String(year)) || !tasks?.length) return
      const idx = (new Date(dateStr + 'T12:00:00').getDay() + 6) % 7
      days[idx].total += tasks.length
      days[idx].completed += tasks.filter(t => t.completed).length
    })
    return days.map(d => ({ ...d, pct: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0 }))
  }, [taskData, year])

  return (
    <div className="dow-chart">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={dayData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={theme.palette.divider} horizontal={false} strokeDasharray="4 4" />
          <XAxis type="number" hide />
          <YAxis dataKey="day" type="category" tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            contentStyle={{
              background: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 8,
              color: theme.palette.text.primary,
              fontSize: 12,
            }}
            formatter={(value, name) => {
              if (name === 'total') return [value, 'Tasks']
              if (name === 'pct') return [`${value}%`, 'Completion']
              return [value, name]
            }}
          />
          <Bar dataKey="total" fill={theme.palette.primary.main} radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function AnalyticsDashboard({ taskData, year }) {
  const stats = useMemo(() => computeStats(taskData, year), [taskData, year])
  const weeks = useMemo(() => getWeeklyData(taskData, year), [taskData, year])
  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.totalCompleted / stats.totalTasks) * 100)
    : 0

  return (
    <div className="analytics-dashboard">
      <h2 className="analytics-title">Analytics — {year}</h2>

      <div className="analytics-summary">
        {[
          { value: `${completionRate}%`, label: 'Completion Rate' },
          { value: stats.totalCompleted,  label: 'Tasks Done' },
          { value: stats.activeDays,      label: 'Active Days' },
          { value: stats.longestStreak,   label: 'Best Streak' },
        ].map(({ value, label }) => (
          <div key={label} className="analytics-stat">
            <span className="analytics-stat-value">{value}</span>
            <span className="analytics-stat-label">{label}</span>
          </div>
        ))}
      </div>

      <div className="analytics-section">
        <h3>Weekly Activity</h3>
        <p className="analytics-hint">Bar height = tasks added · Color = completion rate</p>
        <WeeklyChart weeks={weeks} />
      </div>

      <div className="analytics-row">
        <div className="analytics-section half">
          <h3>Tasks by Category</h3>
          <DonutChart categoryTotals={stats.categoryTotals} />
        </div>
        <div className="analytics-section half">
          <h3>Productivity by Day of Week</h3>
          <DayOfWeekChart taskData={taskData} year={year} />
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard
