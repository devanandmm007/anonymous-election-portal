import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const voteSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});

interface VoteFormProps {
  nomineeId: string;
  onSuccess: () => void;
}

export function VoteForm({ nomineeId, onSuccess }: VoteFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = voteSchema.safeParse({ name, email, phone });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("cast-vote", {
        body: {
          name: result.data.name,
          email: result.data.email,
          phone: result.data.phone || null,
          nominee_id: nomineeId,
        },
      });

      if (error) {
        toast({
          title: "Vote Failed",
          description: "An error occurred. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        toast({
          title: "Cannot Vote",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Vote Recorded! ✅",
        description: "Your vote has been recorded successfully.",
      });
      onSuccess();
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-card border border-border rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-display font-bold text-foreground mb-4">
        Complete Your Vote
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name" className="font-body">Full Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            className="mt-1"
            maxLength={100}
          />
          {errors.name && (
            <p className="text-destructive text-xs mt-1 font-body">{errors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email" className="font-body">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="mt-1"
            maxLength={255}
          />
          {errors.email && (
            <p className="text-destructive text-xs mt-1 font-body">{errors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone" className="font-body">Phone Number (optional)</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            className="mt-1"
            maxLength={20}
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-body font-semibold py-5"
        >
          {submitting ? "Casting Vote..." : "Cast My Vote"}
        </Button>

        <p className="text-xs text-muted-foreground text-center font-body">
          Your identity will remain anonymous. Only election administrators can access voter records.
        </p>
      </form>
    </div>
  );
}
