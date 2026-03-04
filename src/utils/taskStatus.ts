import type { TaskStatus } from '../api/types'

export function getTaskStatusText(status?: TaskStatus | string | null) {
  if (!status) return '—'
  switch (status) {
    case 'draft':
      return '草稿'
    case 'ready_to_submit':
      return '待确认'
    case 'submitted':
      return '已提交'
    case 'in_progress':
      return '处理中'
    case 'done':
      return '已完成'
    case 'failed':
      return '失败'
    default:
      return status
  }
}
