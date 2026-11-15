/**
 * ProviderDashboard — /provider-dashboard
 * For verified providers (role='provider'):
 * - View & edit their listing card
 * - See booked sessions
 * - Manage availability
 * - Edit organisation profile (if org admin)
 * - Promote/feature their listing
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Edit2, Star, Users, Clock, CheckCircle,
  XCircle, AlertCircle, Loader2, Camera, MapPin,
  Briefcase, TrendingUp, MessageCircle, Settings,
  BadgeCheck, Zap, ChevronRight, Building2, Save, X,
} from 'lucide-react';
import { servicesAPI } from '../api/client';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import AvatarDisplay from '../components/avatar/AvatarDisplay';
import PageHeader from '../components/PageHeader';
import toast from '../utils/toast';

const STATUS_CFG = {
  pending:   { color:'#d97706', bg:'rgba(217,119,6,0.08)',  label:'Pending Review' },
  confirmed: { color:'#0d9488', bg:'rgba(13,148,136,0.08)', label:'Confirmed'      },
  completed: { color:'#059669', bg:'rgba(5,150,105,0.08)',  label:'Completed'      },
  cancelled: { color:'#dc2626', bg:'rgba(220,38,38,0.08)',  label:'Cancelled'      },
};

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)',
      borderRadius:12, padding:'16px', display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ width:40, height:40, borderRadius:10, flexShrink:0,
        background:`${color}14`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon size={18} style={{ color }}/>
      </div>
      <div>
        <p style={{ margin:0, fontSize:20, fontWeight:900, color:'var(--text-900)', lineHeight:1 }}>{value}</p>
        <p style={{ margin:'2px 0 0', fontSize:11, color:'var(--text-500)', fontWeight:600 }}>{label}</p>
      </div>
    </div>
  );
}

export default function ProviderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});

  // Fetch provider's own full profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['my-provider-profile'],
    queryFn: () => servicesAPI.getProvider(user.id).then(r => r.data),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
    onSuccess: (d) => {
      setProfileForm({
        bio: d.bio || '',
        region: d.region || '',
        facility_name: d.facility_name || '',
        specialisation: d.specialisation || '',
        years_experience: d.years_experience || 0,
      });
    },
  });

  // Fetch bookings
  const { data: bookingsData } = useQuery({
    queryKey: ['provider-bookings'],
    queryFn: () => servicesAPI.getMyBookings().then(r => r.data),
    staleTime: 60 * 1000,
  });
  const bookings = bookingsData?.bookings || [];

  // Update profile mutation
  const updateMut = useMutation({
    mutationFn: (data) => apiClient.put('/api/profile', data),
    onSuccess: () => {
      qc.invalidateQueries(['my-provider-profile']);
      setEditingProfile(false);
      toast.success('Profile updated');
    },
    onError: () => toast.error('Update failed'),
  });

  // Confirm booking
  const confirmMut = useMutation({
    mutationFn: (id) => servicesAPI.confirmBooking(id),
    onSuccess: () => { qc.invalidateQueries(['provider-bookings']); toast.success('Booking confirmed'); },
    onError: () => toast.error('Could not confirm booking'),
  });

  // Cancel booking
  const cancelMut = useMutation({
    mutationFn: (id) => servicesAPI.cancelBooking(id),
    onSuccess: () => { qc.invalidateQueries(['provider-bookings']); toast.success('Booking cancelled'); },
    onError: () => toast.error('Could not cancel booking'),
  });

  const stats = {
    total:     bookings.length,
    pending:   bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    rating:    profile?.average_rating?.toFixed(1) || 'N/A',
    reviews:   profile?.total_reviews || 0,
  };

  const TABS = [
    { id:'overview',     label:'Overview',    icon:TrendingUp   },
    { id:'bookings',     label:'Bookings',    icon:Calendar     },
    { id:'listing',      label:'My Listing',  icon:Edit2        },
    { id:'availability', label:'Availability',icon:Clock        },
  ];

  if (profileLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--page-bg)' }}>
      <Loader2 size={28} style={{ color:'#0d9488', animation:'spin 1s linear infinite' }}/>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'var(--page-bg)', paddingBottom:48 }}>
      <PageHeader
        title="Provider Dashboard"
        subtitle={`Welcome back, ${user?.full_name?.split(' ')[0] || 'Provider'}`}
        icon={Briefcase}
      />

      <div style={{ maxWidth:1100, margin:'16px auto 0', padding:'0 20px' }}>

        {/* Provider identity card */}
        <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)',
          borderRadius:14, padding:'20px', marginBottom:16,
          display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          <AvatarDisplay size={64} showRing/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
              <h1 style={{ margin:0, fontSize:18, fontWeight:800, color:'var(--text-900)' }}>
                {user?.full_name}
              </h1>
              {profile?.is_verified && <BadgeCheck size={18} style={{ color:'#5eead4' }}/>}
              <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:99,
                background:'rgba(13,148,136,0.1)', color:'#0d9488' }}>
                {profile?.service_type?.replace(/_/g,' ') || 'Provider'}
              </span>
            </div>
            <p style={{ margin:0, fontSize:12, color:'var(--text-500)' }}>
              {[profile?.region, profile?.facility_name].filter(Boolean).join(' · ') || 'Complete your profile'}
            </p>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button onClick={() => navigate('/messages')}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
                borderRadius:9, fontSize:12, fontWeight:600,
                border:'1px solid var(--card-border)', background:'var(--page-bg)',
                color:'var(--text-600)', cursor:'pointer' }}>
              <MessageCircle size={13}/>Messages
            </button>
            <button onClick={() => navigate('/settings')}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
                borderRadius:9, fontSize:12, fontWeight:600,
                background:'#0d9488', color:'#fff', border:'none', cursor:'pointer' }}>
              <Settings size={13}/>Settings
            </button>
          </div>
        </div>

        {/* Tab nav */}
        <div style={{ display:'flex', gap:2, marginBottom:16, background:'var(--card-bg)',
          borderRadius:12, padding:4, border:'1px solid var(--card-border)', width:'fit-content' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
                borderRadius:9, fontSize:12, fontWeight:700,
                background: activeTab===t.id ? '#0d9488' : 'transparent',
                color: activeTab===t.id ? '#fff' : 'var(--text-500)',
                border:'none', cursor:'pointer', transition:'all 0.15s' }}>
              <t.icon size={13}/>{t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── OVERVIEW ── */}
          {activeTab==='overview' && (
            <motion.div key="overview"
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              transition={{ duration:0.14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, marginBottom:20 }}>
                <StatCard label="Total Bookings" value={stats.total}     icon={Calendar}  color="#0d9488"/>
                <StatCard label="Pending"         value={stats.pending}   icon={Clock}     color="#d97706"/>
                <StatCard label="Confirmed"        value={stats.confirmed} icon={CheckCircle} color="#059669"/>
                <StatCard label="Rating"           value={stats.rating}   icon={Star}      color="#f59e0b"/>
                <StatCard label="Reviews"          value={stats.reviews}  icon={Users}     color="#0891b2"/>
              </div>

              {/* Quick actions */}
              <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)',
                borderRadius:14, overflow:'hidden', marginBottom:16 }}>
                <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--card-border)',
                  background:'var(--page-bg)' }}>
                  <p style={{ margin:0, fontSize:12, fontWeight:700, color:'var(--text-700)' }}>Quick Actions</p>
                </div>
                {[
                  { label:'Edit my listing', desc:'Update bio, qualifications, availability', icon:Edit2,       action:()=>setActiveTab('listing')      },
                  { label:'View bookings',   desc:'Confirm or manage session requests',       icon:Calendar,    action:()=>setActiveTab('bookings')     },
                  { label:'Set availability',desc:'Block dates or set weekly schedule',       icon:Clock,       action:()=>setActiveTab('availability') },
                  { label:'View my profile', desc:'See how patients see your listing',        icon:Briefcase,   action:()=>navigate(`/services`)        },
                  { label:'Send a message',  desc:'Chat with patients or colleagues',         icon:MessageCircle,action:()=>navigate('/messages')       },
                ].map((a, i, arr) => (
                  <button key={a.label} onClick={a.action}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:12,
                      padding:'12px 16px', border:'none', cursor:'pointer', textAlign:'left',
                      borderBottom: i < arr.length-1 ? '1px solid var(--card-border)' : 'none',
                      background:'transparent', transition:'background 0.12s', fontFamily:'inherit' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='var(--page-bg)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                    <div style={{ width:34, height:34, borderRadius:9, background:'rgba(13,148,136,0.1)',
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <a.icon size={15} style={{ color:'#0d9488' }}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:0, fontSize:13, fontWeight:600, color:'var(--text-900)' }}>{a.label}</p>
                      <p style={{ margin:0, fontSize:11, color:'var(--text-500)' }}>{a.desc}</p>
                    </div>
                    <ChevronRight size={14} style={{ color:'var(--text-300)', flexShrink:0 }}/>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── BOOKINGS ── */}
          {activeTab==='bookings' && (
            <motion.div key="bookings"
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              transition={{ duration:0.14 }}>
              {bookings.length === 0 ? (
                <div style={{ background:'var(--card-bg)', border:'2px dashed var(--card-border)',
                  borderRadius:14, padding:'64px 24px', textAlign:'center' }}>
                  <Calendar size={36} style={{ color:'var(--text-300)', margin:'0 auto 12px', display:'block' }}/>
                  <p style={{ margin:'0 0 4px', fontSize:14, fontWeight:600, color:'var(--text-600)' }}>No bookings yet</p>
                  <p style={{ margin:0, fontSize:12, color:'var(--text-400)' }}>When patients book a session with you, it will appear here</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {bookings.map(b => {
                    const sc = STATUS_CFG[b.status] || STATUS_CFG.pending;
                    return (
                      <div key={b.id} style={{ background:'var(--card-bg)',
                        border:'1px solid var(--card-border)', borderRadius:12,
                        padding:'14px 16px', display:'flex', alignItems:'center',
                        gap:12, flexWrap:'wrap' }}>
                        <AvatarDisplay userId={b.patient_user_id || b.user_id} size={40}/>
                        <div style={{ flex:1, minWidth:120 }}>
                          <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:700, color:'var(--text-900)' }}>
                            {b.patient_name || 'Patient'}
                          </p>
                          <p style={{ margin:0, fontSize:11, color:'var(--text-500)' }}>
                            {b.service_type?.replace(/_/g,' ')} ·{' '}
                            {b.requested_date ? new Date(b.requested_date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : ''}
                            {b.start_time ? ` at ${b.start_time}` : ''}
                          </p>
                          {b.notes && <p style={{ margin:'4px 0 0', fontSize:11, color:'var(--text-400)', fontStyle:'italic' }}>{b.notes}</p>}
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99,
                          background:sc.bg, color:sc.color, flexShrink:0 }}>
                          {sc.label}
                        </span>
                        {b.status === 'pending' && (
                          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                            <button onClick={() => confirmMut.mutate(b.id)}
                              disabled={confirmMut.isPending}
                              style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px',
                                borderRadius:8, fontSize:11, fontWeight:700, background:'#0d9488',
                                color:'#fff', border:'none', cursor:'pointer' }}>
                              <CheckCircle size={11}/>Confirm
                            </button>
                            <button onClick={() => cancelMut.mutate(b.id)}
                              disabled={cancelMut.isPending}
                              style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px',
                                borderRadius:8, fontSize:11, fontWeight:600, background:'var(--page-bg)',
                                color:'#dc2626', border:'1px solid rgba(220,38,38,0.25)', cursor:'pointer' }}>
                              <XCircle size={11}/>Decline
                            </button>
                          </div>
                        )}
                        {b.status === 'confirmed' && (
                          <button onClick={() => navigate(`/messages?userId=${b.patient_user_id || b.user_id}`)}
                            style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px',
                              borderRadius:8, fontSize:11, fontWeight:600, background:'var(--page-bg)',
                              color:'#0d9488', border:'1px solid rgba(13,148,136,0.3)', cursor:'pointer', flexShrink:0 }}>
                            <MessageCircle size={11}/>Message
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── MY LISTING ── */}
          {activeTab==='listing' && (
            <motion.div key="listing"
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              transition={{ duration:0.14 }}>
              <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)',
                borderRadius:14, overflow:'hidden' }}>
                <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--card-border)',
                  background:'var(--page-bg)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <p style={{ margin:0, fontSize:13, fontWeight:700, color:'var(--text-900)' }}>Listing Details</p>
                  {!editingProfile ? (
                    <button onClick={() => setEditingProfile(true)}
                      style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px',
                        borderRadius:8, fontSize:12, fontWeight:700, background:'#0d9488',
                        color:'#fff', border:'none', cursor:'pointer' }}>
                      <Edit2 size={12}/>Edit Listing
                    </button>
                  ) : (
                    <div style={{ display:'flex', gap:7 }}>
                      <button onClick={() => { setEditingProfile(false); }}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 10px',
                          borderRadius:8, fontSize:11, fontWeight:600, border:'1px solid var(--card-border)',
                          background:'var(--page-bg)', color:'var(--text-600)', cursor:'pointer' }}>
                        <X size={12}/>Cancel
                      </button>
                      <button onClick={() => updateMut.mutate(profileForm)}
                        disabled={updateMut.isPending}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px',
                          borderRadius:8, fontSize:11, fontWeight:700, background:'#0d9488',
                          color:'#fff', border:'none', cursor:'pointer', opacity:updateMut.isPending?0.6:1 }}>
                        {updateMut.isPending ? <Loader2 size={12} style={{ animation:'spin 1s linear infinite' }}/> : <Save size={12}/>}
                        Save
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ padding:'20px' }}>
                  {/* Profile photo */}
                  <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20,
                    paddingBottom:20, borderBottom:'1px solid var(--card-border)' }}>
                    <AvatarDisplay size={72} showRing/>
                    <div>
                      <p style={{ margin:'0 0 6px', fontSize:13, fontWeight:700, color:'var(--text-900)' }}>Profile Photo</p>
                      <button onClick={() => navigate('/profile')}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px',
                          borderRadius:8, fontSize:11, fontWeight:600, background:'var(--page-bg)',
                          color:'var(--text-600)', border:'1px solid var(--card-border)', cursor:'pointer' }}>
                        <Camera size={11}/>Change photo (via Profile)
                      </button>
                    </div>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {[
                      { label:'Professional Bio', key:'bio', type:'textarea',
                        placeholder:'Describe your experience and approach to palliative care…' },
                      { label:'Region', key:'region', type:'text', placeholder:'e.g. Greater Accra' },
                      { label:'Organisation / Facility', key:'facility_name', type:'text', placeholder:'e.g. Korle Bu Teaching Hospital' },
                      { label:'Specialisation', key:'specialisation', type:'text', placeholder:'e.g. Pain Management' },
                      { label:'Years of Experience', key:'years_experience', type:'number', placeholder:'0' },
                    ].map(field => (
                      <div key={field.key}>
                        <label style={{ display:'block', fontSize:11, fontWeight:700,
                          color:'var(--text-600)', marginBottom:5 }}>
                          {field.label}
                        </label>
                        {editingProfile ? (
                          field.type === 'textarea' ? (
                            <textarea
                              value={profileForm[field.key] || ''}
                              onChange={e => setProfileForm(f => ({ ...f, [field.key]: e.target.value }))}
                              rows={3} placeholder={field.placeholder}
                              style={{ width:'100%', padding:'9px 12px', borderRadius:9,
                                border:'1.5px solid var(--card-border)', fontSize:12,
                                color:'var(--text-800)', background:'var(--card-bg)',
                                outline:'none', resize:'none', boxSizing:'border-box' }}
                              onFocus={e=>(e.target.style.borderColor='#0d9488')}
                              onBlur={e=>(e.target.style.borderColor='var(--card-border)')}
                            />
                          ) : (
                            <input
                              type={field.type}
                              value={profileForm[field.key] || ''}
                              onChange={e => setProfileForm(f => ({ ...f, [field.key]: e.target.value }))}
                              placeholder={field.placeholder}
                              style={{ width:'100%', padding:'9px 12px', borderRadius:9,
                                border:'1.5px solid var(--card-border)', fontSize:12,
                                color:'var(--text-800)', background:'var(--card-bg)',
                                outline:'none', boxSizing:'border-box' }}
                              onFocus={e=>(e.target.style.borderColor='#0d9488')}
                              onBlur={e=>(e.target.style.borderColor='var(--card-border)')}
                            />
                          )
                        ) : (
                          <p style={{ margin:0, fontSize:13, color:'var(--text-700)',
                            padding:'9px 0', borderBottom:'1px solid var(--card-border)' }}>
                            {profile?.[field.key] || <span style={{ color:'var(--text-300)', fontStyle:'italic' }}>Not set</span>}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Verification status */}
              <div style={{ marginTop:12, background:'var(--card-bg)', border:'1px solid var(--card-border)',
                borderRadius:12, padding:'14px 16px' }}>
                <p style={{ margin:'0 0 10px', fontSize:12, fontWeight:700, color:'var(--text-700)' }}>Verification Status</p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {[
                    { label:'Account Active',    ok: user?.is_active,    icon:CheckCircle },
                    { label:'Identity Verified', ok: profile?.is_verified, icon:BadgeCheck },
                    { label:'Professional',      ok: profile?.is_professional, icon:Briefcase },
                  ].map(s => (
                    <div key={s.label} style={{ display:'flex', alignItems:'center', gap:6,
                      padding:'5px 12px', borderRadius:99,
                      background: s.ok ? 'rgba(13,148,136,0.08)' : 'rgba(100,116,139,0.06)',
                      border: `1px solid ${s.ok ? 'rgba(13,148,136,0.2)' : 'var(--card-border)'}` }}>
                      <s.icon size={12} style={{ color: s.ok ? '#0d9488' : 'var(--text-400)' }}/>
                      <span style={{ fontSize:11, fontWeight:600, color: s.ok ? '#0d9488' : 'var(--text-400)' }}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
                {!profile?.is_verified && (
                  <p style={{ margin:'10px 0 0', fontSize:11, color:'var(--text-400)' }}>
                    Verification is reviewed by the Aura Care admin team. Contact support if your application was submitted over 3 days ago.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* ── AVAILABILITY ── */}
          {activeTab==='availability' && (
            <motion.div key="availability"
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              transition={{ duration:0.14 }}>
              <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)',
                borderRadius:14, padding:'24px', textAlign:'center' }}>
                <Clock size={36} style={{ color:'#0d9488', margin:'0 auto 12px', display:'block' }}/>
                <p style={{ margin:'0 0 6px', fontSize:15, fontWeight:700, color:'var(--text-900)' }}>
                  Availability Management
                </p>
                <p style={{ margin:'0 0 16px', fontSize:12, color:'var(--text-500)', maxWidth:360, marginLeft:'auto', marginRight:'auto' }}>
                  Set your weekly schedule and block specific dates when you're unavailable.
                  Patients will only see available slots when booking.
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6, maxWidth:400, margin:'0 auto 20px' }}>
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i) => (
                    <div key={d} style={{ padding:'8px 4px', borderRadius:8, textAlign:'center',
                      background: i < 5 ? 'rgba(13,148,136,0.1)' : 'var(--page-bg)',
                      border:`1px solid ${i < 5 ? 'rgba(13,148,136,0.25)' : 'var(--card-border)'}` }}>
                      <p style={{ margin:0, fontSize:10, fontWeight:700,
                        color: i < 5 ? '#0d9488' : 'var(--text-400)' }}>{d}</p>
                      <p style={{ margin:'2px 0 0', fontSize:9, color: i < 5 ? '#0d9488' : 'var(--text-300)' }}>
                        {i < 5 ? 'Open' : 'Closed'}
                      </p>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize:11, color:'var(--text-400)', margin:'0 0 12px' }}>
                  Full availability calendar — coming soon. For now, contact bookings directly via Messages.
                </p>
                <button onClick={() => navigate('/messages')}
                  style={{ padding:'10px 20px', borderRadius:10, fontSize:12, fontWeight:700,
                    background:'#0d9488', color:'#fff', border:'none', cursor:'pointer',
                    display:'inline-flex', alignItems:'center', gap:6 }}>
                  <MessageCircle size={13}/>Open Messages
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
