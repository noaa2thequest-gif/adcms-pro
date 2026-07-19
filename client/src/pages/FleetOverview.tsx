import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function FleetOverview() {
  const [, navigate] = useLocation();
  const { data: aircraft, isLoading, error } = trpc.aircraft.list.useQuery();
  const { data: allDefects } = trpc.defect.list.useQuery({});
  const { data: allCabinDefects } = trpc.cabinDefect.list.useQuery({});
  const { data: allMelItems } = trpc.mel.list.useQuery({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">Failed to load aircraft data</p>
        </div>
      </div>
    );
  }

  const getAircraftStats = (aircraftId: number) => {
    const defects = (allDefects || []).filter((d: any) => d.aircraftId === aircraftId && d.status === "OPEN");
    const cabinDefects = (allCabinDefects || []).filter((c: any) => c.aircraftId === aircraftId);
    const melItems = (allMelItems || []).filter((m: any) => {
      const defect = allDefects?.find((d: any) => d.id === m.defectId);
      return defect?.aircraftId === aircraftId;
    });

    return {
      openDefects: defects.length,
      cabinDefects: cabinDefects.length,
      melItems: melItems.length,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SERVICEABLE":
        return "bg-green-100 text-green-800";
      case "DEFERRED":
        return "bg-yellow-100 text-yellow-800";
      case "AOG":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Fleet Overview</h1>
        <p className="text-gray-600 mt-2">Monitor all aircraft and their maintenance status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aircraft?.map((ac: any) => {
          const stats = getAircraftStats(ac.id);
          const hasAOG = ac.status === "AOG";

          return (
            <Card
              key={ac.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${hasAOG ? "border-red-300" : ""}`}
              onClick={() => navigate(`/aircraft/${ac.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{ac.registration}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{ac.model}</p>
                  </div>
                  <Badge className={getStatusColor(ac.status)}>
                    {ac.status}
                  </Badge>
                </div>
                {ac.location && (
                  <p className="text-xs text-gray-500 mt-2">📍 {ac.location}</p>
                )}
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium text-gray-700">Open Defects</span>
                    <span className={`text-lg font-bold ${stats.openDefects > 0 ? "text-red-600" : "text-green-600"}`}>
                      {stats.openDefects}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium text-gray-700">MEL Items</span>
                    <span className={`text-lg font-bold ${stats.melItems > 0 ? "text-orange-600" : "text-green-600"}`}>
                      {stats.melItems}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium text-gray-700">Cabin Defects</span>
                    <span className={`text-lg font-bold ${stats.cabinDefects > 0 ? "text-yellow-600" : "text-green-600"}`}>
                      {stats.cabinDefects}
                    </span>
                  </div>
                </div>

                {hasAOG && (
                  <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-xs text-red-700 font-medium">Aircraft Grounded</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(!aircraft || aircraft.length === 0) && (
        <div className="text-center py-12">
          <p className="text-gray-500">No aircraft in fleet</p>
        </div>
      )}
    </div>
  );
}
