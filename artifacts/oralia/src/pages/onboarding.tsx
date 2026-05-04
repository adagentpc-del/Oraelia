import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useUpdateProfile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const updateProfile = useUpdateProfile();
  const [formData, setFormData] = useState({
    fullName: "",
    birthday: "",
    birthTime: "",
    birthCity: "",
    currentCity: "",
    relationshipStatus: "",
    careerStage: "",
    topGoals: [] as string[],
    currentChallenges: "",
    guidanceCategories: [] as string[],
    menstrualCycleTracking: false,
    sleepTracking: false,
    spiritualOpenness: "medium",
    guidanceTone: "mystical",
  });

  const totalSteps = 6;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else handleComplete();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    updateProfile.mutate(
      { data: { ...formData, onboardingComplete: true } },
      { onSuccess: () => setLocation("/dashboard") }
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2 font-sans">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="h-1 w-full bg-border rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary" 
              initial={{ width: 0 }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="bg-card border border-border p-8 md:p-12 rounded-xl shadow-sm min-h-[400px] flex flex-col relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-serif font-bold text-primary mb-6">Welcome to Oralia</h2>
                  <p className="text-muted-foreground mb-8">Let's establish your energetic baseline. What is your name and when were you born?</p>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input 
                        value={formData.fullName} 
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Your name"
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Birthday</Label>
                        <Input 
                          type="date" 
                          value={formData.birthday} 
                          onChange={e => setFormData({ ...formData, birthday: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Birth Time (Optional)</Label>
                        <Input 
                          type="time" 
                          value={formData.birthTime} 
                          onChange={e => setFormData({ ...formData, birthTime: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Birth City</Label>
                      <Input 
                        value={formData.birthCity} 
                        onChange={e => setFormData({ ...formData, birthCity: e.target.value })}
                        placeholder="e.g. Paris, France"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-serif font-bold text-primary mb-6">Current Reality</h2>
                  <p className="text-muted-foreground mb-8">Where are you right now, physically and experientially?</p>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Current City</Label>
                      <Input 
                        value={formData.currentCity} 
                        onChange={e => setFormData({ ...formData, currentCity: e.target.value })}
                        placeholder="Where you live now"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Relationship Status</Label>
                      <Select value={formData.relationshipStatus} onValueChange={v => setFormData({ ...formData, relationshipStatus: v })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="partnered">Partnered</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="complicated">It's Complicated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Career Stage</Label>
                      <Select value={formData.careerStage} onValueChange={v => setFormData({ ...formData, careerStage: v })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student / Exploring</SelectItem>
                          <SelectItem value="early">Early Career</SelectItem>
                          <SelectItem value="mid">Mid Career / Established</SelectItem>
                          <SelectItem value="leadership">Leadership / Executive</SelectItem>
                          <SelectItem value="transitioning">Transitioning / Sabbatical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-serif font-bold text-primary mb-6">Goals & Challenges</h2>
                  <p className="text-muted-foreground mb-8">What are you moving towards, and what is in the way?</p>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Top Focus Areas (Select up to 3)</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {["Health", "Wealth", "Love", "Career", "Spirituality", "Creativity", "Peace"].map(goal => (
                          <div key={goal} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`goal-${goal}`} 
                              checked={formData.topGoals.includes(goal)}
                              onCheckedChange={(checked) => {
                                if (checked && formData.topGoals.length < 3) {
                                  setFormData({ ...formData, topGoals: [...formData.topGoals, goal] });
                                } else if (!checked) {
                                  setFormData({ ...formData, topGoals: formData.topGoals.filter(g => g !== goal) });
                                }
                              }}
                            />
                            <label htmlFor={`goal-${goal}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{goal}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-4">
                      <Label>Current Challenges</Label>
                      <Input 
                        value={formData.currentChallenges} 
                        onChange={e => setFormData({ ...formData, currentChallenges: e.target.value })}
                        placeholder="What feels heavy right now?"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-serif font-bold text-primary mb-6">Intelligence Preferences</h2>
                  <p className="text-muted-foreground mb-8">What systems of knowledge do you want to integrate?</p>
                  
                  <div className="space-y-4">
                    <Label>Guidance Categories</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 mb-6">
                      {["Astrology", "Human Design", "Chakras", "Tarot", "Somatic", "Productivity"].map(cat => (
                        <div key={cat} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`cat-${cat}`} 
                            checked={formData.guidanceCategories.includes(cat)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({ ...formData, guidanceCategories: [...formData.guidanceCategories, cat] });
                              } else {
                                setFormData({ ...formData, guidanceCategories: formData.guidanceCategories.filter(c => c !== cat) });
                              }
                            }}
                          />
                          <label htmlFor={`cat-${cat}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{cat}</label>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between border border-border p-4 rounded-md">
                      <div className="space-y-0.5">
                        <Label>Cycle Tracking</Label>
                        <p className="text-sm text-muted-foreground">Track menstrual or moon cycles</p>
                      </div>
                      <Switch 
                        checked={formData.menstrualCycleTracking} 
                        onCheckedChange={v => setFormData({ ...formData, menstrualCycleTracking: v })}
                      />
                    </div>

                    <div className="flex items-center justify-between border border-border p-4 rounded-md">
                      <div className="space-y-0.5">
                        <Label>Sleep Tracking</Label>
                        <p className="text-sm text-muted-foreground">Include sleep quality in patterns</p>
                      </div>
                      <Switch 
                        checked={formData.sleepTracking} 
                        onCheckedChange={v => setFormData({ ...formData, sleepTracking: v })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-serif font-bold text-primary mb-6">Your Oracle</h2>
                  <p className="text-muted-foreground mb-8">How should Oralia speak to you?</p>
                  
                  <div className="space-y-6">
                    <div>
                      <Label>Spiritual Openness</Label>
                      <Select value={formData.spiritualOpenness} onValueChange={v => setFormData({ ...formData, spiritualOpenness: v })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Grounded & Practical</SelectItem>
                          <SelectItem value="medium">Open & Curious</SelectItem>
                          <SelectItem value="high">Deeply Esoteric</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Guidance Tone</Label>
                      <Select value={formData.guidanceTone} onValueChange={v => setFormData({ ...formData, guidanceTone: v })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="soft">Soft & Nurturing</SelectItem>
                          <SelectItem value="direct">Direct & Empowering</SelectItem>
                          <SelectItem value="mystical">Mystical & Poetic</SelectItem>
                          <SelectItem value="luxury-oracle">Luxury Oracle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-6 text-center pt-8">
                  <h2 className="text-4xl font-serif font-bold text-primary mb-4">Your Profile is Ready</h2>
                  <p className="text-muted-foreground mb-12 max-w-md mx-auto">
                    Oralia is preparing your personalized dashboard and establishing your energetic baseline.
                  </p>
                  
                  <div className="w-24 h-24 mx-auto border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-8" />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-auto pt-8 flex justify-between">
            <Button 
              variant="ghost" 
              onClick={handleBack} 
              disabled={step === 1 || step === totalSteps || updateProfile.isPending}
              className={step === 1 ? 'invisible' : ''}
            >
              Back
            </Button>
            <Button 
              onClick={handleNext}
              className="bg-primary text-primary-foreground px-8"
              disabled={updateProfile.isPending || (step === 1 && (!formData.fullName || !formData.birthday))}
            >
              {step === totalSteps ? 'Complete' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
