import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Button,
  Alert,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fetchMarkersFromSupabase,
  subscribeToMarkers,
} from "../../utils/supabaseClient";
import * as Location from "expo-location";
import "../../global.css";

const ExploreScreen = () => {
  const [savedLocations, setSavedLocations] = useState([]);
  const [supabaseLocations, setSupabaseLocations] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const locations = await AsyncStorage.getItem("savedLocations");
        if (locations) {
          setSavedLocations(JSON.parse(locations));
        }
        const supabaseLocations = await fetchMarkersFromSupabase();
        setSupabaseLocations(supabaseLocations);
      } catch (error) {
        console.error("Error loading locations:", error);
      }
    };

    loadLocations();

    const unsubscribe = subscribeToMarkers((updatedLocations) => {
      setSupabaseLocations(updatedLocations);
    });

    return () => unsubscribe();
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
      setSavedLocations([]);
      console.log("AsyncStorage cache cleared!");
      Alert.alert("Success", "Cache has been cleared!");
      const supabaseLocations = await fetchMarkersFromSupabase();
      setSupabaseLocations(supabaseLocations);
    } catch (error) {
      console.error("Failed to clear AsyncStorage:", error);
      Alert.alert("Error", "Failed to clear cache.");
    }
  };

  const getDistance = (loc1, loc2) => {
    const toRad = (angle) => (angle * Math.PI) / 180;
    const R = 6371e3;
    const dLat = toRad(loc2.latitude - loc1.latitude);
    const dLon = toRad(loc2.longitude - loc1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(loc1.latitude)) *
        Math.cos(toRad(loc2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const isNear = (marker) => {
    if (!currentLocation) return false;
    const distance = getDistance(currentLocation, marker);
    return distance < 100;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const locations = await AsyncStorage.getItem("savedLocations");
      if (locations) {
        setSavedLocations(JSON.parse(locations));
      }
      const supabaseLocations = await fetchMarkersFromSupabase();
      setSupabaseLocations(supabaseLocations);
    } catch (error) {
      console.error("Error refreshing locations:", error);
    }
    setIsRefreshing(false);
  };

  return (
    <View className="flex-1 p-5 bg-white">
      <Text className="text-xl font-bold mb-3">Saved Locations</Text>
      <Button title="Clear Cache" onPress={clearAsyncStorage} color="red" />
      <FlatList
        data={[...supabaseLocations, ...savedLocations]}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => {
          const near = isNear(item);
          return (
            <TouchableOpacity
              className={`p-4 my-1 rounded-lg shadow-md ${
                near ? "bg-green-500" : "bg-gray-100"
              }`}
            >
              <Text className="text-lg font-bold">{item.name}</Text>
              <Text className="text-sm text-gray-600">
                Lat: {item.latitude?.toFixed(6)}, Lng:{" "}
                {item.longitude?.toFixed(6)}
              </Text>
            </TouchableOpacity>
          );
        }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      />
    </View>
  );
};

export default ExploreScreen;
