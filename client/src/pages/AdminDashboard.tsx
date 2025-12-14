import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("events");

  // Check if user is admin
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-accent mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the admin dashboard.
          </p>
          <Button
            onClick={() => setLocation("/")}
            className="bg-primary hover:bg-blue-900 text-white"
          >
            Return Home
          </Button>
        </Card>
      </div>
    );
  }

  const { data: pendingEventsData } = trpc.events.listPending.useQuery({});
  const pendingEvents = pendingEventsData?.events || [];
  const { data: pendingRequestsData } = trpc.organizerRequests.listPending.useQuery({});
  const pendingRequests = pendingRequestsData?.requests || [];

  const approveEventMutation = trpc.events.approve.useMutation();
  const rejectEventMutation = trpc.events.reject.useMutation();
  const approveRequestMutation = trpc.organizerRequests.approve.useMutation();
  const rejectRequestMutation = trpc.organizerRequests.reject.useMutation();

  const handleApproveEvent = async (id: number) => {
    try {
      await approveEventMutation.mutateAsync({ id });
      toast.success("Event approved!");
    } catch (error) {
      toast.error("Failed to approve event");
    }
  };

  const handleRejectEvent = async (id: number) => {
    try {
      await rejectEventMutation.mutateAsync({ id, reason: "Rejected by admin" });
      toast.success("Event rejected");
    } catch (error) {
      toast.error("Failed to reject event");
    }
  };

  const handleApproveRequest = async (id: number) => {
    try {
      await approveRequestMutation.mutateAsync({ id, organizationId: 1 });
      toast.success("Organizer request approved!");
    } catch (error) {
      toast.error("Failed to approve request");
    }
  };

  const handleRejectRequest = async (id: number) => {
    try {
      await rejectRequestMutation.mutateAsync({ id, reason: "Rejected by admin" });
      toast.success("Organizer request rejected");
    } catch (error) {
      toast.error("Failed to reject request");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-primary text-primary-foreground shadow-md">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center font-bold">
              DE
            </div>
            <h1 className="text-xl font-bold">Delaware Right Now</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">{user?.name}</span>
            <button
              onClick={() => setLocation("/")}
              className="px-4 py-2 bg-accent/20 hover:bg-accent/30 rounded-md transition-colors"
            >
              Back to Site
            </button>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <section className="bg-gradient-to-r from-primary to-blue-900 text-primary-foreground py-12">
        <div className="container">
          <h2 className="text-4xl font-bold mb-2">Admin Dashboard</h2>
          <p className="text-lg opacity-90">Manage event submissions and organizer requests</p>
        </div>
      </section>

      {/* Dashboard Content */}
      <section className="container py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Events ({pendingEvents.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Organizer Requests ({pendingRequests.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Events Tab */}
          <TabsContent value="events">
            {pendingEvents.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground">
                  There are no pending events to review.
                </p>
              </Card>
            ) : (
              <div className="grid gap-6">
                {pendingEvents.map((event: any) => (
                  <Card key={event.id} className="p-6 border border-border">
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-2xl font-bold text-foreground">{event.name}</h3>
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                          Pending Review
                        </span>
                      </div>
                      <p className="text-muted-foreground mb-4">{event.description}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-6 text-sm text-foreground">
                      <div>
                        <strong>Date:</strong> {format(new Date(event.startDate), "PPpp")}
                      </div>
                      <div>
                        <strong>Location:</strong> {event.location}
                      </div>
                      <div>
                        <strong>Organizer:</strong> {event.organizerName}
                      </div>
                      <div>
                        <strong>Email:</strong> {event.organizerEmail}
                      </div>
                      <div>
                        <strong>Type:</strong> {event.eventType}
                      </div>
                      <div>
                        <strong>Visibility:</strong> {event.visibility}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleApproveEvent(event.id)}
                        disabled={approveEventMutation.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleRejectEvent(event.id)}
                        disabled={rejectEventMutation.isPending}
                        variant="outline"
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Organizer Requests Tab */}
          <TabsContent value="requests">
            {pendingRequests.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground">
                  There are no pending organizer requests to review.
                </p>
              </Card>
            ) : (
              <div className="grid gap-6">
                {pendingRequests.map((request: any) => (
                  <Card key={request.id} className="p-6 border border-border">
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-2xl font-bold text-foreground">{request.name}</h3>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          Pending Review
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-6 text-sm text-foreground">
                      <div>
                        <strong>Email:</strong> {request.email}
                      </div>
                      <div>
                        <strong>Phone:</strong> {request.phone || "Not provided"}
                      </div>
                      <div>
                        <strong>Organization:</strong> {request.organizationName}
                      </div>
                      <div>
                        <strong>Organization Type:</strong> {request.organizationType}
                      </div>
                      <div className="md:col-span-2">
                        <strong>Message:</strong>
                        <p className="text-muted-foreground mt-1">{request.message || "No message provided"}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleApproveRequest(request.id)}
                        disabled={approveRequestMutation.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve & Create Account
                      </Button>
                      <Button
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={rejectRequestMutation.isPending}
                        variant="outline"
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
