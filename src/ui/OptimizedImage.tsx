import React, { useState, useEffect, memo, useCallback } from 'react'
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import FastImage, { ResizeMode } from 'react-native-fast-image'
import { getCDNImageUrl } from '../config/cdnMapping'
import Empty from '../assets/svg/Empty'
import { getMoyskladImageUrl, getMoyskladVariantImageUrl } from '../api/functions/images'

interface OptimizedImageProps {
  productId: string
  index?: number
  style?: StyleProp<ViewStyle>
  resizeMode?: ResizeMode
  emptyStyle?: StyleProp<ViewStyle>
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  productId,
  index = 0,
  style,
  resizeMode = 'cover',
  emptyStyle
}) => {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadImage = async () => {
      setIsLoading(true)
      
      const cdnUrl = getCDNImageUrl(productId, index)
      
      if (cdnUrl && isMounted) {
        setImageUrl(cdnUrl)
        setHasError(false)
        setIsLoading(false)
        return
      }
      
      try {
        let moyskladUrl = await getMoyskladImageUrl(productId)
        
        if (!moyskladUrl && isMounted) {
          moyskladUrl = await getMoyskladVariantImageUrl(productId)
        }
        
        if (moyskladUrl && isMounted) {
          setImageUrl(moyskladUrl)
          setHasError(false)
        } else if (isMounted) {
          setImageUrl('')
          setHasError(true)
        }
      } catch (error) {
        if (isMounted) {
          setImageUrl('')
          setHasError(true)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadImage()

    return () => {
      isMounted = false
    }
  }, [productId, index])

  const handleError = useCallback(async () => {
    try {
      let moyskladUrl = await getMoyskladImageUrl(productId)
      
      if (!moyskladUrl) {
        moyskladUrl = await getMoyskladVariantImageUrl(productId)
      }
      
      if (moyskladUrl) {
        setImageUrl(moyskladUrl)
        setHasError(false)
      } else {
        setHasError(true)
      }
    } catch (error) {
      setHasError(true)
    }
  }, [productId])

  if (hasError || !imageUrl) {
    return (
      <View style={[styles.emptyContainer, emptyStyle]}>
        <View style={styles.emptyIconWrapper}>
          <Empty width={48} height={48} />
        </View>
      </View>
    )
  }

  return (
    <FastImage
      style={style}
      source={{
        uri: imageUrl,
        priority: FastImage.priority.high,
        cache: FastImage.cacheControl.immutable
      }}
      resizeMode={resizeMode}
      onError={handleError}
    />
  )
}

const styles = StyleSheet.create({
  emptyContainer: {
    borderWidth: 1,
    borderColor: '#4FBD01',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    overflow: 'hidden'
  },
  emptyIconWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  }
})

export default memo(OptimizedImage, (prevProps, nextProps) => {
  return (
    prevProps.productId === nextProps.productId &&
    prevProps.index === nextProps.index
  )
})

