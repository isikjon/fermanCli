import { StyleSheet, TouchableOpacity, View } from 'react-native'
import React from 'react'
import Txt from '../../../ui/Text'
import useCatalogStore from '../../../store/catalog'
import { useRoute, RouteProp } from '@react-navigation/native'
import { filteredCategories } from '../../../constants'

// Определяем типы для роутов
type RootStackParamList = {
    Categories: { id: string }
}

const Categories = () => {
    const { changeCategory, catalogList, category } = useCatalogStore()
    const route = useRoute<RouteProp<RootStackParamList, 'Categories'>>()
    const { id } = route.params

    const activeCatalogItem = catalogList.find(i => i.id === id)
    const filteredCategory = filteredCategories.find(f => f.name === activeCatalogItem?.name)
    const filteredSubCategories = activeCatalogItem?.subCategory?.filter(sub =>
        filteredCategory?.array.some(filtered => filtered === sub.name)
    )

    console.log('🏷️ [Categories] Rendered:', {
        mainCategoryId: id,
        mainCategoryName: activeCatalogItem?.name,
        selectedSubCategory: category,
        subCategoriesCount: filteredSubCategories?.length || 0
    })

    return (
        <View style={styles.Categories}>
            <Txt size={24} weight="Jingleberry">
                {activeCatalogItem?.name}
            </Txt>

            <View style={styles.List}>
                {filteredSubCategories?.map((item, index) => {
                    const isActive = category === item.id
                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.Item,
                                isActive && styles.ItemActive
                            ]}
                            onPress={() => {
                                console.log('👆 [Categories] User clicked:', item.name, 'id:', item.id)
                                changeCategory(item.id)
                            }}
                        >
                            <Txt weight="Bold" color={isActive ? "#4FBD01" : "#4D4D4D"}>
                                {item.name}
                            </Txt>
                        </TouchableOpacity>
                    )
                })}
            </View>
        </View>
    )
}

export default Categories

const styles = StyleSheet.create({
    Categories: {
        width: '100%',
        paddingHorizontal: 20,
        marginVertical: '4%',
        gap: 16
    },
    List: {
        flexWrap: 'wrap',
        flexDirection: 'row',
        gap: 10
    },
    Item: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: '#EEEEEE',
        height: 48,
        gap: 10,
        borderWidth: 1,
        borderColor: "rgba(77, 77, 77, 0.5)"
    },
    ItemActive: {
        borderColor: "#4FBD01",
        borderWidth: 2,
        backgroundColor: '#F0F9EC'
    }
})
