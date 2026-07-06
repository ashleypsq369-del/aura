# 🛠️ Developer Quick Reference - Drill-Down Navigation

## Quick Start Guide

### Creating a New Detail Page

```jsx
// 1. Create new file: /pages/YourDetail.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import PageTransition from '../components/PageTransition';
import PageHeader from '../components/PageHeader';
import Breadcrumbs from '../components/Breadcrumbs';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function YourDetail() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('auth_token');

  // Fetch data
  const { data, isLoading } = useQuery({
    queryKey: ['your-data', patientId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/patients/${patientId}/your-endpoint`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  });

  // Breadcrumb trail
  const breadcrumbTrail = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Patients', path: '/patients' },
    { label: patient?.full_name || 'Patient', path: `/patients/${patientId}` },
    { label: 'Your Section', current: true }
  ];

  // Action buttons
  const actions = [
    {
      label: 'Primary Action',
      icon: Plus,
      primary: true,
      onClick: () => console.log('Action')
    }
  ];

  return (
    <PageTransition>
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <Breadcrumbs trail={breadcrumbTrail} />
        
        <PageHeader
          title="Your Section"
          subtitle="Description of what this page shows"
          icon={YourIcon}
          actions={actions}
        />

        {/* Your content here */}
      </div>
    </PageTransition>
  );
}

// 2. Add route to App.jsx
<Route path="/patients/:patientId/your-section" element={<YourDetail />} />

// 3. Add summary card to PatientDetail.jsx
<SummaryCard
  icon={YourIcon}
  title="Your Section"
  summary="Brief description of what's available"
  status="normal"
  onClick={() => navigate(`/patients/${patientId}/your-section`)}
/>
```

---

## Component Reference

### PageTransition
**Purpose:** Smooth page transitions  
**Usage:**
```jsx
<PageTransition>
  <YourPageContent />
</PageTransition>
```
**Props:** None (wraps children)

---

### PageHeader
**Purpose:** Professional page headers  
**Props:**
```jsx
<PageHeader
  title="Page Title"                    // Required: Main title
  subtitle="Page description"           // Optional: Subtitle
  icon={IconComponent}                  // Optional: Lucide icon
  showBack={true}                       // Optional: Show back button (default: true)
  onBack={() => {}}                     // Optional: Custom back handler
  actions={[                            // Optional: Action buttons
    {
      label: 'Button Text',
      icon: IconComponent,
      primary: true,                    // Primary style (teal bg)
      onClick: () => {},
      disabled: false
    }
  ]}
/>
```

**Example:**
```jsx
<PageHeader
  title={`${patient?.full_name} - Vitals`}
  subtitle="Complete vital signs history"
  icon={Activity}
  actions={[
    {
      label: 'Record Vitals',
      icon: Plus,
      primary: true,
      onClick: () => console.log('Record')
    }
  ]}
/>
```

---

### SummaryCard
**Purpose:** Interactive drill-down navigation cards  
**Props:**
```jsx
<SummaryCard
  icon={IconComponent}                  // Required: Lucide icon
  title="Card Title"                    // Required: Card title
  summary="1-2 line description"        // Required: Brief summary
  status="normal"                       // Optional: normal|warning|critical|success
  badge="5 active"                      // Optional: Badge text
  badgeColor="bg-blue-100..."           // Optional: Custom badge colors
  onClick={() => navigate('/path')}    // Required: Click handler
/>
```

**Status Colors:**
- `normal`: Blue border, teal icon
- `warning`: Amber border, amber icon
- `critical`: Red border, red icon
- `success`: Green border, green icon

**Example:**
```jsx
<SummaryCard
  icon={Pill}
  title="Medications"
  summary="5 active prescriptions. Next refill check required."
  status="normal"
  badge="5 active"
  badgeColor="bg-green-100 text-green-700 border-green-300"
  onClick={() => navigate(`/patients/${patientId}/medications`)}
/>
```

---

### Breadcrumbs
**Purpose:** Hierarchical navigation  
**Props:**
```jsx
<Breadcrumbs
  trail={[
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Patients', path: '/patients' },
    { label: 'Sarah Johnson', path: `/patients/123` },
    { label: 'Vitals', current: true }
  ]}
/>
```

**Note:** Last item with `current: true` is not clickable

---

## Layout Standards

### Container
```jsx
<div className="max-w-[1400px] mx-auto px-8 py-8">
  {/* Content */}
