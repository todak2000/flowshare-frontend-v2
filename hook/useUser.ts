/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useUser.ts
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { User } from "../types";
import { auth, db } from "../lib/firebase";
import { userDB } from "../constants";

export function useUser() {
  const [user, setUser] = useState<{
    auth: any;
    data: User | null;
    loading: boolean;
  }>({
    auth: null,
    data: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, userDB, firebaseUser.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data() as User;
            setUser({
              auth: firebaseUser,
              data: userData,
              loading: false,
            });
          } else {
            setUser({
              auth: firebaseUser,
              data: null,
              loading: false,
            });
          }
        });
        return () => unsubscribeSnapshot();
      } else {
        setUser({
          auth: null,
          data: null,
          loading: false,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return user;
}
