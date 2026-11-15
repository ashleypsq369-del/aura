/**
 * OrganisationProfile — /services/org/:id
 * Shows an organisation's full profile: about, services, staff roster,
 * contact and booking CTA.
 *
 * Data model: organisations are User records with role='organisation'
 * (approved via AdminUserManagement Org Requests tab). Their staff are
 * providers whose facility_name matches the org name, or who are linked
 * via org_id in UserProfile.
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin, Phone, Mail, Globe, Star, BadgeCheck, Shield,
  Users, Calendar, MessageCircle, ArrowLeft, ChevronRight,
  Building2, Stethoscope, Award, Clock, CheckCircle,
} from 'lucide-react';
import { servicesAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import AvatarDisplay from '../components/avatar/AvatarDisplay';
import toast from '../utils/toast';

const TYPE_COLORS = {
  hospital:  { color:'#0891b2', bg:'rgba(8,145,178,0.08)',  label:'Hospital'          },
  hospice:   { color:'#0d9488', bg:'rgba(13,148,136,0.08)', label:'Hospice'           },
  clinic:    { color:'#059669', bg:'rgba(5,150,105,0.08)',  label:'Clinic'            },
  care_home: { color:'#7c3aed', bg:'rgba(124,58,237,0.08)', label:'Care Home'         },
  ngo:       { color:'#d97706', bg:'rgba(217,119,6,0.08)',  label:'NGO / Charity'     },
  pharmacy:  { color:'#0369a1', bg:'rgba(3,105,161,0.08)', label:'Pharmacy'          },
  default:   { color:'#0d9488', bg:'rgba(13,148,136,0.08)', label:'Healthcare Org'    },
};

function typeMeta(t) { return TYPE_COLORS[t] || TYPE_COLORS.default; }

function Stars({ value, count }) {
  if (!value) return <span style={{ fontSize:11, color:'var(--text-400)', fontStyle:'italic' }}>No reviews</span>;
  return (
    <span style={{ display:'flex', alignItems:'center', gap:3 }}>
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={12} strokeWidth={1.5}
          style={{ color: n<=Math.round(value)?'#f59e0b':'var(--card-border)', fill: n<=Math.round(value)?'#f59e0b':'none' }}/>
      ))}
      <span style={{ marginLeft:4, fontSize:12, fontWeight:700, color:'var(--text-800)' }}>{value.toFixed(1)}</span>
      {count>0 && <span style={{ fontSize:11, color:'var(--text-400)' }}>({count})</span>}
    </span>
  );
}

function StaffCard({ member, onBook, onMessage }) {
  const meta = typeMeta('default');
  const rating = member.average_rating;
  return (
    <motion.div
      whileHover={{ y:-3, boxShadow:'0 8px 24px rgba(0,0,0,0.1)' }}
      style={{
        background:'var(--card-bg)', borderRadius:14, border:'1px solid var(--card-border)',
        overflow:'hidden', display:'flex', flexDirection:'column',
        boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Photo area */}
      <div style={{ height:130, position:'relative', overflow:'hidden',
        background:`linear-gradient(135deg,${meta.color}cc,${meta.color}88)` }}>
        {member.avatar_url && (
          <img src={member.avatar_url} alt={member.full_name}
            style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 20%' }}
            onError={e => e.currentTarget.style.display='none'}/>
        )}
        <div style={{ position:'absolute', inset:0,
          background:'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }}/>
        {member.is_verified && (
          <div style={{ position:'absolute', top:8, right:8 }}>
            <BadgeCheck size={18} style={{ color:'#5eead4' }}/>
          </div>
        )}
        {rating && (
          <div style={{ position:'absolute', top:8, left:8,
            display:'flex', alignItems:'center', gap:3,
            background:'rgba(255,255,255,0.95)', borderRadius:8, padding:'2px 7px' }}>
            <Star size={10} style={{ color:'#f59e0b', fill:'#f59e0b' }}/>
            <span style={{ fontSize:11, fontWeight:800, color:'#0f172a' }}>{rating.toFixed(1)}</span>
          </div>
        )}
        <div style={{ position:'absolute', bottom:8, left:12, right:8 }}>
          <p style={{ color:'#fff', fontWeight:800, fontSize:13, margin:0, lineHeight:1.2 }}>{member.full_name}</p>
          <p style={{ color:'rgba(255,255,255,0.75)', fontSize:10, margin:'2px 0 0' }}>
            {member.professional_title || member.service_type?.replace(/_/g,' ')}
          </p>
        </div>
      </div>
      {/* Body */}
      <div style={{ padding:'10px 12px', flex:1, display:'flex', flexDirection:'column', gap:8 }}>
        <Stars value={rating} count={member.total_reviews||0}/>
        {member.region && (
          <p style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'var(--text-500)', margin:0 }}>
            <MapPin size={9}/>{member.region}
          </p>
        )}
        <div style={{ display:'flex', gap:6, marginTop:'auto' }}>
          <button onClick={() => onBook(member)}
            style={{ flex:1, padding:'7px 0', borderRadius:9, fontSize:11, fontWeight:700,
              background:meta.color, color:'#fff', border:'none', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
            <Calendar size={11}/>Book
          </button>
          <button onClick={() => onMessage(member)}
            style={{ flex:1, padding:'7px 0', borderRadius:9, fontSize:11, fontWeight:600,
              background:'var(--page-bg)', color:'var(--text-600)',
              border:'1px solid var(--card-border)', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
            <MessageCircle size={11}/>Chat
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function OrganisationProfile() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('about');

  const { data: org, isLoading } = useQuery({
    queryKey: ['org-profile', id],
    queryFn:  () => servicesAPI.getOrganisation?.(id).then(r => r.data)
              .catch(() => null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: staffData } = useQuery({
    queryKey: ['org-staff', id],
    queryFn:  () => servicesAPI.getOrganisationStaff?.(id).then(r => r.data)
              .catch(() => ({ staff: [] })),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const staff = staffData?.staff || [];

  const handleBook = (provider) => {
    navigate(`/services?book=${provider.id}`);
  };

  const handleMessage = (provider) => {
    navigate(`/messages?userId=${provider.id}`);
  };

  const handleContactOrg = () => {
    if (org?.contact_user_id) {
      navigate(`/messages?userId=${org.contact_user_id}`);
    } else {
      toast('Contact details not available');
    }
  };

  if (isLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--page-bg)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, borderRadius:14, background:'rgba(13,148,136,0.1)',
          display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
          <Building2 size={22} style={{ color:'#0d9488' }}/>
        </div>
        <p style={{ fontSize:13, color:'var(--text-500)' }}>Loading organisation…</p>
      </div>
    </div>
  );

  /* Fallback data when API doesn't have org-specific endpoint yet */
  const orgData = org || {
    full_name: 'Organisation',
    org_type: 'default',
    bio: null,
    region: null,
    phone: null,
    email: null,
    website: null,
    avatar_url: null,
    is_verified: false,
    average_rating: null,
    total_reviews: 0,
    services_offered: [],
    total_staff: staff.length,
  };

  const meta = typeMeta(orgData.org_type);
  const TABS = [
    { id:'about',    label:'About'   },
    { id:'team',     label:`Team (${staff.length})`  },
    { id:'services', label:'Services'},
  ];

  return (
    <div style={{ minHeight:'100vh', background:'var(--page-bg)', paddingBottom:64 }}>
      {/* Back button */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'16px 20px 0' }}>
        <button onClick={() => navigate(-1)}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px',
            borderRadius:9, fontSize:12, fontWeight:600, border:'1px solid var(--card-border)',
            background:'var(--card-bg)', color:'var(--text-600)', cursor:'pointer' }}>
          <ArrowLeft size={14}/>Back to Services
        </button>
      </div>

      {/* Hero banner */}
      <div style={{ maxWidth:1100, margin:'16px auto 0', padding:'0 20px' }}>
        <div style={{ borderRadius:18, overflow:'hidden', position:'relative',
          background:`linear-gradient(135deg,${meta.color}ee,${meta.color}99)`,
          minHeight:200 }}>
          {orgData.cover_image && (
            <img src={orgData.cover_image} alt={orgData.full_name}
              style={{ position:'absolute', inset:0, width:'100%', height:'100%',
                objectFit:'cover', opacity:0.3 }}/>
          )}
          <div style={{ position:'relative', zIndex:1, padding:'32px 28px', display:'flex',
            alignItems:'flex-end', gap:20, minHeight:200 }}>
            {/* Org logo/avatar */}
            <div style={{ width:80, height:80, borderRadius:16, flexShrink:0,
              background:'rgba(255,255,255,0.95)', display:'flex', alignItems:'center',
              justifyContent:'center', boxShadow:'0 4px 16px rgba(0,0,0,0.2)',
              overflow:'hidden' }}>
              {orgData.avatar_url
                ? <img src={orgData.avatar_url} alt={orgData.full_name}
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                : <Building2 size={36} style={{ color:meta.color }}/>
              }
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                <h1 style={{ color:'#fff', fontWeight:900, fontSize:22, margin:0,
                  textShadow:'0 2px 8px rgba(0,0,0,0.4)' }}>{orgData.full_name}</h1>
                {orgData.is_verified && <BadgeCheck size={20} style={{ color:'#5eead4' }}/>}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:99,
                  background:'rgba(255,255,255,0.2)', color:'#fff' }}>{meta.label}</span>
                {orgData.region && (
                  <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11,
                    color:'rgba(255,255,255,0.8)' }}>
                    <MapPin size={10}/>{orgData.region}
                  </span>
                )}
                <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11,
                  color:'rgba(255,255,255,0.8)' }}>
                  <Users size={10}/>{staff.length} staff members
                </span>
              </div>
            </div>
            {/* CTA buttons */}
            <div style={{ display:'flex', gap:8, flexShrink:0, flexWrap:'wrap' }}>
              <button onClick={handleContactOrg}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px',
                  borderRadius:10, fontSize:12, fontWeight:700,
                  background:'rgba(255,255,255,0.15)', color:'#fff',
                  border:'1px solid rgba(255,255,255,0.3)', cursor:'pointer',
                  backdropFilter:'blur(4px)' }}>
                <MessageCircle size={13}/>Contact
              </button>
              <button onClick={() => setActiveTab('team')}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px',
                  borderRadius:10, fontSize:12, fontWeight:700,
                  background:'#fff', color:meta.color,
                  border:'none', cursor:'pointer' }}>
                <Calendar size={13}/>Book Appointment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div style={{ maxWidth:1100, margin:'16px auto 0', padding:'0 20px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)',
          background:'var(--card-bg)', borderRadius:14, border:'1px solid var(--card-border)',
          overflow:'hidden' }}>
          {[
            { label:'Staff Members', value:staff.length || orgData.total_staff || '-', icon:Users         },
            { label:'Rating',        value:orgData.average_rating?.toFixed(1)||'New',  icon:Star          },
            { label:'Reviews',       value:orgData.total_reviews||0,                   icon:Award         },
            { label:'Status',        value:orgData.is_verified?'Verified':'Pending',   icon:Shield,
              color:orgData.is_verified?'#0d9488':'#d97706' },
          ].map((s,i) => (
            <div key={s.label} style={{ padding:'14px 16px', textAlign:'center',
              borderRight: i<3 ? '1px solid var(--card-border)' : 'none' }}>
              <p style={{ margin:'0 0 2px', fontSize:18, fontWeight:900,
                color: s.color||'var(--text-900)' }}>{s.value}</p>
              <p style={{ margin:0, fontSize:10, fontWeight:600, color:'var(--text-400)',
                textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tab nav + content */}
      <div style={{ maxWidth:1100, margin:'20px auto 0', padding:'0 20px' }}>
        {/* Tabs */}
        <div style={{ display:'flex', gap:2, marginBottom:20,
          background:'var(--page-bg)', borderRadius:12, padding:4,
          width:'fit-content', border:'1px solid var(--card-border)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ padding:'8px 18px', borderRadius:9, fontSize:12, fontWeight:700,
                background: activeTab===t.id ? 'var(--card-bg)' : 'transparent',
                color: activeTab===t.id ? '#0d9488' : 'var(--text-500)',
                border:'none', cursor:'pointer', transition:'all 0.15s',
                boxShadow: activeTab===t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* About tab */}
          {activeTab==='about' && (
            <motion.div key="about"
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              transition={{ duration:0.15 }}
              style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>
              <div>
                {orgData.bio && (
                  <div style={{ background:'var(--card-bg)', borderRadius:14,
                    border:'1px solid var(--card-border)', padding:'20px 22px', marginBottom:14 }}>
                    <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:700,
                      color:'var(--text-400)', textTransform:'uppercase', letterSpacing:'0.08em' }}>About</p>
                    <p style={{ margin:0, fontSize:13, color:'var(--text-700)', lineHeight:1.7 }}>
                      {orgData.bio}
                    </p>
                  </div>
                )}
                {orgData.services_offered?.length > 0 && (
                  <div style={{ background:'var(--card-bg)', borderRadius:14,
                    border:'1px solid var(--card-border)', padding:'20px 22px' }}>
                    <p style={{ margin:'0 0 12px', fontSize:11, fontWeight:700,
                      color:'var(--text-400)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Services Offered</p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                      {orgData.services_offered.map((s,i) => (
                        <span key={i} style={{ fontSize:12, fontWeight:600, padding:'4px 12px',
                          borderRadius:99, background:`${meta.color}10`,
                          color:meta.color, border:`1px solid ${meta.color}30` }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {!orgData.bio && orgData.services_offered?.length === 0 && (
                  <div style={{ background:'var(--card-bg)', borderRadius:14,
                    border:'2px dashed var(--card-border)', padding:'40px 24px', textAlign:'center' }}>
                    <Building2 size={28} style={{ color:'var(--text-300)', margin:'0 auto 10px', display:'block' }}/>
                    <p style={{ margin:0, fontSize:13, color:'var(--text-500)' }}>
                      Profile details coming soon. Contact the organisation directly.
                    </p>
                  </div>
                )}
              </div>
              {/* Contact sidebar */}
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ background:'var(--card-bg)', borderRadius:14,
                  border:'1px solid var(--card-border)', padding:'18px' }}>
                  <p style={{ margin:'0 0 12px', fontSize:11, fontWeight:700,
                    color:'var(--text-400)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Contact</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                    {orgData.phone && (
                      <a href={`tel:${orgData.phone}`} style={{ display:'flex', alignItems:'center', gap:8,
                        fontSize:12, color:'var(--text-700)', textDecoration:'none' }}>
                        <Phone size={13} style={{ color:'#0d9488', flexShrink:0 }}/>{orgData.phone}
                      </a>
                    )}
                    {orgData.email && (
                      <a href={`mailto:${orgData.email}`} style={{ display:'flex', alignItems:'center', gap:8,
                        fontSize:12, color:'var(--text-700)', textDecoration:'none' }}>
                        <Mail size={13} style={{ color:'#0d9488', flexShrink:0 }}/>{orgData.email}
                      </a>
                    )}
                    {orgData.website && (
                      <a href={orgData.website} target="_blank" rel="noopener noreferrer"
                        style={{ display:'flex', alignItems:'center', gap:8,
                          fontSize:12, color:'#0d9488', textDecoration:'none' }}>
                        <Globe size={13} style={{ flexShrink:0 }}/>Visit website
                      </a>
                    )}
                    {orgData.region && (
                      <p style={{ display:'flex', alignItems:'center', gap:8, fontSize:12,
                        color:'var(--text-700)', margin:0 }}>
                        <MapPin size={13} style={{ color:'#0d9488', flexShrink:0 }}/>{orgData.region}
                      </p>
                    )}
                    {!orgData.phone && !orgData.email && !orgData.website && (
                      <p style={{ fontSize:12, color:'var(--text-400)', fontStyle:'italic', margin:0 }}>
                        Contact details not public yet
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={handleContactOrg}
                  style={{ width:'100%', padding:'11px', borderRadius:12, fontSize:13, fontWeight:700,
                    background:'#0d9488', color:'#fff', border:'none', cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                  <MessageCircle size={14}/>Send Message
                </button>
              </div>
            </motion.div>
          )}

          {/* Team tab */}
          {activeTab==='team' && (
            <motion.div key="team"
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              transition={{ duration:0.15 }}>
              {staff.length === 0 ? (
                <div style={{ background:'var(--card-bg)', borderRadius:14,
                  border:'2px dashed var(--card-border)', padding:'64px 24px', textAlign:'center' }}>
                  <Users size={32} style={{ color:'var(--text-300)', margin:'0 auto 12px', display:'block' }}/>
                  <p style={{ margin:'0 0 4px', fontSize:14, fontWeight:600, color:'var(--text-600)' }}>
                    No staff listed yet
                  </p>
                  <p style={{ margin:0, fontSize:12, color:'var(--text-400)' }}>
                    Contact the organisation directly to enquire about their team
                  </p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize:13, color:'var(--text-500)', marginBottom:16 }}>
                    <strong style={{ color:'var(--text-800)' }}>{staff.length} professionals</strong> working with {orgData.full_name}
                  </p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14 }}>
                    {staff.map(member => (
                      <StaffCard key={member.id} member={member}
                        onBook={handleBook} onMessage={handleMessage}/>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Services tab */}
          {activeTab==='services' && (
            <motion.div key="services"
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              transition={{ duration:0.15 }}>
              <div style={{ background:'var(--card-bg)', borderRadius:14,
                border:'1px solid var(--card-border)', padding:'24px' }}>
                <p style={{ margin:'0 0 16px', fontSize:11, fontWeight:700,
                  color:'var(--text-400)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Available Services</p>
                {orgData.services_offered?.length > 0 ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {orgData.services_offered.map((s,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:10,
                        padding:'12px 14px', borderRadius:10, background:'var(--page-bg)',
                        border:'1px solid var(--card-border)' }}>
                        <CheckCircle size={14} style={{ color:'#0d9488', flexShrink:0 }}/>
                        <span style={{ fontSize:13, color:'var(--text-800)', fontWeight:500 }}>{s}</span>
                        <button onClick={() => setActiveTab('team')}
                          style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4,
                            fontSize:11, fontWeight:700, color:'#0d9488', background:'none',
                            border:'none', cursor:'pointer' }}>
                          Book<ChevronRight size={12}/>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize:13, color:'var(--text-400)', fontStyle:'italic' }}>
                    View our team to see available services and book directly with a provider.
                  </p>
                )}
                <button onClick={() => setActiveTab('team')}
                  style={{ marginTop:20, width:'100%', padding:'12px', borderRadius:12,
                    fontSize:13, fontWeight:700, background:'#0d9488', color:'#fff',
                    border:'none', cursor:'pointer', display:'flex', alignItems:'center',
                    justifyContent:'center', gap:8 }}>
                  <Users size={14}/>View Team & Book
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
