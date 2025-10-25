import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import UberWidgetApp from "./src/main/screens/UberWidgetApp";

export default function App() {
  return <UberWidgetApp />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
