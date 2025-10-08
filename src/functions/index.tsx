import CtalogIcons from '../assets/svg/catalog';
import { orderConstants, slotsList, weightedList } from '../constants';
import 'react-native-get-random-values';
import * as turf from '@turf/turf';
import zoneData from '../constants/geojson.json';
import { deliveryDataObj } from '../constants/delivery';
import { postitionsDTO } from './dtos';
import { IOrder, SlotType } from '../types';


export function formatPrice(price: number): string {
    return price.toFixed(2);
}

export function generateCode(length = 4) {
    return Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)).toString();
}

export function normalizePhoneNumber(input: string): string {
    return input.replace(/\D/g, '').replace(/^8/, '7').replace(/^7?/, '7');
}

export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export const formatDateInput = (value: string) => {
    // Оставляем только цифры
    const digits = value.replace(/\D/g, '');

    let result = '';

    if (digits.length <= 2) {
        result = digits;
    } else if (digits.length <= 4) {
        result = digits.slice(0, 2) + '.' + digits.slice(2);
    } else if (digits.length <= 8) {
        result = digits.slice(0, 2) + '.' + digits.slice(2, 4) + '.' + digits.slice(4, 8);
    } else {
        // Ограничиваем длину до 8 цифр (DDMMYYYY)
        result = digits.slice(0, 2) + '.' + digits.slice(2, 4) + '.' + digits.slice(4, 8);
    }

    return result;
};

export function fillIconForCategory(id: string) {
    switch (id) {
        case "762d57da-1191-11ee-0a80-043600051b3e": return <CtalogIcons.Discount />; // Чай, травы и дикоросы

        case "36470fc3-6225-11ec-0a80-069f0004f61c": return <CtalogIcons.Tea />; // Чай, травы и дикоросы
        case "555ff02d-eeb6-11eb-0a80-05240007b3e0": return <CtalogIcons.Eggs />; // Яйцо домашнее
        case "57cfcab4-622b-11ec-0a80-00c400062ea7": return <CtalogIcons.Bread />; // Ремесленный хлеб и выпечка
        case "70464031-8ac6-11eb-0a80-07610022336d": return <CtalogIcons.Honey />; // Мед
        case "710be1b1-9283-11eb-0a80-080500020eea": return <CtalogIcons.Jam />; // Варенье, домашние соки и компоты
        case "7b1f0bed-6226-11ec-0a80-069f00051ff1": return <CtalogIcons.Canning />; // Домашняя консервация
        case "9a16bb8a-b7f9-11ed-0a80-073500036911": return <CtalogIcons.ReadyEat />; // Готовая еда
        case "bd0f8fce-61e8-11ec-0a80-02aa00030ab6": return <CtalogIcons.Sausage />; // Колбасные изделия
        case "e395744c-d3e7-11ea-0a80-09fa0067dd95": return <CtalogIcons.Milk />; // Молочная продукция
        case "e3da0fd5-d3e7-11ea-0a80-09fa0067de07": return <CtalogIcons.Vegetables />; // Овощи, фрукты, ягоды, грибы
        case "e3fe816c-d3e7-11ea-0a80-09fa0067de48": return <CtalogIcons.Fish />; // Мясо и рыба
        case "e46baf13-d3e7-11ea-0a80-09fa0067df0e": return <CtalogIcons.Meat />; // Мясные деликатесы
        case "e4811803-d3e7-11ea-0a80-09fa0067df38": return <CtalogIcons.Cheese />; // Домашние и ремесленные сыры
        case "e49d43fa-d3e7-11ea-0a80-09fa0067df6d": return <CtalogIcons.SemiFinished />; // Полуфабрикаты домашние
        case "f21df40d-fba7-11ea-0a80-02c5001e1090": return <CtalogIcons.Grocery />; // Бакалея
        case "9310164a-bb48-11ee-0a80-11a90005919e": return <CtalogIcons.Suppliments />; // БАДы
        case "2db1439e-de19-11ef-0a80-0cb40007a651": return <CtalogIcons.Snacks />; // Орехи, сухофрукты, снеки
        case "21d58cf2-660b-11ec-0a80-05b70069c7ab": return <CtalogIcons.Cetificate />; // Подарки и подарочные сертификаты
        case "bf9ef63c-dabf-11ef-0a80-0d2f0013c530": return <CtalogIcons.ForBeauty />; // Товары для красоты
        case "d1ae86d6-a342-11eb-0a80-04620006c3d5": return <CtalogIcons.StewedMeats />; // Тушенки, консервы, каши
        case "4054d32a-b802-11ed-0a80-03260004ff0b": return <CtalogIcons.Cake />; // Сладости и десерты
        case "c5617139-32c4-11ef-0a80-139000070727": return <CtalogIcons.ForHome />; // Товары для дома
        default: return null
    }
}

