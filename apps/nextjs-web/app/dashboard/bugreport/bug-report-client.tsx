"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Bug,
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
  createBug,
  addBugReport,
  deleteBug,
  deleteBugReport,
  getBugReports,
  updateBug,
} from "./actions";
import type { TimeFilter } from "./actions";
import type { BugReport } from "@/db/schema";

interface BugWithCount {
  id: string;
  title: string;
  description: string;
  firstReportedAt: Date;
  isLlmGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
  reportCount: number;
}

interface BugReportClientProps {
  bugs: BugWithCount[];
  initialSearchQuery: string;
  initialTimeFilter: TimeFilter;
}

export function BugReportClient({ bugs, initialSearchQuery, initialTimeFilter }: BugReportClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(initialTimeFilter);
  const [isPending, startTransition] = useTransition();
  const [expandedBugs, setExpandedBugs] = useState<Set<string>>(new Set());
  const [bugReports, setBugReports] = useState<Record<string, BugReport[]>>({});
  const [loadingReports, setLoadingReports] = useState<Set<string>>(new Set());

  // Edit state
  const [editingBugId, setEditingBugId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // New bug form state
  const [newBugOpen, setNewBugOpen] = useState(false);
  const [newBugTitle, setNewBugTitle] = useState("");
  const [newBugDescription, setNewBugDescription] = useState("");
  const [newBugDiscordLink, setNewBugDiscordLink] = useState("");
  const [newBugDate, setNewBugDate] = useState<Date | undefined>(new Date());

  // Add report form state
  const [addReportOpen, setAddReportOpen] = useState<string | null>(null);
  const [reportDiscordLink, setReportDiscordLink] = useState("");
  const [reportDate, setReportDate] = useState<Date | undefined>(new Date());

  const updateUrlParams = (search: string, time: TimeFilter) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (time !== "all") params.set("time", time);
    const queryString = params.toString();
    router.push(`/dashboard/bugreport${queryString ? `?${queryString}` : ""}`);
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

  const toggleBugExpanded = async (bugId: string) => {
    const newExpanded = new Set(expandedBugs);
    if (newExpanded.has(bugId)) {
      newExpanded.delete(bugId);
    } else {
      newExpanded.add(bugId);
      // Load reports if not already loaded
      if (!bugReports[bugId]) {
        setLoadingReports((prev) => new Set(prev).add(bugId));
        const reports = await getBugReports(bugId);
        setBugReports((prev) => ({ ...prev, [bugId]: reports }));
        setLoadingReports((prev) => {
          const newSet = new Set(prev);
          newSet.delete(bugId);
          return newSet;
        });
      }
    }
    setExpandedBugs(newExpanded);
  };

  const handleStartEdit = (bug: BugWithCount, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBugId(bug.id);
    setEditTitle(bug.title);
    setEditDescription(bug.description);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBugId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const handleSaveEdit = async (bugId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editTitle.trim()) return;
    
    await updateBug(bugId, editTitle, editDescription);
    setEditingBugId(null);
    setEditTitle("");
    setEditDescription("");
    router.refresh();
  };

  const handleCreateBug = async () => {
    if (!newBugTitle || !newBugDescription || !newBugDiscordLink || !newBugDate) return;

    await createBug(newBugTitle, newBugDescription, newBugDiscordLink, newBugDate);
    setNewBugOpen(false);
    setNewBugTitle("");
    setNewBugDescription("");
    setNewBugDiscordLink("");
    setNewBugDate(new Date());
    router.refresh();
  };

  const handleAddReport = async (bugId: string) => {
    if (!reportDiscordLink || !reportDate) return;

    await addBugReport(bugId, reportDiscordLink, reportDate);
    setAddReportOpen(null);
    setReportDiscordLink("");
    setReportDate(new Date());
    // Refresh the reports for this bug
    const reports = await getBugReports(bugId);
    setBugReports((prev) => ({ ...prev, [bugId]: reports }));
    router.refresh();
  };

  const handleDeleteBug = async (bugId: string) => {
    await deleteBug(bugId);
    router.refresh();
  };

  const handleDeleteReport = async (reportId: string, bugId: string) => {
    await deleteBugReport(reportId);
    // Refresh the reports for this bug
    const reports = await getBugReports(bugId);
    setBugReports((prev) => ({ ...prev, [bugId]: reports }));
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
              <Bug className="h-5 w-5" />
              Bug Reports
            </CardTitle>
            <CardDescription>
              {bugs.length} bug{bugs.length !== 1 ? "s" : ""} tracked
            </CardDescription>
          </div>
          <Dialog open={newBugOpen} onOpenChange={setNewBugOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Bug
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Bug</DialogTitle>
                <DialogDescription>
                  Create a new bug entry with its first report
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Brief description of the bug"
                    value={newBugTitle}
                    onChange={(e) => setNewBugTitle(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed description of the bug"
                    value={newBugDescription}
                    onChange={(e) => setNewBugDescription(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="discordLink">Discord Link</Label>
                  <Input
                    id="discordLink"
                    placeholder="https://discord.com/channels/..."
                    value={newBugDiscordLink}
                    onChange={(e) => setNewBugDiscordLink(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Report Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newBugDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newBugDate ? format(newBugDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newBugDate}
                        onSelect={setNewBugDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewBugOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateBug}>Create Bug</Button>
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
              placeholder="Search bugs by title or description..."
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

        {/* Bug List */}
        {bugs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bug className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No bugs found</p>
            <p className="text-sm mt-1">
              {searchQuery || timeFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Add a bug to get started"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bugs.map((bug) => (
              <Collapsible
                key={bug.id}
                open={expandedBugs.has(bug.id)}
                onOpenChange={() => toggleBugExpanded(bug.id)}
              >
                <div className="border border-border rounded-lg overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {expandedBugs.has(bug.id) ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingBugId === bug.id ? (
                            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                              <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Bug title"
                                className="font-medium"
                              />
                              <Textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Bug description"
                                className="text-sm min-h-[60px]"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => handleSaveEdit(bug.id, e)}
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
                                      bug.isLlmGenerated ? "bg-primary" : "bg-muted-foreground"
                                    }`}
                                    title={bug.isLlmGenerated ? "Generated by AI" : "Added by human"}
                                  />
                                  {bug.title}
                                </h3>
                                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full flex-shrink-0">
                                  {bug.reportCount} report{bug.reportCount !== 1 ? "s" : ""}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate mt-0.5">
                                {bug.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                First reported: {formatDate(bug.firstReportedAt)}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      {editingBugId !== bug.id && (
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={(e) => handleStartEdit(bug, e)}
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
                                <AlertDialogTitle>Delete Bug</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this bug? This will also
                                  delete all associated reports. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteBug(bug.id)}
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
                        <h4 className="text-sm font-medium text-foreground">Reports</h4>
                        <Dialog
                          open={addReportOpen === bug.id}
                          onOpenChange={(open) => setAddReportOpen(open ? bug.id : null)}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Plus className="h-3 w-3 mr-1" />
                              Add Report
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Report</DialogTitle>
                              <DialogDescription>
                                Add another report for "{bug.title}"
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
                                <Label>Report Date</Label>
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
                                      {reportDate ? format(reportDate, "PPP") : "Pick a date"}
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
                              <Button onClick={() => handleAddReport(bug.id)}>
                                Add Report
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      {loadingReports.has(bug.id) ? (
                        <div className="text-sm text-muted-foreground">
                          Loading reports...
                        </div>
                      ) : bugReports[bug.id]?.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          No reports yet
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {bugReports[bug.id]?.map((report) => (
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
                                  {formatDate(report.reportedAt)}
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
                                      <AlertDialogTitle>Delete Report</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this report? This
                                        action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteReport(report.id, bug.id)}
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
