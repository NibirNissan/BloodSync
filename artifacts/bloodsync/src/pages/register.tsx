import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
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
import { Switch } from "@/components/ui/switch";
import { useCreateDonor } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  Heart,
  Loader2,
  User,
  MapPin,
  Stethoscope,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const STEP_SCHEMAS = [
  z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    blood_group: z.string({ required_error: "Please select a blood group." }),
  }),
  z.object({
    district: z.string().min(2, "Please enter your district or city."),
    whatsapp_number: z
      .string()
      .min(10, "Please enter a valid WhatsApp number."),
  }),
  z.object({
    smoker: z.boolean().default(false),
    last_donation_date: z.string().optional(),
  }),
  z.object({
    is_willing_to_donate: z.boolean().default(true),
  }),
];

const fullSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  blood_group: z.string({ required_error: "Please select a blood group." }),
  district: z.string().min(2, "Please enter your district or city."),
  whatsapp_number: z.string().min(10, "Please enter a valid WhatsApp number."),
  smoker: z.boolean().default(false),
  last_donation_date: z.string().optional(),
  is_willing_to_donate: z.boolean().default(true),
});

type FormData = z.infer<typeof fullSchema>;

const STEPS = [
  { title: "Personal Info", icon: User, description: "Tell us who you are" },
  { title: "Location & Contact", icon: MapPin, description: "Where can we reach you?" },
  { title: "Medical History", icon: Stethoscope, description: "For transparency & safety" },
  { title: "Availability", icon: Heart, description: "Are you ready to save lives?" },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function Register() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      name: "",
      blood_group: undefined,
      district: "",
      whatsapp_number: "",
      smoker: false,
      last_donation_date: "",
      is_willing_to_donate: true,
    },
    mode: "onTouched",
  });

  const createDonor = useCreateDonor();

  const validateStep = async () => {
    const fields = [
      ["name", "blood_group"],
      ["district", "whatsapp_number"],
      ["smoker", "last_donation_date"],
      ["is_willing_to_donate"],
    ][step] as (keyof FormData)[];
    return form.trigger(fields);
  };

  const next = async () => {
    const valid = await validateStep();
    if (!valid) return;
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prev = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const onSubmit = (values: FormData) => {
    createDonor.mutate(
      {
        data: {
          ...values,
          last_donation_date: values.last_donation_date || null,
        },
      },
      {
        onSuccess: (donor) => {
          localStorage.setItem("bloodsync_donor_id", String(donor.id));
          toast({
            title: "Registration successful",
            description: "Welcome to BloodSync! Redirecting to your dashboard.",
          });
          setTimeout(() => setLocation("/donor-dashboard"), 800);
        },
        onError: () => {
          toast({
            title: "Registration failed",
            description: "There was an error. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-20 flex items-start justify-center">
      <div className="container mx-auto px-4 md:px-6 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-5">
            <Heart className="w-8 h-8 text-primary" fill="currentColor" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Register as a Donor
          </h1>
          <p className="text-gray-400">
            Your blood could save up to three lives. Join our heroes today.
          </p>
        </motion.div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isCompleted = i < step;
            const isCurrent = i === step;
            return (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{
                      backgroundColor: isCompleted
                        ? "rgba(220,38,38,1)"
                        : isCurrent
                        ? "rgba(220,38,38,0.15)"
                        : "rgba(255,255,255,0.05)",
                      borderColor: isCompleted || isCurrent
                        ? "rgba(220,38,38,0.6)"
                        : "rgba(255,255,255,0.1)",
                    }}
                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <Icon
                        className={`w-5 h-5 ${isCurrent ? "text-primary" : "text-gray-500"}`}
                      />
                    )}
                  </motion.div>
                  <span
                    className={`text-xs mt-1.5 font-medium hidden sm:block ${
                      isCurrent ? "text-white" : isCompleted ? "text-primary" : "text-gray-600"
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-2 mt-[-12px] sm:mt-[-20px]">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      animate={{ scaleX: i < step ? 1 : 0 }}
                      style={{ transformOrigin: "left" }}
                      transition={{ duration: 0.3 }}
                    />
                    <div className="h-full -mt-px bg-white/10 rounded-full" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Form Card */}
        <GlassCard className="p-8 overflow-hidden">
          {/* Step label */}
          <div className="mb-6">
            <p className="text-xs text-primary uppercase tracking-widest font-semibold mb-1">
              Step {step + 1} of {STEPS.length}
            </p>
            <h2 className="text-xl font-bold text-white">{STEPS[step].title}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{STEPS[step].description}</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="relative min-h-[200px]">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="space-y-5"
                  >
                    {/* Step 0: Personal Info */}
                    {step === 0 && (
                      <>
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Full Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. Rahul Islam"
                                  className="bg-white/5 border-white/10 text-white h-12 focus-visible:ring-primary"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="blood_group"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Blood Group</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 focus:ring-primary">
                                    <SelectValue placeholder="Select your blood group" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                  {BLOOD_GROUPS.map((bg) => (
                                    <SelectItem key={bg} value={bg}>
                                      <span className="font-bold text-primary mr-2">{bg}</span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {/* Step 1: Location & Contact */}
                    {step === 1 && (
                      <>
                        <FormField
                          control={form.control}
                          name="district"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">District / City</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. Dhaka, Chittagong"
                                  className="bg-white/5 border-white/10 text-white h-12 focus-visible:ring-primary"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription className="text-gray-500">
                                Used to match you with nearby recipients
                              </FormDescription>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="whatsapp_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">WhatsApp Number</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="+8801712345678"
                                  className="bg-white/5 border-white/10 text-white h-12 focus-visible:ring-primary"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription className="text-gray-500">
                                Recipients will contact you here in emergencies
                              </FormDescription>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {/* Step 2: Medical Info */}
                    {step === 2 && (
                      <>
                        <FormField
                          control={form.control}
                          name="last_donation_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">
                                Last Donation Date{" "}
                                <span className="text-gray-500 font-normal">(Optional)</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  className="bg-white/5 border-white/10 text-white h-12 focus-visible:ring-primary [color-scheme:dark]"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription className="text-gray-500">
                                Donors typically need 3 months between donations
                              </FormDescription>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="smoker"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-white/10 bg-white/5 p-5">
                              <div>
                                <FormLabel className="text-base text-white">
                                  I am a smoker
                                </FormLabel>
                                <FormDescription className="text-gray-400 mt-0.5">
                                  Required for medical transparency
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:bg-orange-500"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {/* Step 3: Availability */}
                    {step === 3 && (
                      <FormField
                        control={form.control}
                        name="is_willing_to_donate"
                        render={({ field }) => (
                          <FormItem>
                            <div
                              className={`flex flex-row items-center justify-between rounded-xl border p-6 transition-colors ${
                                field.value
                                  ? "border-emerald-500/30 bg-emerald-500/5"
                                  : "border-white/10 bg-white/5"
                              }`}
                            >
                              <div>
                                <FormLabel className="text-lg text-white font-semibold">
                                  {field.value ? "Available to Donate" : "Currently Unavailable"}
                                </FormLabel>
                                <FormDescription className="text-gray-400 mt-1">
                                  {field.value
                                    ? "People in emergencies can find and contact you"
                                    : "You won't appear in search results"}
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:bg-emerald-500 scale-125"
                                />
                              </FormControl>
                            </div>
                            <p className="text-sm text-gray-500 mt-3 text-center">
                              You can change this anytime from your donor dashboard.
                            </p>
                          </FormItem>
                        )}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prev}
                  disabled={step === 0}
                  className="text-gray-400 hover:text-white disabled:opacity-0"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>

                <span className="text-xs text-gray-600">
                  {step + 1} / {STEPS.length}
                </span>

                {step < STEPS.length - 1 ? (
                  <Button
                    type="button"
                    onClick={next}
                    className="bg-primary hover:bg-primary/90 text-white px-6"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={createDonor.isPending}
                    className="bg-primary hover:bg-primary/90 text-white px-8 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
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
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </GlassCard>
      </div>
    </div>
  );
}
