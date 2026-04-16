import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createPost } from '@/api/content';
import { useFeedStore } from '@/store/feed-store';
import { Pretendard, FontSizes, Spacing, FeedColors } from '@/constants/theme';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications'

interface SelectedImage {
    uri: string;
    name: string;
    type: string;
}

function showPermissionPrePrompt(
    title: string,
    message: string,
    confirmText = '허용하기',
    cancelText = '나중에',
): Promise<boolean> {
    return new Promise(resolve => {
        Alert.alert(title, message, [
            {
                text: cancelText,
                style: 'cancel',
                onPress: () => resolve(false),
            },
            {
                text: confirmText,
                onPress: () => resolve(true),
            },
        ]);
    });
}

// 업로드 성공 후 로컬 알림 예약
async function scheduleUploadNotification(caption: string) {
    // TODO 실습 6-1
    // getPermissionsAsync로 알림 권한을 확인하고 미허용이면 return 하세요
    const { status } = await Notifications.getPermissionsAsync();
    
    if (status !== 'granted') {
        console.log('알림 권한이 없습니다. 알림을 발송할 수 없습니다.');
        return;
    }
    // scheduleNotificationAsync로 로컬 알림을 발송하세요
    await Notifications.scheduleNotificationAsync({

        content: {
            title: '게시물 생성 완료',
            body: '새로운 게시물 생성을 완료했습니다.'
        },

        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 3,
        }
    });
    // content에 title, body를 구성하고
    // TODO 실습 6-2
    // trigger: { seconds: N }으로 N초 딜레이 발송을 테스트해보세요
}

