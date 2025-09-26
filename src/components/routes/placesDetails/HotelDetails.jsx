import { useCache } from "@/Context/Cache/CacheContext";
import React, { useEffect, useState } from "react";
import {
  Map as GoogleMap,
  AdvancedMarker,
  Marker,
} from "@vis.gl/react-google-maps";

import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getRoute, getNearbyPlaces, getMockNearbyPlaces, libraries } from "@/Service/GlobalApi.jsx";
import { getPhotoUrl } from "@/lib/photoUtils";

import polyline from "@mapbox/polyline";
import { Loader, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader as GoogleMapsLoader } from "@googlemaps/js-api-loader";

const HotelDetails = ({ HotelDetailsPageRef }) => {
  const {
    selectedHotel,
    checkInDate,
    checkOutDate,
    adults,
    childrenCount,
    rooms,
  } = useCache();
  const {
    name,
    address,
    rating,
    price,
    city,
    location,
    photos,
    description,
    id,
  } = selectedHotel || {};
  const { lat, lng } = useParams();
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const navigate = useNavigate();

  // Check if Map ID is available for Advanced Markers
  const hasMapId = !!import.meta.env.VITE_GOOGLE_MAP_ID;

  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [decodedPath, setDecodedPath] = useState([]);
  const [distance, setDistance] = useState(null);
  const [time, setTime] = useState(null);
  const [image_url, setImageUrl] = useState(null);
  const [placeId, setPlaceId] = useState(null);
  const [isLoadingNearby, setIsLoadingNearby] = useState(true);
  const [nearbyError, setNearbyError] = useState(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [photoRequestCache, setPhotoRequestCache] = useState(new Map());
  const [isMapReady, setIsMapReady] = useState(false);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        const loader = new GoogleMapsLoader({
          apiKey: import.meta.env.VITE_GOOGLE_MAP_API_KEY,
          version: "weekly",
          libraries: ["places", "geometry"],
        });

        await loader.load();
        console.log("✅ Google Maps API loaded successfully");
        setIsGoogleMapsLoaded(true);
        setIsMapReady(true);
      } catch (error) {
        console.error("❌ Failed to load Google Maps API:", error);
        setNearbyError("Failed to load Google Maps API. Please refresh the page.");
        setIsLoadingNearby(false);
      }
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    const fetchNearbyPlaces = async () => {
      if (!latitude || !longitude) {
        setIsLoadingNearby(false);
        return;
      }

      // Wait for Google Maps to be loaded
      if (!isGoogleMapsLoaded) {
        console.log("⏳ Waiting for Google Maps to load...");
        return;
      }

      // Check if Google Maps is available
      if (!window.google || !window.google.maps) {
        console.error("❌ Google Maps not loaded");
        setNearbyError("Google Maps not loaded. Please refresh the page and try again.");
        setIsLoadingNearby(false);
        return;
      }

      setIsLoadingNearby(true);
      setNearbyError(null);

      try {
        console.log("🏨 Fetching nearby places for hotel location:", latitude, longitude);
        const location = new window.google.maps.LatLng(latitude, longitude);

        // Try multiple place types in order of preference
        const placeTypes = ["tourist_attraction", "restaurant", "lodging"];
        let results = [];
        let foundResults = false;

        for (const type of placeTypes) {
          try {
            console.log(`🏨 Trying place type: ${type}`);
            results = await getNearbyPlaces(location, type);
            console.log(`🏨 HotelDetails - ${type} results:`, results);
            console.log(`🏨 HotelDetails - ${type} results length:`, results ? results.length : 'undefined');

            if (results && results.length > 0) {
              console.log(`✅ Found ${results.length} results with type: ${type}`);
              foundResults = true;
              break;
            } else {
              console.log(`⚠️ No results for ${type}, trying next type...`);
            }
          } catch (typeError) {
            console.log(`❌ Error with ${type}:`, typeError.message);
            // Continue to next type
          }
        }

        // If no real results found, use mock data
        if (!foundResults || (results && results.length === 0)) {
          console.log("🎭 Using mock data as fallback for hotel");
          results = getMockNearbyPlaces(location, "tourist_attraction");
        }

        setNearbyPlaces(results);
      } catch (error) {
        console.error("Error fetching nearby places:", error);
        let errorMessage = "Unable to load nearby places.";

        if (error.message.includes("ZERO_RESULTS")) {
          errorMessage = "No nearby places found for this location. This might be due to the location being too remote or the API key not having proper permissions.";
        } else if (error.message.includes("API key")) {
          errorMessage = "API key issue. Please check your Google Maps API key configuration.";
        } else if (error.message.includes("billing")) {
          errorMessage = "API billing issue. Please check your Google Cloud billing settings.";
        }

        setNearbyError(errorMessage);
        setNearbyPlaces([]);
      } finally {
        setIsLoadingNearby(false);
      }
    };

    fetchNearbyPlaces();
  }, [latitude, longitude]);

  //   useEffect(() => {
  //     if (!selectedHotel) {
  //         console.log("No hotel selected");
  //         navigate("/");
  //     }
  //   }, [selectedHotel]);

  function generateMakeMyTripHotelURL({
    checkinDate, // format: 'YYYY-MM-DD'
    checkoutDate, // format: 'YYYY-MM-DD'
    poiName, // e.g., 'Netaji Subhash Place Metro Station'
    lat, // e.g., 28.69605
    lng, // e.g., 77.15263
    adults = 2,
    children = 0,
    rooms = 1,
  }) {
    // Handle missing hotel data gracefully
    const safePoiName = poiName || "Unknown Hotel";
    const safeLat = lat || 0;
    const safeLng = lng || 0;

    // Format dates for MakeMyTrip (MMDDYYYY format)
    // Handle both MMDDYYYY and YYYY-MM-DD formats
    const formatDate = (dateStr) => {
      if (!dateStr) return null;
      try {
        let date;

        // Check if it's already in MMDDYYYY format (8-10 digits)
        if (/^\d{8,10}$/.test(dateStr)) {
          // MMDDYYYY format
          const mm = dateStr.substring(0, 2);
          const dd = dateStr.substring(2, 4);
          const yyyy = dateStr.substring(4, 8);
          date = new Date(`${yyyy}-${mm}-${dd}`);
        } else {
          // Try parsing as YYYY-MM-DD or other standard format
          date = new Date(dateStr);
        }

        if (isNaN(date.getTime())) return null;

        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${mm}${dd}${yyyy}`;
      } catch (error) {
        console.error("Error formatting date:", error);
        return null;
      }
    };

    // Helper function to get default dates if null
    const getDefaultDates = () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      return {
        checkin: formatDate(today.toISOString().split('T')[0]),
        checkout: formatDate(tomorrow.toISOString().split('T')[0])
      };
    };

    const checkin = formatDate(checkinDate);
    const checkout = formatDate(checkoutDate);

    // If checkout date is invalid, calculate it as 1 day after checkin
    let finalCheckout = checkout;
    if (!finalCheckout && checkin) {
      try {
        // Parse the MMDDYYYY checkin date
        const checkinDateObj = new Date(`${checkin.substring(4, 8)}-${checkin.substring(0, 2)}-${checkin.substring(2, 4)}`);
        const checkoutDateObj = new Date(checkinDateObj);
        checkoutDateObj.setDate(checkinDateObj.getDate() + 1);
        finalCheckout = formatDate(checkoutDateObj.toISOString().split('T')[0]);
      } catch (error) {
        console.error("Error calculating checkout date:", error);
        finalCheckout = null;
      }
    }

    // Fallback: if both dates are invalid, use today's date and tomorrow
    let finalCheckin = checkin;
    let finalCheckoutDate = finalCheckout;

    if (!finalCheckin || !finalCheckoutDate) {
      const defaultDates = getDefaultDates();

      if (!finalCheckin) finalCheckin = defaultDates.checkin;
      if (!finalCheckoutDate) finalCheckoutDate = defaultDates.checkout;

      console.log("Using fallback dates:", { finalCheckin, finalCheckoutDate });
    }

    // Only encode POI if we have valid data
    const encodedPOI = safePoiName && safePoiName !== "Unknown Hotel"
      ? encodeURIComponent(safePoiName)
      : encodeURIComponent(`${safeLat},${safeLng}`);

    console.log("Hotel details for URL:", {
      poiName: safePoiName,
      lat: safeLat,
      lng: safeLng,
      encodedPOI
    });
    console.log("Final checkin:", finalCheckin);
    console.log("Final checkout:", finalCheckoutDate);

    const roomStayQualifier = `${adults}e${children}e`;
    const rsc = `${rooms}e${adults}e${children}e`;

    return `https://www.makemytrip.com/hotels/hotel-listing/?checkin=${finalCheckin}&checkout=${finalCheckoutDate}&searchText=${encodedPOI}&roomStayQualifier=${roomStayQualifier}&reference=hotel&type=poi&rsc=${rsc}`;
  }

  useEffect(() => {
    console.log("Raw dates from cache:", { checkInDate, checkOutDate });
    console.log("Hotel details:", { name, city });

    const url = generateMakeMyTripHotelURL({
      checkinDate: checkInDate,
      checkoutDate: checkOutDate,
      poiName: name + "," + city,
      lat: latitude,
      lng: longitude,
      adults: adults,
      children: childrenCount,
      rooms: rooms,
    });

    console.log("Generated URL:", url);
  }, []);

  const containerStyle = {
    width: "100%",
    height: "400px",
  };

  const mapCenter = {
    lat: latitude || 0,
    lng: longitude || 0,
  };

  const handleSelectPlace = (place) => () => {
    setSelectedPlace(place);
  };

  function extractPlaceId(url) {
    const match = url.match(/place_id:([^&]+)/);
    return match ? match[1] : null;
  }

  // Rate limiting for photo requests to prevent 429 errors
  const photoRequestQueue = [];
  let isProcessingQueue = false;

  const processPhotoQueue = async () => {
    if (isProcessingQueue || photoRequestQueue.length === 0) return;

    isProcessingQueue = true;

    while (photoRequestQueue.length > 0) {
      const { photoReference, resolve, reject } = photoRequestQueue.shift();

      try {
        // Check cache first
        const cacheKey = photoReference;
        if (photoRequestCache.has(cacheKey)) {
          resolve(photoRequestCache.get(cacheKey));
          continue;
        }

        // Make the request
        const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${import.meta.env.VITE_GOOGLE_MAP_API_KEY}`;

        // Cache the result
        photoRequestCache.set(cacheKey, url);
        resolve(url);

        // Rate limiting: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.error("Error fetching photo URL:", err);
        reject(err);
      }
    }

    isProcessingQueue = false;
  };

  const fetchGooglePhotoUrl = async (photoReference) => {
    return new Promise((resolve, reject) => {
      if (!photoReference) {
        resolve(null);
        return;
      }

      // Add to queue
      photoRequestQueue.push({ photoReference, resolve, reject });
      processPhotoQueue();
    });
  };

  useEffect(() => {
    if (selectedPlace && selectedPlace.geometry && selectedPlace.geometry.location) {
      const origin = { latitude: latitude, longitude: longitude };
      const destination = {
        latitude: selectedPlace.geometry.location.lat(),
        longitude: selectedPlace.geometry.location.lng(),
      };

      getRoute(origin, destination).then((routeInfo) => {
        if (routeInfo) {
          setDistance(routeInfo.distanceMeters);
          setTime(routeInfo.duration);

          const decodedPath = polyline
            .decode(routeInfo.polyline.encodedPolyline)
            .map(([lat, lng]) => ({
              lat,
              lng,
            }));
          setDecodedPath(decodedPath);
          // }
        }
      });

      let googleMapsUri = selectedPlace?.googleMapsUri;
      if (googleMapsUri) {
        const placeId = extractPlaceId(googleMapsUri);
        setPlaceId(placeId);
      }
    }
  }, [selectedPlace]);



  const getTime = (value) => {
    const seconds = parseInt(value);
    const minutes = Math.ceil(seconds / 60);
    return minutes;
  };

  const getDistance = (value) => {
    const meters = parseInt(value);
    const kilometers = (meters / 1000).toFixed(2);
    return kilometers;
  };

  const handleBooking = () => {
    const bookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(name + ", " + city)}&checkin=${checkInDate}&checkout=${checkOutDate}&group_adults=${adults}&group_children=${childrenCount}&no_rooms=${rooms}`;

    // Alternative booking sites as fallbacks
    const alternativeUrls = [
      `https://www.makemytrip.com/hotels/hotel-listing/?checkin=${checkInDate}&checkout=${checkOutDate}&searchText=${encodeURIComponent(name + ", " + city)}&roomStayQualifier=${adults}e${childrenCount}e&reference=hotel&type=city&rsc=${rooms}e${adults}e${childrenCount}e`,
      `https://www.agoda.com/search?city=${city}&checkin=${checkInDate}&checkout=${checkOutDate}&adults=${adults}&children=${childrenCount}&rooms=${rooms}`,
      `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(name + ", " + city)}&startDate=${checkInDate}&endDate=${checkOutDate}&adults=${adults}&children=${childrenCount}&rooms=${rooms}`
    ];

    // Try to open the booking URL in a new tab
    try {
      window.open(bookingUrl, '_blank');
    } catch (error) {
      console.error("Error opening booking URL:", error);
      // Fallback to alternative URLs
      for (const url of alternativeUrls) {
        try {
          window.open(url, '_blank');
          break;
        } catch (altError) {
          console.error("Error opening alternative booking URL:", altError);
        }
      }
    }
  };

  return (
    <div ref={HotelDetailsPageRef} className="main">
      <div className="hotel-details mt-5">
        <div className="text text-center">
          <h2 className="text-3xl md:text-5xl mt-5 font-bold flex items-center justify-center">
            <span className="bg-gradient-to-b text-7xl from-blue-400 to-blue-700 bg-clip-text text-center text-transparent">
              {name}
            </span>
          </h2>
          📍
          <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent text-xl">
            {address}
          </span>
        </div>

        <div className="flex items-center justify-center py-2 gap-2 mt-2">
          <h3 className="location-info opacity-90 bg-foreground/20 px-2 md:px-4 flex items-center justify-center rounded-md text-center text-md font-medium tracking-tight text-primary/80 md:text-lg">
            💵 {price}
          </h3>
          <h3 className="location-info opacity-90 bg-foreground/20 px-2 md:px-4 flex items-center justify-center rounded-md text-center text-md font-medium tracking-tight text-primary/80 md:text-lg">
            ⭐ {rating} Stars
          </h3>
          <button
            onClick={handleBooking}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 flex items-center gap-2"
          >
            🏨 Book Now
          </button>
        </div>
      </div>

      <div className="map-location mt-5 w-full bg-gradient-to-b from-primary/90 to-primary/60 font-bold bg-clip-text text-transparent text-3xl text-center">
        Map Location
      </div>
      <div className="hotel-map rounded-lg m-4 md:m-2 overflow-hidden shadow-md flex flex-col gap-2 md:flex-row">
        <GoogleMap
          style={containerStyle}
          defaultCenter={mapCenter}
          defaultZoom={15}
          gestureHandling={'greedy'}
          disableDefaultUI={false}
        >
            {hasMapId ? (
              // Use AdvancedMarker when Map ID is available
              <>
                <AdvancedMarker
                  position={{
                    lat: latitude,
                    lng: longitude,
                  }}
                  title={name}
                />
                {selectedPlace && selectedPlace.geometry && selectedPlace.geometry.location && (
                  <>
                    {/* Draw a line between hotel and place */}
                    <Polyline
                      path={decodedPath}
                      options={{
                        strokeColor: "#1E90FF",
                        strokeOpacity: 0.8,
                        strokeWeight: 4,
                      }}
                    />
                    <AdvancedMarker
                      position={{
                        lat: selectedPlace.geometry.location.lat(),
                        lng: selectedPlace.geometry.location.lng(),
                      }}
                      title={selectedPlace.name}
                    />
                  </>
                )}
              </>
            ) : (
              // Use regular Marker when no Map ID is available
              <>
                <Marker
                  position={{
                    lat: latitude,
                    lng: longitude,
                  }}
                  title={name}
                />
                {selectedPlace && selectedPlace.geometry && selectedPlace.geometry.location && (
                  <>
                    {/* Draw a line between hotel and place */}
                    <Polyline
                      path={decodedPath}
                      options={{
                        strokeColor: "#1E90FF",
                        strokeOpacity: 0.8,
                        strokeWeight: 4,
                      }}
                    />
                    <Marker
                      position={{
                        lat: selectedPlace.geometry.location.lat(),
                        lng: selectedPlace.geometry.location.lng(),
                      }}
                      title={selectedPlace.name}
                    />
                  </>
                )}
              </>
            )}
        </GoogleMap>
      </div>

      {distance && time && (
        <>
          <div className="flex items-center justify-center py-2 gap-2 mt-2">
            <h3 className="location-info opacity-90 bg-foreground/20 px-2 md:px-4 flex items-center justify-center rounded-md text-center text-md font-medium tracking-tight text-primary/80 md:text-lg">
              Distance: {distance} meters ( {getDistance(distance)} km )
            </h3>
            <h3 className="location-info opacity-90 bg-foreground/20 px-2 md:px-4 flex items-center justify-center rounded-md text-center text-md font-medium tracking-tight text-primary/80 md:text-lg">
              Time: {getTime(time)} minutes
            </h3>
          </div>
        </>
      )}

      <div className="mt-4 w-full">
        <h2 className="nearby-places mt-5 w-full bg-gradient-to-b from-primary/90 to-primary/60 font-bold bg-clip-text text-transparent text-3xl text-center">
          Nearby Places
        </h2>

        {isLoadingNearby ? (
          <div className="text-center my-5">
            <Loader2 size={50} className="animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading nearby places...</p>
          </div>
        ) : nearbyError ? (
          <div className="text-center my-5">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mx-4">
              <p className="text-red-800 font-medium">Unable to load nearby places</p>
              <p className="text-red-600 text-sm mt-1">{nearbyError}</p>
              <p className="text-red-500 text-xs mt-2">
                Please check your Google Maps API key configuration and ensure the Places API is enabled.
              </p>
            </div>
          </div>
        ) : nearbyPlaces.length === 0 ? (
          <div className="text-center my-5">
            <p className="text-gray-500">No nearby places found for this location.</p>
            <p className="text-sm text-gray-400 mt-1">This might be due to the location being too remote or API limitations.</p>
          </div>
        ) : (
          <ul className="places-list space-y-2 grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 p-5 lg:grid-cols-4 mx-auto">
            {nearbyPlaces
              .filter(place => place?.latitude && place?.longitude &&
                !isNaN(place.latitude) && !isNaN(place.longitude))
              .map((place, index) => (
              <div
                onClick={handleSelectPlace(place)}
                className="max-w-xs relative w-full group/card border border-foreground/20 rounded-lg overflow-hidden shadow-md cursor-pointer"
                key={index}
              >
                <div
                  style={{ backgroundImage: `url(${getPhotoUrl(place)})` }}
                  className={cn(
                    " cursor-pointer overflow-hidden relative card h-72 rounded-md shadow-xl  max-w-sm mx-auto backgroundImage flex flex-col justify-between p-4",
                    `bg-cover`
                  )}
                >
                  <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-background to-transparent z-0 pointer-events-none" />

                  <div className="absolute w-full h-full top-0 left-0 transition duration-300 group-hover/card:bg-background opacity-60"></div>
                  <div className="absolute bottom-0 left-0 w-full h-28 bg-gradient-to-t from-background to-transparent z-0 pointer-events-none" />

                  <div className="flex flex-row items-center space-x-4 z-10 ">
                    <div className="flex flex-col">
                      <p className="font-normal text-base text-foreground relative z-10">
                        # {index + 1}
                      </p>
                      <p className="text-sm text-foreground/90">
                        Rating {place?.rating} ⭐
                      </p>
                    </div>
                  </div>
                  <div className="text content">
                    <h1 className="font-bold text-xl md:text-2xl text-foreground relative z-10 line-clamp-2">
                      {place.name}
                    </h1>
                    <p className="font-normal text-sm text-foreground relative z-10 my-4 line-clamp-3">
                      {place.address}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HotelDetails;

// hotel-details
// map-location
// hotel-map
// nearby-places
// places-list
