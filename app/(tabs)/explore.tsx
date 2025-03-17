import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Button,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchMarkersFromSupabase } from "../../utils/supabaseClient"; // Import function
import * as Location from "expo-location";

const ExploreScreen = () => {
  const [savedLocations, setSavedLocations] = useState([]);
  const [supabaseLocations, setSupabaseLocations] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    const loadSavedLocations = async () => {
      try {
        // Load locally stored locations
        const locations = await AsyncStorage.getItem("savedLocations");
        if (locations) {
          setSavedLocations(JSON.parse(locations));
        }

        // Fetch locations from Supabase
        const supabaseLocations = await fetchMarkersFromSupabase();
        setSupabaseLocations(supabaseLocations);
      } catch (error) {
        console.error("Error loading locations:", error);
      }
    };

    loadSavedLocations(); // Call the function inside useEffect
  }, []);

  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (newLocation) => {
          setCurrentLocation(newLocation.coords);
        }
      );
    };
    getLocation();
  }, []);

  const clearAsyncStorage = async () => {
    try {
      await AsyncStorage.clear();
      setSavedLocations([]); // Reset local storage state
      console.log("AsyncStorage cache cleared!");
      Alert.alert("Success", "Cache has been cleared!");

      // Ensure Supabase data is still fetched
      const supabaseLocations = await fetchMarkersFromSupabase();
      setSupabaseLocations(supabaseLocations);
    } catch (error) {
      console.error("Failed to clear AsyncStorage:", error);
      Alert.alert("Error", "Failed to clear cache.");
    }
  };

  const getDistance = (loc1, loc2) => {
    const toRad = (angle) => (angle * Math.PI) / 180;
    const R = 6371e3; // Earth radius in meters
    const dLat = toRad(loc2.latitude - loc1.latitude);
    const dLon = toRad(loc2.longitude - loc1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(loc1.latitude)) *
        Math.cos(toRad(loc2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Returns distance in meters
  };

  const isNear = (marker) => {
    if (!currentLocation) return false;
    const distance = getDistance(
      {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      },
      marker
    );
    return distance < 100; // 100 meters threshold for being near the marker
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Saved Locations</Text>
      <Button title="Clear Cache" onPress={clearAsyncStorage} color="red" />

      <FlatList
        data={[...supabaseLocations, ...savedLocations]} // Combine both sources
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => {
          const near = isNear(item); // Check if the current location is near the marker
          return (
            <TouchableOpacity
              style={[styles.card, near && styles.cardNear]} // Apply green color if near
            >
              <Text style={styles.cardText}>{item.name}</Text>
              <Text style={styles.cardSubText}>
                Lat: {item.latitude?.toFixed(6)}, Lng:{" "}
                {item.longitude?.toFixed(6)}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  card: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardNear: {
    backgroundColor: "green", // Change the background color to green if near
  },
  cardText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cardSubText: {
    fontSize: 14,
    color: "#555",
  },
});

export default ExploreScreen;
