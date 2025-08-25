// src/components/itinerary/DayCard.tsx
import { MapPinned, Clock, Landmark } from "lucide-react";
import { Card, CardBody, CardHeader } from "../ui/Card";
import Badge from "../ui/Badge";

type Activity = {
  time?: string;
  title: string;
  details?: string;
  mapUrl?: string;
  tags?: string[];
};

export default function DayCard({ dayIndex, date, activities }: { dayIndex: number; date?: string; activities: Activity[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader title={`Day ${dayIndex + 1}`} subtitle={date} />
      <CardBody>
        <ol className="space-y-4">
          {activities.map((a, i) => (
            <li key={i} className="grid grid-cols-[auto,1fr] gap-3">
              <div className="pt-1">
                <Badge className="bg-sky-50 text-sky-700">{a.time ?? "—"}</Badge>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-medium">
                  <Landmark className="h-4 w-4 text-slate-500" />
                  {a.title}
                </div>
                {a.details && <p className="text-sm text-slate-600">{a.details}</p>}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {a.mapUrl && (
                    <a
                      href={a.mapUrl}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-sm text-sky-700 hover:underline"
                    >
                      <MapPinned className="h-4 w-4" />
                      Open map
                    </a>
                  )}
                  {a.tags?.map((t, k) => (
                    <Badge key={k}>{t}</Badge>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </CardBody>
      <div className="border-t bg-slate-50/60 p-3 text-xs text-slate-500 flex items-center gap-2">
        <Clock className="h-3.5 w-3.5" />
        Keep 15–20 min buffer between activities.
      </div>
    </Card>
  );
}