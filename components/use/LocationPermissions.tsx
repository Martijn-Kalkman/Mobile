import React, { useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";

const LocationPermissions = () => {
  useEffect(() => {
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
          // Handle location updates
        }
      );
    };
    getLocation();
  }, []);

  return null;
};

export default LocationPermissions;
