'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  Screen,
  Family,
  Child,
  Chore,
  Reward,
  PendingReward,
  RewardType,
  ChoreStatus,
  AdminStats,
  GoodCause,
  PlanTier,
  SubscriptionInfo,
  BillingInterval,
  BlogPost,
  Review,
  PublishStatus,
} from '@/lib/types';
import { useToast } from "@/hooks/use-toast"
import confetti from 'canvas-confetti';
import { auth, db, storage } from '@/lib/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail,
    type User as FirebaseUser
} from 'firebase/auth';
import { 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    query, 
    where, 
    getDocs, 
    updateDoc,
    Timestamp,
    arrayUnion,
    arrayRemove,
    addDoc,
    deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PLAN_DEFINITIONS, getActivePlan, canAddChild, canAddChore, isPremiumPlan, choresThisMonth, hasFeature as planHasFeature, PlanDefinition, PlanFeatureKey } from '@/lib/plans';


type BlogPostInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl?: string | null;
  tags: string[];
  status: PublishStatus;
  seoTitle?: string | null;
  seoDescription?: string | null;
  publishedAt?: Timestamp | null;
};

type ReviewInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  rating: number;
  author: string;
  status: PublishStatus;
  seoTitle?: string | null;
  seoDescription?: string | null;
  publishedAt?: Timestamp | null;
};

type NotificationPayload =
  | {
      type: 'welcome_parent';
      to: string;
      data: { familyName: string; familyCode: string };
    }
  | {
      type: 'chore_submitted';
      to: string;
      data: { parentName: string; childName: string; choreName: string; points: number };
    }
  | {
      type: 'reward_redeemed';
      to: string;
      data: { parentName: string; childName: string; rewardName: string; points: number };
    };

