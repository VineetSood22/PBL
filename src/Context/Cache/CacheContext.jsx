import { createContext, useContext, useState } from "react";

const CacheContext = createContext();

export const CacheProvider = ({ children }) => {
  const [placeCache, setPlaceCache] = useState(new Map());
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Initialize with default dates (today and tomorrow)
  const getDefaultDates = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return {
      checkIn: today.toISOString().split('T')[0], // YYYY-MM-DD format
      checkOut: tomorrow.toISOString().split('T')[0]
    };
  };

  const defaultDates = getDefaultDates();
  const [checkInDate, setCheckInDate] = useState(defaultDates.checkIn);
  const [checkOutDate, setCheckOutDate] = useState(defaultDates.checkOut);
  const [adults, setAdults] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [rooms, setRooms] = useState(1);


  return (
    <CacheContext.Provider
      value={{
        placeCache,
        setPlaceCache,
        selectedHotel,
        setSelectedHotel,
        selectedPlace,
        setSelectedPlace,
        setCheckInDate,
        setCheckOutDate,
        checkInDate,
        checkOutDate,
        setAdults,
        setChildrenCount,
        setRooms,
        adults,
        childrenCount,
        rooms,

      }}
    >
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => useContext(CacheContext);
