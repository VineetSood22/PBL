export const libraries = ["places", "geometry"];

const getPlaceDetails = async (query) => {
  try {
    console.log("🔍 getPlaceDetails called with query:", query, "type:", typeof query);

    let searchQuery;
    if (typeof query === "string") {
      searchQuery = query;
    } else if (typeof query === "object" && query !== null) {
      if (query.textQuery) {
        searchQuery = query.textQuery;
      } else if (query.displayName) {
        searchQuery = query.displayName;
      } else if (query.formattedAddress) {
        searchQuery = query.formattedAddress;
      } else {
        console.error("❌ Invalid query object:", query);
        throw new Error("Query must be a string or an object with textQuery, displayName, or formattedAddress");
      }
    } else {
      console.error("❌ Invalid query type:", typeof query, "value:", query);
      throw new Error("Query must be a string or an object with textQuery, displayName, or formattedAddress");
    }

    if (!searchQuery || searchQuery.trim() === "") {
      throw new Error("Search query cannot be empty");
    }

    console.log("🔍 Using search query:", searchQuery);

    // Use the new Places API text search
    const { Place } = await window.google.maps.importLibrary("places");
    const request = {
      textQuery: searchQuery,
      fields: ['displayName', 'formattedAddress', 'location', 'rating', 'photos'],
      maxResultCount: 20,
    };

    const { places } = await Place.searchByText(request);

    // Transform results to match the expected structure
    const transformedPlaces = places.map(place => ({
      id: place.id,
      location: {
        latitude: place.location.lat,
        longitude: place.location.lng,
      },
      displayName: place.displayName,
      formattedAddress: place.formattedAddress,
      rating: place.rating,
      photos: place.photos ? place.photos.map(photo => ({
        name: photo.getURI(),
        widthPx: photo.widthPx,
        heightPx: photo.heightPx,
        authorAttributions: photo.authorAttributions
      })) : null,
    }));

    return { data: { places: transformedPlaces } };
  } catch (error) {
    throw new Error("Place search failed: " + error.message);
  }
};

const getCityDetails = async (query) => {
  const result = await getPlaceDetails(query);
  return result.data.places;
};

const getNearbyPlaces = async (location, type) => {
  try {
    // Check if API key is available
    const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY;
    if (!apiKey) {
      throw new Error("API key not found. Please check your environment configuration.");
    }

    console.log("🔍 getNearbyPlaces called with:", { location: location.toJSON(), type });
    console.log("🔑 Using API key:", apiKey ? "API key is set" : "API key is missing");

    // Use the new Places API nearby search
    const { Place } = await window.google.maps.importLibrary("places");
    const request = {
      locationRestriction: {
        center: location,
        radius: 5000,
      },
      includedTypes: [type],
      fields: ['displayName', 'formattedAddress', 'location', 'rating', 'photos'],
      maxResultCount: 20,
    };

    console.log("📡 Making Places API request:", request);

    // Add retry mechanism for API calls
    let retryCount = 0;
    const maxRetries = 2;
    let places = null;

    while (retryCount <= maxRetries) {
      try {
        const response = await Place.searchNearby(request);
        places = response.places;
        console.log("📍 Raw API response places:", places);

        if (!places || places.length === 0) {
          console.warn("⚠️ No places returned from API for location:", location.toJSON(), "type:", type);
          return [];
        }

        // Success - break out of retry loop
        break;
      } catch (apiError) {
        retryCount++;
        console.warn(`⚠️ API call failed (attempt ${retryCount}/${maxRetries + 1}):`, apiError.message);

        if (retryCount > maxRetries) {
          throw apiError;
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }

    // Transform nearby search results to match expected structure
    const transformedResults = places
      .filter(place => {
        const hasValidLocation = place.location && place.location.lat && place.location.lng;
        if (!hasValidLocation) {
          console.warn("⚠️ Filtering out place without valid location:", place);
        }
        return hasValidLocation;
      })
      .map(place => ({
        id: place.id,
        name: place.displayName,
        address: place.formattedAddress,
        location: {
          latitude: place.location.lat,
          longitude: place.location.lng,
        },
        rating: place.rating,
        photos: place.photos ? place.photos.map(photo => ({
          name: photo.getURI(),
          widthPx: photo.widthPx,
          heightPx: photo.heightPx,
          authorAttributions: photo.authorAttributions
        })) : null,
      }));

    console.log("✅ Transformed results:", transformedResults);
    return transformedResults;
  } catch (error) {
    console.error("❌ getNearbyPlaces error:", error);

    // Provide more specific error messages
    if (error.message.includes("API_KEY") || error.message.includes("API key")) {
      throw new Error("API key issue: Please check your Google Maps API key configuration and ensure it has Places API enabled.");
    } else if (error.message.includes("BILLING") || error.message.includes("billing")) {
      throw new Error("API billing issue: Please check your Google Cloud billing settings.");
    } else if (error.message.includes("ZERO_RESULTS")) {
      throw new Error("ZERO_RESULTS: No nearby places found for this location. This might be due to the location being too remote or API restrictions.");
    } else if (error.message.includes("OVER_QUERY_LIMIT")) {
      throw new Error("OVER_QUERY_LIMIT: API quota exceeded. Please check your usage limits.");
    } else if (error.message.includes("API key not found")) {
      throw new Error("API key not found: Please check your environment configuration and ensure VITE_GOOGLE_MAP_API_KEY is set.");
    } else {
      throw new Error("Nearby search failed: " + error.message);
    }
  }
};

// Fallback function to generate mock nearby places when API fails
const getMockNearbyPlaces = (location, type) => {
  console.log("🎭 Generating mock nearby places for:", { location: location.toJSON(), type });

  const mockPlaces = [
    {
      id: `mock_${type}_1`,
      name: `Sample ${type.charAt(0).toUpperCase() + type.slice(1)} 1`,
      address: `Nearby ${type} near your location`,
      location: {
        latitude: location.lat() + (Math.random() - 0.5) * 0.01,
        longitude: location.lng() + (Math.random() - 0.5) * 0.01,
      },
      rating: Math.floor(Math.random() * 5) + 1,
      photos: null,
    },
    {
      id: `mock_${type}_2`,
      name: `Sample ${type.charAt(0).toUpperCase() + type.slice(1)} 2`,
      address: `Another nearby ${type} location`,
      location: {
        latitude: location.lat() + (Math.random() - 0.5) * 0.01,
        longitude: location.lng() + (Math.random() - 0.5) * 0.01,
      },
      rating: Math.floor(Math.random() * 5) + 1,
      photos: null,
    },
    {
      id: `mock_${type}_3`,
      name: `Sample ${type.charAt(0).toUpperCase() + type.slice(1)} 3`,
      address: `Popular ${type} in the area`,
      location: {
        latitude: location.lat() + (Math.random() - 0.5) * 0.01,
        longitude: location.lng() + (Math.random() - 0.5) * 0.01,
      },
      rating: Math.floor(Math.random() * 5) + 1,
      photos: null,
    },
  ];

  console.log("🎭 Mock places generated:", mockPlaces);
  return mockPlaces;
};

export { getPlaceDetails, getCityDetails, getNearbyPlaces, getMockNearbyPlaces };

export const PHOTO_URL =
  "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={replace}&key=" +
  import.meta.env.VITE_GOOGLE_MAP_API_KEY;

export const getRoute = async (origin, destination) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/get-route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ origin, destination }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Route fetch failed");
    }

    return data;
  } catch (error) {
    console.error("Error fetching route:", error);
    return null;
  }
};