</div>
```

### Grid Layouts
```jsx
{/* 3-column responsive grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>

{/* 4-column responsive grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Cards */}
</div>
```

### Section Spacing
```jsx
{/* 32px between major sections */}
<div className="mb-8">
  <SectionContent />
</div>

{/* 24px between cards in grid (handled by gap-6) */}
<div className="grid gap-6">
  <Card />
  <Card />
</div>
```

---

## Card Styles

### Stat Card (140px height)
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
  className="bg-white rounded-2xl p-6 shadow-lg border-3 border-blue-300 h-[140px] flex flex-col justify-between"
>
  <div className="flex items-center space-x-3 mb-2">
    <div className="p-2 rounded-xl bg-blue-100">
      <Icon className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
    </div>
    <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wide">Title</h3>
  </div>
  <div>
    <p className="text-4xl font-bold text-slate-900">42</p>
    <p className="text-xs text-slate-600">Description</p>
  </div>
</motion.div>
```

### Content Card
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-white rounded-2xl p-6 shadow-lg border-3 border-slate-200"
>
  <h3 className="text-xl font-bold text-slate-900 mb-4">Section Title</h3>
  {/* Content */}
</motion.div>
```

### Table Container
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-white rounded-2xl shadow-lg border-3 border-slate-200 overflow-hidden"
>
  {/* Header */}
  <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-white border-b-3 border-slate-200">
    <h2 className="text-2xl font-serif font-bold text-slate-900 mb-1">Table Title</h2>
    <p className="text-slate-600 text-sm">Table description</p>
  </div>

  {/* Table */}
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="bg-slate-50 border-b-3 border-slate-200">
          <th className="text-left py-4 px-8 text-sm font-bold text-slate-700 uppercase tracking-wide">
            Column Header
          </th>
        </tr>
      </thead>
      <tbody className="divide-y-2 divide-slate-100">
        <tr className="hover:bg-slate-50 transition-colors h-[56px]">
          <td className="py-4 px-8 text-sm text-slate-700">Cell content</td>
        </tr>
      </tbody>
    </table>
  </div>
</motion.div>
```

---

## Status Badges

### Badge Component
```jsx
<span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border-2 ${
  status === 'active' 
    ? 'bg-green-100 text-green-700 border-green-300'
    : 'bg-gray-100 text-gray-700 border-gray-300'
}`}>
  {status}
</span>
```

### Common Badge Styles
```jsx
// Success/Active
className="bg-green-100 text-green-700 border-green-300"

// Warning
className="bg-amber-100 text-amber-700 border-amber-300"

// Critical/Error
className="bg-red-100 text-red-700 border-red-300"

// Info
className="bg-blue-100 text-blue-700 border-blue-300"

// Neutral/Inactive
className="bg-gray-100 text-gray-700 border-gray-300"
```

---

## Charts (Recharts)

### Line Chart
```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={250}>
  <LineChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
    <XAxis 
      dataKey="date" 
      stroke="#64748b" 
      style={{ fontSize: '12px' }} 
    />
    <YAxis 
      stroke="#64748b" 
      style={{ fontSize: '12px' }} 
    />
    <Tooltip 
      contentStyle={{ 
        backgroundColor: 'white', 
        border: '3px solid #cbd5e1',
        borderRadius: '12px',
        fontWeight: 'bold'
      }}
    />
    <Legend />
    <Line 
      type="monotone" 
      dataKey="value" 
      stroke="#14b8a6" 
      strokeWidth={3}
      name="Label"
      dot={{ r: 4 }}
    />
  </LineChart>
