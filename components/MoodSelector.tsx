import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const MoodSelector = () => {
    const moods = [
        { color: "#FF6B6B", icon: "sad-outline" },
        { color: "#FFD93D", icon: "happy-outline" },
        { color: "#6BCB77", icon: "leaf-outline" },
        { color: "#4D96FF", icon: "water-outline" },
        { color: "#9B59B6", icon: "star-outline" },
    ];

    return (
        <View style={styles.container}>
            {moods.map((mood, index) => (
                <TouchableOpacity
                    key={index}
                    style={[styles.moodButton, { backgroundColor: mood.color }]}
                >
                    <Ionicons name={mood.icon as any} size={24} color="white" />
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginVertical: 20,
    },
    moodButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
    },
});
