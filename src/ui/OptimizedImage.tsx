import React, { useState, useEffect, memo, useCallback } from 'react'
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import FastImage, { ResizeMode } from 'react-native-fast-image'
import { getCDNImageUrl } from '../config/cdnMapping'
import Empty from '../assets/svg/Empty'

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

  useEffect(() => {
    let isMounted = true

    const cdnUrl = getCDNImageUrl(productId, index)
    
    if (cdnUrl && isMounted) {
      setImageUrl(cdnUrl)
      setHasError(false)
    } else if (isMounted) {
      setImageUrl('')
      setHasError(true)
    }

    return () => {
      isMounted = false
    }
  }, [productId, index])

  const handleError = useCallback(() => {
    setHasError(true)
  }, [])

  if (hasError || !imageUrl) {
    return (
      <View style={[styles.emptyContainer, emptyStyle]}>
        <Empty />
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
    backgroundColor: '#f9f9f9'
  }
})

export default memo(OptimizedImage, (prevProps, nextProps) => {
  return (
    prevProps.productId === nextProps.productId &&
    prevProps.index === nextProps.index
  )
})

