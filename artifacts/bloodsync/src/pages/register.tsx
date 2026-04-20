import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { supabase, type Donor } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Heart, Loader2, User, MapPin, Droplet, Phone, Calendar,
  Cigarette, ShieldCheck, ArrowRight, Sparkles,
} from "lucide-react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const DISTRICTS = [
  "Dhaka", "Chittagong", "Rajshahi", "Khulna", "Sylhet", "Barisal",
  "Rangpur", "Mymensingh", "Comilla", "Narayanganj", "Gazipur",
  "Tangail", "Jessore", "Bogura", "Cox's Bazar", "Jamalpur", "Other",
];

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  blood_group: z.string({ required_error: "Please select a blood group." }).min(1, "Please select a blood group."),
  district: z.string({ required_error: "Please select your district." }).min(1, "Please select your district."),
  whatsapp_number: z
    .string()
    .min(8, "Please enter a valid WhatsApp number.")
    .regex(/^[0-9\s-]+$/, "Only digits, spaces, and dashes allowed."),
  smoker: z.boolean().default(false),
  last_donation_date: z.string().optional(),
  is_willing_to_donate: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [smoker, setSmoker] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      blood_group: undefined,
      district: undefined,
      whatsapp_number: "",
      smoker: false,
      last_donation_date: "",
      is_willing_to_donate: true,
    },
    mode: "onTouched",
  });

  const createDonor = useMutation({
    mutationFn: async (values: FormData & { smoker: boolean; whatsapp_number: string }) => {
      const { data, error } = await supabase
        .from("donors")
        .insert({
          name: values.name,
          blood_group: values.blood_group,
          district: values.district,
          whatsapp_number: values.whatsapp_number,
          smoker: values.smoker,
          last_donation_date: values.last_donation_date || null,
          is_willing_to_donate: values.is_willing_to_donate,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Donor;
    },
    onSuccess: (donor) => {
      localStorage.setItem("bloodsync_donor_id", String(donor.id));
      toast({
        title: "Registration successful",
        description: "Welcome to BloodSync — redirecting to your dashboard.",
      });
      setTimeout(() => setLocation("/donor-dashboard"), 700);
    },
    onError: (err: Error) => {
      toast({
        title: "Registration failed",
        description: err.message || "There was an error. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormData) => {
    const digits = values.whatsapp_number
      .replace(/\D/g, "")
      .replace(/^880/, "")
      .replace(/^0/, "");
    const fullNumber = `+880${digits}`;

    createDonor.mutate({
      ...values,
      smoker,
      whatsapp_number: fullNumber,
    });
  };

  return (
    <div className="min-h-screen pt-32 pb-20 w-full px-6 sm:px-10 lg:px-16 flex items-start justify-center">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md text-primary text-xs font-medium mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Join 1,000+ heroes saving lives
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-3">
            Become a <span className="glow-red-text">Donor</span>
          </h1>
          <p className="text-gray-400 max-w-md mx-auto">
            Your blood could save up to three lives. It takes less than two minutes.
          </p>
        </motion.div>

        {/* Glass Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-[0_8px_50px_rgba(0,0,0,0.5)]"
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Full Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 text-sm flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Rahul Islam"
                        className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus-visible:ring-primary placeholder:text-gray-600"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              {/* Blood Group + District (side by side) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="blood_group"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 text-sm flex items-center gap-2">
                        <Droplet className="w-3.5 h-3.5 text-primary" fill="currentColor" />
                        Blood Group
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-primary">
                            <SelectValue placeholder="Select blood group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border-white/10 text-white">
                          {BLOOD_GROUPS.map((bg) => (
                            <SelectItem key={bg} value={bg}>
                              <span className="font-bold text-primary mr-2">{bg}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 text-sm flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                        District / Area
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-primary">
                            <SelectValue placeholder="Select district" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border-white/10 text-white max-h-72">
                          {DISTRICTS.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              {/* WhatsApp with +880 prefix */}
              <FormField
                control={form.control}
                name="whatsapp_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 text-sm flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-500" />
                      WhatsApp Number
                    </FormLabel>
                    <FormControl>
                      <div className="relative flex items-center">
                        <div className="absolute left-0 top-0 bottom-0 flex items-center pl-4 pr-3 border-r border-white/10 pointer-events-none">
                          <span className="text-gray-300 font-medium text-sm">+880</span>
                        </div>
                        <Input
                          placeholder="1712 345 678"
                          className="bg-white/5 border-white/10 text-white h-12 pl-20 rounded-xl focus-visible:ring-primary placeholder:text-gray-600"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-gray-500 text-xs">
                      Recipients will message you here in emergencies.
                    </FormDescription>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              {/* Last Donation Date */}
              <FormField
                control={form.control}
                name="last_donation_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 text-sm flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      Last Donation Date <span className="text-gray-600 font-normal text-xs">(Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus-visible:ring-primary [color-scheme:dark]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-500 text-xs">
                      Donors typically need 3 months between donations.
                    </FormDescription>
                  </FormItem>
                )}
              />

              {/* Smoker Toggle (radio-style) */}
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm flex items-center gap-2">
                  <Cigarette className="w-3.5 h-3.5 text-gray-500" />
                  Smoking Status
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSmoker(false)}
                    className={`flex items-center justify-center gap-2 h-12 rounded-xl border transition-all ${
                      !smoker
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 ring-2 ring-emerald-500/20"
                        : "bg-white/5 border-white/10 text-gray-500 hover:bg-white/8"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-sm font-medium">Non-Smoker</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmoker(true)}
                    className={`flex items-center justify-center gap-2 h-12 rounded-xl border transition-all ${
                      smoker
                        ? "bg-orange-500/10 border-orange-500/40 text-orange-300 ring-2 ring-orange-500/20"
                        : "bg-white/5 border-white/10 text-gray-500 hover:bg-white/8"
                    }`}
                  >
                    <Cigarette className="w-4 h-4" />
                    <span className="text-sm font-medium">Smoker</span>
                  </button>
                </div>
                <p className="text-xs text-gray-600">For medical transparency only. Smokers can still donate.</p>
              </div>

              {/* Submit Button — vibrant red glow */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={createDonor.isPending}
                  className="w-full h-13 py-3.5 btn-glow-red text-white rounded-xl text-base font-semibold border-0 group"
                >
                  {createDonor.isPending ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4 mr-2" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 mr-2" fill="currentColor" />
                      Complete Registration
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-gray-600 mt-3">
                  By registering, you agree to be contacted by people in genuine medical emergencies.
                </p>
              </div>

            </form>
          </Form>
        </motion.div>

        {/* Trust Bar */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-600"
        >
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500/60" /> Privacy-first</span>
          <span className="w-1 h-1 rounded-full bg-gray-700" />
          <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-primary/60" /> Free forever</span>
          <span className="w-1 h-1 rounded-full bg-gray-700" />
          <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-pink-500/60" /> No spam</span>
        </motion.div>
      </div>
    </div>
  );
}

function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={className} {...props}>{children}</label>;
}
