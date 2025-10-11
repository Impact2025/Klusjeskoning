'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Screen, Family, Child, Chore, Reward, PendingReward, RewardType, ChoreStatus, AdminStats, GoodCause } from '@/lib/types';
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
    addDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';


interface AppContextType {
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;
  isLoading: boolean;
  family: Family | null;
  user: Child | null;
  adminStats: AdminStats | null;
  goodCauses: GoodCause[] | null;
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
  const { toast } = useToast();
  
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
            setIsLoading(false);
          } else {
            fetchFamilyData(user.uid);
          }
        } else {
            setFamily(null);
            setUser(null);
            setAdminStats(null);
            setGoodCauses(null);
            if (window.location.pathname !== '/admin') {
              setScreen('landing');
            }
            setIsLoading(false);
        }
    });

    return () => unsubscribe();
  }, [getAdminStats, getGoodCauses]);



  const logout = useCallback(async () => {
    const isAdmin = auth.currentUser?.email === 'admin@klusjeskoning.nl';
    await signOut(auth);
    setFamily(null);
    setUser(null);
    setAdminStats(null);
    setGoodCauses(null);
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
        };
        await setDoc(doc(db, 'families', newFamily.id), newFamily);
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

  const updateFamilyDoc = async (updates) => {
      if (!family) return;
      const familyDocRef = doc(db, 'families', family.id);
      await updateDoc(familyDocRef, updates);
      await refreshFamilyData();
  };

  const addChild = async (name: string, pin: string, avatar: string) => {
      if(!family) return;
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
      setIsLoading(true);
      const newChore: Chore = { id: `chore${Date.now()}`, name, points, assignedTo, status: 'available' };
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

  const value = {
    currentScreen,
    setScreen,
    isLoading,
    family,
    user,
    adminStats,
    goodCauses,
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
