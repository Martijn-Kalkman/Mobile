import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  Button,
  TextInput,
  Alert,
  Vibration,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import {
  fetchMarkersFromSupabase,
  saveMarkerToSupabase,
} from "../../utils/supabaseClient"; // Import functions

const MapScreen = () => {
  const [location, setLocation] = useState(null);
  const [savedLocations, setSavedLocations] = useState([]);
  const [newMarker, setNewMarker] = useState(null);
  const [markerName, setMarkerName] = useState("");

  useEffect(() => {
    // Request notification permissions
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to send notifications was denied");
      }
    };
    requestPermissions();
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
          setLocation(newLocation.coords);
          checkProximity(newLocation.coords); // Check proximity on every location update
        }
      );
    };
    getLocation();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadSavedLocations = async () => {
        try {
          const locations = await AsyncStorage.getItem("savedLocations");
          if (locations) {
            setSavedLocations(JSON.parse(locations));
          }

          const supabaseLocations = await fetchMarkersFromSupabase(); // Fetch from Supabase
          setSavedLocations((prevLocations) => [
            ...prevLocations,
            ...supabaseLocations,
          ]);
        } catch (error) {
          console.error("Failed to load saved locations:", error);
        }
      };
      loadSavedLocations();
    }, [])
  );

  const saveMarker = async () => {
    if (!newMarker) {
      Alert.alert("Error", "Please tap on the map to place a marker.");
      return;
    }
    if (!markerName.trim()) {
      Alert.alert("Error", "Please enter a name for the marker.");
      return;
    }
    try {
      const newMarkerData = {
        latitude: newMarker.latitude,
        longitude: newMarker.longitude,
        name: markerName,
      };

      // Save to local storage
      const storedMarkers = await AsyncStorage.getItem("savedLocations");
      const markers = storedMarkers ? JSON.parse(storedMarkers) : [];
      markers.push(newMarkerData);
      await AsyncStorage.setItem("savedLocations", JSON.stringify(markers));
      setSavedLocations(markers);

      // Save to Supabase using the separate function
      const success = await saveMarkerToSupabase(newMarkerData);
      if (success) {
        setNewMarker(null);
        setMarkerName("");
      }
    } catch (error) {
      console.error("Failed to save marker:", error);
    }
  };

  const checkProximity = (currentLocation) => {
    savedLocations.forEach((marker) => {
      const distance = getDistance(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        { latitude: marker.latitude, longitude: marker.longitude }
      );
      if (distance < 100) {
        // Check for proximity within 100 meters
        Vibration.vibrate(500);
        sendNotification(marker.name); // Correctly send the marker name
      }
    });
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

  const sendNotification = async (markerName) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "You are near a marker!",
        body: `You are near ${markerName}`, // Corrected string interpolation
      },
      trigger: { seconds: 1 }, // Trigger the notification immediately for testing
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tap on the map to add a marker</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter marker name"
        value={markerName}
        onChangeText={setMarkerName}
      />
      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true}
          followsUserLocation={true}
          onPress={(e) => setNewMarker(e.nativeEvent.coordinate)}
        >
          {savedLocations.map((item, index) => (
            <Marker key={index} coordinate={item} title={item.name} />
          ))}
          {newMarker && (
            <Marker
              coordinate={newMarker}
              title={markerName}
              description="New marker"
            />
          )}
        </MapView>
      )}
      <Button title="Save Marker" onPress={saveMarker} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { width: "100%", height: "80%" },
  text: { margin: 10, fontSize: 18, fontWeight: "bold" },
  input: {
    width: "80%",
    padding: 10,
    margin: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    fontSize: 16,
  },
});

export default MapScreen;
