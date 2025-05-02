import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet
} from 'react-native';
import { useRouter } from "expo-router";
import { API_URL } from '@env';
import { useTheme } from '../components/ThemeContext';
import { getCurrentUser } from './api/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function leaderboard() {
  const router = useRouter();
  const { isDarkTheme } = useTheme(); // Get dark mode state
  const [users, setUsers] = useState([]);
  const [points, setPoints] = useState(0);
  const [now, setNow] = useState(new Date());
  const [uname, setUsername] = useState("");
  const [upoints, setUserPoints] = useState(0);
  const [ustreak, setUserStreak] = useState(0);
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'GET',
      });
      const data = await response.json();
      const sortedData = data.sort((a, b) => b.points - a.points);
      setUsers(sortedData);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const getUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const user = await getCurrentUser({ token });
      setUsername(user.data.username);
      setUserPoints(user.data.points);
      setUserStreak(user.data.streak);
    } catch (error) {
      console.error("Error getting current user");
    }
  }

  useEffect(() => {
    fetchUsers();
    getUser();
    let hasRefreshedToday = false; //ensure it can't rerun multiple times a day
  
    const intervalId = setInterval(() => {
      const current = new Date();
  
      if (current.getHours() === 0 && current.getMinutes() === 0) {
        if (!hasRefreshedToday) {
          fetchUsers();
          getUser();
          hasRefreshedToday = true;
        }
      } else {
        hasRefreshedToday = false; // reset after midnight minute passes
      }
  
      setNow(current);
    }, 60000);

    // Make sure multiple can't be running at once
    return () => clearInterval(intervalId);
  }, []);

  const handleEditPoints = async (userId) => {
    if (points.toString().trim()) {
      try {
        const newUser = { points: Number(points) };

        const res = await fetch(`${API_URL}/users/${userId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newUser),
        });

        const data = await res.json();
        if (res.ok) {
          setPoints(0);
          fetchUsers();
        } else {
          console.error("Couldn't find User");
        }
      } catch (error) {
        console.error("Error editing user:", error);
      }
    }
  };

  return (
    <View style={[styles.container, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
      <Text style={[styles.title, isDarkTheme ? styles.darkText : styles.lightText]}>
        Study Points Leaderboard
      </Text>

      <FlatList
        style={[styles.listContainer, isDarkTheme ? styles.darkOutline : styles.lightOutline]}
        data={users.slice(0,20)}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <View style={[styles.usersItem, isDarkTheme ? styles.darkNoteItem : styles.lightNoteItem, isDarkTheme ? styles.darkOutline : styles.lightOutline]}>
            <View style={styles.userRow}>

              {/* Rank */}
              <View style={[styles.rankBox, isDarkTheme ? styles.darkBox : styles.lightBox, isDarkTheme ? styles.darkOutline : styles.lightOutline]}>
                <Text style={[styles.pointsText, isDarkTheme ? styles.darkText : styles.lightText]}>
                  #{index + 1}
                </Text>
              </View>
              
              {/* Username */}
              <View style={[styles.userBox, isDarkTheme ? styles.darkBox : styles.lightBox, isDarkTheme ? styles.darkOutline : styles.lightOutline]}>
                <Text style={[styles.pointsText, isDarkTheme ? styles.darkBox : styles.lightBox, isDarkTheme ? styles.darkText : styles.lightText]}>
                  User: {item.username}
                </Text>
              </View>

              {/* Points */}
              <View style={[styles.pointsBox, isDarkTheme ? styles.darkBox : styles.lightBox, isDarkTheme ? styles.darkOutline : styles.lightOutline]}>
                <Text style={[styles.pointsText, isDarkTheme ? styles.darkText : styles.lightText]}>
                  {item.points} pts
                </Text>
              </View>
            </View>
          </View>
        )}
      />
      <View style={[styles.userPosition, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
        <Text style={[styles.title, isDarkTheme ? styles.darkText : styles.lightText]}> Your Points </Text>
        <View style={[styles.userRow, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
            <View style={[styles.userBox2, isDarkTheme ? styles.darkBox : styles.lightBox, isDarkTheme ? styles.darkOutline : styles.lightOutline]} testID='userBox2'>
              <Text style={[styles.titleText, isDarkTheme ? styles.darkText : styles.lightText]}>
                User: {uname}
              </Text>
            </View>
            <View style={[styles.pointsBox2, isDarkTheme ? styles.darkBox : styles.lightBox, isDarkTheme ? styles.darkOutline : styles.lightOutline]}>
              <Text style={[styles.pointsText, isDarkTheme ? styles.darkText : styles.lightText]}>
                {upoints} pts
              </Text>
            </View>
            <View style={[styles.pointsBox2, isDarkTheme ? styles.darkBox : styles.lightBox, isDarkTheme ? styles.darkOutline : styles.lightOutline]}>
              <Text style={[styles.pointsText, isDarkTheme ? styles.darkText : styles.lightText]}>
                {ustreak} day streak
              </Text>
            </View>
          </View>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    alignSelf: "center", 
    justifyContent: "center", 
    alignItems: "center", 
    //backgroundColor: "#CFB991",
    //height: "90%",
  },
  userPosition: {
    width: "100%",
    height: "20%",
    //backgroundColor: "#CFB991",
    justifyContent: "center",   
    alignItems: "center",        
    flexDirection: "column",       
    gap: 2,       
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  usersItem: {
    padding: 10,
    borderBottomWidth: 1,
    width: '100%',
    alignItems: 'center',
  },
  listContainer: {
    padding: 5,
    width: '80%',
    height: "80%",
    borderWidth: 6,
    //borderColor: "black",
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  userBox: {
    //backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    minWidth: '45%',
    alignItems: 'center',
    //borderColor: 'black',
    borderWidth: 2,
  },
  userBox2: {
    //backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    minWidth: '33%',
    alignItems: 'center',
    //borderColor: 'black',
    borderWidth: 2,
  },
  pointsBox2: { 
    //backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    minWidth: '33%',
    alignItems: 'center',
    //borderColor: 'black',
    borderWidth: 2,
  },
  rankBox: {
    padding: 10,
    borderRadius: 8,
    minWidth: '10%',
    alignItems: 'center',
    //borderColor: 'black',
    borderWidth: 2,
  },
  pointsBox: {
    //backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    minWidth: '45%',
    alignItems: 'center',
    //borderColor: 'black',
    borderWidth: 2,
  },
  pointsText: {
    fontSize: 16,
  },
  titleText: {
    fontSize: 16,
    font: "bold",
  },
  /* Light Mode */
  lightBackground: {
    backgroundColor: "#FFFFFF",
  },
  lightText: {
    color: "#000",
  },
  lightInputContainer: {
    backgroundColor: "#F5F5F5",
  },
  lightInput: {
    backgroundColor: "#FFF",
    borderColor: "#CCC",
    color: "#000",
  },
  lightNoteItem: {
    backgroundColor: "#FFF",
    borderBottomColor: "#DDD",
  },
  lightBox: {
    backgroundColor: "#DEEAEA",
  },
  lightOutline: {
    borderColor: "black",
  },

  /* Dark Mode */
  darkBackground: {
    backgroundColor: "#121212",
  },
  darkText: {
    color: "#F1F1F1",
  },
  darkOutline: {
    borderColor: "white",
  },
  darkInputContainer: {
    backgroundColor: "#1E1E1E",
  },
  darkInput: {
    backgroundColor: "#333",
    borderColor: "#555",
    color: "#F1F1F1",
  },
  darkNoteItem: {
    backgroundColor: "#1E1E1E",
    borderBottomColor: "#555",
  },
  darkBox: {
    backgroundColor: "#879191",
  },
});
