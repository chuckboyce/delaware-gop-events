import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string, details?: { lat?: number; lng?: number; address?: string }) => void;
  placeholder?: string;
  className?: string;
  onAddressSelect?: (address: string, lat: number, lng: number) => void;
}

interface PlacePrediction {
  placeId: string;
  mainText: string;
  secondaryText?: string;
}

export default function GooglePlacesAutocomplete({
  value,
  onChange,
  placeholder = "Enter event location",
  className = "",
  onAddressSelect,
}: GooglePlacesAutocompleteProps) {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const initAttemptedRef = useRef(false);
  const sessionTokenRef = useRef<any>(null);

  // Fetch API key from backend
  const { data: configData, isLoading: isLoadingConfig } = trpc.config.googlePlacesApiKey.useQuery();

  // Initialize Google Places API
  useEffect(() => {
    if (initAttemptedRef.current || scriptLoadedRef.current) return;
    
    const apiKey = configData?.apiKey;

    if (!apiKey) {
      if (isLoadingConfig) {
        return; // Still loading
      }
      console.error("Google Places API key not available");
      setApiError("Google Places API key not configured");
      initAttemptedRef.current = true;
      return;
    }

    initAttemptedRef.current = true;
    const w = window as any;

    // Function to initialize services
    const initializeServices = () => {
      try {
        if (w.google?.maps?.places) {
          console.log("Initializing Google Places services with new API");
          // Use the new API if available
          if (w.google.maps.places.AutocompleteService) {
            autocompleteServiceRef.current = new w.google.maps.places.AutocompleteService();
          }
          if (w.google.maps.places.PlacesService && containerRef.current) {
            placesServiceRef.current = new w.google.maps.places.PlacesService(containerRef.current);
          }
          
          // Create session token for new API
          if (w.google.maps.places.AutocompleteSessionToken) {
            sessionTokenRef.current = new w.google.maps.places.AutocompleteSessionToken();
          }
          
          setApiLoaded(true);
          setApiError(null);
          scriptLoadedRef.current = true;
          console.log("Google Places services initialized successfully");
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error initializing Google Places services:", error);
        setApiError("Failed to initialize Google Places");
        scriptLoadedRef.current = true;
        return false;
      }
    };

    // Check if Google Maps is already loaded
    if (w.google?.maps?.places) {
      console.log("Google Maps already loaded, initializing services");
      initializeServices();
      return;
    }

    // Load Google Maps script with new API
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    
    script.onload = () => {
      console.log("Google Maps script loaded");
      // Wait a bit for the API to be ready
      setTimeout(() => {
        if (!initializeServices()) {
          setApiError("Google Places API failed to load");
        }
      }, 100);
    };

    script.onerror = () => {
      console.error("Failed to load Google Maps script");
      setApiError("Failed to load Google Places API");
      scriptLoadedRef.current = true;
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove script as it might be used elsewhere
    };
  }, [configData, isLoadingConfig]);

  // Handle input change
  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);

    if (!inputValue.trim()) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    if (!autocompleteServiceRef.current || !apiLoaded) {
      console.warn("AutocompleteService not initialized or API not loaded");
      return;
    }

    setIsLoading(true);

    try {
      // Use the callback-based API (works with both old and new versions)
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: inputValue,
          componentRestrictions: { country: "us" },
          sessionToken: sessionTokenRef.current,
        },
        (predictions: any[] | null, status: string) => {
          console.log(`Autocomplete status: ${status}, predictions: ${predictions?.length || 0}`);
          if (predictions && status === "OK") {
            // Map predictions to our interface
            const mappedPredictions = predictions.map((p: any) => ({
              placeId: p.place_id,
              mainText: p.main_text || p.description,
              secondaryText: p.secondary_text,
            }));
            setPredictions(mappedPredictions.slice(0, 8));
            setIsOpen(true);
          } else if (status === "ZERO_RESULTS") {
            setPredictions([]);
            setIsOpen(false);
          } else if (status !== "OK") {
            console.warn(`Autocomplete status: ${status}`);
          }
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error("Autocomplete error:", error);
      setIsLoading(false);
    }
  };

  // Handle prediction selection
  const handleSelectPrediction = (prediction: PlacePrediction) => {
    onChange(prediction.mainText);
    setPredictions([]);
    setIsOpen(false);

    // Fetch place details for coordinates and full address
    if (placesServiceRef.current && apiLoaded) {
      try {
        placesServiceRef.current.getDetails(
          {
            placeId: prediction.placeId,
            fields: ["formatted_address", "geometry", "address_components"],
            sessionToken: sessionTokenRef.current,
          },
          (place: any | null, status: string) => {
            if (status === "OK" && place?.geometry?.location) {
              const lat = typeof place.geometry.location.lat === 'function' 
                ? place.geometry.location.lat() 
                : place.geometry.location.lat;
              const lng = typeof place.geometry.location.lng === 'function' 
                ? place.geometry.location.lng() 
                : place.geometry.location.lng;
              const address = place.formatted_address || prediction.mainText;
              
              console.log(`Selected: ${address}, Lat: ${lat}, Lng: ${lng}`);
              
              onChange(prediction.mainText, {
                lat,
                lng,
                address,
              });

              if (onAddressSelect) {
                onAddressSelect(address, lat, lng);
              }

              // Create a new session token for the next request
              const w = window as any;
              if (w.google?.maps?.places?.AutocompleteSessionToken) {
                sessionTokenRef.current = new w.google.maps.places.AutocompleteSessionToken();
              }
            } else {
              console.warn(`Place details status: ${status}`);
            }
          }
        );
      } catch (error) {
        console.error("Place details error:", error);
      }
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <Input
        type="text"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent ${className}`}
        onFocus={() => value && predictions.length > 0 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        autoComplete="off"
      />

      {isLoadingConfig && (
        <div className="absolute right-3 top-3 text-muted-foreground text-xs">
          Loading...
        </div>
      )}

      {isLoading && (
        <div className="absolute right-3 top-3 text-muted-foreground text-sm">
          Loading...
        </div>
      )}

      {isOpen && predictions.length > 0 && apiLoaded && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50">
          {predictions.map((prediction) => (
            <button
              key={prediction.placeId}
              onClick={() => handleSelectPrediction(prediction)}
              className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-b-0"
            >
              <div className="font-medium text-foreground text-sm">{prediction.mainText}</div>
              {prediction.secondaryText && (
                <div className="text-xs text-muted-foreground">{prediction.secondaryText}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {apiError && !isLoadingConfig && (
        <div className="text-xs text-red-500 mt-1">
          {apiError} - You can still enter the address manually
        </div>
      )}
    </div>
  );
}
