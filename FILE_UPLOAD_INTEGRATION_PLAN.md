# 📎 Complete File Upload Integration Plan

## Pages & Forms Requiring File Attachments

### 1. Communication & Messaging ✅
- [x] **Messages** - General file attachments (images, docs, PDFs)
- [ ] **Community Hub** - Image attachments for posts
- [ ] **Care Plans** - Document attachments (care instructions, medical orders)
- [ ] **Appointments** - Document uploads (appointment notes, prescriptions)

### 2. Patient Records & Documentation
- [ ] **Patient Detail** - Medical documents, test results, reports
- [ ] **Vitals Detail** - Supporting documents, charts
- [ ] **Symptoms Detail** - Photos of symptoms, medical reports
- [ ] **Medications Detail** - Prescription images, medication schedules

### 3. Assessment Forms (All 10)
- [ ] **ESAS Form** - Supporting documentation
- [ ] **PPS Form** - Assessment notes
- [ ] **PHQ-9 Form** - Clinical documentation
- [ ] **GAD-7 Form** - Assessment records
- [ ] **Barthel Index** - Supporting evidence
- [ ] **Cognitive Assessment** - Test materials
- [ ] **Brief Pain Inventory** - Pain charts, images
- [ ] **Quality of Life** - Supporting materials
- [ ] **Caregiver Burden** - Documentation
- [ ] **Motor Skills** - Assessment videos/photos

### 4. Legacy & Bereavement ✅
- [ ] **Legacy Content Creator** - Audio/video messages
- [ ] **Memory Vault** - Photos, videos, documents
- [ ] **Journal** - Attached memories, photos
- [ ] **Continuity Bridge** - Resources, documents

### 5. Admin & Profile
- [ ] **Profile** - Avatar/profile picture
- [ ] **Admin User Management** - User documents
- [ ] **Resources** - Resource file attachments

### 6. Support & Help
- [ ] **Contact Forms** - Supporting documentation
- [ ] **Feedback Forms** - Screenshots, evidence
- [ ] **Support Tickets** - Attachments

---

## Implementation Strategy

### Phase 1: Core Communication (Priority 1)
1. Messages ✅
2. Community Hub
3. Care Plans

### Phase 2: Patient Records (Priority 2)
4. Patient Detail
5. Vitals Detail
6. Symptoms Detail
7. Medications Detail

### Phase 3: Assessment Forms (Priority 3)
8-17. All 10 assessment forms

### Phase 4: Legacy & Memory (Priority 4)
18. Legacy Content Creator
19. Memory Vault
20. Journal

### Phase 5: Profile & Admin (Priority 5)
21. Profile
22. Admin pages

---

## Standard Implementation Pattern

```jsx
// 1. Import FileUpload component
import FileUpload from '../components/FileUpload';
import { Paperclip } from 'lucide-react';

// 2. Add state for file management
const [showFileUpload, setShowFileUpload] = useState(false);
const [attachedFiles, setAttachedFiles] = useState([]);

// 3. Add file upload UI in form
{showFileUpload && (
  <div className="mb-4 p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-sm font-bold text-slate-700">Attach Files</h4>
      <button onClick={() => setShowFileUpload(false)}>
        <X size={16} />
      </button>
    </div>
    <FileUpload
      category="[appropriate-category]"
      relatedId={[entity-id]}
      onUploadComplete={(files) => {
        setAttachedFiles(files);
        toast.success(`${files.length} file(s) attached`);
      }}
      accept="[file-types]"
      multiple={true}
      maxSizeMB={50}
    />
  </div>
)}

// 4. Add attachment button
<button onClick={() => setShowFileUpload(!showFileUpload)}>
  <Paperclip size={20} />
</button>
```

---

## File Categories by Page

| Page/Form | Category | Accept Types | Max Size |
|-----------|----------|--------------|----------|
| Messages | messages | images, videos, pdfs, docs | 50MB |
| Community | community | images only | 10MB |
| Care Plans | documents | pdfs, docs | 50MB |
| Legacy Content | legacy | audio, video | 100MB |
| Memory Vault | memories | images, videos | 50MB |
| Profile | profiles | images only | 5MB |
| Patient Records | documents | all types | 50MB |
| Assessments | documents | images, pdfs | 20MB |

---

## Next: Execute Full Integration

