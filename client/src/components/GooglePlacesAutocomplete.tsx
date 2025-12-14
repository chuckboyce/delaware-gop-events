import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Type for Google Maps window object

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
}: GooglePlacesAutocompleteProps) {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Google Places API
  useEffect(() => {
    const apiKey = import.meta.env.VITE_FRONTEND_FORGE_API_KEY || import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      console.warn("Google Places API key not configured");
      return;
    }

    const w = window as any;

    // Load Google Maps script if not already loaded
    if (!w.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.maps?.places) {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
          if (containerRef.current) {
            placesServiceRef.current = new window.google.maps.places.PlacesService(containerRef.current);
          }
        }
      };
      document.head.appendChild(script);
    } else if ((window as any).google?.maps?.places) {
      autocompleteServiceRef.current = new (window as any).google.maps.places.AutocompleteService();
      if (containerRef.current) {
        placesServiceRef.current = new (window as any).google.maps.places.PlacesService(containerRef.current);
      }
    }
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
      return;
    }

    setIsLoading(true);

    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: inputValue,
        componentRestrictions: { country: "us" }, // Restrict to US
      },
      (predictions: PlacePrediction[] | null) => {
        if (predictions) {
          setPredictions(predictions.slice(0, 5)); // Limit to 5 suggestions
          setIsOpen(true);
        } else {
          setPredictions([]);
        }
        setIsLoading(false);
      }
    );
  };

  // Handle prediction selection
  const handleSelectPrediction = (prediction: PlacePrediction) => {
    onChange(prediction.description);
    setPredictions([]);
    setIsOpen(false);

    // Optionally fetch place details for coordinates
    if (placesServiceRef.current) {
      placesServiceRef.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: ["formatted_address", "geometry"],
        },
        (place: PlaceDetails | null) => {
          if (place?.geometry?.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            // You can store these coordinates if needed
            console.log(`Location: ${lat}, ${lng}`);
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
      />

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
              <div className="font-medium text-foreground">{prediction.main_text}</div>
              {prediction.secondary_text && (
                <div className="text-sm text-muted-foreground">{prediction.secondary_text}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
