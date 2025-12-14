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
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const initAttemptedRef = useRef(false);
  const sessionTokenRef = useRef<any>(null);

  // Fetch API key from backend
  const { data: configData, isLoading: isLoadingConfig } = trpc.config.googlePlacesApiKey.useQuery();

  // Initialize Google Places API with async loading
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

    // Function to initialize services with new API
    const initializeServices = () => {
      try {
        if (w.google?.maps?.places) {
          console.log("Initializing Google Places with new AutocompleteSuggestion API");
          
          // Use the new AutocompleteSuggestion API
          if (w.google.maps.places.AutocompleteService) {
            autocompleteServiceRef.current = new w.google.maps.places.AutocompleteService();
            console.log("AutocompleteService initialized");
          }
          
          // Create session token for billing optimization
          if (w.google.maps.places.AutocompleteSessionToken) {
            sessionTokenRef.current = new w.google.maps.places.AutocompleteSessionToken();
            console.log("Session token created");
          }
          
          setApiLoaded(true);
          setApiError(null);
          scriptLoadedRef.current = true;
          console.log("Google Places initialized successfully");
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

    // Load Google Maps script with async loading parameter
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log("Google Maps script loaded asynchronously");
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

  // Handle input change - use new AutocompleteSuggestion API
  const handleInputChange = async (inputValue: string) => {
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
      // Use the new AutocompleteSuggestion API with promise-based approach
      const request = {
        input: inputValue,
        componentRestrictions: { country: "us" },
        sessionToken: sessionTokenRef.current,
      };

      // The new API returns a promise
      const service = autocompleteServiceRef.current;
      const response = await service.getPlacePredictions(request);
      
      console.log(`Autocomplete returned ${response.predictions?.length || 0} predictions`);
      
      if (response.predictions && response.predictions.length > 0) {
        // Map predictions to our interface
        const mappedPredictions = response.predictions.map((p: any) => ({
          placeId: p.place_id,
          mainText: p.main_text || p.description,
          secondaryText: p.secondary_text,
        }));
        setPredictions(mappedPredictions.slice(0, 8));
        setIsOpen(true);
      } else {
        setPredictions([]);
        setIsOpen(false);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Autocomplete error:", error);
      setIsLoading(false);
    }
  };

  // Handle prediction selection - use new Place API
  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    onChange(prediction.mainText);
    setPredictions([]);
    setIsOpen(false);

    // Fetch place details using new Place API
    const w = window as any;
    if (w.google?.maps?.places?.Place && apiLoaded) {
      try {
        // Use the new Place API
        const place = new w.google.maps.places.Place({
          id: prediction.placeId,
        });

        const request = {
          fields: ["geometry", "formatted_address", "address_components"],
          sessionToken: sessionTokenRef.current,
        };

        await place.fetchFields(request);

        if (place.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
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
          if (w.google?.maps?.places?.AutocompleteSessionToken) {
            sessionTokenRef.current = new w.google.maps.places.AutocompleteSessionToken();
          }
        }
      } catch (error) {
        console.error("Place details error:", error);
        // Still use the prediction main text even if we can't get details
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
