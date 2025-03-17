import React, { useEffect, useState } from "react";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { StyleSheet, View, Alert, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { deleteMarkerFromSupabase } from "../../utils/supabaseClient"; // Import Supabase delete function

const MapScreen = ({ savedLocations, handleMapPress, setSavedLocations }) => {
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setCurrentLocation(loc.coords);
    };

    getLocation();
  }, []);

  const deleteMarker = async (index) => {
    try {
      const markers = [...savedLocations];
      const markerToDelete = markers[index];

      Alert.alert(
        "Delete Marker",
        `Are you sure you want to delete "${markerToDelete.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            onPress: async () => {
              const success = await deleteMarkerFromSupabase(
                markerToDelete.latitude,
                markerToDelete.longitude
              );

              if (success) {
                markers.splice(index, 1);
                setSavedLocations(markers);
                await AsyncStorage.setItem(
                  "savedLocations",
                  JSON.stringify(markers)
                );
              } else {
                Alert.alert("Error", "Failed to delete marker from Supabase");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Failed to delete marker:", error);
    }
  };

  if (!currentLocation) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
      onPress={handleMapPress} // Handle adding a new marker
      showsUserLocation={true}
      followsUserLocation={true}
    >
      {savedLocations.map((loc, index) => (
        <Marker
          key={index}
          coordinate={{
            latitude: loc.latitude,
            longitude: loc.longitude,
          }}
          title={loc.name}
          onPress={() => deleteMarker(index)} // Handle marker deletion on press
        />
      ))}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
  },
});

export default MapScreen;
