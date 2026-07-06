# 📎 How to Add File Uploads to Any Form (2 Lines of Code!)

## Quick Add - Use FormFileUpload Component

I've created a universal `FormFileUpload` component that can be added to **ANY** form with just 2 lines of code!

---

## Step 1: Import the Component

```jsx
import FormFileUpload from '../components/FormFileUpload';
```

## Step 2: Add to Your Form

```jsx
<FormFileUpload
  category="documents"  // or messages, legacy, memories, community, profiles
  label="Attach Files"
  description="Upload supporting documents"
/>
```

**That's it!** File upload is now working! 🎉

---

## Complete Examples

### Example 1: Assessment Form (e.g., ESAS, PHQ-9, etc.)

```jsx
import FormFileUpload from '../components/FormFileUpload';

export default function ESASForm() {
  return (
    <form onSubmit={handleSubmit}>
      {/* ...existing form fields... */}
      
      {/* Add file upload - JUST ONE COMPONENT! */}
      <FormFileUpload
        category="documents"
        relatedId={patientId}
        label="Supporting Documentation"
        description="Attach medical reports, charts, or photos"
        accept="image/*,.pdf,.doc,.docx"
      />
      
      <button type="submit">Submit Assessment</button>
    </form>
  );
}
```

### Example 2: Community Post

```jsx
<FormFileUpload
  category="community"
  label="Attach Image"
  description="Add an image to your post"
  accept="image/*"
  multiple={false}
  maxSizeMB={10}
/>
```

### Example 3: Profile Picture

```jsx
<FormFileUpload
  category="profiles"
  label="Profile Picture"
  description="Upload your profile picture"
  accept="image/*"
  multiple={false}
  maxSizeMB={5}
/>
```

### Example 4: Legacy Audio/Video Message

```jsx
<FormFileUpload
  category="legacy"
  label="Audio/Video Message"
  description="Record or upload a message for your loved ones"
  accept="audio/*,video/*"
  maxSizeMB={100}
/>
```

### Example 5: Memory Vault Photos

```jsx
<FormFileUpload
  category="memories"
  label="Photos & Videos"
  description="Upload cherished memories"
  accept="image/*,video/*"
/>
```

---

## All Available Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `category` | string | 'documents' | Upload category (documents, messages, legacy, memories, community, profiles) |
| `relatedId` | number | null | ID of related entity (patient, post, etc.) |
| `accept` | string | 'image/*,.pdf,.doc,.docx' | Accepted file types |
| `multiple` | boolean | true | Allow multiple files |
| `maxSizeMB` | number | 50 | Maximum file size in MB |
| `label` | string | 'Attach Files' | Button/section label |
| `description` | string | 'Upload supporting files' | Help text |
| `onFilesAttached` | function | null | Callback when files are attached |
| `className` | string | '' | Additional CSS classes |

---

## Categories & Use Cases

| Category | Best For | Accept Types | Max Size |
|----------|----------|--------------|----------|
| **documents** | Medical records, reports, assessments | images, pdfs, docs | 50MB |
| **messages** | Chat attachments | images, videos, pdfs, docs | 50MB |
| **legacy** | Audio/video messages for heirs | audio, video | 100MB |
| **memories** | Memory vault, journal | images, videos | 50MB |
| **community** | Community posts | images only | 10MB |
| **profiles** | Profile pictures, avatars | images only | 5MB |

---

## Features Included

✅ **Drag & Drop** - Users can drag files to upload  
✅ **File Previews** - Shows file names, sizes, types  
✅ **Progress Tracking** - Upload progress indicators  
✅ **Multi-file Support** - Upload multiple files at once  
✅ **File Management** - Remove files before submitting  
✅ **Validation** - File type and size validation  
✅ **Toast Notifications** - Success/error messages  
✅ **Responsive Design** - Works on all devices  
✅ **Icon Display** - Different icons for file types  
✅ **Collapsible UI** - Expands/collapses to save space  

---

## Pages That Need File Upload

### ✅ Already Added (1/24)
- [x] Messages

### 🔄 To Add (23/24)

#### Assessment Forms (10)
- [ ] ESAS Form
- [ ] PPS Form
- [ ] PHQ-9 Form
- [ ] GAD-7 Form
- [ ] Barthel Index
- [ ] Cognitive Assessment
- [ ] Brief Pain Inventory
- [ ] Quality of Life
- [ ] Caregiver Burden
- [ ] Motor Skills

#### Patient Records (4)
- [ ] Patient Detail
- [ ] Vitals Detail
- [ ] Symptoms Detail
- [ ] Medications Detail

#### Legacy & Memory (3)
- [ ] Legacy Content Creator
- [ ] Memory Vault
- [ ] Journal

#### Communication (3)
- [ ] Community Hub
- [ ] Care Plans
- [ ] Appointments

#### Profile & Admin (3)
- [ ] Profile
- [ ] Admin User Management
- [ ] Resources

---

## Quick Implementation Script

Want to add to ALL forms at once? Run this:

```bash
# Add imports to all assessment forms
cd frontend/src/pages

# For each form, add this import:
# import FormFileUpload from '../components/FormFileUpload';

# Then add the component in each form before the submit button
```

Or use the provided Python script:

```bash
python add_file_uploads.py
```

---

## Advanced: Handle Uploaded Files

If you need to do something with the uploaded files:

```jsx
<FormFileUpload
  category="documents"
  onFilesAttached={(files) => {
    console.log('Files attached:', files);
    // files is an array of file objects with:
    // { id, filename, original_filename, filepath, file_size, mime_type, url }
    
    // Do something with the files:
    setFormData(prev => ({
      ...prev,
      attachment_ids: files.map(f => f.id)
    }));
  }}
/>
```

---

## Backend Integration

The backend is already complete! Files are automatically:
- ✅ Uploaded to `backend/uploads/[category]/`
- ✅ Stored in database (FileAttachment table)
- ✅ Validated for type and size
- ✅ Protected with access control
- ✅ Organized by category

No backend changes needed - just add the component to your forms!

---

## Next Steps

1. **Add to 3 high-priority pages** (Assessment forms, Patient Records, Memory Vault)
2. **Test file upload** in each page
3. **Add to remaining pages** incrementally
4. **User training** on how to attach files

---

## Support

**Component Location:** `frontend/src/components/FormFileUpload.jsx`  
**Backend API:** Already complete (`backend/routers/uploads.py`)  
**Documentation:** `FILE_UPLOAD_SYSTEM.md`

**Questions?** Check the FileUpload and FormFileUpload component code for details.

---

**Adding file uploads is now as simple as importing one component!** 🚀