export default function CreateScreen() {
    const insets = useSafeAreaInsets();
    const { prependPost } = useFeedStore();
    const router = useRouter();

    const [images, setImages] = useState<SelectedImage[]>([]);
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);
    const imageList = Array.isArray(images) ? images : [];

    const canSubmit =
        (imageList.length > 0 || caption.trim().length > 0) && !loading;

    // ── 이미지 선택 ──────────────────────────────────────────────
    const handlePickImage = async () => {
        // TODO 실습 1-1
        // getMediaLibraryPermissionsAsync로 현재 권한 상태(status, canAskAgain)를 확인하세요
        let { status, canAskAgain } =
            await ImagePicker.getMediaLibraryPermissionsAsync();

        // TODO 실습 3-1 (iOS)
        // Platform.OS === 'ios'이고 아직 미결정 상태라면
        // 커스텀 Alert로 사용 목적을 먼저 안내한 뒤 시스템 팝업을 띄우세요
        if (Platform.OS === 'ios' && status === 'undetermined') {
            const accepted = await showPermissionPrePrompt(
                '사진 접근 권한 안내',
                '게시물 업로드를 위해 사진 라이브러리 접근 권한이 필요합니다.',
            );

            if (!accepted) {
                return;
            }

            const requested =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
            status = requested.status;
            canAskAgain = requested.canAskAgain;
        }

        // TODO 실습 1-2
        // 미허용 상태라면 requestMediaLibraryPermissionsAsync로 권한을 요청하세요
        // 거부 시 Alert 안내 후 return 하세요
        if (status !== 'granted' && canAskAgain) {
            const requested =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
            status = requested.status;
            canAskAgain = requested.canAskAgain;
        }
        
        if (status !== 'granted') { 
            // TODO 실습 2-1
            // canAskAgain이 false면 Linking.openSettings()로 설정 앱을 유도하고 return 하세요
            if(!canAskAgain) {
                Alert.alert(
                    '권한 필요',
                    '사진 업로드시 사진 접근 권한이 필요합니다.',
                    [
                        { text: '취소', style: 'cancel' },
                        { text: '설정으로 이동',
                        onPress: () => Linking.openSettings() },
                    ]
                );
            }
            return;
        }
        
        // TODO 실습 1-3
        // launchImageLibraryAsync로 이미지 피커를 실행하고
        // 선택된 asset에서 uri, fileName, mimeType을 추출해 setImages에 저장하세요
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            if (!asset?.uri) return;

            const picked: SelectedImage = {
                uri: asset.uri,
                name: asset.fileName ?? `image-${Date.now()}.jpg`,
                type: asset.mimeType ?? 'image/jpeg',
            };

            setImages(prev => [...prev, picked]);
        }
    };

    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    // ── 업로드 ────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!canSubmit) return;
        setLoading(true);
        try {
            const post = await createPost({
                caption: caption.trim() || undefined,
                images: imageList.length > 0 ? imageList : undefined,
            });

            // 피드 맨 앞에 낙관적으로 추가
            prependPost(post);

            // 로컬 알림 예약
            try {
                await scheduleUploadNotification(caption.trim());
            } catch (err) {
                console.warn('[Create] 로컬 알림 예약 실패:', err);
            }

            // 초기화
            setImages([]);
            setCaption('');
        } catch (err) {
            console.error('[Create] 업로드 실패:', err);
            Alert.alert(
                '업로드 실패',
                '게시물을 올리는 데 실패했습니다. 다시 시도해 주세요.',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
                    <Ionicons name='chevron-back' size={26} color='#262626' />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>새 게시물</Text>
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={!canSubmit}
                    hitSlop={8}
                >
                    {loading ? (
                        <ActivityIndicator size='small' color='#0095F6' />
                    ) : (
                        <Text
                            style={[
                                styles.shareButton,
                                !canSubmit && styles.shareButtonDisabled,
                            ]}
                        >
                            공유
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps='handled'
                showsVerticalScrollIndicator={false}
            >
                {/* 이미지 선택 영역 */}
                <View style={styles.imageSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.imageRow}
                    >
                        {/* 추가 버튼 */}
                        {imageList.length < 10 && (
                            <TouchableOpacity
                                style={styles.addImageButton}
                                onPress={handlePickImage}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name='image-outline'
                                    size={32}
                                    color='#8e8e8e'
                                />
                                <Text style={styles.addImageLabel}>
                                    {imageList.length === 0
                                        ? '사진 선택'
                                        : `+추가 (${imageList.length}/10)`}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* 선택된 이미지 썸네일 */}
                        {imageList.map((img, index) => (
                            <View key={img.uri} style={styles.thumbWrapper}>
                                <Image
                                    source={{ uri: img.uri }}
                                    style={styles.thumb}
                                />
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => handleRemoveImage(index)}
                                    hitSlop={4}
                                >
                                    <Ionicons
                                        name='close-circle'
                                        size={20}
                                        color='#fff'
                                    />
                                </TouchableOpacity>
                                {index === 0 && (
                                    <View style={styles.coverBadge}>
                                        <Text style={styles.coverBadgeText}>
                                            대표
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* 캡션 입력 */}
                <View style={styles.captionSection}>
                    <TextInput
                        style={styles.captionInput}
                        placeholder='문구를 입력하세요...'
                        placeholderTextColor='#999'
                        value={caption}
                        onChangeText={setCaption}
                        multiline
                        maxLength={2200}
                        textAlignVertical='top'
                    />
                    <Text style={styles.captionCount}>
                        {caption.length} / 2200
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const THUMB_SIZE = 100;

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#DBDBDB',
    },
    headerTitle: {
        fontFamily: Pretendard.semiBold,
        fontSize: FontSizes.md,
        color: FeedColors.primaryText,
    },
    shareButton: {
        fontFamily: Pretendard.semiBold,
        fontSize: FontSizes.sm,
        color: '#0095F6',
    },
    shareButtonDisabled: {
        color: '#B2DFFC',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    imageSection: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#DBDBDB',
        paddingVertical: Spacing.xl,
    },
    imageRow: {
        paddingHorizontal: Spacing.xl,
        gap: Spacing.sm,
        alignItems: 'flex-start',
    },
    addImageButton: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#DBDBDB',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        backgroundColor: '#FAFAFA',
    },
    addImageLabel: {
        fontFamily: Pretendard.medium,
        fontSize: 11,
        color: '#8e8e8e',
        textAlign: 'center',
    },
    thumbWrapper: {
        position: 'relative',
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: 8,
        overflow: 'hidden',
    },
    thumb: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: 8,
    },
    removeButton: {
        position: 'absolute',
        top: 4,
        right: 4,
    },
    coverBadge: {
        position: 'absolute',
        bottom: 4,
        left: 4,
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 4,
    },
    coverBadgeText: {
        fontFamily: Pretendard.semiBold,
        fontSize: 10,
        color: '#fff',
    },
    captionSection: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#DBDBDB',
    },
    captionInput: {
        fontFamily: Pretendard.regular,
        fontSize: FontSizes.sm,
        color: FeedColors.primaryText,
        minHeight: 100,
        lineHeight: 22,
        ...Platform.select({ android: { paddingTop: 0 } }),
    },
    captionCount: {
        fontFamily: Pretendard.regular,
        fontSize: 12,
        color: '#c7c7c7',
        textAlign: 'right',
        marginTop: 4,
    },
    hint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
    },
    hintText: {
        fontFamily: Pretendard.regular,
        fontSize: FontSizes.xs,
        color: '#8e8e8e',
    },
});
