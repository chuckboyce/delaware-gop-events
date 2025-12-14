import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string, details?: { lat?: number; lng?: number; address?: string }) => void;
  placeholder?: string;
  className?: string;
  onAddressSelect?: (address: string, lat: number, lng: number) => void;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text?: string;
}

interface PlaceDetails {
  formatted_address?: string;
  geometry?: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
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

  // Initialize Google Places API
  useEffect(() => {
    if (scriptLoadedRef.current) return;
    
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      console.error("Google Places API key not found in VITE_GOOGLE_PLACES_API_KEY");
      setApiError("Google Places API key not configured");
      return;
    }

    const w = window as any;

    // Check if Google Maps is already loaded
    if (w.google?.maps?.places) {
      console.log("Google Maps already loaded");
      autocompleteServiceRef.current = new w.google.maps.places.AutocompleteService();
      if (containerRef.current) {
        placesServiceRef.current = new w.google.maps.places.PlacesService(containerRef.current);
      }
      setApiLoaded(true);
      scriptLoadedRef.current = true;
      return;
    }

    // Load Google Maps script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log("Google Maps script loaded");
      if (w.google?.maps?.places) {
        autocompleteServiceRef.current = new w.google.maps.places.AutocompleteService();
        if (containerRef.current) {
          placesServiceRef.current = new w.google.maps.places.PlacesService(containerRef.current);
        }
        setApiLoaded(true);
        setApiError(null);
      } else {
        console.error("Google Maps Places API not available after script load");
        setApiError("Google Places API failed to load");
      }
      scriptLoadedRef.current = true;
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
  }, []);

  // Handle input change
  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);

    if (!inputValue.trim()) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    if (!autocompleteServiceRef.current) {
      console.warn("AutocompleteService not initialized");
      return;
    }

    setIsLoading(true);

    try {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: inputValue,
          componentRestrictions: { country: "us" },
        },
        (predictions: PlacePrediction[] | null, status: string) => {
          console.log(`Autocomplete status: ${status}, predictions: ${predictions?.length || 0}`);
          if (predictions && status === "OK") {
            setPredictions(predictions.slice(0, 8));
            setIsOpen(true);
          } else if (status === "ZERO_RESULTS") {
            setPredictions([]);
            setIsOpen(false);
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
    onChange(prediction.description);
    setPredictions([]);
    setIsOpen(false);

    // Fetch place details for coordinates and full address
    if (placesServiceRef.current) {
      placesServiceRef.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: ["formatted_address", "geometry", "address_components"],
        },
        (place: PlaceDetails | null, status: string) => {
          if (status === "OK" && place?.geometry?.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const address = place.formatted_address || prediction.description;
            
            console.log(`Selected: ${address}, Lat: ${lat}, Lng: ${lng}`);
            
            onChange(prediction.description, {
              lat,
              lng,
              address,
            });

            if (onAddressSelect) {
              onAddressSelect(address, lat, lng);
            }
          }
        }
      );
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <Input
        type="text"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        onFocus={() => value && predictions.length > 0 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        autoComplete="off"
        disabled={!apiLoaded}
      />

      {!apiLoaded && (
        <div className="absolute right-3 top-3 text-muted-foreground text-xs">
          {apiError ? "⚠️" : "Loading..."}
        </div>
      )}

      {isLoading && (
        <div className="absolute right-3 top-3 text-muted-foreground text-sm">
          Loading...
        </div>
      )}

      {isOpen && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              onClick={() => handleSelectPrediction(prediction)}
              className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-b-0"
            >
              <div className="font-medium text-foreground text-sm">{prediction.main_text}</div>
              {prediction.secondary_text && (
                <div className="text-xs text-muted-foreground">{prediction.secondary_text}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {apiError && (
        <div className="text-xs text-red-500 mt-1">
          {apiError}
        </div>
      )}
    </div>
  );
}
