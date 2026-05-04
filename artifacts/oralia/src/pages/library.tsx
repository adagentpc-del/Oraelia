import { useState } from "react";
import { useListLibraryEntries, useListLibraryCategories } from "@workspace/api-client-react";
import type { LibraryEntry } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, AlertTriangle } from "lucide-react";

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const queryParams: Record<string, string> = {};
  if (search) queryParams.search = search;
  if (category !== "All") queryParams.category = category;

  const { data: entries, isLoading, isError, refetch } = useListLibraryEntries(queryParams);
  const { data: categories } = useListLibraryCategories();

  const allCategories = ["All", ...(categories || [])];

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-serif text-primary mb-2">Unable to load library</h2>
        <p className="text-muted-foreground mb-6">Something went wrong while fetching library entries.</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-serif font-bold text-primary tracking-wide">Knowledge Library</h1>
        <p className="text-muted-foreground mt-2">Explore archetypes, systems, and energetic principles.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the library..."
            className="pl-9"
            data-testid="input-library-search"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full md:w-[200px]" data-testid="select-library-category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {allCategories.map((cat: string) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : entries?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry: LibraryEntry) => (
            <Card key={entry.id} className="bg-card hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{entry.category}</div>
                <CardTitle className="font-serif text-lg text-primary leading-tight">{entry.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">{entry.content}</p>
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {entry.tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="text-xs bg-secondary/20 text-secondary-foreground px-2 py-0.5 rounded-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card border border-border border-dashed rounded-lg">
          <p className="text-muted-foreground">No entries found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