interface AppContextType {
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;
  isLoading: boolean;
  activePlan: PlanTier;
  planDefinition: PlanDefinition;
  isPremium: boolean;
  monthlyChoreUsage: number;
  canAccessFeature: (feature: PlanFeatureKey) => boolean;
  family: Family | null;
  user: Child | null;
  adminStats: AdminStats | null;
  goodCauses: GoodCause[] | null;
  blogPosts: BlogPost[] | null;
  reviews: Review[] | null;
  loginParent: (email: string, password_not_used: string) => Promise<void>;
  registerFamily: (familyName: string, city: string, email: string, password_not_used: string) => Promise<void>;
  logout: () => void;
  loginChildStep1: (familyCode: string) => Promise<void>;
  selectChildProfile: (childId: string) => void;
  submitPin: (pin: string) => void;
  addChild: (name: string, pin: string, avatar: string) => Promise<void>;
  updateChild: (childId: string, updates: Partial<Child>) => Promise<void>;
  addChore: (name:string, points: number, assignedTo: string[]) => Promise<void>;
  updateChore: (choreId: string, updates: Partial<Chore>) => Promise<void>;
  addReward: (name: string, points: number, type: RewardType, assignedTo: string[]) => Promise<void>;
  updateReward: (rewardId: string, updates: Partial<Reward>) => Promise<void>;
  approveChore: (choreId: string) => Promise<void>;
  rejectChore: (choreId: string) => Promise<void>;
  deleteItem: (collection: 'children' | 'chores' | 'rewards', itemId: string) => Promise<void>;
  submitChoreForApproval: (choreId: string, emotion: string, photoFile: File | null) => Promise<void>;
  redeemReward: (rewardId: string) => Promise<void>;
  markRewardAsGiven: (pendingRewardId: string) => Promise<void>;
  saveRecoveryEmail: (email: string) => Promise<void>;
  recoverFamilyCode: (email: string) => Promise<void>; // This now just resets password
  getAdminStats: () => Promise<void>;
  getGoodCauses: () => Promise<void>;
  addGoodCause: (cause: Omit<GoodCause, 'id'>) => Promise<void>;
  updateGoodCause: (causeId: string, updates: Partial<Omit<GoodCause, 'id'>>) => Promise<void>;
  getBlogPosts: () => Promise<void>;
  createBlogPost: (data: BlogPostInput) => Promise<void>;
  updateBlogPost: (postId: string, data: BlogPostInput) => Promise<void>;
  deleteBlogPost: (postId: string) => Promise<void>;
  getReviews: () => Promise<void>;
  createReview: (data: ReviewInput) => Promise<void>;
  updateReview: (reviewId: string, data: ReviewInput) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  startPremiumCheckout: (interval: BillingInterval) => Promise<string | null>;
  confirmPremiumCheckout: (orderId: string, interval: BillingInterval) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const generateFamilyCode = () => (Math.random().toString(36).substring(2, 8)).toUpperCase();

const getInitialScreen = (): Screen => {
  if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
    return 'adminLogin';
  }
  return 'landing';
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentScreen, setScreen] = useState<Screen>('landing');
  const [isLoading, setIsLoading] = useState(true);
  const [family, setFamily] = useState<Family | null>(null);
  const [user, setUser] = useState<Child | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [goodCauses, setGoodCauses] = useState<GoodCause[] | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[] | null>(null);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const { toast } = useToast();
  const activePlan = getActivePlan(family?.subscription as SubscriptionInfo | undefined);
  const planDefinition: PlanDefinition = PLAN_DEFINITIONS[activePlan];
  const isPremium = isPremiumPlan(family?.subscription as SubscriptionInfo | undefined);
  const monthlyChoreUsage = choresThisMonth(family);
  const canAccessFeature = useCallback((feature: PlanFeatureKey) => planHasFeature(family?.subscription as SubscriptionInfo | undefined, feature), [family?.subscription]);

  const sendNotification = useCallback(async (payload: NotificationPayload) => {
    try {
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Failed to send notification', error);
    }
  }, []);
  
  useEffect(() => {
    // This effect runs only on the client side and handles the initial screen logic.
    // This avoids hydration errors.
    if (window.location.pathname === '/admin') {
      setScreen('adminLogin');
    }
  }, []);

  const getAdminStats = useCallback(async () => {
    setIsLoading(true);
    try {
        const familiesRef = collection(db, "families");
        const querySnapshot = await getDocs(familiesRef);
        
        let totalFamilies = 0;
        let totalChildren = 0;
        let totalPointsEver = 0;
        let totalDonationPoints = 0;

        querySnapshot.forEach(doc => {
            const familyData = doc.data() as Family;
            totalFamilies++;
            totalChildren += familyData.children.length;
            familyData.children.forEach(child => {
                totalPointsEver += child.totalPointsEver || 0;
            });
            familyData.pendingRewards.forEach(pr => {
                const reward = familyData.rewards.find(r => r.id === pr.rewardId);
                if(reward?.type === 'donation') {
                    totalDonationPoints += pr.points;
                }
            });
        });
        
        setAdminStats({
            totalFamilies,
            totalChildren,
            totalPointsEver,
            totalDonationPoints
        });

    } catch (error) {
        console.error("Error fetching admin stats:", error);
        toast({ variant: 'destructive', title: 'Fout', description: 'Kon admin-statistieken niet laden.' });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  const getGoodCauses = useCallback(async () => {
    setIsLoading(true);
    try {
      const causesRef = collection(db, "goodCauses");
      const querySnapshot = await getDocs(causesRef);
      const causes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GoodCause));
      setGoodCauses(causes);
    } catch (error) {
      console.error("Error fetching good causes:", error);
      toast({ variant: 'destructive', title: 'Fout', description: 'Kon goede doelen niet laden.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const sortByPublishedDate = <T extends { publishedAt?: Timestamp | null; createdAt: Timestamp }>(
    items: T[]
  ) =>
    [...items].sort((a, b) => {
      const aDate = a.publishedAt ?? a.createdAt;
      const bDate = b.publishedAt ?? b.createdAt;
      return (bDate?.toMillis() ?? 0) - (aDate?.toMillis() ?? 0);
    });

  const getBlogPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'blogPosts'));
      const posts = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as BlogPost));
      setBlogPosts(sortByPublishedDate(posts));
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      toast({ variant: 'destructive', title: 'Fout', description: 'Kon blogposts niet laden.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createBlogPost = useCallback(
    async (data: BlogPostInput) => {
      setIsLoading(true);
      try {
        const now = Timestamp.now();
        const payload = {
          ...data,
          coverImageUrl: data.coverImageUrl || null,
          seoTitle: data.seoTitle || null,
          seoDescription: data.seoDescription || null,
          tags: data.tags,
          createdAt: now,
          updatedAt: now,
          publishedAt: data.status === 'published' ? data.publishedAt ?? now : null,
        };
        await addDoc(collection(db, 'blogPosts'), payload);
        toast({ title: 'Succes', description: 'Blogpost opgeslagen.' });
        await getBlogPosts();
      } catch (error) {
        console.error('Error creating blog post:', error);
        toast({ variant: 'destructive', title: 'Fout', description: 'Kon blogpost niet opslaan.' });
      } finally {
        setIsLoading(false);
      }
    },
    [getBlogPosts, toast]
  );

  const updateBlogPost = useCallback(
    async (postId: string, data: BlogPostInput) => {
      setIsLoading(true);
      try {
        const now = Timestamp.now();
        const payload = {
          ...data,
          coverImageUrl: data.coverImageUrl || null,
          seoTitle: data.seoTitle || null,
          seoDescription: data.seoDescription || null,
          updatedAt: now,
          publishedAt: data.status === 'published' ? data.publishedAt ?? now : null,
        };

        await updateDoc(doc(db, 'blogPosts', postId), payload);
        toast({ title: 'Succes', description: 'Blogpost bijgewerkt.' });
        await getBlogPosts();
      } catch (error) {
        console.error('Error updating blog post:', error);
        toast({ variant: 'destructive', title: 'Fout', description: 'Kon blogpost niet bijwerken.' });
      } finally {
        setIsLoading(false);
      }
    },
    [getBlogPosts, toast]
  );

  const deleteBlogPost = useCallback(
    async (postId: string) => {
      setIsLoading(true);
      try {
        await deleteDoc(doc(db, 'blogPosts', postId));
        toast({ title: 'Verwijderd', description: 'Blogpost verwijderd.' });
        await getBlogPosts();
      } catch (error) {
        console.error('Error deleting blog post:', error);
        toast({ variant: 'destructive', title: 'Fout', description: 'Kon blogpost niet verwijderen.' });
      } finally {
        setIsLoading(false);
      }
    },
    [getBlogPosts, toast]
  );

  const getReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'reviews'));
      const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Review));
      setReviews(sortByPublishedDate(items));
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({ variant: 'destructive', title: 'Fout', description: 'Kon reviews niet laden.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createReview = useCallback(
    async (data: ReviewInput) => {
      setIsLoading(true);
      try {
        const now = Timestamp.now();
        const payload = {
          ...data,
          seoTitle: data.seoTitle || null,
          seoDescription: data.seoDescription || null,
          createdAt: now,
          updatedAt: now,
          publishedAt: data.status === 'published' ? data.publishedAt ?? now : null,
        };
        await addDoc(collection(db, 'reviews'), payload);
        toast({ title: 'Succes', description: 'Review opgeslagen.' });
        await getReviews();
      } catch (error) {
        console.error('Error creating review:', error);
        toast({ variant: 'destructive', title: 'Fout', description: 'Kon review niet opslaan.' });
      } finally {
        setIsLoading(false);
      }
    },
    [getReviews, toast]
  );

  const updateReview = useCallback(
    async (reviewId: string, data: ReviewInput) => {
      setIsLoading(true);
      try {
        const now = Timestamp.now();
        const payload = {
          ...data,
          seoTitle: data.seoTitle || null,
          seoDescription: data.seoDescription || null,
          updatedAt: now,
          publishedAt: data.status === 'published' ? data.publishedAt ?? now : null,
        };

        await updateDoc(doc(db, 'reviews', reviewId), payload);
        toast({ title: 'Succes', description: 'Review bijgewerkt.' });
        await getReviews();
      } catch (error) {
        console.error('Error updating review:', error);
        toast({ variant: 'destructive', title: 'Fout', description: 'Kon review niet bijwerken.' });
      } finally {
        setIsLoading(false);
      }
    },
    [getReviews, toast]
  );

  const deleteReview = useCallback(
    async (reviewId: string) => {
      setIsLoading(true);
      try {
        await deleteDoc(doc(db, 'reviews', reviewId));
        toast({ title: 'Verwijderd', description: 'Review verwijderd.' });
        await getReviews();
      } catch (error) {
        console.error('Error deleting review:', error);
        toast({ variant: 'destructive', title: 'Fout', description: 'Kon review niet verwijderen.' });
      } finally {
        setIsLoading(false);
      }
    },
    [getReviews, toast]
  );
  
  
  useEffect(() => {
    const fetchFamilyData = async (familyId: string) => {
        setIsLoading(true);
        try {
            const familyDocRef = doc(db, 'families', familyId);
            const familyDocSnap = await getDoc(familyDocRef);
            if (familyDocSnap.exists()) {
                const familyData = { id: familyDocSnap.id, ...familyDocSnap.data() } as Family;
                setFamily(familyData);
                setScreen('parentDashboard');
            } else {
                console.log("No such family document!");
                setFamily(null);
                await signOut(auth);
                setScreen('landing');
            }
        } catch (error) {
            console.error("Error fetching family data:", error);
            setFamily(null);
            setScreen('landing');
        } finally {
            setIsLoading(false);
        }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setIsLoading(true);
        if (user) {
          getGoodCauses(); // Fetch good causes for any logged-in user
          if(user.email === 'admin@klusjeskoning.nl') {
            setScreen('adminDashboard');
            getAdminStats();
            getBlogPosts();
            getReviews();
            setIsLoading(false);
          } else {
            fetchFamilyData(user.uid);
          }
        } else {
            setFamily(null);
            setUser(null);
            setAdminStats(null);
            setGoodCauses(null);
            setBlogPosts(null);
            setReviews(null);
            if (window.location.pathname !== '/admin') {
              setScreen('landing');
            }
            setIsLoading(false);
        }
    });

    return () => unsubscribe();
  }, [getAdminStats, getGoodCauses, getBlogPosts, getReviews]);



  const logout = useCallback(async () => {
    const isAdmin = auth.currentUser?.email === 'admin@klusjeskoning.nl';
    await signOut(auth);
    setFamily(null);
    setUser(null);
    setAdminStats(null);
    setGoodCauses(null);
    setBlogPosts(null);
    setReviews(null);
    if(isAdmin || window.location.pathname === '/admin') {
      setScreen('adminLogin');
    } else {
      setScreen('landing');
    }
  }, []);

  const loginParent = async (email: string, password) => {
    setIsLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Auth state change will trigger screen change and loading state update
    } catch (error) {
        toast({ variant: "destructive", title: "Fout", description: "E-mail of wachtwoord onjuist." });
        setIsLoading(false);
    }
  };
  
  const registerFamily = async (familyName: string, city: string, email: string, password) => {
      setIsLoading(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newFamily: Family = {
            id: userCredential.user.uid,
            familyCode: generateFamilyCode(),
            familyName,
            city,
            email,
            createdAt: Timestamp.now(),
            recoveryEmail: email,
            children: [], chores: [], rewards: [], pendingRewards: [],
            subscription: {
              plan: 'starter',
              status: 'active',
              interval: null,
              renewalDate: null,
              lastPaymentAt: null,
              orderId: null,
            },
        };
        await setDoc(doc(db, 'families', newFamily.id), newFamily);
        void sendNotification({
          type: 'welcome_parent',
          to: email,
          data: { familyName, familyCode: newFamily.familyCode },
        });
        // Let the onAuthStateChanged handle the state update
        toast({ title: "Welkom!", description: "Je gezin is aangemaakt." });
      } catch (error) {
          console.error("Error registering family: ", error);
          toast({ variant: "destructive", title: "Registratiefout", description: "Er is iets misgegaan." });
          setIsLoading(false);
      }
  };

  const loginChildStep1 = async (familyCode: string) => {
    setIsLoading(true);
    const familiesRef = collection(db, "families");
    const q = query(familiesRef, where("familyCode", "==", familyCode.toUpperCase()));
    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const familyDoc = querySnapshot.docs[0];
            const familyData = {id: familyDoc.id, ...familyDoc.data()} as Family;
            setFamily(familyData);
            setScreen('childProfileSelect');
            await getGoodCauses();
        } else {
            toast({ variant: "destructive", title: "Fout", description: "Gezinscode niet gevonden." });
        }
    } catch (error) {
        console.error("Error finding family: ", error);
        toast({ variant: "destructive", title: "Fout", description: "Kon gezin niet opzoeken." });
    } finally {
        setIsLoading(false);
    }
  };

  const selectChildProfile = (childId: string) => {
      if (family) {
        const selectedChild = family.children.find(c => c.id === childId);
        if (selectedChild) {
            setUser(selectedChild);
            setScreen('childPin');
        }
      }
  };

  const submitPin = (pin: string) => {
      if (user && user.pin === pin) {
          setScreen('childDashboard');
      } else {
          toast({ variant: "destructive", title: "Fout", description: "Pincode is fout! Probeer het opnieuw." });
      }
  };
  
  const refreshFamilyData = useCallback(async () => {
    if (family?.id) {
        const familyDocRef = doc(db, 'families', family.id);
        const familyDocSnap = await getDoc(familyDocRef);
        if (familyDocSnap.exists()) {
            setFamily({ id: familyDocSnap.id, ...familyDocSnap.data() } as Family);
        }
    }
  }, [family?.id]);

  const updateFamilyDoc = useCallback(async (updates: Record<string, unknown>) => {
      if (!family) return;
      const familyDocRef = doc(db, 'families', family.id);
      await updateDoc(familyDocRef, updates);
      await refreshFamilyData();
  }, [family, refreshFamilyData]);

  const addChild = async (name: string, pin: string, avatar: string) => {
      if(!family) return;
      const gate = canAddChild(family);
      if (!gate.allowed) {
        toast({ variant: "destructive", title: "Upgrade nodig", description: gate.reason || 'Het maximum aantal kinderen is bereikt.' });
        return;
      }
      setIsLoading(true);
      const newChild: Child = { id: `child${Date.now()}`, name, pin, avatar, points: 0, totalPointsEver: 0 };
      await updateFamilyDoc({ children: arrayUnion(newChild) });
      toast({ title: "Succes", description: `${name} is toegevoegd!` });
      setIsLoading(false);
  };
  
  const updateChild = async (childId: string, updates: Partial<Child>) => {
    if(!family) return;
    setIsLoading(true);
    const updatedChildren = family.children.map(c => c.id === childId ? { ...c, ...updates } : c);
    await updateFamilyDoc({ children: updatedChildren });
    toast({ title: "Succes", description: `Gegevens van kind bijgewerkt!` });
    setIsLoading(false);
  };

  const addChore = async (name: string, points: number, assignedTo: string[]) => {
      if(!family) return;
      const gate = canAddChore(family);
      if (!gate.allowed) {
        toast({ variant: "destructive", title: "Upgrade nodig", description: gate.reason || 'Je hebt de limiet voor deze maand bereikt.' });
        return;
      }
      setIsLoading(true);
      const newChore: Chore = { id: `chore${Date.now()}`, name, points, assignedTo, status: 'available', createdAt: Timestamp.now() };
      await updateFamilyDoc({ chores: arrayUnion(newChore) });
      toast({ title: "Succes", description: "Klusje toegevoegd!" });
      setIsLoading(false);
  };

  const updateChore = async (choreId: string, updates: Partial<Chore>) => {
    if(!family) return;
    setIsLoading(true);
    const updatedChores = family.chores.map(c => c.id === choreId ? { ...c, ...updates } : c);
    await updateFamilyDoc({ chores: updatedChores });
    toast({ title: "Succes", description: `Klusje bijgewerkt!` });
    setIsLoading(false);
  };
  
  const addReward = async (name: string, points: number, type: RewardType, assignedTo: string[]) => {
      if(!family) return;
      if (type === 'donation' && !planHasFeature(family.subscription as SubscriptionInfo | undefined, 'donations')) {
        toast({ variant: "destructive", title: "Premium nodig", description: 'Donaties zijn onderdeel van het Gezin+ abonnement.' });
        return;
      }
      setIsLoading(true);
      const newReward: Reward = { id: `reward${Date.now()}`, name, points, type, assignedTo };
      await updateFamilyDoc({ rewards: arrayUnion(newReward) });
      toast({ title: "Succes", description: "Beloning toegevoegd!" });
      setIsLoading(false);
  };

  const updateReward = async (rewardId: string, updates: Partial<Reward>) => {
    if(!family) return;
    setIsLoading(true);
    const updatedRewards = family.rewards.map(r => r.id === rewardId ? { ...r, ...updates } : r);
    await updateFamilyDoc({ rewards: updatedRewards });
    toast({ title: "Succes", description: `Beloning bijgewerkt!` });
    setIsLoading(false);
  };

  const approveChore = async (choreId: string) => {
      if(!family) return;
      setIsLoading(true);
      
      const familyDocRef = doc(db, 'families', family.id);
      const familyDocSnap = await getDoc(familyDocRef);
      const currentFamilyData = familyDocSnap.data() as Family;

      const chore = currentFamilyData.chores.find(c => c.id === choreId);
      const child = currentFamilyData.children.find(c => c.id === chore?.submittedBy);

      if (chore && child) {
          const updatedChores = currentFamilyData.chores.map(c => c.id === choreId ? { ...c, status: 'approved' } : c);
          const updatedChildren = currentFamilyData.children.map(c => c.id === child.id ? { ...c, points: c.points + chore.points, totalPointsEver: c.totalPointsEver + chore.points } : c);
          
          await updateDoc(familyDocRef, { chores: updatedChores, children: updatedChildren });
          await refreshFamilyData();
          toast({ title: "Succes", description: "Klusje goedgekeurd!" });
      }
      setIsLoading(false);
  };
  
  const rejectChore = async (choreId: string) => {
      if(!family) return;
      setIsLoading(true);
      const updatedChores = family.chores.map(c => c.id === choreId ? { ...c, status: 'available', submittedBy: null, emotion: null, submittedAt: null, photoUrl: null } : c);
      await updateFamilyDoc({ chores: updatedChores });
      toast({ title: "Info", description: "Klusje afgekeurd en weer beschikbaar." });
      setIsLoading(false);
  };
  
  const deleteItem = async (collection: 'children' | 'chores' | 'rewards', itemId: string) => {
      if(!family) return;
      setIsLoading(true);
      const itemToDelete = family[collection].find(item => item.id === itemId);
      if(itemToDelete) {
          await updateFamilyDoc({ [collection]: arrayRemove(itemToDelete) });
          toast({ title: "Succes", description: "Item verwijderd." });
      }
      setIsLoading(false);
  };
  
  const submitChoreForApproval = (choreId: string, emotion: string, photoFile: File | null): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        if (!user || !family) {
            return reject(new Error("User or family not found"));
        }

        try {
            let photoUrl: string | null = null;
            if (photoFile) {
                const storageRef = ref(storage, `chore-proof/${family.id}/${choreId}-${Date.now()}.jpg`);
                const snapshot = await uploadBytes(storageRef, photoFile);
                photoUrl = await getDownloadURL(snapshot.ref);
            }
    
            const familyDocRef = doc(db, 'families', family.id);
            const familyDocSnap = await getDoc(familyDocRef);
            if (!familyDocSnap.exists()) {
                 return reject(new Error("Family document not found."));
            }
            const currentFamilyData = familyDocSnap.data() as Family;
    
            const updatedChores = currentFamilyData.chores.map(c => 
                c.id === choreId 
                ? {
                    ...c,
                    status: 'submitted' as ChoreStatus,
                    submittedBy: user.id,
                    submittedAt: Timestamp.now(),
                    emotion: emotion,
                    photoUrl: photoUrl
                  }
                : c
            );
    
            await updateDoc(familyDocRef, { chores: updatedChores });
            await refreshFamilyData();
            const parentEmail = currentFamilyData.email;
            const chore = currentFamilyData.chores.find(c => c.id === choreId);
            if (parentEmail && chore && user) {
                void sendNotification({
                    type: 'chore_submitted',
                    to: parentEmail,
                    data: {
                        parentName: currentFamilyData.familyName,
                        childName: user.name,
                        choreName: chore.name,
                        points: chore.points,
                    },
                });
            }
            confetti({ particleCount: 150, spread: 120, origin: { y: 0.6 } });
            resolve();
    
        } catch (e: any) {
            console.error("Error submitting chore: ", e);
            reject(e);
        }
    });
  };

  const redeemReward = async (rewardId: string) => {
    if (!user || !family) return;
    setIsLoading(true);

    const familyDocRef = doc(db, 'families', family.id);
    const familyDocSnap = await getDoc(familyDocRef);
    const currentFamilyData = familyDocSnap.data() as Family;

    const reward = currentFamilyData.rewards.find(r => r.id === rewardId);
    const child = currentFamilyData.children.find(c => c.id === user.id);

    if (reward && child && child.points >= reward.points) {
        const updatedChildren = currentFamilyData.children.map(c => c.id === user.id ? { ...c, points: c.points - reward.points } : c);
        const newPendingReward: PendingReward = {
            id: `pr${Date.now()}`,
            childId: child.id,
            childName: child.name,
            rewardId: reward.id,
            rewardName: reward.name,
            points: reward.points,
            redeemedAt: Timestamp.now(),
        };
        await updateDoc(familyDocRef, { children: updatedChildren, pendingRewards: arrayUnion(newPendingReward) });
        await refreshFamilyData();
        toast({ title: "Succes!", description: `Je hebt "${reward.name}" gekocht!` });
        const parentEmail = currentFamilyData.email;
        if (parentEmail) {
            void sendNotification({
                type: 'reward_redeemed',
                to: parentEmail,
                data: {
                    parentName: currentFamilyData.familyName,
                    childName: child.name,
                    rewardName: reward.name,
                    points: reward.points,
                },
            });
        }
    } else {
        toast({ variant: "destructive", title: "Oeps!", description: "Je hebt niet genoeg punten." });
    }
    setIsLoading(false);
  };

  const markRewardAsGiven = async (pendingRewardId: string) => {
    if(!family) return;
    setIsLoading(true);
    const rewardToGive = family.pendingRewards.find(pr => pr.id === pendingRewardId);
    if(rewardToGive) {
        await updateFamilyDoc({ pendingRewards: arrayRemove(rewardToGive) });
        toast({ title: "Succes", description: "Beloning afgehandeld." });
    }
    setIsLoading(false);
  };
  
  const saveRecoveryEmail = async (email: string) => {
      if(!family) return;
      setIsLoading(true);
      await updateFamilyDoc({ recoveryEmail: email });
      toast({ title: "Succes", description: "Herstel-e-mailadres opgeslagen." });
      setIsLoading(false);
  };

  const recoverFamilyCode = async (email: string) => { // This now only sends a password reset
      setIsLoading(true);
      try {
          await sendPasswordResetEmail(auth, email);
          toast({ title: "E-mail verzonden!", description: `Als dit e-mailadres bekend is, is er een wachtwoordherstel-mail verstuurd.` });
      } catch (error) {
          console.error(error);
          toast({ title: "E-mail verzonden!", description: `Als dit e-mailadres bekend is, is er een wachtwoordherstel-mail verstuurd.` });
      } finally {
          setScreen('parentLogin');
          setIsLoading(false);
      }
  };

  const addGoodCause = useCallback(async (cause: Omit<GoodCause, 'id'>) => {
    setIsLoading(true);
    try {
      await addDoc(collection(db, "goodCauses"), cause);
      toast({ title: "Succes", description: "Goed doel toegevoegd." });
      await getGoodCauses(); // Refresh the list
    } catch (error) {
      console.error("Error adding good cause:", error);
      toast({ variant: 'destructive', title: 'Fout', description: 'Kon goed doel niet toevoegen.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast, getGoodCauses]);

  const updateGoodCause = useCallback(async (causeId: string, updates: Partial<Omit<GoodCause, 'id'>>) => {
    setIsLoading(true);
    try {
      const causeRef = doc(db, "goodCauses", causeId);
      await updateDoc(causeRef, updates);
      toast({ title: "Succes", description: "Goed doel bijgewerkt." });
      await getGoodCauses(); // Refresh the list
    } catch (error) {
      console.error("Error updating good cause:", error);
      toast({ variant: 'destructive', title: 'Fout', description: 'Kon goed doel niet bijwerken.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast, getGoodCauses]);

  const startPremiumCheckout = useCallback(async (interval: BillingInterval) => {
    if (!family) {
      toast({ variant: 'destructive', title: 'Geen gezin gevonden', description: 'Log opnieuw in en probeer het nog eens.' });
      return null;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/billing/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: family.id,
          email: family.email,
          familyName: family.familyName,
          interval,
          plan: 'premium',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Kon betaalverzoek niet starten.');
      }

      if (!data?.paymentUrl) {
        throw new Error('Geen betaal-URL ontvangen van MultiSafepay.');
      }

      return data.paymentUrl as string;
    } catch (error) {
      console.error('startPremiumCheckout error', error);
      toast({ variant: 'destructive', title: 'Betaling mislukt', description: error instanceof Error ? error.message : 'Probeer het later opnieuw.' });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [family, toast]);

  const confirmPremiumCheckout = useCallback(async (orderId: string, interval: BillingInterval) => {
    if (!family) {
      toast({ variant: 'destructive', title: 'Geen gezin gevonden', description: 'Log opnieuw in en probeer het nog eens.' });
      return false;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/billing/confirm-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Kon betaling niet bevestigen.');
      }

      if (data.status !== 'completed') {
        toast({ variant: 'destructive', title: 'Betaling niet afgerond', description: 'De betaling is nog niet voltooid. Controleer je MultiSafepay-transactie.' });
        return false;
      }

      const resolvedInterval = (data.interval as BillingInterval | undefined) ?? interval;
      const renewalTimestamp = data.renewalDate ? Timestamp.fromDate(new Date(data.renewalDate)) : null;

      await updateFamilyDoc({
        subscription: {
          plan: 'premium',
          status: 'active',
          interval: resolvedInterval,
          renewalDate: renewalTimestamp,
          lastPaymentAt: Timestamp.now(),
          orderId,
        },
      });

      toast({ title: 'Welkom bij Gezin+', description: 'Je gezin heeft nu toegang tot alle premium functies.' });
      return true;
    } catch (error) {
      console.error('confirmPremiumCheckout error', error);
      toast({ variant: 'destructive', title: 'Bevestigen mislukt', description: error instanceof Error ? error.message : 'Probeer het later opnieuw.' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [family, toast, updateFamilyDoc]);

  const value = {
    currentScreen,
    setScreen,
    isLoading,
    activePlan,
    planDefinition,
    isPremium,
    monthlyChoreUsage,
    canAccessFeature,
    family,
    user,
    adminStats,
    goodCauses,
    blogPosts,
    reviews,
    loginParent,
    registerFamily,
    logout,
    loginChildStep1,
    selectChildProfile,
    submitPin,
    addChild,
    updateChild,
    addChore,
    updateChore,
    addReward,
    updateReward,
    approveChore,
    rejectChore,
    deleteItem,
    submitChoreForApproval,
    redeemReward,
    markRewardAsGiven,
    saveRecoveryEmail,
    recoverFamilyCode,
    getAdminStats,
    getGoodCauses,
    addGoodCause,
    updateGoodCause,
    getBlogPosts,
    createBlogPost,
    updateBlogPost,
    deleteBlogPost,
    getReviews,
    createReview,
    updateReview,
    deleteReview,
    startPremiumCheckout,
    confirmPremiumCheckout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
