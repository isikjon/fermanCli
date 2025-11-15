import { ICategory, OrderItemType, OrderType, ProductType } from "../types"
import { fillIconForCategory } from "."
import { SvgProps } from "react-native-svg"
import api from "../api"

type CategoryNode = ICategory & {
    icon: React.FC<SvgProps> | null
    subCategory: CategoryNode[]
}

export function CategoryDTO(data: ICategory[]) {
    const pathMap = new Map<string, CategoryNode>()

    // Сначала создаём узлы с иконками и пустыми подкатегориями
    data.forEach(category => {
        pathMap.set(category.name, {
            ...category,
            icon: fillIconForCategory(category.id) as any,
            subCategory: []
        })
    })

    const tree: CategoryNode[] = []

    pathMap.forEach(node => {
        if (!node.pathName) {
            // Корневая категория
            tree.push(node)
        } else {
            const parentName = node.pathName.split("/").slice(-1)[0] // берем последнюю категорию в pathName
            const parent = pathMap.get(parentName)

            if (parent) {
                parent.subCategory.push(node)
            } else {
                // Если родителя не нашли — добавляем в корень
                tree.push(node)
            }
        }
    })

    // Сортировка
    const sortFn = (a: CategoryNode, b: CategoryNode) => {
        const nameCompare = a.name.localeCompare(b.name, "ru")
        if (a.icon && !b.icon) return -1
        if (!a.icon && b.icon) return 1
        return nameCompare
    }

    const sortTree = (nodes: CategoryNode[]): CategoryNode[] =>
        nodes
            .sort(sortFn)
            .map(node => ({
                ...node,
                subCategory: sortTree(node.subCategory)
            }))

    return sortTree(tree)
}

type ProductDTOOptions = {
    stockByStore?: Record<string, Record<string, number>>
    storePriority?: string[]
}

export function ProductDTO(data: any, options?: ProductDTOOptions) {
    if (!data || !Array.isArray(data)) {
        console.log('⚠️ [ProductDTO] Invalid data provided:', typeof data);
        return [];
    }

    console.log('📦 [ProductDTO] Processing', data.length, 'products');

    const formattedArray: ProductType[] = data
        .filter(product => {
            if (!product || !product.id) {
                console.log('⚠️ [ProductDTO] Skipping product without id');
                return false;
            }
            return true;
        })
        .map((product: any): ProductType | null => {
            try {
                const stock = product?.stock ?? product?.quantity ?? product?.stockStore ?? undefined;
                const stockMap = options?.stockByStore?.[product.id];
                const priorityList = options?.storePriority && options.storePriority.length > 0
                    ? options.storePriority
                    : (stockMap ? Object.keys(stockMap) : []);
                let resolvedStoreId: string | undefined = undefined;
                let resolvedStock = stock;

                if (stockMap) {
                    let candidate: { id: string; value: number } | null = null;
                    for (const storeId of priorityList) {
                        const value = stockMap[storeId];
                        if (value && value > 0) {
                            candidate = { id: storeId, value };
                            break;
                        }
                    }

                    if (!candidate) {
                        for (const [storeId, value] of Object.entries(stockMap)) {
                            if (value && value > 0) {
                                candidate = { id: storeId, value };
                                break;
                            }
                        }
                    }

                    if (candidate) {
                        resolvedStoreId = candidate.id;
                        resolvedStock = candidate.value;
                    } else if (stock !== undefined && stock > 0) {
                        const fallbackStoreId = priorityList[0];
                        if (fallbackStoreId) {
                            resolvedStoreId = fallbackStoreId;
                        }
                        resolvedStock = stock;
                    } else {
                        resolvedStock = 0;
                    }
                }
                
                let price = 0;
                if (product?.salePrices && Array.isArray(product.salePrices) && product.salePrices.length > 0) {
                    price = product.salePrices[0]?.value ? product.salePrices[0].value / 100 : 0;
                }
                
                // Сохраняем product.id как image - URL сформируем через getCDNImageUrl
                const imageUrl = product.id;
                
                const formattedProduct = {
                    image: imageUrl, // Теперь это product.id для CDN маппинга
                    price: price,
                    name: product?.name || 'Без названия',
                    id: product.id,
                    description: product?.description || '',
                    pathName: product?.pathName || '',
                    country: product?.country?.meta?.href || '',
                    volume: product?.volume || 0,
                    weight: product?.weight || 0,
                    weighed: product?.weighed || false,
                    stock: resolvedStock !== undefined ? resolvedStock : stock,
                    stockByStore: stockMap,
                    storeId: resolvedStoreId
                } as ProductType;

                if (price === 0) {
                    console.log('⚠️ [ProductDTO] Product with zero price:', product.name, 'id:', product.id);
                }

                if (stock !== undefined && stock <= 0) {
                    console.log('⚠️ [ProductDTO] Product out of stock:', product.name?.substring(0, 50), 'stock:', stock, 'id:', product.id);
                }

                return formattedProduct;
            } catch (error) {
                console.log('❌ [ProductDTO] Error processing product:', product?.name, 'id:', product?.id, 'error:', error);
                return null;
            }
        })
        .filter((item: ProductType | null): item is ProductType => item !== null);

    console.log('✅ [ProductDTO] Successfully processed', formattedArray.length, 'products');

    return formattedArray;
}

export function postitionsDTO(items: OrderItemType[]) {
    const deliveryServiceId = "bca82cda-cfaa-11ee-0a80-0d920004a1bb"

    const formattedArray = items.map(i => ({
        quantity: i.amount,
        price: i.price * 100,
        assortment: {
            meta: {
                href: `https://api.moysklad.ru/api/remap/1.2/entity/${i.productId === deliveryServiceId ? "service" : "product"}/${i.productId}`,
                type: i.productId === deliveryServiceId ? "service" : "product",
                mediaType: "application/json"
            }
        }
    }))

    return formattedArray
}

export async function ordersDTO(items: any[]): Promise<OrderType[]> {
    const formattedArray = await Promise.all(items.map(async (i): Promise<OrderType> => {
        const bonusMatch = i.description?.split(`"`)[1]?.split(" ")[0]
        const bonus = bonusMatch || 0

        const deliveryAttr = i.attributes.find((item: any) => item.name === "Тип заказа")
        const deliveryType = deliveryAttr?.value?.name || "Не указан"

        const statusResponse = await api.order.getDataFromURL(i.state.meta.href)
        const status = statusResponse?.data?.name || "Неизвестный статус"

        const name = i.name.split("-")[1]

        return {
            bonus: bonus,
            created: i.created,
            deliveryType: deliveryType,
            id: i.id,
            name: name,
            positions: i.positions.meta.href,
            status: status,
            store: i.store.meta.href,
            sum: Number(i.sum) / 100
        }
    }))

    return formattedArray
}