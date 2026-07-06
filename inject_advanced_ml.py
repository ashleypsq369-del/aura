"""
inject_advanced_ml.py
Injects drug interaction panel into Medications.jsx
and burnout panel into Caregivers.jsx
"""
import sys

# ── Medications.jsx: add drug interaction query + panel ──────────────────
med_file = 'frontend/src/components/../pages/Medications.jsx'
with open(med_file, 'r', encoding='utf-8') as f:
    med = f.read()

# Add drug interactions query after medications query (after enabled: !!selectedPatientId)
INTERACTIONS_QUERY = """
  // Drug interaction screening (P9)
  const { data: drugInteractions } = useQuery({
    queryKey: ['drug-interactions', selectedPatientId],
    queryFn: () => advancedMlAPI.getDrugInteractions(selectedPatientId).then(r => r.data),
    enabled: !!selectedPatientId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
"""

# Insert after the medications query block
INSERT_AFTER = "    enabled: !!selectedPatientId,\n  });\n\n  // Auto-select first patient"
INSERT_AFTER_ALT = "    enabled: !!selectedPatientId,\n  });\n\n  const [showModal"

if INTERACTIONS_QUERY.strip()[:30] not in med:
    for target in [INSERT_AFTER, INSERT_AFTER_ALT]:
        if target in med:
            med = med.replace(target, target + INTERACTIONS_QUERY, 1)
            print("Added drug interactions query to Medications.jsx")
            break
    else:
        print("Could not find insertion point for drug interactions query")

# Add the panel before the closing of the selectedPatientId conditional block
DRUG_PANEL = """
          {/* Drug Interaction Panel (P9) */}
          {drugInteractions && drugInteractions.interaction_count > 0 && (
            <div className={`rounded-xl border overflow-hidden ${
              drugInteractions.severe_count > 0
                ? 'border-red-300 bg-red-50'
                : 'border-amber-300 bg-amber-50'
            }`}>
              <div className="px-4 py-3 flex items-center gap-2">
                <AlertTriangle size={15} className={drugInteractions.severe_count > 0 ? 'text-red-600' : 'text-amber-600'} />
                <p className="text-sm font-bold" style={{color: drugInteractions.severe_count > 0 ? '#991b1b' : '#92400e'}}>
                  {drugInteractions.severe_count > 0
                    ? `${drugInteractions.severe_count} SEVERE drug interaction${drugInteractions.severe_count>1?'s':''} detected`
                    : `${drugInteractions.interaction_count} drug interaction${drugInteractions.interaction_count>1?'s':''} — review recommended`}
                </p>
              </div>
              <div className="px-4 pb-3 space-y-2">
                {(drugInteractions.interactions || []).slice(0, 4).map((ix, i) => (
                  <div key={i} className="bg-white rounded-lg border border-slate-200 p-2.5">
                    <p className="text-xs font-bold text-slate-800">
                      {ix.drug_a}{ix.drug_b ? ` + ${ix.drug_b}` : ''}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">{ix.effect}</p>
                    <p className={`text-[10px] font-bold mt-1 ${
                      ix.severity === 'SEVERE' ? 'text-red-600' : 'text-amber-600'
                    }`}>{ix.severity} -- {ix.action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
"""

# Find the Add / Edit Medication Modal section to insert before it
BEFORE_MODAL = "      {/* Add / Edit Medication Modal"
if BEFORE_MODAL in med and DRUG_PANEL.strip()[:35] not in med:
    med = med.replace(BEFORE_MODAL, DRUG_PANEL + "      {/* Add / Edit Medication Modal", 1)
    print("Added drug interaction panel to Medications.jsx")

# Add AlertTriangle import if missing
if 'AlertTriangle' not in med:
    med = med.replace(
        "import { Pill, Plus, Edit, Trash2, Bell, Search } from 'lucide-react';",
        "import { Pill, Plus, Edit, Trash2, Bell, Search, AlertTriangle } from 'lucide-react';"
    )

with open(med_file, 'w', encoding='utf-8', newline='\n') as f:
    f.write(med)


# ── Caregivers.jsx: add burnout overview ────────────────────────────────
cg_file = 'frontend/src/pages/Caregivers.jsx'
with open(cg_file, 'r', encoding='utf-8') as f:
    cg = f.read()

# Add import for advancedMlAPI
if 'advancedMlAPI' not in cg:
    cg = cg.replace(
        "import apiClient, { caregiversAPI } from '../api/client';",
        "import apiClient, { caregiversAPI, advancedMlAPI } from '../api/client';"
    )
    print("Added advancedMlAPI import to Caregivers.jsx")

# Add burnout query after existing queries
BURNOUT_QUERY = """
  // P10: Caregiver burnout overview
  const { data: burnoutData } = useQuery({
    queryKey: ['caregiver-burnout-overview'],
    queryFn: () => advancedMlAPI.getAllCaregiverBurnout().then(r => r.data),
    enabled: isStaffView,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
"""

if 'burnout-overview' not in cg:
    # Insert before the isStaffView declaration
    target = "\n  const isStaffView = user?.role !== 'caregiver';"
    if target in cg:
        cg = cg.replace(target, BURNOUT_QUERY + target, 1)
        print("Added burnout query to Caregivers.jsx")

# Add burnout badges to caregiver cards
BURNOUT_BADGE = """
                  {burnoutData?.caregivers && (() => {
                    const cBurnout = burnoutData.caregivers.find(b => b.user_id === caregiver.id);
                    if (!cBurnout || cBurnout.burnout_level === 'low') return null;
                    const color = cBurnout.burnout_level === 'critical' ? '#e11d48' : cBurnout.burnout_level === 'high' ? '#f97316' : '#d97706';
                    return (
                      <span key="burnout" className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white ml-1" style={{backgroundColor: color}}>
                        BURNOUT {cBurnout.burnout_level.toUpperCase()}
                      </span>
                    );
                  })()}"""

# Insert after the role badge
AFTER_ROLE_BADGE = "                        {caregiver.specialization && (\n                          <span className=\"text-[11px] text-slate-400 truncate\">{caregiver.specialization}</span>\n                        )}"
if AFTER_ROLE_BADGE in cg and 'burnout_level' not in cg:
    cg = cg.replace(AFTER_ROLE_BADGE, AFTER_ROLE_BADGE + BURNOUT_BADGE, 1)
    print("Added burnout badge to caregiver cards")

with open(cg_file, 'w', encoding='utf-8', newline='\n') as f:
    f.write(cg)

print("Done - all P9/P10 UI injections complete")
