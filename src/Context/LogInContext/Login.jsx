import { createContext, useState, useEffect } from "react";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../Service/Firebase";

export const LogInContext = createContext(null);

export const LogInContextProvider = (props) => {
    const [user, setUser] = useState(null);
    const [trip, setTrip] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsAuthenticated(!!currentUser);
        });
        return () => unsubscribe();
    }, []);

    const loginWithPopup = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in:", error);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <LogInContext.Provider value={{user, loginWithPopup, logout, isAuthenticated, trip, setTrip, firebaseUser: user}}>
            {props.children}
        </LogInContext.Provider>
    )   
}
