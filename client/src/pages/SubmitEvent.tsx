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
  eventType: z.enum(["fundraiser", "rally", "meeting", "training", "social", "other"]),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().optional(),
  recurringMonths: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  startTime: z.string().optional(),
  isAllDay: z.boolean().optional().default(false),
  durationValue: z.number().optional(),
  durationUnit: z.enum(["minutes", "hours", "days"]).optional(),
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
  visibility: z.enum(["public", "private", "members"]),
  requestLogin: z.boolean().optional().default(false),
  organizationName: z.string().optional(),
  organizationType: z.enum(["committee", "club", "group", "campaign", "party", "other"]).optional(),
  phone: z.string().optional(),
  message: z.string().optional(),
  userTimezoneOffset: z.number().optional(),
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
      isRecurring: false,
    },
  });

  const eventType = watch("eventType");
  const isRecurring = watch("isRecurring");
  const recurringMonths = watch("recurringMonths");

  const onSubmit = async (data: any) => {
    try {
      // Get user's timezone offset in minutes
      const userTimezoneOffset = new Date().getTimezoneOffset();
      
      // Submit event
      const eventResult = await submitEventMutation.mutateAsync({
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        startTime: data.startTime,
        isAllDay: data.isAllDay ? 1 : 0,
        durationValue: data.durationValue,
        durationUnit: data.durationUnit,
        userTimezoneOffset: userTimezoneOffset,
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
        isRecurring: (data.isRecurring && data.eventType === "meeting") ? 1 : 0,
        recurringPattern: (data.isRecurring && data.eventType === "meeting") ? data.recurringPattern : null,
        recurringMonths: (data.isRecurring && data.eventType === "meeting") ? data.recurringMonths : null,
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

  const nthDayOptions = [
    { value: "1st-monday", label: "1st Monday" },
    { value: "1st-tuesday", label: "1st Tuesday" },
    { value: "1st-wednesday", label: "1st Wednesday" },
    { value: "1st-thursday", label: "1st Thursday" },
    { value: "1st-friday", label: "1st Friday" },
    { value: "1st-saturday", label: "1st Saturday" },
    { value: "1st-sunday", label: "1st Sunday" },
    { value: "2nd-monday", label: "2nd Monday" },
    { value: "2nd-tuesday", label: "2nd Tuesday" },
    { value: "2nd-wednesday", label: "2nd Wednesday" },
    { value: "2nd-thursday", label: "2nd Thursday" },
    { value: "2nd-friday", label: "2nd Friday" },
    { value: "2nd-saturday", label: "2nd Saturday" },
    { value: "2nd-sunday", label: "2nd Sunday" },
    { value: "3rd-monday", label: "3rd Monday" },
    { value: "3rd-tuesday", label: "3rd Tuesday" },
    { value: "3rd-wednesday", label: "3rd Wednesday" },
    { value: "3rd-thursday", label: "3rd Thursday" },
    { value: "3rd-friday", label: "3rd Friday" },
    { value: "3rd-saturday", label: "3rd Saturday" },
    { value: "3rd-sunday", label: "3rd Sunday" },
    { value: "4th-monday", label: "4th Monday" },
    { value: "4th-tuesday", label: "4th Tuesday" },
    { value: "4th-wednesday", label: "4th Wednesday" },
    { value: "4th-thursday", label: "4th Thursday" },
    { value: "4th-friday", label: "4th Friday" },
    { value: "4th-saturday", label: "4th Saturday" },
    { value: "4th-sunday", label: "4th Sunday" },
    { value: "last-monday", label: "Last Monday" },
    { value: "last-tuesday", label: "Last Tuesday" },
    { value: "last-wednesday", label: "Last Wednesday" },
    { value: "last-thursday", label: "Last Thursday" },
    { value: "last-friday", label: "Last Friday" },
    { value: "last-saturday", label: "Last Saturday" },
    { value: "last-sunday", label: "Last Sunday" },
  ];

  const monthOptions = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const handleMonthToggle = (monthValue: string) => {
    const currentMonths = recurringMonths ? JSON.parse(recurringMonths) : [];
    const monthNum = parseInt(monthValue);
    const index = currentMonths.indexOf(monthNum);
    
    if (index > -1) {
      currentMonths.splice(index, 1);
    } else {
      currentMonths.push(monthNum);
    }
    
    currentMonths.sort((a: number, b: number) => a - b);
    setValue("recurringMonths", JSON.stringify(currentMonths));
  };

  const getSelectedMonths = () => {
    if (!recurringMonths) return [];
    try {
      return JSON.parse(recurringMonths);
    } catch {
      return [];
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

              {/* Event Type - MOVED ABOVE DATE/TIME */}
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

              {/* Recurring Meeting Options - ONLY FOR MEETING TYPE */}
              {eventType === "meeting" && (
                <div className="mb-6 p-4 bg-accent/10 rounded-md border border-accent/20">
                  <div className="mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("isRecurring")}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium text-foreground">
                        This is a recurring monthly meeting
                      </span>
                    </label>
                  </div>

                  {isRecurring && (
                    <>
                      {/* Nth Day of Week Selection */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Meeting Pattern *
                        </label>
                        <select
                          {...register("recurringPattern")}
                          className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="">Select meeting pattern</option>
                          {nthDayOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {errors.recurringPattern && typeof errors.recurringPattern === 'object' && 'message' in errors.recurringPattern && <p className="text-error text-sm mt-1">{String(errors.recurringPattern.message)}</p>}
                      </div>

                      {/* Month Selection */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-3">
                          Active Months *
                        </label>
                        <p className="text-xs text-muted-foreground mb-3">
                          Select which months this meeting occurs (for breaks during the year)
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {monthOptions.map((month) => (
                            <label key={month.value} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={getSelectedMonths().includes(parseInt(month.value))}
                                onChange={() => handleMonthToggle(month.value)}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-foreground">{month.label}</span>
                            </label>
                          ))}
                        </div>
                        {getSelectedMonths().length === 0 && isRecurring && (
                          <p className="text-error text-sm mt-2">Select at least one month</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Date and Time */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  {...register("startDate", { valueAsDate: true })}
                  className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {errors.startDate && typeof errors.startDate === 'object' && 'message' in errors.startDate && <p className="text-error text-sm mt-1">{String(errors.startDate.message)}</p>}
              </div>

              {/* Start Time */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Start Time
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    {...register("startTime")}
                    className="px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select time</option>
                    {Array.from({ length: 24 }, (_, h) => 
                      Array.from({ length: 4 }, (_, m) => {
                        const hour = String(h).padStart(2, '0');
                        const minute = String(m * 15).padStart(2, '0');
                        const time = `${hour}:${minute}`;
                        return <option key={time} value={time}>{time}</option>;
                      })
                    )}
                  </select>
                </div>
                {errors.startTime && typeof errors.startTime === 'object' && 'message' in errors.startTime && <p className="text-error text-sm mt-1">{String(errors.startTime.message)}</p>}
              </div>

              {/* All Day Checkbox */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("isAllDay")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-foreground">
                    All day event
                  </span>
                </label>
              </div>

              {/* Duration */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Duration
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="number"
                    {...register("durationValue", { valueAsNumber: true })}
                    placeholder="e.g., 2"
                    min="1"
                    className="px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <select
                    {...register("durationUnit")}
                    className="px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent col-span-2"
                  >
                    <option value="">Select unit</option>
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
                {errors.durationValue && typeof errors.durationValue === 'object' && 'message' in errors.durationValue && <p className="text-error text-sm mt-1">{String(errors.durationValue.message)}</p>}
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

              {/* Address with Google Places Autocomplete */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Address
                </label>
                <GooglePlacesAutocomplete
                  value={watch("locationAddress") || ""}
                  onChange={(value: string, details?: { lat?: number; lng?: number; address?: string }) => {
                    setValue("locationAddress", value);
                    if (details?.lat) setValue("locationLatitude", details.lat.toString());
                    if (details?.lng) setValue("locationLongitude", details.lng.toString());
                  }}
                  onAddressSelect={(address: string, lat: number, lng: number) => {
                    setValue("locationAddress", address);
                    setValue("locationLatitude", lat.toString());
                    setValue("locationLongitude", lng.toString());
                  }}
                />
              </div>
            </div>

            {/* Organizer Information Section */}
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
                  placeholder="Your full name"
                  className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {errors.organizerName && typeof errors.organizerName === 'object' && 'message' in errors.organizerName && <p className="text-error text-sm mt-1">{String(errors.organizerName.message)}</p>}
              </div>

              {/* Organizer Email */}
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

              {/* Organizer Phone */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  {...register("organizerPhone")}
                  placeholder="(302) 555-0000"
                  className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {errors.organizerPhone && typeof errors.organizerPhone === 'object' && 'message' in errors.organizerPhone && <p className="text-error text-sm mt-1">{String(errors.organizerPhone.message)}</p>}
              </div>

              {/* Organizer URL */}
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
                {errors.organizerUrl && typeof errors.organizerUrl === 'object' && 'message' in errors.organizerUrl && <p className="text-error text-sm mt-1">{String(errors.organizerUrl.message)}</p>}
              </div>

              {/* Request Login Checkbox */}
              <div className="mb-6 p-4 bg-primary/10 rounded-md border border-primary/20">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requestLogin}
                    onChange={(e) => setRequestLogin(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-foreground">
                    Request organizer login access
                  </span>
                </label>
                <p className="text-xs text-muted-foreground mt-2">
                  We'll vet your request and contact you within 24 hours to set up your account for direct event submission.
                </p>
              </div>
            </div>

            {/* Event Details Section */}
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-6 pb-4 border-b border-border">
                Additional Details
              </h2>

              {/* Event URL */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Event Website/Registration URL
                </label>
                <input
                  type="url"
                  {...register("eventUrl")}
                  placeholder="https://example.com/event"
                  className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {errors.eventUrl && typeof errors.eventUrl === 'object' && 'message' in errors.eventUrl && <p className="text-error text-sm mt-1">{String(errors.eventUrl.message)}</p>}
              </div>

              {/* Image URL */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Event Image URL
                </label>
                <input
                  type="url"
                  {...register("imageUrl")}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {errors.imageUrl && typeof errors.imageUrl === 'object' && 'message' in errors.imageUrl && <p className="text-error text-sm mt-1">{String(errors.imageUrl.message)}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-accent hover:bg-accent/90 text-white font-semibold py-3 rounded-md transition-colors"
              >
                {isSubmitting ? "Submitting..." : "Submit Event"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