export function formatDate(value: string | Date, returnString?: boolean) {
    if (returnString && typeof value === "object") {
        const year = value.getFullYear()
        const month = String(value.getMonth() + 1).padStart(2, "0")
        const day = String(value.getDate()).padStart(2, "0")

        return `${day}.${month}.${year}`
    } else {
        const splitedValue = String(value).split(".")
        if (splitedValue.length !== 3) return new Date();
        return new Date(`${splitedValue[2]}-${splitedValue[1]}-${splitedValue[0]}`)
    }
}

export function fillWeighed(isWeighted: boolean, path: string) {
    // if (!isWeighted) return { sign: "шт", weight: null };

    const normalizedPath = path.toLowerCase();

    for (const category of weightedList) {
        const categoryName = category.name.toLowerCase();

        // Проверяем, входит ли путь в название категории
        if (normalizedPath.includes(categoryName)) {
            // Проверяем подкатегории
            if (category.array) {
                for (const sub of category.array) {
                    const subName = sub.name.toLowerCase();
                    if (normalizedPath.includes(subName)) {
                        return sub.weight === 1 ? { sign: "кг", weight: 1 } : { sign: "г", weight: sub.weight };
                    }
                }
            }

            // Если нет точного совпадения с подкатегориями, но категория подходит
            if (category.weight) {
                return category.weight === 1 ? { sign: "кг", weight: 1 } : { sign: "г", weight: category.weight };
            }
        }
    }

    // Если ничего не найдено, по умолчанию "шт"
    return { sign: "шт", weight: null };
}

type NamedSlot = {
    time: string;
    name: string;
    order: { from: number; to: number; price: number }[];
};

function isNamedSlot(slot: any): slot is NamedSlot {
    return 'time' in slot && 'name' in slot && 'order' in slot;
}

export function calculateDeliveryPrice(
    totalPrice: number,
    zoneName: string,
    express?: boolean,
): number {
    // 1. Получаем текущее время по Владивостоку, считая от UTC (избегаем локальной TZ)
    const now = new Date();
    const vladHours = (now.getUTCHours() + 10 + 24) % 24; // UTC+10
    const currentMinutes = vladHours * 60 + now.getUTCMinutes();

    // 2. Ищем нужную зону
    const zone = deliveryDataObj.zones.find(z => z.zone.name === zoneName);
    if (!zone) {
        throw new Error("Зона не найдена")
    }
    // 3. Если экспресс-доставка — возвращаем цену экспресса
    if (express) {
        return zone.express;
    }

    const slots = zone.slots;

    // Если слотов нет — не можем ничего вернуть
    if (!slots || slots.length === 0) {
        throw new Error('No delivery slots available for this zone');
    }

    if (isNamedSlot(slots[0])) {
        const namedSlots = slots as NamedSlot[];

        // 4. Выбор ближайшего слота по времени
        const timeToMinutes = (timeRange: string) => {
            const [start] = timeRange.split(' - ');
            const [hours, minutes] = start.split(':').map(Number);
            return hours * 60 + minutes;
        };

        // Сортируем слоты по времени начала
        const sortedSlots = namedSlots.slice().sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

        // Находим ближайший будущий слот, иначе берём первый
        const nearestSlot = sortedSlots.find(slot => timeToMinutes(slot.time) > currentMinutes) || sortedSlots[0];

        // Ищем нужный диапазон по цене
        const priceBracket = nearestSlot.order.find(
            bracket => totalPrice >= bracket.from && totalPrice <= bracket.to
        );

        console.log(priceBracket)

        return priceBracket?.price ?? 0;
    } else {
        // 5. Если слоты без time/name — просто берём нужную цену по totalPrice
        const priceBracket: any = slots.find(
            (slot: any) => totalPrice >= slot.from && totalPrice <= slot.to
        );

        console.log(priceBracket)

        return priceBracket?.price ?? 0;
    }
}


export const getZoneForLocation = (latitude: number, longitude: number) => {
    const point = turf.point([longitude, latitude]);

    for (const feature of zoneData.features) {
        const polygon = feature.geometry;
        if (turf.booleanPointInPolygon(point, polygon as any)) {
            return feature.properties;
        }
    }

    return null;
};

