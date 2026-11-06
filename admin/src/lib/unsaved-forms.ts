const dirtyForms = new Set<symbol>()

export function markUnsavedForm(id: symbol, dirty: boolean) {
  if (dirty) dirtyForms.add(id)
  else dirtyForms.delete(id)
}

export function clearUnsavedForm(id: symbol) {
  dirtyForms.delete(id)
}

export function confirmUnsavedForms() {
  if (!dirtyForms.size) return true
  const confirmed = window.confirm('Bạn có thay đổi chưa lưu. Rời khỏi biểu mẫu sẽ làm mất các thay đổi này.')
  if (confirmed) dirtyForms.clear()
  return confirmed
}
