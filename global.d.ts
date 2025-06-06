declare global {
    interface Window {
        esmLoaded: boolean
        jsLoaded: boolean
        ensureJsLoaded: (() => void) | undefined
    }
}

export { }