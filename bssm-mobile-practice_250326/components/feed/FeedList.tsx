import { ThemedView } from '@components/themed-view';
import { Post } from '@type/Post';
import { FlatList, StyleSheet } from 'react-native';
import { FeedPost } from './post/FeedPost';

function FeedList({ posts }: { posts: Post[] }) {
    return (
        <ThemedView style={styles.container}>
            <FlatList
                data={posts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <FeedPost post={item} key={item.id} />
                )}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
});

export { FeedList };
