# FRONTEND IMPLEMENTATION GUIDE
## Building the Missing 35% — Step-by-Step

This guide shows exactly how to build the 3 critical missing components to complete Project Aura.

---

## COMPONENT 1: Personalisation Questionnaire (2 hours)

### Location
`frontend/src/pages/PersonalisationQuest.jsx`

### When It Shows
- Automatically on first login if `user.role === "patient" || user.role === "family"`
- Check via: `GET /api/preferences/{user_id}` → if `questionnaire_complete === false`, show questionnaire
- Can be re-accessed from Settings

### Data Flow
1. User answers 7 steps
2. Each step updates local state
3. On completion, `POST /api/preferences` with full data object
4. Redirect to `/my-space` (patient portal)

### Step Structure
```javascript
const STEPS = [
  {
    id: 1,
    title: "Let's get to know you",
    subtitle: "This helps us make Project Aura feel like it was built just for you.",
    fields: [
      {
        name: "language_pref",
        label: "What language do you prefer?",
        type: "radio",
        options: ["English", "Twi", "Ga", "Ewe", "Hausa", "Dagbani"]
      },
      {
        name: "info_style",
        label: "How do you prefer to receive information?",
        type: "radio",
        options: [
          "Simple plain language",
          "Detailed medical information",
          "Visual diagrams and charts",
          "A mix of everything"
        ]
      },
      {
        name: "tech_comfort",
        label: "How comfortable are you with technology?",
        type: "radio",
        options: [
          "Very comfortable",
          "Somewhat comfortable",
          "I prefer simple screens",
          "I need step-by-step help"
        ]
      }
    ]
  },
  // Steps 2-7 follow same pattern
];
```

### Implementation Pattern
```jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';

export default function PersonalisationQuest() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();

  const savePreferences = useMutation({
    mutationFn: (data) => api.post('/api/preferences', data),
    onSuccess: () => {
      navigate('/my-space');
    }
  });

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - submit
      savePreferences.mutate({
        ...formData,
        questionnaire_complete: true
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const updateField = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  return (
    <div className="min-h-screen bg-aura-bg flex items-center justify-center p-4">
      <motion.div
        className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep} of 7</span>
            <span>{Math.round((currentStep / 7) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-aura-forest h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 7) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <StepContent
            key={currentStep}
            step={STEPS[currentStep - 1]}
            formData={formData}
            updateField={updateField}
          />
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="ml-auto px-8 py-2 bg-aura-forest text-white rounded-lg hover:bg-aura-forest-dark"
          >
            {currentStep === 7 ? 'Complete' : 'Next'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function StepContent({ step, formData, updateField }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="py-6"
    >
      <h2 className="font-serif text-3xl text-gray-900 mb-2">{step.title}</h2>
      <p className="text-gray-600 mb-8">{step.subtitle}</p>

      <div className="space-y-6">
        {step.fields.map(field => (
          <FieldRenderer
            key={field.name}
            field={field}
            value={formData[field.name]}
            onChange={(val) => updateField(field.name, val)}
          />
        ))}
      </div>
    </motion.div>
  );
}
```

### API Endpoint
```javascript
// POST /api/preferences
{
  "language_pref": "en",
  "info_style": "simple",
  "tech_comfort": "medium",
  "diagnosis_duration": "3-12 months",
  "emotional_states": ["scared", "hopeful"],
  "care_priorities": ["pain_control", "family_time"],
  // ... all other fields from 7 steps
  "topic_interests": ["pain_management", "sleep", "mental_health"],
  "wants_community": true,
  "questionnaire_complete": true
}
```

---

## COMPONENT 2: Adaptive Patient Portal (1.5 hours)

### Location
`frontend/src/pages/PatientPortal.jsx`

### Route
`/my-space` (patient-only route)

