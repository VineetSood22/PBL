import { PHOTO_URL } from "@/Service/GlobalApi";

export function getPhotoUrl(place) {
  if (!place || !place.photos || place.photos.length === 0) {
    return "/images/main_img_placeholder.jpg";
  }

  // Handle new Places API photo structure
  const firstPhoto = place.photos[0];

  if (typeof firstPhoto === 'object' && firstPhoto !== null) {
    // New API: photo object with getURI method
    if (firstPhoto.getURI && typeof firstPhoto.getURI === 'function') {
      try {
        return firstPhoto.getURI();
      } catch (error) {
        console.error("Error getting photo URI:", error);
        return "/images/main_img_placeholder.jpg";
      }
    }
    // New API: photo object with name property
    if (firstPhoto.name) {
      // For new API, the name is already a full URL
      if (firstPhoto.name.startsWith('http')) {
        return firstPhoto.name;
      }
      // Fallback to constructing URL
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${firstPhoto.name}&key=${import.meta.env.VITE_GOOGLE_MAP_API_KEY}`;
    }
  }

  // Handle old API format (string photo reference)
  if (typeof firstPhoto === 'string') {
    if (firstPhoto.startsWith('http')) {
      return firstPhoto;
    }
    return PHOTO_URL.replace("{replace}", firstPhoto);
  }

  return "/images/main_img_placeholder.jpg";
}
