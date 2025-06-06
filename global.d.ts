import components from './src/components'

declare global {
    interface Window {
        esmLoaded: boolean
        jsLoaded: boolean
        ensureJsLoaded: (() => void) | undefined
    }

    declare const FloatMsgs: typeof components.FloatMsgs
}

export { }