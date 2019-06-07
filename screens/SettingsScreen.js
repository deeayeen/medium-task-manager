import React from "react";
import {
  RefreshControl,
  Platform,
  SectionList,
  Image,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Constants } from "expo";
import Swipeout from "react-native-swipeout";
import moment from "moment/min/moment-with-locales";
import { AntDesign, Ionicons } from "@expo/vector-icons";

import { Stitch, RemoteMongoClient } from "mongodb-stitch-react-native-sdk";

export default class SettingsScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentUserId: undefined,
      client: undefined,
      tasks: undefined,
      refreshing: false
    };
    this._loadClient = this._loadClient.bind(this);
  }

  componentDidMount() {
    this._loadClient();
  }

  _onRefresh = () => {
    this.setState({ refreshing: true });
    const stitchAppClient = Stitch.defaultAppClient;
    const mongoClient = stitchAppClient.getServiceClient(
      RemoteMongoClient.factory,
      "mongodb-atlas"
    );
    const db = mongoClient.db("taskmanager");
    const tasks = db.collection("tasks");
    tasks
      .find(
        {
          status: "completed"
        },
        { sort: { date: -1 } }
      )
      .asArray()
      .then(docs => {
        this.setState({ tasks: docs });
        this.setState({ refreshing: false });
      })
      .catch(err => {
        console.warn(err);
      });
  };

  render() {
    const { manifest } = Constants;
    const sections =
      this.state.tasks == undefined
        ? [{ data: [{ title: "Loading..." }], title: "Loading..." }]
        : this.state.tasks.length > 0
        ? [{ data: this.state.tasks, title: "Completed tasks" }]
        : [
            {
              data: [{ title: "No completed tasks" }],
              title: "No completed tasks"
            }
          ];

    return (
      <SectionList
        style={{ ...styles.container }}
        renderItem={this._renderItem}
        renderSectionHeader={this._renderSectionHeader}
        stickySectionHeadersEnabled={true}
        keyExtractor={(item, index) => index}
        sections={sections}
        refreshControl={
          <RefreshControl
            refreshing={this.state.refreshing}
            onRefresh={this._onRefresh}
          />
        }
      />
    );
  }

  _renderSectionHeader = ({ section }) => {
    return <SectionHeader title={section.title} />;
  };

  _renderItem = ({ item }) => {
    return (
      <SectionContent>
        <Swipeout
          autoClose={true}
          backgroundColor="none"
          right={[
            {
              component: (
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column"
                  }}
                >
                  <Ionicons
                    name={Platform.OS == "ios" ? "ios-archive" : "md-archive"}
                    size={30}
                    style={{ textAlign: "center", color: "white" }}
                  />
                </View>
              ),
              backgroundColor: "#2e78b7",
              onPress: () => this._onPressArchive(item._id)
            }
          ]}
        >
          <View style={styles.taskListTextTime}>
            {item.title != "No completed tasks" &&
            item.title != "Loading..." ? (
              <Text style={styles.taskListTextTime}>
                created {moment(item.date).fromNow()}
              </Text>
            ) : item.title == "No completed tasks" ? (
              <AntDesign
                name={Platform.OS == "ios" ? "smileo" : "smileo"}
                size={30}
                style={{
                  textAlign: "center",
                  color: "lightgray",
                  marginTop: 25
                }}
              />
            ) : (
              <Text />
            )}
          </View>
          <Text style={styles.sectionContentText}>
            {item.title != "No completed tasks" ? item.description : ""}
          </Text>
          <Text style={styles.taskListTextTimeComplete}>
            {item.title != "No completed tasks" && item.title != "Loading..."
              ? "completed " + moment(item.completedDate).fromNow()
              : null}
          </Text>
        </Swipeout>
      </SectionContent>
    );
  };

  _loadClient() {
    const stitchAppClient = Stitch.defaultAppClient;
    const mongoClient = stitchAppClient.getServiceClient(
      RemoteMongoClient.factory,
      "mongodb-atlas"
    );
    const db = mongoClient.db("taskmanager");
    const tasks = db.collection("tasks");
    tasks
      .find(
        {
          status: "completed"
        },
        { sort: { date: -1 } }
      )
      .asArray()
      .then(docs => {
        this.setState({ tasks: docs });
      })
      .catch(err => {
        console.warn(err);
      });
  }
  _onPressArchive(itemID) {
    const stitchAppClient = Stitch.defaultAppClient;
    const mongoClient = stitchAppClient.getServiceClient(
      RemoteMongoClient.factory,
      "mongodb-atlas"
    );
    const db = mongoClient.db("taskmanager");
    const tasks = db.collection("tasks");
    tasks
      .updateOne(
        { _id: itemID },
        { $set: { status: "archived", archivedDate: new Date() } },
        { upsert: true }
      )
      .then(() => {
        tasks
          .find({ status: "completed" }, { sort: { date: -1 } })
          .asArray()
          .then(docs => {
            this.setState({ tasks: docs });
          })
          .catch(err => {
            console.warn(err);
          });
      })
      .catch(err => {
        console.warn(err);
      });
  }
}

const SectionHeader = ({ title }) => {
  return (
    <View style={styles.sectionHeaderContainer}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
};

const SectionContent = props => {
  return <View style={styles.sectionContentContainer}>{props.children}</View>;
};

SettingsScreen.navigationOptions = {
  headerTitle: (
    <Ionicons
      name={
        Platform.OS == "ios"
          ? "ios-checkmark-circle-outline"
          : "md-checkmark-circle-outline"
      }
      size={23}
      style={{
        color: "#2e78b7",
        flex: 1,
        textAlign: "center"
      }}
      resizeMode="contain"
    />
  )
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  titleContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 15,
    flexDirection: "row"
  },
  titleIconContainer: {
    marginRight: 15,
    paddingTop: 2
  },
  sectionHeaderContainer: {
    backgroundColor: "#fbfbfb",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ededed",
    alignItems: "center"
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "bold"
  },
  sectionContentContainer: {
    paddingHorizontal: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "lightgray"
  },
  sectionContentText: {
    color: "black",
    fontSize: 15,
    paddingBottom: 10,
    paddingHorizontal: 10,
    textAlign: "left"
  },
  taskListTextTime: {
    paddingHorizontal: 15,
    paddingVertical: 3,
    textAlign: "center",
    color: "lightgray"
  },
  taskListTextTimeComplete: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    textAlign: "left",
    color: "green",
    fontSize: 13
  }
});
