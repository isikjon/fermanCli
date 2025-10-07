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
        const links = Array.from(this.pendingMetadata.keys()).slice(0, 5)
        const callbacks = new Map(this.pendingMetadata)
        links.forEach(link => this.pendingMetadata.delete(link))
        this.batchTimeout = null

        const results = await Promise.allSettled(
            links.map(link => {
                return Promise.race([
                    api.products.getImage(link, false),
                    new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
                ])
            })
        )

        results.forEach((result, index) => {
            const link = links[index]
            const resolvers = callbacks.get(link) || []
            const value = result.status === 'fulfilled' ? result.value : null
            
            resolvers.forEach(resolve => resolve(value))
        })

        if (this.pendingMetadata.size > 0) {
            setTimeout(() => this.processBatch(), 50)
        }
    }
}

export const imageBatchLoader = new ImageBatchLoader()

