import { InteractionManager } from 'react-native'

class PerformanceMonitor {
    private frameCount = 0
    private lastTime = performance.now()
    private fps = 60
    private rafId: number | null = null
    private isMonitoring = false

    startMonitoring() {
        if (this.isMonitoring) return
        this.isMonitoring = true
        this.frameCount = 0
        this.lastTime = performance.now()
        this.measureFPS()
    }

    private measureFPS = () => {
        this.frameCount++
        const currentTime = performance.now()
        const delta = currentTime - this.lastTime

        if (delta >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / delta)
            console.log(`📊 FPS: ${this.fps}`)
            this.frameCount = 0
            this.lastTime = currentTime
        }

        if (this.isMonitoring) {
            this.rafId = requestAnimationFrame(this.measureFPS)
        }
    }

    stopMonitoring() {
        this.isMonitoring = false
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId)
            this.rafId = null
        }
    }

    logInteraction(action: string, screen: string) {
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
        console.log(`👆 [${timestamp}] ${screen} -> ${action}`)
    }

    async measureAsyncOperation<T>(
        operation: () => Promise<T>,
        operationName: string
    ): Promise<T> {
        const startTime = performance.now()
        
        try {
            const result = await operation()
            const duration = (performance.now() - startTime).toFixed(2)
            console.log(`⚡ ${operationName}: ${duration}ms`)
            return result
        } catch (error) {
            const duration = (performance.now() - startTime).toFixed(2)
            console.log(`❌ ${operationName} failed: ${duration}ms`)
            throw error
        }
    }

    getCurrentFPS(): number {
        return this.fps
    }
}

export const performanceMonitor = new PerformanceMonitor()

