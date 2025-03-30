import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet
} from 'react-native';
import { useRouter } from "expo-router";
import { API_URL } from '@env';
import { useTheme } from '@react-navigation/native';

export default function leaderboard() {
  const router = useRouter();
  const { isDarkTheme } = useTheme(); // Get dark mode state
  const [users, setUsers] = useState([]);
  const [points, setPoints] = useState(0);
  
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'GET',
      });

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => { fetchUsers() }, []);

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
        style={styles.listContainer}
        data={[...users].sort((a, b) => b.points - a.points)}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={[styles.usersItem, isDarkTheme ? styles.darkNoteItem : styles.lightNoteItem]}>
            <View style={styles.userRow}>
              <View style={styles.userBox}>
                <Text style={[styles.pointsText, isDarkTheme ? styles.darkText : styles.lightText]}>
                  User: {item.username}
                </Text>
              </View>
              <View style={styles.pointsBox}>
                <Text style={[styles.pointsText, isDarkTheme ? styles.darkText : styles.lightText]}>
                  {item.points} pts
                </Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignSelf: "center", 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#CFB991",
    flex: 1,
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
    borderWidth: 6,
    borderColor: "black",
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  userBox: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    minWidth: '50%',
    alignItems: 'center',
  },
  pointsBox: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    minWidth: '50%',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 16,
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

  /* Dark Mode */
  darkBackground: {
    backgroundColor: "#121212",
  },
  darkText: {
    color: "#F1F1F1",
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
});
