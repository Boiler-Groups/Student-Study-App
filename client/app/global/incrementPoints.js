import {getCurrentUser, getUserPoints, updateUserPoints} from "@/app/api/user";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const handleAddPointsToCurrentUser = async(additionalPoints) => {
    try{
        const currentUserId = await getUserId();
        console.log("User Id", currentUserId)
        const response = await getUserPoints(currentUserId);
        const currentPoints = response.data.points;

        const updatedPoints = currentPoints + additionalPoints;

        await updateUserPoints(currentUserId,updatedPoints);
        console.log(`Succesfully updated points! New total: ${updatedPoints}`)
    } catch (error){
        console.error("error adding points",error)
    }

}
const getUserId = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            console.error("No token found! User may not be logged in.");
            return null;
        }

        const user = await getCurrentUser({ token });

        if (!user || !user.data || !user.data._id) {
            console.error("User data is invalid or missing userId.");
            return null;
        }

        return user.data._id;
    } catch (error) {
        console.error("Error retrieving user ID:", error);
        return null;
    }
};