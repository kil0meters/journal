import { ReactElement } from "react";
import { Text, View } from "react-native";

export default function CustomHeader({
  title,
  color,
  button,
}: {
  title: any;
  color: any;
  button?: () => ReactElement;
}) {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: "row",
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: color,
          fontWeight: "condensedBold",
          fontFamily: "Helvetica Neue",
          fontSize: 24,
        }}
      >
        {title}
      </Text>
      {button && <View style={{ marginLeft: "auto" }}>{button()}</View>}
    </View>
  );
}
