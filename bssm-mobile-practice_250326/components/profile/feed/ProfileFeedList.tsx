import React from 'react';
import { Grid } from '@/constants/theme';
import { resolveImageSource } from '@/utils/image';
import { ThemedView } from '@components/themed-view';
import { Post } from '@type/Post';
import { Image } from 'expo-image';
import { Dimensions, FlatList, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / Grid.profileColumnCount;

export default function ProfileFeedList({ posts, ListHeaderComponent }: { posts: Post[], ListHeaderComponent?: React.ReactElement }) {
    return (
        <ThemedView style={styles.container}>
            <FlatList
                style={{ flex: 1 }}
                data={posts}
                keyExtractor={(item) => item.id}
                numColumns={Grid.profileColumnCount}
                ListHeaderComponent={ListHeaderComponent}
                renderItem={({ item }) => (
                    <Image
                        style={styles.image}
                        contentFit={'cover'}
                        source={resolveImageSource(item.images[0])}
                        key={item.id}
                    />
                )}
                showsVerticalScrollIndicator={false}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    image: {
        height: ITEM_SIZE * Grid.profileImageRatio,
        width: ITEM_SIZE - Grid.gap,
        paddingRight: 1.5 * Grid.gap,
        paddingBottom: 1.5 * Grid.gap,
    },
    container: {
        flex: 1,
    },
});
