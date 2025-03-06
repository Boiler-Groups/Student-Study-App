import { useLocalSearchParams } from 'expo-router';
import GroupChatPage from '../group';

export default function GroupChatScreen() {
    const { groupId } = useLocalSearchParams(); // Get groupId from the URL

    return <GroupChatPage groupId={groupId} />;
}
