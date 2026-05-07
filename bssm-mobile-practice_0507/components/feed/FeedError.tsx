import { ThemedText } from '@components/themed-text';
import { TouchableOpacity, View } from 'react-native';

interface FeedErrorProps {
    message: string;
    onRetry: () => void;
}

export function FeedError({ message, onRetry }: FeedErrorProps) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
            <ThemedText style={{ fontSize: 16, marginBottom: 20, textAlign: 'center' }}>
                {message}
            </ThemedText>
            <TouchableOpacity
                onPress={onRetry}
                style={{
                    backgroundColor: '#0a7ea4',
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                }}
            >
                <ThemedText style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                    다시 시도
                </ThemedText>
            </TouchableOpacity>
        </View>
    );
}
