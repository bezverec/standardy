import { ClerkProvider } from "@clerk/react";
import { EditorApp } from "./EditorApp.tsx";

export default function AuthenticatedEditor({ publishableKey }: { publishableKey: string }) {
  return <ClerkProvider publishableKey={publishableKey}><EditorApp /></ClerkProvider>;
}
