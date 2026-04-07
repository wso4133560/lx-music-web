import { isWebRuntime } from './runtime'

const webSupportedOnlineSources = new Set<LX.OnlineSource>(['mg'])

export const defaultOnlineSource: LX.OnlineSource = 'mg'

export const filterRuntimeOnlineSources = <T extends { id: string }>(sources: T[]): T[] => {
  if (!isWebRuntime) return [...sources]
  return sources.filter(source => webSupportedOnlineSources.has(source.id as LX.OnlineSource))
}

export const getDefaultOnlineSource = <T extends string>(sources?: readonly T[]): T => {
  if (sources?.length) {
    return (sources.find(source => source == defaultOnlineSource) ?? sources[0]) as T
  }
  return defaultOnlineSource as T
}

export const shouldExposeAggregatedSource = (sourceCount: number) => sourceCount > 1

export const resolveAvailableSource = <T extends string>(source: string | null | undefined, sources: readonly T[], fallback?: T): T => {
  const targetSource = source as T | undefined
  if (targetSource && sources.includes(targetSource)) return targetSource
  return fallback ?? sources[0]
}
