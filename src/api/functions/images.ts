import axios from "axios"
import { MOYSKLAD_TOKEN } from "./products"

type ImageCache = {
  [productId: string]: string
}

const imageCache: ImageCache = {}

export async function getMoyskladImageUrl(productId: string): Promise<string> {
  try {
    if (imageCache[productId]) {
      return imageCache[productId]
    }

    const response = await axios.get(
      `https://api.moysklad.ru/api/remap/1.2/entity/product/${productId}`,
      {
        headers: { Authorization: MOYSKLAD_TOKEN },
        timeout: 5000
      }
    )

    const images = response.data?.images
    if (!images?.meta?.href) {
      return ''
    }

    const imagesResponse = await axios.get(images.meta.href, {
      headers: { Authorization: MOYSKLAD_TOKEN },
      timeout: 5000
    })

    const rows = imagesResponse.data?.rows
    if (!rows || rows.length === 0) {
      return ''
    }

    const firstImage = rows[0]
    const downloadUrl = firstImage?.meta?.downloadHref || firstImage?.miniature?.downloadHref || firstImage?.tiny?.downloadHref

    if (downloadUrl) {
      imageCache[productId] = downloadUrl
      return downloadUrl
    }

    return ''
  } catch (error) {
    return ''
  }
}

export async function getMoyskladVariantImageUrl(productId: string): Promise<string> {
  try {
    if (imageCache[productId]) {
      return imageCache[productId]
    }

    const response = await axios.get(
      `https://api.moysklad.ru/api/remap/1.2/entity/variant/${productId}`,
      {
        headers: { Authorization: MOYSKLAD_TOKEN },
        timeout: 5000
      }
    )

    const images = response.data?.images
    if (!images?.meta?.href) {
      return ''
    }

    const imagesResponse = await axios.get(images.meta.href, {
      headers: { Authorization: MOYSKLAD_TOKEN },
      timeout: 5000
    })

    const rows = imagesResponse.data?.rows
    if (!rows || rows.length === 0) {
      return ''
    }

    const firstImage = rows[0]
    const downloadUrl = firstImage?.meta?.downloadHref || firstImage?.miniature?.downloadHref || firstImage?.tiny?.downloadHref

    if (downloadUrl) {
      imageCache[productId] = downloadUrl
      return downloadUrl
    }

    return ''
  } catch (error) {
    return ''
  }
}
