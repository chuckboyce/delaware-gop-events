import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import GooglePlacesAutocomplete from "@/components/GooglePlacesAutocomplete";

const eventSubmissionSchema = z.object({
  name: z.string().min(1, "Event title is required").max(255),
  description: z.string().min(1, "Description is required"),
  startDate: z.date(),
  endDate: z.date().optional(),
  location: z.string().min(1, "Location is required").max(255),
  locationAddress: z.string().optional(),
  locationLatitude: z.string().optional(),
  locationLongitude: z.string().optional(),
  organizerName: z.string().min(1, "Organizer name is required").max(255),
  organizerEmail: z.string().email("Valid email required"),
  organizerPhone: z.string().optional(),
  organizerUrl: z.string().url().optional(),
  eventUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  eventType: z.enum(["fundraiser", "rally", "meeting", "training", "social", "other"]),
  visibility: z.enum(["public", "private", "members"]),
  requestLogin: z.boolean().optional().default(false),
  organizationName: z.string().optional(),
  organizationType: z.enum(["committee", "club", "group", "campaign", "party", "other"]).optional(),
  phone: z.string().optional(),
  message: z.string().optional(),
});

type EventSubmissionFormData = z.infer<typeof eventSubmissionSchema>;

export default function SubmitEvent() {
  const [, setLocation] = useLocation();
  const [requestLogin, setRequestLogin] = useState(false);
  const submitEventMutation = trpc.events.submit.useMutation();
  const submitOrganizerRequestMutation = trpc.organizerRequests.submit.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<any>({
    resolver: zodResolver(eventSubmissionSchema),
    defaultValues: {
      eventType: "other",
      visibility: "public",
      requestLogin: false,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      // Submit event
      const eventResult = await submitEventMutation.mutateAsync({
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        location: data.location,
        locationAddress: data.locationAddress,
        locationLatitude: data.locationLatitude,
        locationLongitude: data.locationLongitude,
        organizerName: data.organizerName,
        organizerEmail: data.organizerEmail,
        organizerPhone: data.organizerPhone,
        organizerUrl: data.organizerUrl,
        eventUrl: data.eventUrl,
        imageUrl: data.imageUrl,
        eventType: data.eventType,
        visibility: data.visibility,
      });

      // Show appropriate success message based on user type
      if (eventResult.status === "approved") {
        toast.success("Event submitted and approved!", {
          description: "Your event is now live on Delaware Right Now and in our RSS feed.",
          duration: 5000,
        });
      } else {
        toast.success("Event submitted for review!", {
          description: "An admin will review your event shortly and it will appear once approved.",
          duration: 5000,
        });
      }

      // Submit organizer request if requested
      if (data.requestLogin && data.organizationName) {
        await submitOrganizerRequestMutation.mutateAsync({
          email: data.organizerEmail,
          name: data.organizerName,
          organizationName: data.organizationName,
          organizationType: data.organizationType || "other",
          phone: data.phone,
          message: data.message,
        });

        toast.success("Organizer access requested!", {
          description: "We will review your request and contact you within 24 hours.",
          duration: 5000,
        });
      }

      // Redirect to events page
      setLocation("/events");
    } catch (error) {
      toast.error("Failed to submit event. Please try again.");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Submit an Event</h1>
          <p className="text-muted-foreground">
            Share your conservative or Republican event with the Delaware community.
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Event Details Section */}
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-6 pb-4 border-b border-border">
                Event Details
              </h2>

              {/* Event Title */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  {...register("name")}
                  placeholder="e.g., Delaware GOP Annual Meeting"
                  className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {errors.name && typeof errors.name === 'object' && 'message' in errors.name && <p className="text-error text-sm mt-1">{String(errors.name.message)}</p>}
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description *
                </label>
                <textarea
                  {...register("description")}
                  placeholder="Describe your event..."
                  rows={5}
                  className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {errors.description && typeof errors.description === 'object' && 'message' in errors.description && <p className="text-error text-sm mt-1">{String(errors.description.message)}</p>}
              </div>

              {/* Date and Time */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    {...register("startDate", { valueAsDate: true })}
                    className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  {errors.startDate && typeof errors.startDate === 'object' && 'message' in errors.startDate && <p className="text-error text-sm mt-1">{String(errors.startDate.message)}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    {...register("endDate", { valueAsDate: true })}
                    className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  {errors.endDate && typeof errors.endDate === 'object' && 'message' in errors.endDate && <p className="text-error text-sm mt-1">{String(errors.endDate.message)}</p>}
                </div>
              </div>

              {/* Event Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Event Type *
                </label>
                <select
                  {...register("eventType")}
                  className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="other">Select event type</option>
                  <option value="fundraiser">Fundraiser</option>
                  <option value="rally">Rally</option>
                  <option value="meeting">Meeting</option>
                  <option value="training">Training</option>
                  <option value="social">Social Event</option>
                  <option value="other">Other</option>
                </select>
                {errors.eventType && typeof errors.eventType === 'object' && 'message' in errors.eventType && <p className="text-error text-sm mt-1">{String(errors.eventType.message)}</p>}
              </div>

              {/* Visibility */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Visibility *
                </label>
                <select
                  {...register("visibility")}
                  className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="public">Public - Visible to all, location shown</option>
                  <option value="private">Private - Visible but location masked</option>
                  <option value="members">Members Only - Visible but location masked</option>
                </select>
                {errors.visibility && typeof errors.visibility === 'object' && 'message' in errors.visibility && <p className="text-error text-sm mt-1">{String(errors.visibility.message)}</p>}
              </div>
            </div>

            {/* Location Section */}
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-6 pb-4 border-b border-border">
                Location
              </h2>

              {/* Location Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Location Name *
                </label>
                <input
                  type="text"
                  {...register("location")}
                  placeholder="e.g., Dover Convention Center"
                  className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {errors.location && typeof errors.location === 'object' && 'message' in errors.location && <p className="text-error text-sm mt-1">{String(errors.location.message)}</p>}
              </div>

              {/* Address */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Address
                </label>
                <GooglePlacesAutocomplete
                  value={watch("locationAddress") || ""}
                  onChange={(value, details) => {
                    setValue("locationAddress", value);
                    if (details?.lat && details?.lng) {
                      setValue("locationLatitude", String(details.lat));
                      setValue("locationLongitude", String(details.lng));
                    }
                  }}
                  placeholder="Street address, city, state, zip"
                  className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Start typing to see address suggestions powered by Google Places
                </p>
              </div>

              {/* Hidden coordinates - captured automatically from Google Places */}
              <input type="hidden" {...register("locationLatitude")} />
              <input type="hidden" {...register("locationLongitude")} />
            </div>

            {/* Organizer Section */}
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-6 pb-4 border-b border-border">
                Organizer Information
              </h2>

              {/* Organization Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  {...register("organizationName")}
                  placeholder="e.g., New Castle County GOP, Delaware Women's Club, Smith for Governor Campaign"
                  className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {errors.organizationName && typeof errors.organizationName === 'object' && 'message' in errors.organizationName && <p className="text-error text-sm mt-1">{String(errors.organizationName.message)}</p>}
              </div>

              {/* Organizer Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  {...register("organizerName")}
                  placeholder="Full name"
                  className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {errors.organizerName && typeof errors.organizerName === 'object' && 'message' in errors.organizerName && <p className="text-error text-sm mt-1">{String(errors.organizerName.message)}</p>}
              </div>

              {/* Email */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  {...register("organizerEmail")}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {errors.organizerEmail && typeof errors.organizerEmail === 'object' && 'message' in errors.organizerEmail && <p className="text-error text-sm mt-1">{String(errors.organizerEmail.message)}</p>}
              </div>

              {/* Phone */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  {...register("organizerPhone")}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Website */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Website
                </label>
                <input
                  type="url"
                  {...register("organizerUrl")}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Event URL */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Event URL / Registration Link
                </label>
                <input
                  type="url"
                  {...register("eventUrl")}
                  placeholder="https://example.com/event"
                  className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {/* Request Login Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  id="requestLogin"
                  checked={requestLogin}
                  onChange={(e) => {
                    setRequestLogin(e.target.checked);
                    setValue("requestLogin", e.target.checked);
                  }}
                  className="mt-1 w-5 h-5 text-accent rounded"
                />
                <div className="flex-1">
                  <label htmlFor="requestLogin" className="block font-medium text-foreground mb-2">
                    Request Organizer Login Access
                  </label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Check this box if you'd like to request a login account to manage multiple events for your organization. 
                    We'll review your request and contact you to set up your account.
                  </p>

                  {requestLogin && (
                    <div className="space-y-4 mt-4 pt-4 border-t border-blue-200">
                      {/* Organization Name */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Organization Name *
                        </label>
                        <input
                          type="text"
                          {...register("organizationName")}
                          placeholder="e.g., Delaware Republican State Committee"
                          className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        {errors.organizationName && typeof errors.organizationName === 'object' && 'message' in errors.organizationName && <p className="text-error text-sm mt-1">{String(errors.organizationName.message)}</p>}
                      </div>

                      {/* Organization Type */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Organization Type
                        </label>
                        <select
                          {...register("organizationType")}
                          className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="">Select type</option>
                          <option value="committee">Committee</option>
                          <option value="club">Club</option>
                          <option value="group">Group</option>
                          <option value="campaign">Campaign</option>
                          <option value="party">Party</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {/* Message */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Message (Optional)
                        </label>
                        <textarea
                          {...register("message")}
                          placeholder="Tell us about your organization..."
                          rows={3}
                          className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-primary hover:bg-blue-900 text-white py-3"
              >
                {isSubmitting ? "Submitting..." : "Submit Event"}
              </Button>
              <Button
                type="button"
                onClick={() => setLocation("/")}
                variant="outline"
                className="flex-1 py-3"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