export function orderPayload(data: IOrder) {
    const organization = orderConstants.organization

    const agent = {
        meta: {
            ...orderConstants.agent.meta,
            href: `https://api.moysklad.ru/api/remap/1.2/entity/organization/${data.customerId}`,
        }
    }

    const orderSourceAttribute = {
        // Источник заказа - Приложение
        meta: {
            ...orderConstants.attributes.orderSource.meta
        },
        value: {
            meta: {
                ...orderConstants.attributes.orderSource.valueMeta,
                href: `https://api.moysklad.ru/api/remap/1.2/entity/customentity/${orderConstants.attributes.orderSource.mobileAppValue}`,
            }
        }
    }

    const attributes = data.delivery.type === 0 ? [
        {
            // Тип заказа доставка
            meta: {
                ...orderConstants.attributes.orderType.meta
            },
            value: {
                meta: {
                    ...orderConstants.attributes.orderType.valueMeta,
                    href: "https://api.moysklad.ru/api/remap/1.2/entity/customentity/8864b5ac-9806-11ee-0a80-11fb003800a6/7d785dc9-9807-11ee-0a80-0cca0036d646",
                }
            }
        },
        {
            // Время доставки
            meta: {
                ...orderConstants.attributes.deliveryTime.meta
            },
            value: {
                meta: {
                    ...orderConstants.attributes.deliveryTime.valueMeta,
                    href: `https://api.moysklad.ru/api/remap/1.2/entity/customentity/d133041a-0836-11ef-0a80-10de004fb76e/${data.delivery.time}`,
                }
            }
        },
        orderSourceAttribute
    ] : [
        {
            // Тип заказа самовывоз
            meta: {
                ...orderConstants.attributes.orderType.meta
            },
            value: {
                meta: {
                    ...orderConstants.attributes.orderType.valueMeta,
                    href: "https://api.moysklad.ru/api/remap/1.2/entity/customentity/8864b5ac-9806-11ee-0a80-11fb003800a6/83334031-9807-11ee-0a80-017900363eaf",
                }
            }
        },
        {
            // Время самовывоза
            meta: {
                ...orderConstants.attributes.selfPickupTime.meta
            },
            value: {
                meta: {
                    ...orderConstants.attributes.selfPickupTime.valueMeta,
                    href: `https://api.moysklad.ru/api/remap/1.2/entity/customentity/52f5aab7-0836-11ef-0a80-0bcc004eec9d/${data.delivery.time}`,
                }
            }
        },
        orderSourceAttribute
    ]

    const store = {
        meta: {
            ...orderConstants.store.meta,
            href: `https://api.moysklad.ru/api/remap/1.2/entity/store/${data.storeId}`,
        }
    }

    const positions = postitionsDTO(data.items)


    return {
        organization,
        agent,
        attributes,
        store,
        description: `${data.bonuses.type === 0 ? "-" : "+"}${data.bonuses.amount} Бонусов`,
        shipmentAddress: data.delivery.address,
        positions,
    }
}

export function getSlots(type: number, isPersonalDelivery: boolean = false): { name: string; array: SlotType[] } {
    const selected = slotsList[type];
    
    const now = new Date();
    const vladHours = (now.getUTCHours() + 10 + 24) % 24;
    const vladMinutes = now.getUTCMinutes();
    const currentVladMinutes = vladHours * 60 + vladMinutes;

    const cutoffTime = 16 * 60 + 30;

    const todaySlots: SlotType[] = [];
    const tomorrowSlots: SlotType[] = [];

    selected.array.forEach(slot => {
        const [start] = slot.value.split(" - ");
        const [startHour, startMinute] = start.split(":").map(Number);
        const slotStartMinutes = startHour * 60 + startMinute;

        const isEveningSlot = slot.value.includes("18:00");
        const isAfterCutoff = currentVladMinutes >= cutoffTime;
        
        if (isEveningSlot && isAfterCutoff && !isPersonalDelivery) {
            tomorrowSlots.push({
                ...slot,
                value: `Завтра, ${slot.value}`
            });
        } else if (slotStartMinutes <= currentVladMinutes) {
            tomorrowSlots.push({
                ...slot,
                value: `Завтра, ${slot.value}`
            });
        } else {
            todaySlots.push({
                ...slot,
                value: `Сегодня, ${slot.value}`
            });
        }
    });

    return {
        name: selected.name,
        array: [...todaySlots, ...tomorrowSlots]
    };
}