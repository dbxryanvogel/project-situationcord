"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Lightbulb,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Trash2,
  Calendar as CalendarIcon,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  createFeatureRequest,
  addFeatureRequestReport,
  deleteFeatureRequest,
  deleteFeatureRequestReport,
  getFeatureRequestReports,
  updateFeatureRequest,
} from "./actions";
import type { TimeFilter } from "./actions";
import type { FeatureRequestReport } from "@/db/schema";

interface FeatureRequestWithCount {
  id: string;
  title: string;
  description: string;
  firstRequestedAt: Date;
  isLlmGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
  reportCount: number;
}

interface FeatureRequestClientProps {
  featureRequests: FeatureRequestWithCount[];
  initialSearchQuery: string;
  initialTimeFilter: TimeFilter;
}

export function FeatureRequestClient({
  featureRequests,
  initialSearchQuery,
  initialTimeFilter,
}: FeatureRequestClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(initialTimeFilter);
  const [isPending, startTransition] = useTransition();
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const [featureReports, setFeatureReports] = useState<
    Record<string, FeatureRequestReport[]>
  >({});
  const [loadingReports, setLoadingReports] = useState<Set<string>>(new Set());

  // Edit state
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // New feature request form state
  const [newFeatureOpen, setNewFeatureOpen] = useState(false);
  const [newFeatureTitle, setNewFeatureTitle] = useState("");
  const [newFeatureDescription, setNewFeatureDescription] = useState("");
  const [newFeatureDiscordLink, setNewFeatureDiscordLink] = useState("");
  const [newFeatureDate, setNewFeatureDate] = useState<Date | undefined>(new Date());

  // Add report form state
  const [addReportOpen, setAddReportOpen] = useState<string | null>(null);
  const [reportDiscordLink, setReportDiscordLink] = useState("");
  const [reportDate, setReportDate] = useState<Date | undefined>(new Date());

  const updateUrlParams = (search: string, time: TimeFilter) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (time !== "all") params.set("time", time);
    const queryString = params.toString();
    router.push(`/dashboard/featurerequest${queryString ? `?${queryString}` : ""}`);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    startTransition(() => {
      updateUrlParams(value, timeFilter);
    });
  };

  const handleTimeFilterChange = (value: TimeFilter) => {
    setTimeFilter(value);
    startTransition(() => {
      updateUrlParams(searchQuery, value);
    });
  };

  const toggleFeatureExpanded = async (featureId: string) => {
    const newExpanded = new Set(expandedFeatures);
    if (newExpanded.has(featureId)) {
      newExpanded.delete(featureId);
    } else {
      newExpanded.add(featureId);
      // Load reports if not already loaded
      if (!featureReports[featureId]) {
        setLoadingReports((prev) => new Set(prev).add(featureId));
        const reports = await getFeatureRequestReports(featureId);
        setFeatureReports((prev) => ({ ...prev, [featureId]: reports }));
        setLoadingReports((prev) => {
          const newSet = new Set(prev);
          newSet.delete(featureId);
          return newSet;
        });
      }
    }
    setExpandedFeatures(newExpanded);
  };

  const handleStartEdit = (feature: FeatureRequestWithCount, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFeatureId(feature.id);
    setEditTitle(feature.title);
    setEditDescription(feature.description);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFeatureId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const handleSaveEdit = async (featureId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editTitle.trim()) return;
    
    await updateFeatureRequest(featureId, editTitle, editDescription);
    setEditingFeatureId(null);
    setEditTitle("");
    setEditDescription("");
    router.refresh();
  };

  const handleCreateFeature = async () => {
    if (
      !newFeatureTitle ||
      !newFeatureDescription ||
      !newFeatureDiscordLink ||
      !newFeatureDate
    )
      return;

    await createFeatureRequest(
      newFeatureTitle,
      newFeatureDescription,
      newFeatureDiscordLink,
      newFeatureDate
    );
    setNewFeatureOpen(false);
    setNewFeatureTitle("");
    setNewFeatureDescription("");
    setNewFeatureDiscordLink("");
    setNewFeatureDate(new Date());
    router.refresh();
  };

  const handleAddReport = async (featureId: string) => {
    if (!reportDiscordLink || !reportDate) return;

    await addFeatureRequestReport(featureId, reportDiscordLink, reportDate);
    setAddReportOpen(null);
    setReportDiscordLink("");
    setReportDate(new Date());
    // Refresh the reports for this feature
    const reports = await getFeatureRequestReports(featureId);
    setFeatureReports((prev) => ({ ...prev, [featureId]: reports }));
    router.refresh();
  };

  const handleDeleteFeature = async (featureId: string) => {
    await deleteFeatureRequest(featureId);
    router.refresh();
  };

  const handleDeleteReport = async (reportId: string, featureId: string) => {
    await deleteFeatureRequestReport(reportId);
    // Refresh the reports for this feature
    const reports = await getFeatureRequestReports(featureId);
    setFeatureReports((prev) => ({ ...prev, [featureId]: reports }));
    router.refresh();
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Feature Requests
            </CardTitle>
            <CardDescription>
              {featureRequests.length} feature request
              {featureRequests.length !== 1 ? "s" : ""} tracked
            </CardDescription>
          </div>
          <Dialog open={newFeatureOpen} onOpenChange={setNewFeatureOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Feature Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Feature Request</DialogTitle>
                <DialogDescription>
                  Create a new feature request entry with its first report
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Brief description of the feature"
                    value={newFeatureTitle}
                    onChange={(e) => setNewFeatureTitle(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed description of the feature request"
                    value={newFeatureDescription}
                    onChange={(e) => setNewFeatureDescription(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="discordLink">Discord Link</Label>
                  <Input
                    id="discordLink"
                    placeholder="https://discord.com/channels/..."
                    value={newFeatureDiscordLink}
                    onChange={(e) => setNewFeatureDiscordLink(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Request Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newFeatureDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newFeatureDate ? format(newFeatureDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newFeatureDate}
                        onSelect={setNewFeatureDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewFeatureOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFeature}>Create Feature Request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search feature requests by title or description..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={timeFilter} onValueChange={(v) => handleTimeFilterChange(v as TimeFilter)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Time filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="week">Last week</SelectItem>
              <SelectItem value="month">Last month</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Feature Request List */}
        {featureRequests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No feature requests found</p>
            <p className="text-sm mt-1">
              {searchQuery || timeFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Add a feature request to get started"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {featureRequests.map((feature) => (
              <Collapsible
                key={feature.id}
                open={expandedFeatures.has(feature.id)}
                onOpenChange={() => toggleFeatureExpanded(feature.id)}
              >
                <div className="border border-border rounded-lg overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {expandedFeatures.has(feature.id) ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingFeatureId === feature.id ? (
                            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                              <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Feature title"
                                className="font-medium"
                              />
                              <Textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Feature description"
                                className="text-sm min-h-[60px]"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => handleSaveEdit(feature.id, e)}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-foreground truncate flex items-center gap-1.5">
                                  <span 
                                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                      feature.isLlmGenerated ? "bg-primary" : "bg-muted-foreground"
                                    }`}
                                    title={feature.isLlmGenerated ? "Generated by AI" : "Added by human"}
                                  />
                                  {feature.title}
                                </h3>
                                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full flex-shrink-0">
                                  {feature.reportCount} request
                                  {feature.reportCount !== 1 ? "s" : ""}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate mt-0.5">
                                {feature.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                First requested: {formatDate(feature.firstRequestedAt)}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      {editingFeatureId !== feature.id && (
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={(e) => handleStartEdit(feature, e)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Feature Request</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this feature request? This
                                  will also delete all associated reports. This action cannot
                                  be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteFeature(feature.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-border bg-muted/30 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-foreground">Requests</h4>
                        <Dialog
                          open={addReportOpen === feature.id}
                          onOpenChange={(open) =>
                            setAddReportOpen(open ? feature.id : null)
                          }
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Plus className="h-3 w-3 mr-1" />
                              Add Request
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Request</DialogTitle>
                              <DialogDescription>
                                Add another request for "{feature.title}"
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label htmlFor="reportLink">Discord Link</Label>
                                <Input
                                  id="reportLink"
                                  placeholder="https://discord.com/channels/..."
                                  value={reportDiscordLink}
                                  onChange={(e) => setReportDiscordLink(e.target.value)}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>Request Date</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !reportDate && "text-muted-foreground"
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {reportDate
                                        ? format(reportDate, "PPP")
                                        : "Pick a date"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={reportDate}
                                      onSelect={setReportDate}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setAddReportOpen(null)}
                              >
                                Cancel
                              </Button>
                              <Button onClick={() => handleAddReport(feature.id)}>
                                Add Request
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      {loadingReports.has(feature.id) ? (
                        <div className="text-sm text-muted-foreground">
                          Loading requests...
                        </div>
                      ) : featureReports[feature.id]?.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          No requests yet
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {featureReports[feature.id]?.map((report) => (
                            <div
                              key={report.id}
                              className="flex items-center justify-between p-3 bg-background rounded-md border border-border"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span 
                                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                    report.isLlmGenerated ? "bg-primary" : "bg-muted-foreground"
                                  }`}
                                  title={report.isLlmGenerated ? "Generated by AI" : "Added by human"}
                                />
                                <a
                                  href={report.discordLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
                                >
                                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{report.discordLink}</span>
                                </a>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(report.requestedAt)}
                                </span>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      className="text-muted-foreground hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Request</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this request? This
                                        action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDeleteReport(report.id, feature.id)
                                        }
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
