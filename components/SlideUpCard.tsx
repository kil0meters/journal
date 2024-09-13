import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from "react-native";

const { height } = Dimensions.get("window");

const SlideUpCard = () => {
  const [isOpen, setIsOpen] = useState(true);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const toggleCard = () => {
    const toValue = isOpen ? 0 : 1;

    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
    }).start();

    setIsOpen(!isOpen);
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height - 100, height / 2],
  });

  return (
    <Animated.View style={[styles.card, { transform: [{ translateY }] }]}>
      <TouchableOpacity onPress={toggleCard} style={styles.handle}>
        <View style={styles.handleBar} />
      </TouchableOpacity>
      <Text style={styles.title}>Slide-up Card</Text>
      <Text style={styles.content}>
        This is the content of the slide-up card. You can add any components or
        information here.
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: height - 100,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  handleBar: {
    width: 50,
    height: 5,
    backgroundColor: "#DDDDDD",
    borderRadius: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  content: {
    fontSize: 16,
  },
});

export default SlideUpCard;
