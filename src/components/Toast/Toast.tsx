import { useEffect } from 'react'
import styles from './Toast.module.css'

interface ToastProps {
  message: string
  variant?: 'warning' | 'error' | 'default'
  onDismiss: () => void
  duration?: number
}

export function Toast({ message, variant = 'default', onDismiss, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [message, onDismiss, duration])

  return (
    <div
      className={`${styles.toast} ${variant === 'warning' ? styles.warning : ''} ${variant === 'error' ? styles.error : ''}`}
      role="alert"
      aria-live="polite"
    >
      <span>{message}</span>
      <button className={styles.dismiss} onClick={onDismiss} aria-label="Cerrar">
        ×
      </button>
    </div>
  )
}
