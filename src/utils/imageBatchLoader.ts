import api from '../api'

class ImageBatchLoader {
    private pendingMetadata: Map<string, Array<(value: string | null) => void>> = new Map()
    private batchTimeout: NodeJS.Timeout | null = null
    private readonly BATCH_DELAY = 100

    async getImageMetadata(link: string): Promise<string | null> {
        return new Promise((resolve) => {
            if (!this.pendingMetadata.has(link)) {
                this.pendingMetadata.set(link, [])
            }
            
            this.pendingMetadata.get(link)!.push(resolve)
            
            if (this.batchTimeout) {
                clearTimeout(this.batchTimeout)
            }

            this.batchTimeout = setTimeout(() => {
                this.processBatch()
            }, this.BATCH_DELAY)
        })
    }

    private async processBatch() {
        const links = Array.from(this.pendingMetadata.keys())
        const callbacks = new Map(this.pendingMetadata)
        this.pendingMetadata.clear()
        this.batchTimeout = null

        console.log(`🔥 [BatchLoader] Processing batch of ${links.length} images`)
        const batchStartTime = performance.now()

        const results = await Promise.allSettled(
            links.map(link => api.products.getImage(link, false))
        )

        console.log(`⚡ [BatchLoader] Batch completed in ${(performance.now() - batchStartTime).toFixed(2)}ms`)

        results.forEach((result, index) => {
            const link = links[index]
            const resolvers = callbacks.get(link) || []
            const value = result.status === 'fulfilled' ? result.value : null
            
            resolvers.forEach(resolve => resolve(value))
        })
    }
}

export const imageBatchLoader = new ImageBatchLoader()

