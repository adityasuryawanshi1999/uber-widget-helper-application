import React, { useState, useEffect, useRef } from "react";
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
  Platform,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RadioButton } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants"; // gives you the status bar height

export default function UberWidgetApp() {
  const [widgets, setWidgets] = useState([]);
  const [newWidget, setNewWidget] = useState({
    name: "",
    pickup: "",
    dropoff: "",
  });
  const [selectedCabService, setSelectedCabService] = useState("option1");
  const [queryPickup, setQueryPickup] = useState("");
  const [queryDroppoff, setQueryDropoff] = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const typingTimeout = useRef(null); // holds timeout id
  const [selectionPickupText, setSelectionPickupText] = useState(null);
  const [selectionDropoffText, setSelectionDropoffText] = useState(null);
  const pickupTextRef = useRef(null);
  const dropoffTextRef = useRef(null);

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

  const clearAllFields = () => {
    setQueryPickup("");
    setQueryDropoff("");
    setDropoffSuggestions([]);
    setPickupSuggestions([]);
    setNewWidget({
      name: "",
      pickup: "",
      dropoff: "",
    });
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
    setQueryDropoff("");
    setQueryPickup("");
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

  const openUberApp = (pickup, dropoff, label) => {
    const [plat, plon] = pickup.split(",").map(Number);
    const [dlat, dlon] = dropoff.split(",").map(Number);
    let url = ``;

    url =
      `uber://?action=setPickup` +
      `&pickup[latitude]=${plat}` +
      `&pickup[longitude]=${plon}` +
      `&dropoff[latitude]=${dlat}` +
      `&dropoff[longitude]=${dlon}` +
      `&dropoff[nickname]=${encodeURIComponent(label || "Destination")}`;

    Linking.openURL(url).catch(() => {
      Alert.alert(
        "Cab service App not found",
        "Please install the app to use this shortcut."
      );
    });
  };

  const openOlaApp = (pickup, dropoff, label) => {
    const [plat, plon] = pickup.split(",").map(Number);
    const [dlat, dlon] = dropoff.split(",").map(Number);
    let url = ``;

    url =
      `olacabs://app/launch?lat=${plat}` +
      `&lng=${plon}` +
      `&drop_lat=${dlat}` +
      `&drop_lng=${dlon}`;

    Linking.openURL(url).catch(() => {
      Alert.alert(
        "Cab service App not found",
        "Please install the app to use this shortcut."
      );
    });
  };

  const openCabApps = (pickup, dropoff, label) => {
    if (selectedCabService === "option1") {
      openUberApp(pickup, dropoff, label);
    } else if (selectedCabService === "option2") {
      openOlaApp(pickup, dropoff, label);
    } else {
      openUberApp(pickup, dropoff, label);
      openOlaApp(pickup, dropoff, label);
    }
  };

  const fetchLocations = async (text, field) => {
    if (field === "pickup") {
      setQueryPickup(text);
    } else {
      setQueryDropoff(text);
    }
    if (text.length < 3) {
      if (field === "pickup") {
        setPickupSuggestions([]);
      } else {
        setDropoffSuggestions([]);
      }
      return;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        text
      )}&limit=5`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "my-expo-app", // required
          "Accept-Language": "en", // optional
        },
      });
      const data = await response.json();
      if (field === "pickup") {
        setPickupSuggestions(data);
      } else {
        setDropoffSuggestions(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelect = (item, field) => {
    if (field === "pickup") {
      setQueryPickup(item.display_name);
      setPickupSuggestions([]);
    } else {
      setQueryDropoff(item.display_name);
      setDropoffSuggestions([]);
    }
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    if (field === "pickup") {
      setNewWidget({ ...newWidget, pickup: lat + "," + lon });
    } else {
      setNewWidget({ ...newWidget, dropoff: lat + "," + lon });
    }
  };

  const handlePickupTextChange = (text) => {
    setQueryPickup(text);
    // setPickupSuggestions([]);
    // Clear previous timer
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    // Wait 600ms after user stops typing
    typingTimeout.current = setTimeout(() => {
      fetchLocations(text, "pickup");
    }, 600);
    // setNewWidget({ ...newWidget, pickup: lat + "," + lon });
  };

  const handleDropoffTextChange = (text) => {
    setQueryDropoff(text);

    // Clear previous timer
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    // Wait 600ms after user stops typing
    typingTimeout.current = setTimeout(() => {
      fetchLocations(text, "dropoff");
    }, 600);
  };

  const handleBlur = (field) => {
    // Set cursor to the beginning on blur
    if (field === "pickup") {
      if (pickupTextRef.current) setSelectionPickupText({ start: 0, end: 0 });
    } else {
      if (dropoffTextRef.current) setSelectionDropoffText({ start: 0, end: 0 });
    }
  };

  const handleFocus = (field) => {
    // Reset the selection state so the user can move the cursor normally
    // after re-focusing.
    if (field === "pickup") {
      setSelectionPickupText(null);
    } else {
      setSelectionDropoffText(null);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingTop:
          Platform.OS === "android"
            ? StatusBar.currentHeight // Android notch/status bar height
            : Constants.statusBarHeight, // iOS status bar height
      }}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <View style={styles.container}>
        <Text style={styles.title}>Quick Routes 🚗</Text>

        <TextInput
          placeholder="Shortcut Name"
          placeholderTextColor="black"
          value={newWidget.name}
          onChangeText={(t) => setNewWidget({ ...newWidget, name: t })}
          style={styles.input}
        />

        <View>
          <TextInput
            placeholder="Enter pickup location"
            placeholderTextColor="black"
            value={queryPickup}
            onChangeText={handlePickupTextChange}
            style={styles.input}
            ref={pickupTextRef}
            onBlur={() => handleBlur("pickup")}
            onFocus={() => handleFocus("pickup")}
            selection={selectionPickupText}
          />
          {pickupSuggestions.length > 0 && (
            <FlatList
              data={pickupSuggestions}
              keyExtractor={(item) => item.place_id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => handleSelect(item, "pickup")}
                >
                  <Text>{item.display_name}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        <View>
          <TextInput
            placeholder="Enter drop location"
            placeholderTextColor="black"
            value={queryDroppoff}
            onChangeText={handleDropoffTextChange}
            style={styles.input}
            ref={dropoffTextRef}
            onBlur={() => handleBlur("dropoff")}
            onFocus={() => handleFocus("dropoff")}
            selection={selectionDropoffText}
          />
          {dropoffSuggestions.length > 0 && (
            <FlatList
              data={dropoffSuggestions}
              keyboardShouldPersistTaps="always"
              keyExtractor={(item) => item.place_id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => handleSelect(item, "dropoff")}
                >
                  <Text>{item.display_name}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        <TextInput
          placeholder="Pickup (lat,lng)"
          placeholderTextColor="black"
          value={newWidget.pickup}
          onChangeText={(t) => setNewWidget({ ...newWidget, pickup: t })}
          style={styles.input}
        />
        <TextInput
          placeholder="Dropoff (lat,lng)"
          placeholderTextColor="black"
          value={newWidget.dropoff}
          onChangeText={(t) => setNewWidget({ ...newWidget, dropoff: t })}
          style={styles.input}
        />
        <View
          style={{
            //   flex: 1,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View style={styles.eightyPercentWithMargin}>
            <Button title="Add Shortcut" onPress={addWidget} />
          </View>
          <View style={styles.twentyPercent}>
            {/* <Button title="Clear" onPress={clearAllFields} /> */}
            <TouchableOpacity
              onPress={clearAllFields}
              style={{
                backgroundColor: "#636363",
                flex: 1,
                borderRadius: 8,
              }}
            >
              <Text
                style={[
                  { color: "white", textAlign: "center", margin: "auto" },
                ]}
              >
                CLEAR
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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

            {/* Second radio button for NextJs */}
            <View style={styles.radioButton}>
              <RadioButton.Android
                value="option3"
                status={
                  selectedCabService === "option3" ? "checked" : "unchecked"
                }
                onPress={() => setSelectedCabService("option3")}
                color="#007BFF" // Custom color for the radio button
              />
              <Text style={styles.radioLabel}>Both</Text>
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
                  onPress={() =>
                    openCabApps(item.pickup, item.dropoff, item.name)
                  }
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
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9fafc",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
    // paddingTop: 30,
    // marginTop: 10,
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
  eightyPercentWithMargin: {
    flex: 8, // 8 / (8+2) = 80%
    marginRight: 5,
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
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    // backgroundColor: "#fff",
    backgroundColor: "grey",
    marginBottom: 5,
  },
});
