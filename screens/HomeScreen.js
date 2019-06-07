import React from "react";
import {
  Platform,
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Keyboard,
  TextInput,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stitch, RemoteMongoClient } from "mongodb-stitch-react-native-sdk";

import Confetti from "react-native-confetti";

var height = Dimensions.get("window").height;

export default class HomeScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: false,
      text: ""
    };
  }
  handleSubmit = () => {
    Keyboard.dismiss();
    const stitchAppClient = Stitch.defaultAppClient;
    const mongoClient = stitchAppClient.getServiceClient(
      RemoteMongoClient.factory,
      "mongodb-atlas"
    );
    const db = mongoClient.db("taskmanager");
    const tasks = db.collection("tasks");
    if (this.state.text != "") {
      tasks
        .insertOne({
          status: "new",
          description: this.state.text,
          date: new Date()
        })
        .then(() => {
          if (this._confettiView) {
            this._confettiView.startConfetti();
          }
          this.setState({ value: !this.state.value });
          this.setState({ text: "" });
        })
        .catch(err => {
          console.warn(err);
        });
    }
  };

  static navigationOptions = {
    header: null
  };

  render() {
    return (
      <View style={styles.container}>
        <Confetti
          confettiCount={50}
          timeout={10}
          duration={2000}
          ref={node => (this._confettiView = node)}
        />
        <TextInput
          style={{
            color: "lightgray",
            fontSize: 20,
            marginTop: height / 2 - 60
          }}
          placeholder="Enter Task..."
          onChangeText={text => this.setState({ text })}
          value={this.state.text}
          onSubmitEditing={() => this.handleSubmit()}
        />
        <TouchableOpacity onPress={() => this.handleSubmit()}>
          <Ionicons
            name={Platform.OS == "ios" ? "ios-add-circle" : "md-add-circle"}
            size={50}
            style={{
              marginTop: 50,
              color: "#2e78b7"
            }}
          />
        </TouchableOpacity>
        <ScrollView
          contentContainerStyle={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center"
  }
});
