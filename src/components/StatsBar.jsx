import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { computeStats } from '../constants'
import './StatsBar.css'

function StatsBar({ taskData, year }) {
  const stats = useMemo(() => computeStats(taskData, year), [taskData, year])
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="stats-bar">
      {[
        { value: stats.totalCompleted, label: 'Tasks Done' },
        { value: stats.totalTasks, label: 'Total Tasks' },
        { value: stats.activeDays, label: 'Active Days' },
        { value: stats.currentStreak, label: 'Current Streak' },
        { value: stats.longestStreak, label: 'Best Streak' },
      ].map((item) => (
        <motion.div key={item.label} className="stat" whileHover={shouldReduceMotion ? undefined : { y: -2 }}>
          <span className="stat-value">{item.value}</span>
          <span className="stat-label">{item.label}</span>
        </motion.div>
      ))}
    </div>
  )
}

export default StatsBar
