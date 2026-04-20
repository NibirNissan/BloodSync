import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { 
  useGetStatsSummary, getGetStatsSummaryQueryKey,
  useGetBloodGroupStats, getGetBloodGroupStatsQueryKey,
  useListDonors, getListDonorsQueryKey,
  useListRequests, getListRequestsQueryKey
} from "@workspace/api-client-react";
import { 
  Users, Droplet, ShieldCheck, Activity, AlertCircle, Clock, CheckCircle2 
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStatsSummary({
    query: { queryKey: getGetStatsSummaryQueryKey() }
  });

  const { data: bgStats, isLoading: bgLoading } = useGetBloodGroupStats({
    query: { queryKey: getGetBloodGroupStatsQueryKey() }
  });

  const { data: recentDonors, isLoading: donorsLoading } = useListDonors(undefined, {
    query: { queryKey: getListDonorsQueryKey() }
  });

  const { data: recentRequests, isLoading: requestsLoading } = useListRequests({
    query: { queryKey: getListRequestsQueryKey() }
  });

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400 text-lg">Overview of BloodSync platform activity</p>
          </div>
          <div className="flex items-center text-sm text-gray-400 bg-white/5 border border-white/10 rounded-lg px-4 py-2">
            <Activity className="w-4 h-4 text-emerald-400 mr-2" />
            System Status: Healthy
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Total Donors</p>
                <h3 className="text-3xl font-bold text-white">{statsLoading ? "-" : stats?.total_donors}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div className="mt-4 text-xs text-blue-400 flex items-center">
              <span className="font-medium mr-1">{statsLoading ? "-" : stats?.willing_donors}</span> actively willing to donate
            </div>
          </GlassCard>

          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Completed Donations</p>
                <h3 className="text-3xl font-bold text-white">{statsLoading ? "-" : stats?.completed_donations}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Droplet className="w-5 h-5 text-primary" fill="currentColor" />
              </div>
            </div>
            <div className="mt-4 text-xs text-primary/80 relative z-10">
              Successfully verified life-saving acts
            </div>
          </GlassCard>

          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Total Requests</p>
                <h3 className="text-3xl font-bold text-white">{statsLoading ? "-" : stats?.total_requests}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div className="mt-4 text-xs text-purple-400">
              Emergency requests processed
            </div>
          </GlassCard>

          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Pending Verifications</p>
                <h3 className="text-3xl font-bold text-white">{statsLoading ? "-" : stats?.pending_verifications}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div className="mt-4 text-xs text-amber-400">
              Require admin approval
            </div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Blood Group Breakdown */}
          <GlassCard className="lg:col-span-1 p-6 flex flex-col">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <Droplet className="w-5 h-5 mr-2 text-primary" />
              Blood Groups
            </h3>
            
            <div className="flex-1 space-y-4">
              {bgLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-8 bg-white/5 rounded-md" />)}
                </div>
              ) : bgStats?.length === 0 ? (
                <p className="text-gray-400 text-sm">No blood group data available.</p>
              ) : (
                bgStats?.map((stat) => {
                  const percentage = stats?.total_donors ? (stat.count / stats.total_donors) * 100 : 0;
                  return (
                    <div key={stat.blood_group} className="flex items-center group">
                      <div className="w-12 text-sm font-bold text-white bg-white/5 py-1 px-2 rounded text-center mr-4 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                        {stat.blood_group}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1 text-xs">
                          <span className="text-gray-400">{stat.count} donors</span>
                          <span className="text-gray-500">{percentage.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-red-600 to-red-400 h-1.5 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </GlassCard>

          {/* Recent Activity */}
          <div className="lg:col-span-2 space-y-8">
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-gray-400" />
                Recent Donors
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 uppercase bg-white/5 rounded-lg border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Name</th>
                      <th className="px-4 py-3">Blood Group</th>
                      <th className="px-4 py-3">District</th>
                      <th className="px-4 py-3 text-right rounded-tr-lg">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donorsLoading ? (
                      <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-500">Loading...</td></tr>
                    ) : recentDonors?.slice(0, 5).map((donor) => (
                      <tr key={donor.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{donor.name}</td>
                        <td className="px-4 py-3">
                          <span className="bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded text-xs font-bold">
                            {donor.blood_group}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{donor.district}</td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {format(new Date(donor.created_at), "MMM d, yyyy")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-gray-400" />
                Recent Requests
              </h3>
              
              <div className="space-y-3">
                {requestsLoading ? (
                  <p className="text-gray-500 text-sm">Loading...</p>
                ) : recentRequests?.length === 0 ? (
                  <p className="text-gray-500 text-sm">No recent requests.</p>
                ) : recentRequests?.slice(0, 4).map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">Requester: {req.requester_identifier}</span>
                      <span className="text-xs text-gray-500">{format(new Date(req.created_at), "PP p")}</span>
                    </div>
                    <Badge variant="outline" className={
                      req.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      req.status === "pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-gray-500/10 text-gray-400 border-gray-500/20"
                    }>
                      {req.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>

      </div>
    </div>
  );
}
