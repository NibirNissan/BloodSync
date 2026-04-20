import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateDonor } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Heart, Activity } from "lucide-react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  blood_group: z.string({
    required_error: "Please select a blood group.",
  }),
  district: z.string().min(2, {
    message: "Please enter your district.",
  }),
  whatsapp_number: z.string().min(10, {
    message: "Please enter a valid WhatsApp number.",
  }),
  smoker: z.boolean().default(false),
  is_willing_to_donate: z.boolean().default(true),
  last_donation_date: z.string().optional(),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      district: "",
      whatsapp_number: "",
      smoker: false,
      is_willing_to_donate: true,
      last_donation_date: "",
    },
  });

  const createDonor = useCreateDonor();

  function onSubmit(values: z.infer<typeof formSchema>) {
    createDonor.mutate({ 
      data: {
        ...values,
        last_donation_date: values.last_donation_date || null
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Registration successful",
          description: "Thank you for registering as a blood donor.",
        });
        setLocation("/find-donors");
      },
      onError: () => {
        toast({
          title: "Registration failed",
          description: "There was an error registering your profile. Please try again.",
          variant: "destructive"
        });
      }
    });
  }

  return (
    <div className="min-h-screen pt-28 pb-20 flex items-center justify-center">
      <div className="container mx-auto px-4 md:px-6 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Heart className="w-8 h-8 text-primary" fill="currentColor" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Register as a Donor</h1>
            <p className="text-gray-400 text-lg">Your blood could save up to three lives. Join our community of heroes today.</p>
          </div>

          <GlassCard className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" className="bg-white/5 border-white/10 text-white h-12 focus-visible:ring-primary" {...field} />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 focus:ring-primary">
                              <SelectValue placeholder="Select blood group" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-zinc-900 border-white/10 text-white">
                            {BLOOD_GROUPS.map((bg) => (
                              <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">District / City</FormLabel>
                        <FormControl>
                          <Input placeholder="New York" className="bg-white/5 border-white/10 text-white h-12 focus-visible:ring-primary" {...field} />
                        </FormControl>
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
                          <Input placeholder="+1234567890" className="bg-white/5 border-white/10 text-white h-12 focus-visible:ring-primary" {...field} />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="last_donation_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Last Donation Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" className="bg-white/5 border-white/10 text-white h-12 focus-visible:ring-primary [color-scheme:dark]" {...field} />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <div className="pt-4 border-t border-white/10 space-y-4">
                  <FormField
                    control={form.control}
                    name="is_willing_to_donate"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base text-white">Available to donate</FormLabel>
                          <FormDescription className="text-gray-400">
                            People can find and contact you for emergencies
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smoker"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base text-white">I am a smoker</FormLabel>
                          <FormDescription className="text-gray-400">
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
                </div>

                <Button 
                  type="submit" 
                  disabled={createDonor.isPending}
                  className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-white rounded-xl mt-8 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                >
                  {createDonor.isPending ? (
                    <div className="flex items-center">
                      <Activity className="animate-spin w-5 h-5 mr-2" />
                      Registering...
                    </div>
                  ) : "Register as Donor"}
                </Button>
              </form>
            </Form>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
