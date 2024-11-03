import { useStore } from "@/app/store";
import { Redirect } from "expo-router";

export default function Index() {
  const loggedIn = useStore((s) => s.loggedIn);
  console.log(`loggedIn: ${loggedIn}`);

  if (loggedIn) {
    return <Redirect href="/main" />;
  } else {
    return <Redirect href="/login" />;
  }
}
