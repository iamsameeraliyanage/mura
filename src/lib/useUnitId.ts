import { useScope } from './scope'

/** The ward every page is currently viewing — driven by the sidebar switcher. */
export function useUnitId(): string | undefined {
  return useScope().unit?.id
}