</ResponsiveContainer>
```

### Bar Chart
```jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={250}>
  <BarChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
    <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
    <Tooltip 
      contentStyle={{ 
        backgroundColor: 'white', 
        border: '3px solid #cbd5e1',
        borderRadius: '12px',
        fontWeight: 'bold'
      }}
    />
    <Bar dataKey="value" fill="#14b8a6" radius={[8, 8, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

### Radar Chart
```jsx
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <RadarChart data={radarData}>
    <PolarGrid stroke="#cbd5e1" />
    <PolarAngleAxis 
      dataKey="dimension" 
      style={{ fontSize: '12px', fontWeight: 'bold' }} 
    />
    <PolarRadiusAxis angle={90} domain={[0, 10]} />
    <Radar 
      name="Score" 
      dataKey="score" 
      stroke="#8b5cf6" 
      fill="#8b5cf6" 
      fillOpacity={0.6}
      strokeWidth={3}
    />
  </RadarChart>
</ResponsiveContainer>
```

---

## Data Fetching with React Query

### Basic Query
```jsx
const { data, isLoading, error } = useQuery({
  queryKey: ['resource-name', patientId],
  queryFn: async () => {
    const response = await axios.get(`${API_URL}/api/endpoint`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },
  refetchInterval: 30000,  // Optional: Refetch every 30s
  enabled: !!patientId      // Optional: Only run if condition met
});
```

### Loading State
```jsx
if (isLoading) {
  return (
    <PageTransition>
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-48 bg-gray-200 rounded-2xl" />
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
```

### Error State
```jsx
if (error || !data) {
  return (
    <PageTransition>
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="bg-white rounded-2xl p-12 text-center border-3 border-red-300">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-6">Unable to load information</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700"
          >
            Go Back
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
```

---

## Animation Delays

Stagger animations for visual polish:

```jsx
// First element: delay: 0.1
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
>

// Second element: delay: 0.2
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2 }}
>

// List items: increment by 0.05
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
  >
))}
```

---

## Common Icon Usage

Import from lucide-react:
```jsx
import { 
  Activity,      // Vitals, health metrics
  Pill,          // Medications
  AlertCircle,   // Symptoms, warnings
  FileText,      // Care plans, documents
  Calendar,      // Appointments
  Heart,         // Wellbeing, favorites
  Users,         // Care team, groups
  Plus,          // Add actions
  ChevronRight,  // Navigation arrows
  ArrowLeft,     // Back navigation
  CheckCircle,   // Success, completed
  Clock,         // Time, pending
  Thermometer,   // Temperature
  Droplets,      // Fluids, hydration
  Wind,          // Oxygen, breathing
  Brain,         // Mental health
  Smile,         // Emotional wellbeing
  Moon,          // Sleep
  Zap            // Energy, pain
} from 'lucide-react';
```

**Icon sizes:**
- Cards: `w-5 h-5` or `w-6 h-6`
- Page headers: `w-8 h-8`
- Empty states: `w-16 h-16`

**Stroke width:** Always use `strokeWidth={2.5}` for consistency

---

## Responsive Utilities

```jsx
// Responsive grid columns
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Responsive padding
className="px-4 md:px-8"

// Responsive text sizes
className="text-sm md:text-base lg:text-lg"

// Hide on mobile
className="hidden md:block"

// Show only on mobile
className="block md:hidden"
```

---

## Color Palette Quick Reference

### Primary Colors
- Teal: `teal-50, teal-100, teal-600, teal-700`
- Cyan: `cyan-600` (for gradients)

### Status Colors
- Green: `green-100, green-300, green-600, green-700`
- Amber: `amber-100, amber-300, amber-600, amber-700`
- Red: `red-100, red-300, red-600, red-700`
- Blue: `blue-100, blue-300, blue-600, blue-700`

### Neutral Colors
- Slate: `slate-50, slate-100, slate-200, slate-600, slate-700, slate-900`
- White: `white`

### Accent Colors
- Purple: `purple-100, purple-300, purple-600`
- Pink: `pink-100, pink-600`
- Indigo: `indigo-100, indigo-600`

---

## Testing Checklist

### Visual Testing
- [ ] 3px borders on all cards
- [ ] max-w-[1400px] container
- [ ] Correct stat card height (140px)
- [ ] Table rows minimum 56px
- [ ] Proper spacing (32px sections, 24px cards)

### Functionality Testing
- [ ] Navigation works (back button, breadcrumbs)
- [ ] Data loads correctly
- [ ] Loading states show
- [ ] Empty states display
- [ ] Error handling works
- [ ] Responsive on mobile/tablet/desktop

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader labels present
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Focus indicators visible

---

## Common Issues & Solutions

### Issue: Charts not rendering
**Solution:** Ensure data format matches chart expectations
```jsx
// Correct format
const chartData = [
  { date: 'Jan 1', value: 120 },
  { date: 'Jan 2', value: 125 }
];
```

### Issue: Images/icons not showing
**Solution:** Check import paths and icon names
```jsx
import { Activity } from 'lucide-react';  // Correct
import Activity from 'lucide-react';      // Wrong
```

### Issue: Animations stuttering
**Solution:** Use GPU-accelerated properties
```jsx
// Use transform properties
transform: translateY(-4px)  // Good
top: -4px                    // Bad
```

### Issue: Table horizontal scroll not working
**Solution:** Add overflow-x-auto to parent
```jsx
<div className="overflow-x-auto">
  <table className="w-full">
```

---

**Status:** Ready for development  
**Last Updated:** 2026-06-03  
**Version:** 1.0
