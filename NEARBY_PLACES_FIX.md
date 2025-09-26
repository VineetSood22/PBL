# Nearby Places Fix Guide

## Issue: Nearby Places Not Visible

If nearby places are not showing up in your application, here are the most common causes and solutions:

### 1. Google Maps API Key Issues

**Problem**: The Google Maps API key doesn't have the required permissions or is not configured correctly.

**Solutions**:
- **Enable Places API (New)**: In your Google Cloud Console, make sure the "Places API (New)" is enabled, not just the legacy Places API.
- **API Key Restrictions**: Ensure your API key has the correct restrictions set up for your domain.
- **Billing**: Make sure billing is enabled on your Google Cloud project.

### 2. Environment Variables

**Problem**: Missing or incorrect environment variables.

**Solutions**:
- Create a `.env.local` file in your project root
- Add your Google Maps API key: `VITE_GOOGLE_MAP_API_KEY=your_api_key_here`
- Make sure the API key is valid and has the necessary permissions

### 3. API Usage Limits

**Problem**: You've exceeded your API quota.

**Solutions**:
- Check your Google Cloud Console for usage limits
- Consider upgrading your billing plan if needed
- The application uses the new Places API which may have different pricing

### 4. Location Issues

**Problem**: The location coordinates are invalid or too remote.

**Solutions**:
- Ensure latitude and longitude coordinates are valid
- Some remote locations may not have nearby places data available
- The search radius is set to 5km - very remote locations may not return results

### 5. Browser Console Errors

**Problem**: JavaScript errors preventing the API calls from working.

**Solutions**:
- Open browser developer tools (F12)
- Check the Console tab for error messages
- Look for specific error messages like "API_KEY", "BILLING", "ZERO_RESULTS", etc.

### 6. Network Issues

**Problem**: Network connectivity issues preventing API calls.

**Solutions**:
- Check your internet connection
- Ensure there are no firewall rules blocking Google Maps API calls
- Try accessing the application from a different network

## Testing the Fix

1. Open the application in your browser
2. Navigate to a place details page
3. Check the browser console for any error messages
4. Look for the "Nearby Places" section at the bottom of the page
5. If there are errors, they will be displayed in a red box with specific guidance

## Common Error Messages

- **"API key issue"**: Check your API key configuration and permissions
- **"API billing issue"**: Enable billing in Google Cloud Console
- **"No nearby places found"**: Location might be too remote or API restrictions
- **"Loading nearby locations..."**: API call is in progress (should resolve within a few seconds)

## Getting Help

If you're still experiencing issues:

1. Check the browser console for specific error messages
2. Verify your Google Maps API key configuration
3. Ensure the Places API (New) is enabled in Google Cloud Console
4. Check that billing is enabled on your Google Cloud project

## Note About API Costs

The new Google Places API (New) used in this application may incur charges. Monitor your usage in Google Cloud Console and consider the pricing implications for production use.
