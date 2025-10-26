import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  FlatList,
  Linking,
  Alert,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RadioButton } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";

export default function UberWidgetApp() {
  const [widgets, setWidgets] = useState([]);
  const [newWidget, setNewWidget] = useState({
    name: "",
    pickup: "",
    dropoff: "",
  });
  const [selectedCabService, setSelectedCabService] = useState("option1");

  useEffect(() => {
    loadWidgets();
  }, []);

  const loadWidgets = async () => {
    const stored = await AsyncStorage.getItem("widgets");
    if (stored) setWidgets(JSON.parse(stored));
  };

  const saveWidgets = async (newList) => {
    setWidgets(newList);
    await AsyncStorage.setItem("widgets", JSON.stringify(newList));
  };

  const addWidget = () => {
    if (!newWidget.name || !newWidget.pickup || !newWidget.dropoff) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }

    // Validate coordinates
    if (
      !isValidCoordinates(newWidget.pickup) ||
      !isValidCoordinates(newWidget.dropoff)
    ) {
      Alert.alert(
        "Error",
        "Coordinates must be in the format lat,lng (numbers)."
      );
      return;
    }

    const newList = [...widgets, newWidget];
    saveWidgets(newList);
    setNewWidget({ name: "", pickup: "", dropoff: "" });
  };

  const deleteShortcut = (index) => {
    const newList = widgets.filter((_, i) => i !== index);
    saveWidgets(newList);
  };

  const isValidCoordinates = (coord) => {
    const parts = coord.split(",");
    if (parts.length !== 2) return false;
    return !isNaN(parts[0]) && !isNaN(parts[1]);
  };

  const openCabApp = (pickup, dropoff, label) => {
    const [plat, plon] = pickup.split(",").map(Number);
    const [dlat, dlon] = dropoff.split(",").map(Number);
    let url = ``;

    if (selectedCabService === "option1") {
      // Construct Uber deep link
      url =
        `uber://?action=setPickup` +
        `&pickup[latitude]=${plat}` +
        `&pickup[longitude]=${plon}` +
        `&dropoff[latitude]=${dlat}` +
        `&dropoff[longitude]=${dlon}` +
        `&dropoff[nickname]=${encodeURIComponent(label || "Destination")}`;
    } else {
      url =
        `olacabs://app/launch?lat=${plat}` +
        `&lng=${plon}` +
        `&drop_lat=${dlat}` +
        `&drop_lng=${dlon}`;
    }

    Linking.openURL(url).catch(() => {
      Alert.alert(
        "Cab service App not found",
        "Please install the app to use this shortcut."
      );
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Routes 🚗</Text>

      <TextInput
        placeholder="Shortcut Name"
        value={newWidget.name}
        onChangeText={(t) => setNewWidget({ ...newWidget, name: t })}
        style={styles.input}
      />
      <TextInput
        placeholder="Pickup (lat,lng)"
        value={newWidget.pickup}
        onChangeText={(t) => setNewWidget({ ...newWidget, pickup: t })}
        style={styles.input}
      />
      <TextInput
        placeholder="Dropoff (lat,lng)"
        value={newWidget.dropoff}
        onChangeText={(t) => setNewWidget({ ...newWidget, dropoff: t })}
        style={styles.input}
      />
      <Button title="Add Shortcut" onPress={addWidget} />
      <View style={styles.radioContainer}>
        <View style={styles.radioGroup}>
          {/* First radio button for ReactJS */}
          <View style={styles.radioButton}>
            <RadioButton.Android
              value="option1"
              status={
                selectedCabService === "option1" ? "checked" : "unchecked"
              }
              onPress={() => setSelectedCabService("option1")}
              color="#007BFF" // Custom color for the radio button
            />
            <Text style={styles.radioLabel}>Uber</Text>
          </View>

          {/* Second radio button for NextJs */}
          <View style={styles.radioButton}>
            <RadioButton.Android
              value="option2"
              status={
                selectedCabService === "option2" ? "checked" : "unchecked"
              }
              onPress={() => setSelectedCabService("option2")}
              color="#007BFF" // Custom color for the radio button
            />
            <Text style={styles.radioLabel}>Ola</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={widgets}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.shortcutContainer}>
            <View style={styles.eightyPercent}>
              <TouchableOpacity
                style={styles.shortcut}
                onPress={() => openCabApp(item.pickup, item.dropoff, item.name)}
              >
                <Text style={styles.shortcutText}>{item.name}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.twentyPercent}>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteShortcut(index)}
              >
                {/* <Text>Delete</Text> */}
                <MaterialIcons
                  name="delete"
                  size={30}
                  color="white"
                  style={{ textAlign: "center" }}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shortcutContainer: {
    // marginTop: 5,
    // marginBottom: 5,
    flex: 1,
    flexDirection: "row", // arrange children horizontally
    width: "100%",
    height: 70,
    alignItems: "center",
    // paddingTop: 10,
  },
  deleteBtn: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: "red",
    borderRadius: 8,
  },
  container: { flex: 1, padding: 20, backgroundColor: "#f9fafc" },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
    paddingTop: 30,
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  shortcut: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#222",
    // marginBottom: 10,
  },
  shortcutText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  //   coordText: { color: "#ddd", fontSize: 14, marginTop: 2 },
  eightyPercent: {
    flex: 8, // 8 / (8+2) = 80%
    // backgroundColor: "skyblue",
  },
  twentyPercent: {
    flex: 2, // 2 / (8+2) = 20%
    // backgroundColor: "salmon",
  },
  radioContainer: {
    marginTop: 10,
    // marginBottom: 20,
    // flex: 1, // Take up the full screen
    // backgroundColor: "#F5F5F5", // Light gray background
    // justifyContent: "space-around", // Center content vertically
    // alignItems: "center", // Center content horizontally
    height: 70,
  },
  radioGroup: {
    flex: 1,
    flexDirection: "row", // Arrange radio buttons in a row
    alignItems: "center", // Align items vertically in the center
    justifyContent: "space-around", // Space out radio buttons evenly
    marginTop: 5, // Add margin at the top,
    marginBottom: 5,
    borderRadius: 8, // Rounded corners
    backgroundColor: "white", // White background for the group
    padding: 16, // Padding inside the group
    elevation: 4, // Shadow for Android
    shadowColor: "#000", // Shadow color for iOS
    shadowOffset: {
      width: 0,
      height: 2, // Shadow offset for iOS
    },
    shadowOpacity: 0.25, // Shadow opacity for iOS
    shadowRadius: 3.84, // Shadow radius for iOS
  },
  radioButton: {
    flexDirection: "row", // Arrange radio button and label in a row
    alignItems: "center", // Align items vertically in the center
  },
  radioLabel: {
    marginLeft: 8, // Space between radio button and label
    fontSize: 16, // Font size for the label
    color: "#333", // Dark gray color for the label
  },
});
