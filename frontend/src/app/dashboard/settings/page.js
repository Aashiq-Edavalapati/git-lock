"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  User, Github, CreditCard, Shield, Lock,
  LogOut, Save, CheckCircle2, AlertCircle, Trash, X
} from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import DeleteConfirmationModal from "@/components/dashboard/DeleteConfirmationModal";
import AddPayoutModal from "@/components/dashboard/AddPayoutModal";
import ErrorModal from "@/components/dashboard/ErrorModal";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import OTPInput from "@/components/ui/OTPInput";
import ResendOTP from "@/components/ui/ResendOTP";
import PasswordInput from "@/components/ui/PasswordInput";

export default function SettingsPage() {
  const router = useRouter();
  const activeTabDefault = "profile";
  const [activeTab, setActiveTab] = useState(activeTabDefault); // profile, billing, security
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddPayoutModal, setShowAddPayoutModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });
  const [payoutMethods, setPayoutMethods] = useState([]);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    bio: "",
    avatarUrl: "",
    role: "", // Added role
    isGithubConnected: false,
    hasPassword: false
  });

  useEffect(() => {
    fetchProfile();
    fetchPayoutMethods();
  }, []);

  const fetchPayoutMethods = async () => {
    try {
        const { data } = await api.get('/payouts');
        setPayoutMethods(data);
    } catch(e) {
        console.error("Failed to load payouts", e);
    }
  };

  const deletePayout = async (id) => {
    if(!confirm("Are you sure?")) return;
    try {
        await api.delete(`/payouts/${id}`);
        fetchPayoutMethods();
    } catch(e) {
        setErrorModal({ isOpen: true, message: "Failed to delete" });
    }
  };

  const setPrimary = async (id) => {
    try {
        await api.put(`/payouts/${id}/primary`);
        fetchPayoutMethods();
    } catch(e) {
        setErrorModal({ isOpen: true, message: "Failed to update" });
    }
  };

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUserData({
        name: data.name,
        email: data.email,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
        role: data.role, 
        isGithubConnected: data.isGithubConnected,
        hasPassword: data.hasPassword
      });
    } catch (error) {
       console.error("Failed to load profile");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/auth/profile', {
        fullName: userData.name,
        bio: userData.bio
      });
      // Optionally show toast success
    } catch (error) {
       console.error("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
     setShowDeleteModal(true); 
  };


  const connectGithub = () => {
    const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const REDIRECT_URI = `${window.location.origin}/auth/github`; 
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=repo,user:email`;
  };

  // Filter tabs
  const tabs = ['profile', 'security'];
  if (userData.role === 'DEVELOPER') {
    tabs.splice(1, 0, 'billing'); // Insert billing in middle
  }

  return (
    <div className="max-w-4xl space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">Settings</h1>
        <p className="text-gray-400 text-sm">Manage your identity and preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-sm font-medium capitalize transition-all relative ${activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="glass-card p-8 rounded-2xl min-h-[400px]">
        
        {/* --- PROFILE TAB --- */}
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="flex items-center gap-6">
               <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 border-2 border-white/10 flex items-center justify-center overflow-hidden">
                  {userData.avatarUrl ? (
                      <img src={userData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                      <User size={32} className="text-gray-400" />
                  )}
               </div>
               <div>
                  <Button variant="outline" className="text-xs h-8">Change Avatar</Button>
                  <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. Max 1MB.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={userData.name} 
                    onChange={(e) => setUserData({...userData, name: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary/50 outline-none" 
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email</label>
                  <input 
                    type="email" 
                    value={userData.email} 
                    disabled 
                    className="w-full bg-white/5 border border-white/5 rounded-lg p-3 text-gray-400 cursor-not-allowed" 
                   />
               </div>
               <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Bio / Headline</label>
                  <textarea 
                    rows="3" 
                    value={userData.bio} 
                    onChange={(e) => setUserData({...userData, bio: e.target.value})}
                    placeholder="Full Stack Developer specialized in React & Node." 
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary/50 outline-none resize-none" 
                  />
               </div>
            </div>
          </motion.div>
        )}

        {/* --- BILLING / PAYOUTS TAB --- */}
        {activeTab === 'billing' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              
              {/* Connected Accounts */}
              <section className="space-y-4">
                 <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Github size={20} /> Repository Access
                 </h3>
                 <div className="p-4 rounded-xl border border-white/10 bg-black/20 flex justify-between items-center">
                    <div>
                       <p className="font-bold text-white">GitHub Account</p>
                       <p className="text-xs text-gray-400">Required to verify commit hashes.</p>
                    </div>
                    {userData.isGithubConnected ? (
                       <div className="flex items-center gap-2 text-green-400 text-sm font-bold bg-green-500/10 px-3 py-1 rounded-full">
                          <CheckCircle2 size={16} /> Connected
                       </div>
                    ) : (
                       <Button onClick={connectGithub} variant="outline" className="h-9">Connect GitHub</Button>
                    )}
                 </div>
              </section>

              <hr className="border-white/5" />

              {/* Payout Method */}
              <section className="space-y-4">
                 <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <CreditCard size={20} /> Payout Methods
                    </h3>
                 </div>
                 <p className="text-sm text-gray-400">Where should we send your escrowed funds?</p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {payoutMethods.map((method) => (
                        <div 
                            key={method.id} 
                            onClick={() => !method.is_primary && setPrimary(method.id)}
                            className={`p-4 rounded-xl border relative cursor-pointer group transition-all ${method.is_primary ? 'bg-primary/5 border-primary/50' : 'bg-black/20 border-white/10 hover:border-white/30'}`}
                        >
                            {method.is_primary && (
                                <div className="absolute top-3 right-3 text-primary"><CheckCircle2 size={18} /></div>
                            )}
                            
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-white">{method.type === 'UPI' ? 'UPI ID' : 'Bank Account'}</p>
                                    <p className="text-sm text-gray-300 mt-1">
                                        {method.type === 'UPI' ? method.details.upiId : method.details.accountNumber}
                                    </p>
                                    {method.type === 'BANK_ACCOUNT' && <p className="text-xs text-gray-500">{method.details.holderName}</p>}
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); deletePayout(method.id); }}
                                    className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                >
                                    <Trash size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    <div 
                        onClick={() => setShowAddPayoutModal(true)}
                        className="p-4 rounded-xl border border-white/10 bg-black/20 hover:border-white/30 cursor-pointer transition-colors flex flex-col justify-center items-center text-gray-400 hover:text-white min-h-[100px]"
                    >
                       <span className="text-2xl mb-1">+</span>
                       <span className="text-xs font-bold uppercase">Add Method</span>
                    </div>
                 </div>
              </section>
              
              <AddPayoutModal 
                isOpen={showAddPayoutModal} 
                onClose={() => setShowAddPayoutModal(false)}
                onSuccess={fetchPayoutMethods}
              />
           </motion.div>
        )}

        {/* --- SECURITY TAB --- */}
        {activeTab === 'security' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              
              {/* Change Password Section */}
              {/* Change Password Section */}
              {userData.hasPassword && (
                <div className="bg-white/5 border border-white/10 p-6 rounded-xl flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-white flex items-center gap-2 mb-1">
                            <Lock size={18} className="text-primary"/> Password
                        </h4>
                        <p className="text-xs text-gray-400">Regularly updating your password improves security.</p>
                    </div>
                    <Button variant="outline" onClick={() => setShowChangePasswordModal(true)}>
                        Change Password
                    </Button>
                </div>
              )}
              
              {showChangePasswordModal && (
                  <ChangePasswordModal onClose={() => setShowChangePasswordModal(false)} />
              )}

              <hr className="border-white/5 my-6" />

              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                 <h4 className="font-bold text-red-400 flex items-center gap-2 mb-2">
                    <AlertCircle size={18} /> Danger Zone
                 </h4>
                 <p className="text-xs text-gray-400 mb-4">
                    Deleting your account will permanently remove all locked contracts and encryption keys. This action cannot be undone.
                 </p>
                 <Button onClick={handleDeleteClick} variant="danger" className="bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white">
                    Delete Account
                 </Button>
              </div>

               {/* Secure Delete Modal */}
               {showDeleteModal && (
                <DeleteConfirmationModal onClose={() => setShowDeleteModal(false)} />
              )}

                <ErrorModal
                    isOpen={errorModal.isOpen}
                    onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
                    message={errorModal.message}
                />
           </motion.div>
        )}

      </div>

      {/* Footer Actions for Profile */}
      {activeTab === 'profile' && (
      <div className="flex justify-end pt-4">
         <Button onClick={handleSave} className="w-32" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
         </Button>
      </div>
      )}

    </div>
  );
}



function ChangePasswordModal({ onClose }) {
    const [step, setStep] = useState(1); // 1: Password Form, 2: MFA
    const [formData, setFormData] = useState({ oldPassword: "", newPassword: "", otp: "" });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const handleInitiate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        if (formData.newPassword.length < 6) {
             setMessage({ type: "error", text: "New password must be at least 6 chars" });
             setLoading(false);
             return;
        }

        try {
            await api.post('/auth/change-password/initiate', { oldPassword: formData.oldPassword });
            setStep(2);
            setMessage({ type: "success", text: "Verification code sent to your email" });
        } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.error || "Failed to initiate change" });
        } finally {
            setLoading(false);
        }
    };

    const handleFinalize = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            await api.post('/auth/change-password/finalize', { otp: formData.otp, newPassword: formData.newPassword });
            setMessage({ type: "success", text: "Password changed successfully! Reloading..." });
            // Reload page or force re-fetch user
            setTimeout(() => window.location.reload(), 2000);
        } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.error || "Failed to change password" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="w-full max-w-md bg-[#0A0A0A] border border-white/10 p-6 rounded-2xl relative shadow-2xl"
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <X size={20}/>
                </button>

                <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-xl">
                    <Lock size={20} className="text-primary"/> Change Password
                </h3>
                
                {message.text && (
                    <div className={`p-3 rounded-lg text-sm mb-4 ${message.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                        {message.text}
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleInitiate} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Old Password</label>
                            <PasswordInput 
                                value={formData.oldPassword} 
                                onChange={(e) => setFormData({...formData, oldPassword: e.target.value})}
                                placeholder="Enter current password"
                            />
                            <div className="flex justify-end mt-1">
                                    <Link href="/forgot-password" className="text-[10px] text-primary hover:underline">Forgot password?</Link>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">New Password</label>
                            <PasswordInput 
                                value={formData.newPassword} 
                                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                                placeholder="Min 6 characters"
                            />
                        </div>
                        <Button type="submit" disabled={loading} className="w-full h-12">
                            {loading ? "Verifying..." : "Next Step"}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleFinalize} className="space-y-4">
                        <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg text-center mb-4">
                            <p className="text-sm text-primary">Enter the 6-digit code sent to your email to confirm this change.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 text-center">Verification Code</label>
                            <OTPInput 
                                length={6}
                                value={formData.otp}
                                onChange={(val) => setFormData({...formData, otp: val})}
                                className="mb-4"
                            />
                        </div>
                        <Button type="submit" disabled={loading} className="w-full h-12">
                            {loading ? "Updating..." : "Verify & Change Password"}
                        </Button>
                        <ResendOTP onResend={async () => await api.post('/auth/change-password/initiate', { oldPassword: formData.oldPassword })} />
                        <button type="button" onClick={() => setStep(1)} className="w-full text-xs text-gray-500 hover:text-white mt-2">Back to Details</button>
                    </form>
                )}
            </motion.div>
        </div>
    );
}

