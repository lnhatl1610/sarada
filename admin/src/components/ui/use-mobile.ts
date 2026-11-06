import * as React from "react"

// Keep tablet widths in the off-canvas navigation mode described by the admin shell.
const MOBILE_BREAKPOINT = 1024
const mediaQuery = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(onChange: () => void) {
  const mediaQueryList = window.matchMedia(mediaQuery)
  mediaQueryList.addEventListener("change", onChange)
  return () => mediaQueryList.removeEventListener("change", onChange)
}

function getSnapshot() {
  return window.matchMedia(mediaQuery).matches
}

function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
