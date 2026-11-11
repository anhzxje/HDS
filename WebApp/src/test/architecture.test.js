import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name)
    if (entry.isDirectory()) return entry.name === 'test' ? [] : sourceFiles(filename)
    return /\.[jt]sx?$/.test(entry.name) && !entry.name.includes('.test.') ? [filename] : []
  })
}
function dependencies(filename) {
  return [...readFileSync(filename, 'utf8').matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*)['"]([^'"]+)['"]/g)]
    .map(([, specifier]) => specifier.startsWith('@/') ? path.join(src, specifier.slice(2)) :
      specifier.startsWith('.') ? path.resolve(path.dirname(filename), specifier) : null)
    .filter(Boolean)
}

it('places each business feature and its layers under a single owner', () => {
  for (const feature of ['products', 'saleouts']) {
    for (const layer of ['components', 'hooks', 'api', 'utils']) {
      expect(existsSync(path.join(src, 'features', feature, layer)), `${feature}/${layer}`).toBe(true)
    }
  }
})

it('keeps shared independent of app/features and features independent of app', () => {
  const violations = []
  for (const filename of sourceFiles(src)) {
    const owner = path.relative(src, filename).split(path.sep)[0]
    for (const dependency of dependencies(filename)) {
      const target = path.relative(src, dependency).split(path.sep)[0]
      if ((owner === 'shared' && ['app', 'features'].includes(target)) || (owner === 'features' && target === 'app')) {
        violations.push(`${path.relative(src, filename)} -> ${path.relative(src, dependency)}`)
      }
    }
  }
  expect(violations).toEqual([])
})

it('keeps UI away from API services and confines cross-feature reads to the public product choices API', () => {
  const violations = []
  for (const filename of sourceFiles(src).filter(file => file.includes(`${path.sep}features${path.sep}`))) {
    const relative = path.relative(src, filename).split(path.sep)
    for (const dependency of dependencies(filename)) {
      const target = path.relative(src, dependency).split(path.sep)
      if (relative[2] === 'components' && target.includes('api')) violations.push(path.relative(src, filename))
      if (target[0] === 'features' && target[1] !== relative[1] &&
        !(relative[1] === 'saleouts' && relative[2] === 'hooks' && target.join('/') === 'features/products/api')) {
        violations.push(`${path.relative(src, filename)} -> ${target.join('/')}`)
      }
      if (['api', 'utils'].includes(relative[2]) && (target.includes('components') || target.includes('hooks') || target.includes('store'))) {
        violations.push(path.relative(src, filename))
      }
    }
  }
  expect(violations).toEqual([])
})

it('does not initialize the i18n runtime just to create the Redux preferences slice', () => {
  const slice = path.join(src, 'app/store/preferencesSlice.js')
  expect(existsSync(slice)).toBe(true)
  expect(dependencies(slice).some(dependency => dependency.includes('/i18n'))).toBe(false)
})
