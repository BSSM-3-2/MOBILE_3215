import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import MOCK_POSTS from '@/mock/posts';
import { MOCK_USERS_MAP } from '@/mock/users';
import ProfileFeedList from '@components/profile/feed/ProfileFeedList';
import { ProfileHeader } from '@components/profile/ProfileHeader';
import { ThemedView } from '@components/themed-view';

export default function UserProfileScreen() {
    // 어떻게 받아와야 할까요?
    const { id } = useLocalSearchParams<{ id: string }>();

    const user = MOCK_USERS_MAP[id];
    const posts = MOCK_POSTS.filter(post => post.userId === id);

    if (!user) {
        return (
            <ThemedView style={styles.notFound}>
                <Text style={styles.notFoundText}>유저를 찾을 수 없어요.</Text>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <ProfileHeader
                user={user}
                userAnalytics={{
                    post: posts.length,
                }}
            />
            <ProfileFeedList posts={posts} />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
    },
    notFound: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notFoundText: {
        fontSize: 16,
        opacity: 0.5,
    },
});
