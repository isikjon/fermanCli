import { StyleSheet, View } from 'react-native'
import React from 'react'
import TouchBox from '../../../components/TouchBox'
import Icons from '../../../ui/Icons'
import Txt from '../../../ui/Text'
import Row from '../../../components/Row'

const Reviews = () => {
    return (
        <View style={styles.Box}>
            <Row gap={16}>
                <TouchBox isFull background="#4FBD0180" height={56}>
                    <View style={styles.Group}>
                        <Icons.Cart />
                        <Txt weight='Bold' size={16}>Добавить в список покупок</Txt>
                    </View>
                </TouchBox>

                <TouchBox height={56}>
                    <Icons.Share width={24} height={24} />
                </TouchBox>
            </Row>

            <TouchBox height={56}>
                <Row>
                    <Txt size={16}>Читать отзывы</Txt>

                    <View style={styles.Reviews}>
                        <Icons.Star color="#FF7A00" />
                        <Txt size={16}>{`4.5 (129)`}</Txt>
                    </View>
                </Row>
            </TouchBox>
        </View>
    )
}

export default Reviews

const styles = StyleSheet.create({
    Box: {
        paddingHorizontal: 16,
        gap: 16,
        paddingBottom: '5%',
        marginTop: 32
    },
    Reviews: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4
    },
    Group: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        gap: 16
    }
})