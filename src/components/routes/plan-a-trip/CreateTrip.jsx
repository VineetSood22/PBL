import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  PROMPT,
  SelectBudgetOptions,
  SelectNoOfPersons,
  SelectTransportationOptions,
  SelectInterestsOptions,
} from "../../constants/Options";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { FcGoogle } from "react-icons/fc";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { chatSession } from "@/Service/AiModel";
import { LogInContext } from "@/Context/LogInContext/Login";
import { db } from "@/Service/Firebase";
import { doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useJsApiLoader, Autocomplete as GoogleAutocomplete } from "@react-google-maps/api";
import { libraries } from "@/Service/GlobalApi";

function CreateTrip({ createTripPageRef }) {
  const [place, setPlace] = useState("");
  const [formData, setFormData] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autocomplete, setAutocomplete] = useState(null);
  const navigate = useNavigate();

  const { user, loginWithPopup, isAuthenticated, firebaseUser } = useContext(LogInContext);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAP_API_KEY,
    libraries: libraries,
  });

  const handleInputChange = (name, value) => {
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const SignIn = async () => {
    try {
      await loginWithPopup();
    } catch (error) {
      console.error("SignIn failed:", error);
      toast.error("Sign In failed. Please try again.");
    }
  };

  const SaveUser = async () => {
    const auth = getAuth();
    console.log("Context user:", user);
    console.log("Firebase auth currentUser:", auth.currentUser);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("User must be logged in to save data.");
      toast.error("User must be logged in to save data.");
      return;
    }
    const id = currentUser.uid;
    try {
      await setDoc(doc(db, "users", id), {
        userName: currentUser.displayName || "Unknown User",
        userEmail: currentUser.email || "unknown@example.com",
        userPicture: currentUser.photoURL || null,
        userNickname: currentUser.displayName || "Unknown",
      });
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("Failed to save user data");
    }
  };

  useEffect(() => {
    if (user && isAuthenticated) {
      localStorage.setItem("User", JSON.stringify(user));
      SaveUser();
    }
  }, [user]);

  const SaveTrip = async (TripData) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("No authenticated user in Firebase Auth.");
      toast.error("User must be logged in to save trip.");
      return;
    }
    console.log("Saving trip for user:", currentUser.uid, currentUser.displayName);
    const User = JSON.parse(localStorage.getItem("User"));
    const id = Date.now().toString();
    const tripDocId = currentUser.uid + "_" + id;
    setIsLoading(true);
    try {
      // Validate TripData
      if (!TripData || typeof TripData !== 'object') {
        throw new Error("Invalid trip data provided.");
      }

      const tripData = {
        tripId: tripDocId,
        userId: currentUser.uid,
        userSelection: formData,
        tripData: TripData,
        userName: currentUser.displayName || User?.name || "Unknown User",
        userEmail: currentUser.email || User?.email || "unknown@example.com",
      };

      // Deep clean the data to remove undefined, null, NaN, and non-serializable fields
      const cleanData = {};
      const cleanValue = (value) => {
        if (value === undefined || value === null || (typeof value === 'number' && isNaN(value))) {
          return undefined;
        }
        if (typeof value === 'object' && !Array.isArray(value)) {
          const cleanedObj = {};
          Object.keys(value).forEach(k => {
            const cleaned = cleanValue(value[k]);
            if (cleaned !== undefined) {
              cleanedObj[k] = cleaned;
            }
          });
          return Object.keys(cleanedObj).length > 0 ? cleanedObj : undefined;
        }
        if (Array.isArray(value)) {
          const cleanedArr = value.map(cleanValue).filter(v => v !== undefined);
          return cleanedArr.length > 0 ? cleanedArr : undefined;
        }
        // Only allow primitive types and serializable objects
        if (typeof value === 'function' || typeof value === 'symbol') {
          return undefined;
        }
        return value;
      };

      Object.keys(tripData).forEach(key => {
        const cleaned = cleanValue(tripData[key]);
        if (cleaned !== undefined) {
          cleanData[key] = cleaned;
        }
      });

      console.log("Clean trip data to save:", cleanData);

      // Ensure cleanData is not empty
      if (Object.keys(cleanData).length === 0) {
        throw new Error("No valid data to save after cleaning.");
      }

      await setDoc(doc(db, "Trips", tripDocId), cleanData);
      localStorage.setItem("Trip", JSON.stringify(TripData));
      localStorage.setItem("UserSelection", JSON.stringify(formData));
      navigate("/my-trips/" + tripDocId);
    } catch (error) {
      console.error("Error saving trip:", error);
      if (error.code === 'permission-denied') {
        toast.error("Permission denied. Please check Firestore security rules.");
      } else {
        toast.error("Failed to save trip data: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateTrip = async () => {
    if (!isAuthenticated) {
      toast("Sign In to continue", {
        icon: "⚠️",
      });
      return setIsDialogOpen(true);
    }
    if (
      !formData?.noOfDays ||
      !formData?.location ||
      !formData?.People ||
      !formData?.Budget ||
      !formData?.transportation ||
      !formData?.interests ||
      !formData?.startDate ||
      !formData?.endDate
    ) {
      return toast.error("Please fill out every field or select every option.");
    }
    if (formData?.interests?.length === 0) {
      return toast.error("Please select at least one interest.");
    }
    if (new Date(formData?.startDate) >= new Date(formData?.endDate)) {
      return toast.error("Start date must be before end date.");
    }

    // New validation: check if date range matches noOfDays
    const start = new Date(formData?.startDate);
    const end = new Date(formData?.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive of start and end

    if (diffDays > formData?.noOfDays) {
      return toast.error(`Date range exceeds number of days selected (${formData.noOfDays}). Please adjust your dates.`);
    }

    if (formData?.noOfDays > 5) {
      return toast.error("Please enter Trip Days less then 5");
    }
    if (formData?.noOfDays < 1) {
      return toast.error("Invalid number of Days");
    }
    const interestsString = Array.isArray(formData?.interests) ? formData.interests.join(", ") : formData?.interests;
    const FINAL_PROMPT = PROMPT.replace(/{location}/g, formData?.location)
      .replace(/{noOfDays}/g, formData?.noOfDays)
      .replace(/{People}/g, formData?.People)
      .replace(/{Budget}/g, formData?.Budget)
      .replace(/{transportation}/g, formData?.transportation)
      .replace(/{interests}/g, interestsString)
      .replace(/{startDate}/g, formData?.startDate)
      .replace(/{endDate}/g, formData?.endDate);

    try {
      const toastId = toast.loading("Generating Trip", {
        icon: "✈️",
      });

      setIsLoading(true);
      const result = await chatSession.sendMessage(FINAL_PROMPT);
      const trip = JSON.parse(result.response.text());

      console.log("Raw trip data from AI model:", trip);

      // Transform trip data to include itinerary if missing
      if (!trip.itinerary && trip.hotels) {
        trip.itinerary = trip.hotels.map((hotel, index) => ({
          day: index + 1,
          title: `Day ${index + 1}`,
          places: [hotel],
        }));
      }

      console.log("Transformed trip itinerary:", trip.itinerary);
      if (trip.itinerary && Array.isArray(trip.itinerary)) {
        trip.itinerary.forEach(day => {
          if (day.places && Array.isArray(day.places)) {
            console.log(`Day ${day.day} places count:`, day.places.length);
          } else {
            console.log(`Day ${day.day} has no places array or it is not an array.`);
          }
        });
      } else {
        console.log("trip.itinerary is undefined or not an array.");
      }

      setIsLoading(false);
      SaveTrip(trip);

      toast.dismiss(toastId);
      toast.success("Trip Generated Successfully");
    } catch (error) {
      setIsLoading(false);
      toast.dismiss();
      toast.error("Failed to generate trip. Please try again.");
      console.error(error);
    }
  };

  if (!isLoaded) {
    return <div>Loading Google Maps...</div>;
  }

  return (
    <div ref={createTripPageRef} className="mt-10 text-center">
      <div className="text">
        <h2 className="text-3xl md:text-5xl font-bold mb-5 flex items-center justify-center">
          <span className="hidden md:block">🚀</span>{" "}
          <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
            Share Your Travel Preferences{" "}
          </span>{" "}
          <span className="hidden md:block">🚀</span>
        </h2>
        <p className="opacity-90 mx-auto text-center text-md md:text-xl font-medium tracking-tight text-primary/80">
          Embark on your dream adventure with just a few simple details. <br />
          <span className="bg-gradient-to-b text-2xl from-blue-400 to-blue-700 bg-clip-text text-center text-transparent">
            SAFAR AI
          </span>{" "}
          <br /> will curate a personalized itinerary, crafted to match your
          unique preferences!
        </p>
      </div>

      <div className="form mt-14 flex flex-col gap-16 md:gap-20 ">
        <div className="place">
          <h2 className="font-semibold text-lg md:text-xl mb-3 ">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              Where do you want to Explore?
            </span>{" "}
            🏖️
          </h2>

          <GoogleAutocomplete
            onLoad={(autocompleteInstance) => {
              setAutocomplete(autocompleteInstance);
            }}
            onPlaceChanged={() => {
              if (autocomplete !== null) {
                const place = autocomplete.getPlace();
                if (place) {
                  setPlace(place);
                  handleInputChange("location", place.formatted_address);
                }
              } else {
                console.log("Autocomplete is not loaded yet!");
              }
            }}
          >
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-center"
              placeholder="Enter a location"
            />
          </GoogleAutocomplete>
          {/* TODO: Migrate from deprecated google.maps.places.Autocomplete to PlaceAutocompleteElement as per Google Maps API migration guide */}
        </div>

        <div className="day">
          <h2 className="font-semibold text-lg md:text-xl mb-3 ">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              How long is your Trip?
            </span>{" "}
            🕜
          </h2>
          <Input
            className="text-center"
            placeholder="Ex: 2"
            type="number"
            min="1"
            max="5"
            name="noOfDays"
            required
            onChange={(day) => handleInputChange("noOfDays", day.target.value)}
          />
        </div>

        <div className="dates">
          <h2 className="font-semibold text-lg md:text-xl mb-3 ">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              When is your Trip?
            </span>{" "}
            📅
          </h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <Input
                className="text-center"
                type="date"
                name="startDate"
                required
                onChange={(date) => handleInputChange("startDate", date.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">End Date</label>
              <Input
                className="text-center"
                type="date"
                name="endDate"
                required
                onChange={(date) => handleInputChange("endDate", date.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="budget">
          <h2 className="font-semibold text-lg md:text-xl mb-3 ">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              {" "}
              What is your Budget?
            </span>{" "}
            💳
          </h2>
          <Input
            className="text-center"
            placeholder="₹ 5000"
            type="number"
            min="1000"
            max="100000"
            required
            onChange={(budget) => handleInputChange("Budget", budget.target.value)}
          />
        </div>

        <div className="people">
          <h2 className="font-semibold  text-lg md:text-xl mb-3 ">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              Who are you traveling with?{" "}
            </span>{" "}
            🚗
          </h2>
          <div className="options grid grid-cols-1 gap-5 md:grid-cols-3">
            {SelectNoOfPersons.map((item) => {
              return (
                <div
                  onClick={(e) => handleInputChange("People", item.no)}
                  key={item.id}
                  className={`option cursor-pointer transition-all hover:scale-110 p-4 h-32 flex items-center justify-center flex-col border rounded-lg hover:shadow-foreground/10 hover:shadow-md
                    ${formData?.People == item.no && "border border-foreground/80"}
                  `}
                >
                  <h3 className="font-bold text-[15px] md:font-[18px]">
                    {item.icon} <span className={`
                      ${formData?.People == item.no ? 
                      "bg-gradient-to-b from-blue-400 to-blue-700 bg-clip-text text-center text-transparent" :
                      ""}
                      `}>{item.title}</span>
                  </h3>
                  <p className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">{item.desc}</p>
                  <p className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">{item.no}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="transportation">
          <h2 className="font-semibold text-lg md:text-xl mb-3 ">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              How do you prefer to travel?
            </span>{" "}
            ✈️
          </h2>
          <div className="options grid grid-cols-1 gap-5 md:grid-cols-4">
            {SelectTransportationOptions.map((item) => {
              return (
                <div
                  onClick={(e) => handleInputChange("transportation", item.title)}
                  key={item.id}
                  className={`option cursor-pointer transition-all hover:scale-110 p-4 h-32 flex items-center justify-center flex-col border rounded-lg hover:shadow-foreground/10 hover:shadow-md
                    ${formData?.transportation == item.title && "border border-foreground/80"}
                  `}
                >
                  <h3 className="font-bold text-[15px] md:font-[18px]">
                    {item.icon} <span className={`
                      ${formData?.transportation == item.title ?
                      "bg-gradient-to-b from-blue-400 to-blue-700 bg-clip-text text-center text-transparent" :
                      ""}
                      `}>{item.title}</span>
                  </h3>
                  <p className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent text-center text-sm">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="interests">
          <h2 className="font-semibold text-lg md:text-xl mb-3 ">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              What are your special interests?
            </span>{" "}
            📸
          </h2>
          <div className="options grid grid-cols-1 gap-5 md:grid-cols-4">
            {SelectInterestsOptions.map((item) => {
              const isSelected = formData?.interests?.includes(item.title);
              return (
                <div
                  onClick={(e) => {
                    const currentInterests = formData?.interests || [];
                    let newInterests;
                    if (isSelected) {
                      newInterests = currentInterests.filter(interest => interest !== item.title);
                    } else {
                      newInterests = [...currentInterests, item.title];
                    }
                    handleInputChange("interests", newInterests);
                  }}
                  key={item.id}
                  className={`option cursor-pointer transition-all hover:scale-110 p-4 h-32 flex items-center justify-center flex-col border rounded-lg hover:shadow-foreground/10 hover:shadow-md
                    ${isSelected && "border border-foreground/80"}
                  `}
                >
                  <h3 className="font-bold text-[15px] md:font-[18px]">
                    {item.icon} <span className={`
                      ${isSelected ?
                      "bg-gradient-to-b from-blue-400 to-blue-700 bg-clip-text text-center text-transparent" :
                      ""}
                      `}>{item.title}</span>
                  </h3>
                  <p className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent text-center text-sm">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="create-trip-btn w-full flex items-center justify-center h-32">
        <Button disabled={isLoading} onClick={generateTrip}>
          {isLoading ? (
            <AiOutlineLoading3Quarters className="h-6 w-6 animate-spin" />
          ) : (
            "Let's Go 🌏"
          )}
        </Button>
      </div>

      <Dialog
        className="m-4"
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              {user ? "Thank you for LogIn" : "Sign In to Continue"}
            </DialogTitle>
            <DialogDescription>
              <span className="flex gap-2">
                <span className="text-center w-full opacity-90 mx-auto tracking-tight text-primary/80">
                  {user
                    ? "Logged In Securely to SAFAR AI with Google Authentication"
                    : "Sign In to SAFAR AI with Google Authentication Securely"}
                </span>
              </span>
              {user ? (
                ""
              ) : (
                <Button
                  onClick={SignIn}
                  className="w-full mt-5 flex gap-2 items-center justify-center"
                >
                  Sign In with <FcGoogle className="h-5 w-5" />
                </Button>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose className="w-full">
              <Button variant="outline" className="w-full">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CreateTrip;