### Data Source
`GET /api/portal/{patient_id}` returns:
```javascript
{
  "patient": {
    "name": "Kofi",
    "condition_category": "cancer",
    "care_pathway": "palliative_care_standard",
    "risk_level": "Moderate"
  },
  "preferences": {
    "language": "en",
    "info_style": "simple",
    "topic_interests": ["pain_management", "sleep", "mental_health"],
    "wants_community": true
  },
  "journey_phase": {
    "phase": 3,
    "name": "Living with Illness",
    "description": "...",
    "what_next": "...",
    "support_available": [...]
  },
  "care_team": {
    "clinician": {"name": "Dr. Mensah", "role": "Clinician"},
    "next_appointment": {"date": "2026-06-10T10:00:00", "type": "Review"}
  },
  "today_focus": {
    "title": "Managing Pain Today",
    "content": "...",
    "action": "Log Pain",
    "action_link": "/wellness-checkin"
  },
  "recommended_resources": [...],
  "community_groups": [...],
  "journey_events": [...]
}
```

### Implementation
```jsx
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../services/api';

export default function PatientPortal() {
  const { data: portalData, isLoading } = useQuery({
    queryKey: ['patient-portal'],
    queryFn: () => api.get('/api/portal/1') // Replace with actual patient ID
  });

  if (isLoading) return <LoadingSkeleton />;

  const { patient, journey_phase, today_focus, care_team, recommended_resources } = portalData;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-serif text-4xl text-gray-900">
          Good {getTimeOfDay()}, {patient.name}
        </h1>
        <p className="text-gray-600 mt-2">{new Date().toLocaleDateString()}</p>
      </motion.div>

      {/* Journey Phase Card */}
      <Card title="Your Journey">
        <JourneyPhaseIndicator phase={journey_phase} />
      </Card>

      {/* Today's Focus */}
      <Card title="Today's Focus">
        <div className="prose">
          <h3>{today_focus.title}</h3>
          <p>{today_focus.content}</p>
          <button className="btn-primary">{today_focus.action}</button>
        </div>
      </Card>

      {/* Care Team */}
      <Card title="Your Care Team">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-aura-forest text-white rounded-full flex items-center justify-center font-bold">
            {care_team.clinician.name[0]}
          </div>
          <div>
            <div className="font-semibold">{care_team.clinician.name}</div>
            <div className="text-sm text-gray-600">{care_team.clinician.role}</div>
          </div>
        </div>
        {care_team.next_appointment && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium">Next Visit</div>
            <div>{new Date(care_team.next_appointment.date).toLocaleDateString()}</div>
            <div className="text-sm text-gray-600">{care_team.next_appointment.type}</div>
          </div>
        )}
      </Card>

      {/* Recommended Resources */}
      <Card title="For You Today">
        <div className="grid gap-4">
          {recommended_resources.map(resource => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md p-6"
    >
      <h2 className="font-serif text-2xl mb-4">{title}</h2>
      {children}
    </motion.div>
  );
}
```

---

## COMPONENT 3: Critical Alert Modal (1 hour)

### Location
`frontend/src/components/CriticalAlertModal.jsx`

### Trigger
- When vitals or symptoms are logged and risk > 0.78
- Or when polling `/api/alerts` returns new crisis alerts
- Shows immediately, cannot be dismissed by clicking outside

### Data Structure
```javascript
{
  "patient_name": "Kofi Mensah",
  "risk_level": "Crisis",
  "risk_score": 0.85,
  "top_shap_features": [
    {"feature": "Pain Level", "value": 9, "impact": 0.12},
    {"feature": "Oxygen Saturation", "value": 88, "impact": 0.10},
    {"feature": "Days Since Admission", "value": 45, "impact": 0.08}
  ],
  "explanation": "This patient shows signs of severe deterioration requiring immediate intervention."
}
```

