import { motion, useReducedMotion } from 'framer-motion'
import './UndoToast.css'

function UndoToast({ message, onUndo, onDismiss }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      className="undo-toast"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
    >
      <span className="toast-message">{message}</span>
      <button className="toast-undo" onClick={onUndo}>Undo</button>
      <button className="toast-close" onClick={onDismiss} aria-label="Dismiss">&times;</button>
    </motion.div>
  )
}

export default UndoToast
