import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';
import { Post } from '@type/Post';
import { FeedPost } from './FeedPost';

const DELETE_AREA_WIDTH = 80;

function SwipeableFeedPost({
    post,
    onDelete,
}: {
    post: Post;
    onDelete: (id: string) => void;
}) {
    const translateX = useSharedValue(0);
    const startX = useSharedValue(0);
    const cardScale = useSharedValue(1);

    const triggerHaptic = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const panGesture = Gesture.Pan()
        // 수평 스와이프에서만 pan이 활성화되도록 제한하여 세로 스크롤과 충돌 방지
        .activeOffsetX([-15, 15])
        .failOffsetY([-10, 10])
        .onBegin(() => {
            startX.value = translateX.value;
        })
        .onUpdate(event => {
            const nextX = startX.value + event.translationX;
            translateX.value = Math.max(-DELETE_AREA_WIDTH, Math.min(0, nextX));
        })
        .onEnd(() => {
            // 손을 떼면 항상 닫히도록 원위치로 복귀
            translateX.value = withTiming(0, { duration: 180 });
        })
        .onFinalize(() => {
            // 제스처가 취소/경합 종료되는 경우도 항상 원위치 보장
            translateX.value = withTiming(0, { duration: 180 });
        });

    const longPressGesture = Gesture.LongPress()
        .minDuration(300)
        .onStart(() => {
            cardScale.value = withTiming(0.96, { duration: 120 });
            runOnJS(triggerHaptic)();
        })
        .onFinalize(() => {
            cardScale.value = withTiming(1, { duration: 120 });
        });

    // TODO: Gesture.Race로 합성 (실습 5-3)
    const composedGesture = Gesture.Race(longPressGesture, panGesture);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { scale: cardScale.value },
        ],
    }));

    const handleDeletePress = () => {
        onDelete(post.id);
    };

    return (
        <View style={styles.container}>
            <View style={styles.deleteArea}>
                <TouchableOpacity
                    onPress={handleDeletePress}
                    style={styles.deleteButton}
                >
                    <Ionicons name='trash-outline' size={24} color='white' />
                </TouchableOpacity>
            </View>

            <GestureDetector gesture={composedGesture}>
                <Animated.View style={animatedStyle}>
                    <FeedPost post={post} />
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
    deleteArea: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: DELETE_AREA_WIDTH,
        backgroundColor: '#ED4956',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
});

export { SwipeableFeedPost };
