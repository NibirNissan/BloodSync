import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Phone, Calendar, Droplet, Filter } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useListDonors, getListDonorsQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function FindDonors() {
  const [bloodGroup, setBloodGroup] = useState<string>("");
  const [district, setDistrict] = useState<string>("");

  const { data: donors, isLoading } = useListDonors(
    { blood_group: bloodGroup || undefined, district: district || undefined, is_willing_to_donate: true },
    { query: { queryKey: getListDonorsQueryKey({ blood_group: bloodGroup || undefined, district: district || undefined, is_willing_to_donate: true }) } }
  );

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Find Donors</h1>
          <p className="text-gray-400 max-w-2xl text-lg">Search for available blood donors in your area. Contact them directly via WhatsApp in case of emergency.</p>
        </div>

        <GlassCard className="mb-8 p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input 
                placeholder="Search by district..." 
                className="pl-9 bg-white/5 border-white/10 text-white h-12 rounded-xl focus-visible:ring-primary"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
            </div>
            
            <Select value={bloodGroup} onValueChange={setBloodGroup}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 rounded-xl">
                <SelectValue placeholder="All Blood Groups" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-white">
                <SelectItem value="all">All Blood Groups</SelectItem>
                {BLOOD_GROUPS.map(bg => (
                  <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              className="h-12 rounded-xl bg-white/10 text-white hover:bg-white/20 border border-white/10"
              onClick={() => { setBloodGroup(""); setDistrict(""); }}
            >
              <Filter className="w-4 h-4 mr-2" /> Clear Filters
            </Button>
          </div>
        </GlassCard>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <GlassCard key={i} className="h-64 animate-pulse bg-white/5" />
            ))}
          </div>
        ) : donors?.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No donors found</h3>
            <p className="text-gray-400">Try adjusting your filters to see more results.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donors?.map((donor, idx) => (
              <motion.div
                key={donor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                <GlassCard className="relative overflow-hidden group hover:border-primary/50 transition-colors">
                  <div className="absolute top-0 right-0 p-6 flex justify-end">
                     <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xl shadow-[0_0_15px_rgba(220,38,38,0.2)] group-hover:scale-110 transition-transform">
                       {donor.blood_group}
                     </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-1 pr-16">{donor.name}</h3>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 mb-4">
                    Willing to donate
                  </Badge>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-gray-300 text-sm">
                      <MapPin className="w-4 h-4 mr-3 text-gray-500" />
                      {donor.district}
                    </div>
                    <div className="flex items-center text-gray-300 text-sm">
                      <Calendar className="w-4 h-4 mr-3 text-gray-500" />
                      Last Donated: {donor.last_donation_date ? format(new Date(donor.last_donation_date), "MMM d, yyyy") : "Never"}
                    </div>
                    {donor.smoker && (
                      <div className="flex items-center text-orange-300/80 text-sm">
                        <Droplet className="w-4 h-4 mr-3 opacity-50" />
                        Smoker
                      </div>
                    )}
                  </div>

                  <a href={`https://wa.me/${donor.whatsapp_number.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="block w-full">
                    <Button className="w-full bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/30 group-hover:bg-[#25D366] group-hover:text-white transition-all h-12 rounded-xl font-medium">
                      <Phone className="w-4 h-4 mr-2" /> WhatsApp Now
                    </Button>
                  </a>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
