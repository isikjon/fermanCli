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

export function ProductDTO(data: any) {
    const formattedArray: ProductType[] = data.map((product: any) => {
        const stock = product?.stock ?? product?.quantity ?? product?.stockStore ?? undefined;
        
        // Логируем обработку остатков для отладки
        if (product?.id) {
            console.log('🔄 ProductDTO processing:', {
                id: product.id,
                name: product.name?.substring(0, 40),
                rawStock: product?.stock,
                rawQuantity: product?.quantity,
                rawStockStore: product?.stockStore,
                finalStock: stock
            });
        }
        
        return {
            image: product?.images?.meta.href,
            price: product?.salePrices[0].value / 100,
            name: product?.name,
            id: product?.id,
            description: product.description,
            pathName: product.pathName,
            country: product?.country?.meta.href,
            volume: product?.volume,
            weight: product?.weight,
            weighed: product?.weighed || false,
            stock: stock
        };
    })

    return formattedArray
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