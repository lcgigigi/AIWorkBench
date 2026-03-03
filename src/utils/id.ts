export function uid(prefix = 'id') {
  const rnd = Math.random().toString(16).slice(2)
  return `${prefix}_${Date.now().toString(16)}_${rnd}`
}

