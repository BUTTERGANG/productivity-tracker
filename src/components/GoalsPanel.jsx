import { useMemo } from 'react'
import { ACHIEVEMENTS, checkAchievements } from '../constants'
import './GoalsPanel.css'

function GoalsPanel({ taskData }) {
  const unlocked = useMemo(() => checkAchievements(taskData), [taskData])

  return (
    <div className="goals-panel">
      <h2 className="goals-title">Goals & Achievements</h2>
      <p className="goals-subtitle">{unlocked.size} / {ACHIEVEMENTS.length} unlocked</p>

      <div className="achievements-grid">
        {ACHIEVEMENTS.map(achievement => {
          const earned = unlocked.has(achievement.id)
          return (
            <div key={achievement.id} className={`achievement ${earned ? 'earned' : 'locked'}`}>
              <div className="achievement-icon">{achievement.icon}</div>
              <div className="achievement-info">
                <div className="achievement-title">{achievement.title}</div>
                <div className="achievement-desc">{achievement.desc}</div>
              </div>
              {earned && <div className="achievement-check">✓</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default GoalsPanel