### Implementation
```jsx
import { Dialog } from '@headlessui/react';
import { motion } from 'framer-motion';

export default function CriticalAlertModal({ alert, onAction, onClose }) {
  if (!alert) return null;

  return (
    <Dialog
      open={true}
      onClose={() => {}} // Cannot close by clicking outside
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          as={motion.div}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
          style={{
            borderTop: '4px solid #DC2626',
            animation: 'crisis-glow 2s infinite'
          }}
        >
          {/* Header */}
          <div className="bg-red-50 p-6 border-b border-red-100">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl">⚠️</span>
              </div>
              <div>
                <Dialog.Title className="text-2xl font-bold text-red-900">
                  CRITICAL RISK DETECTED
                </Dialog.Title>
                <p className="text-red-700 font-semibold">{alert.patient_name}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Risk Score */}
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <span className="font-semibold text-gray-900">Risk Score</span>
              <span className="text-3xl font-bold text-red-600">
                {Math.round(alert.risk_score * 100)}%
              </span>
            </div>

            {/* Top Drivers */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Top Risk Drivers:</h3>
              <div className="space-y-2">
                {alert.top_shap_features.map((feature, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{feature.feature}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-600">{feature.value}</span>
                      <span className="text-red-600 font-semibold">+{Math.round(feature.impact * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-gray-800">{alert.explanation}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 bg-gray-50 border-t flex justify-end space-x-3">
            <button
              onClick={() => onAction('urgent')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
            >
              Assign to Urgent Review
            </button>
            <button
              onClick={() => onAction('contact')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Contact Family Now
            </button>
            <button
              onClick={() => onAction('escalate')}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700"
            >
              Escalate to Senior
            </button>
          </div>
        </Dialog.Panel>
      </div>

      <style jsx>{`
        @keyframes crisis-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.3); }
          50% { box-shadow: 0 0 0 16px rgba(220, 38, 38, 0); }
        }
      `}</style>
    </Dialog>
  );
}
```

---

## ADDITIONAL UI ENHANCEMENTS

### Breadcrumbs Component (30 min)
```jsx
// frontend/src/components/Breadcrumbs.jsx
import { Link, useLocation } from 'react-router-dom';

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      <Link to="/" className="hover:text-aura-forest">Home</Link>
      {pathnames.map((name, idx) => {
        const path = `/${pathnames.slice(0, idx + 1).join('/')}`;
        const isLast = idx === pathnames.length - 1;
        return (
          <div key={path} className="flex items-center space-x-2">
            <span>/</span>
            {isLast ? (
              <span className="text-gray-900 font-medium">
                {name.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())}
              </span>
            ) : (
              <Link to={path} className="hover:text-aura-forest">
                {name.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
```

### Loading Skeleton (30 min)
```jsx
// frontend/src/components/LoadingSkeleton.jsx
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="animate-pulse space-y-4">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex space-x-4">
          <div className="h-12 bg-gray-200 rounded flex-1" />
          <div className="h-12 bg-gray-200 rounded w-32" />
          <div className="h-12 bg-gray-200 rounded w-24" />
        </div>
      ))}
    </div>
  );
}
```

### Empty State (20 min)
```jsx
// frontend/src/components/EmptyState.jsx
export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      {action && (
        <button className="btn-primary">{action.label}</button>
      )}
    </div>
  );
}

// Usage:
<EmptyState
  icon="📚"
  title="No resources yet"
  description="Browse our library to find helpful articles and guides"
  action={{ label: "Browse Resources", onClick: () => navigate('/resources') }}
/>
```

---

## INTEGRATION CHECKLIST

### Before Building
- [ ] Backend running on `http://localhost:8000`
- [ ] Frontend running on `http://localhost:5173`
- [ ] Database seeded with test data
- [ ] API routes tested in Postman/Thunder Client

### During Building
- [ ] Check browser console for errors
- [ ] Test API calls with Network tab
- [ ] Verify data structure matches backend response
- [ ] Test both success and error states

### After Building
- [ ] Test complete flow: register → login → questionnaire → portal
- [ ] Test on mobile viewport
- [ ] Check accessibility (keyboard navigation, screen reader)
- [ ] Verify all links work
- [ ] Test error handling (network failure, validation errors)

---

## API ENDPOINTS REFERENCE

```
POST   /api/preferences             Save questionnaire
GET    /api/preferences/{user_id}   Get questionnaire data
GET    /api/portal/{patient_id}     Get adaptive portal data
GET    /api/resources               List resources (filtered)
GET    /api/resources/recommended/{user_id}  Personalized resources
POST   /api/community/groups/{id}/join     Join group
GET    /api/community/groups/{id}/posts    Get posts
POST   /api/community/posts                Create post
POST   /api/community/posts/{id}/react     React to post
GET    /api/alerts                         Get pending alerts
```

---

**Estimated Total Time: 4-5 hours to build all 3 components + enhancements**

Good luck! The backend is ready and waiting. 🚀
