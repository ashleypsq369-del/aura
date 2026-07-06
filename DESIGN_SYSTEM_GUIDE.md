# Project Aura Design System Guide 🎨

## Quick Reference for Developers

This guide provides quick copy-paste examples for applying the modern design system to new pages.

---

## 📐 Layout Structure

### Page Container
```jsx
<div className="min-h-screen p-6">
  <div className="max-w-7xl mx-auto">
    <Breadcrumbs />
    
    {/* Page content here */}
  </div>
</div>
```

---

## 🎯 Headers

### Modern Gradient Header
```jsx
<div className="mb-8 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-8 shadow-xl border-2 border-teal-400">
  <h1 className="text-4xl font-serif font-bold text-white flex items-center space-x-3 mb-2">
    <IconComponent className="w-10 h-10" />
    <span>Page Title</span>
  </h1>
  <p className="text-teal-50 text-lg">Page description goes here</p>
</div>
```

---

## 🃏 Cards

### Basic Modern Card
```jsx
<div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
  {/* Card content */}
</div>
```

### Stat Card with Gradient
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 shadow-lg border-2 border-blue-200 hover:shadow-xl hover:scale-105 transition-all duration-300"
>
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-semibold text-slate-600 mb-1">Stat Label</p>
      <p className="text-4xl font-bold text-slate-900">123</p>
    </div>
    <div className="p-3 rounded-xl bg-blue-500 bg-opacity-10">
      <IconComponent className="w-8 h-8 text-blue-600" />
    </div>
  </div>
</motion.div>
```

### Section Card with Header
```jsx
<div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200">
  {/* Header */}
  <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-white border-b-2 border-slate-200">
    <h2 className="text-2xl font-serif font-bold text-slate-900">Section Title</h2>
    <p className="text-slate-600 mt-1">Section description</p>
  </div>
  
  {/* Content */}
  <div className="p-6">
    {/* Content here */}
  </div>
</div>
```

---

## 📝 Form Inputs

### Text Input
```jsx
<div>
  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
    Field Label
  </label>
  <input
    type="text"
    className="w-full px-5 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium shadow-md"
    placeholder="Enter value..."
  />
</div>
```

### Input with Icon
```jsx
<div>
  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
    Field Label
  </label>
  <div className="relative">
    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
      <IconComponent size={18} />
    </span>
    <input
      type="text"
      className="w-full pl-12 pr-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium shadow-md"
      placeholder="Enter value..."
    />
  </div>
</div>
```

### Select Dropdown
```jsx
<select className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 font-bold shadow-md">
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</select>
```

### Textarea
```jsx
<textarea
  rows={4}
  className="w-full px-5 py-4 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none text-slate-900 placeholder-slate-400 shadow-md font-medium"
  placeholder="Enter your message..."
/>
```

---

## 🔘 Buttons

### Primary Button (Gradient)
```jsx
<button className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:shadow-xl transition-all font-bold shadow-lg border-2 border-teal-500">
  Button Text
</button>
```

### Primary Button with Icon
```jsx
<button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:shadow-xl transition-all font-bold shadow-lg border-2 border-teal-500">
  <IconComponent size={20} />
  <span>Button Text</span>
</button>
```

### Secondary Button
```jsx
<button className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-bold shadow-md">
  Cancel
</button>
```

### Icon Button
```jsx
<button className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-all border-2 border-transparent hover:border-blue-200 shadow-md">
  <IconComponent size={18} />
</button>
```

---

## 🏷️ Badges

### Status Badge
```jsx
<span className="inline-block px-4 py-2 rounded-full text-xs font-bold border-2 bg-blue-100 text-blue-700 border-blue-300">
  Active
</span>
```

### Role Badge (Color Variants)
```jsx
{/* Purple for Admin */}
<span className="px-4 py-2 rounded-full text-xs font-bold border-2 bg-purple-100 text-purple-700 border-purple-300">
  Admin
</span>

{/* Blue for Clinician */}
<span className="px-4 py-2 rounded-full text-xs font-bold border-2 bg-blue-100 text-blue-700 border-blue-300">
  Clinician
</span>

{/* Green for Caregiver */}
<span className="px-4 py-2 rounded-full text-xs font-bold border-2 bg-green-100 text-green-700 border-green-300">
  Caregiver
</span>
```

---

## 📊 Tables

### Modern Table
```jsx
<div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden">
  <table className="w-full">
    <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
      <tr>
        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
          Column 1
        </th>
        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
          Column 2
        </th>
      </tr>
    </thead>
    <tbody className="divide-y-2 divide-slate-100">
      <tr className="hover:bg-teal-50 transition-all duration-200 border-l-4 border-transparent hover:border-teal-500">
        <td className="px-6 py-4 font-bold text-slate-900">Data 1</td>
        <td className="px-6 py-4 text-slate-600">Data 2</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 🪟 Modals

### Modern Modal
```jsx
<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-slate-200"
  >
    {/* Header */}
    <div className="p-6 border-b-2 border-slate-200 flex items-center justify-between sticky top-0 bg-gradient-to-r from-slate-50 to-white z-10">
      <h2 className="text-3xl font-serif font-bold text-slate-900">Modal Title</h2>
      <button 
        onClick={onClose}
        className="p-2 hover:bg-slate-100 rounded-xl border-2 border-transparent hover:border-slate-300 transition-all"
      >
        <X size={22} />
      </button>
    </div>

    {/* Content */}
    <div className="p-6">
      {/* Modal content */}
    </div>

    {/* Footer */}
    <div className="flex justify-end space-x-3 p-6 border-t-2 border-slate-200">
      <button className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-bold shadow-md">
        Cancel
      </button>
      <button className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:shadow-xl transition-all font-bold shadow-lg border-2 border-teal-500">
        Confirm
      </button>
    </div>
  </motion.div>
</div>
```

---

## 🔍 Search Bars

### Large Search Bar
```jsx
<div className="relative max-w-2xl mx-auto">
  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
  <input
    type="text"
    placeholder="Search..."
    className="w-full pl-14 pr-6 py-4 border-2 border-slate-300 rounded-xl shadow-md focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-white text-slate-900 placeholder-slate-400 font-medium"
  />
</div>
```

---

## 🎛️ Filter Buttons (Pills)

### Pill Filter Buttons
```jsx
<div className="flex flex-wrap gap-3">
  {categories.map((category) => (
    <button
      key={category.value}
      onClick={() => setSelected(category.value)}
      className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all duration-200 border-2 shadow-md ${
        selected === category.value
          ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white border-teal-500 scale-105 shadow-lg'
          : 'bg-white text-slate-700 border-slate-300 hover:border-teal-400 hover:shadow-lg hover:scale-105'
      }`}
    >
      <IconComponent size={20} />
      <span>{category.label}</span>
    </button>
  ))}
</div>
```

---

## 📱 Empty States

### Modern Empty State
```jsx
<div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-16 text-center">
  <IconComponent className="w-20 h-20 text-slate-300 mx-auto mb-6" />
  <h3 className="text-2xl font-semibold text-slate-900 mb-3">No Items Found</h3>
  <p className="text-slate-600 text-lg">
    Description of empty state
  </p>
</div>
```

---

## 🎨 Color Reference

### Primary Gradient
```jsx
className="bg-gradient-to-r from-teal-500 to-cyan-600"
```

### Background Gradients
```jsx
// Blue
className="bg-gradient-to-br from-white to-blue-50"

// Green
className="bg-gradient-to-br from-white to-green-50"

// Purple
className="bg-gradient-to-br from-white to-purple-50"

// Red
className="bg-gradient-to-br from-white to-red-50"

// Amber
className="bg-gradient-to-br from-white to-amber-50"
```

### Text Colors
```jsx
// Primary text
className="text-slate-900"

// Secondary text
className="text-slate-600"

// Muted text
className="text-slate-500"
```

---

## 🎭 Animations

### Fade In + Slide Up
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* Content */}
</motion.div>
```

### Staggered List Animation
```jsx
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    {/* Item content */}
  </motion.div>
))}
```

---

## ⚡ Loading States

### Spinner
```jsx
<div className="flex items-center justify-center py-20">
  <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
</div>
```

### Button Loading
```jsx
<button 
  disabled={isLoading}
  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:shadow-xl transition-all disabled:opacity-50 flex items-center space-x-2 font-bold shadow-lg border-2 border-teal-500"
>
  {isLoading ? (
    <>
      <Loader2 size={18} className="animate-spin" />
      <span>Loading...</span>
    </>
  ) : (
    <span>Submit</span>
  )}
</button>
```

---

## 📐 Spacing Guidelines

### Standard Padding
- **Small cards:** `p-4` or `p-5`
- **Medium cards:** `p-6`
- **Large cards:** `p-8`

### Standard Gaps
- **Tight spacing:** `space-y-3` or `gap-3`
- **Normal spacing:** `space-y-6` or `gap-6`
- **Loose spacing:** `space-y-8` or `gap-8`

### Standard Margins
- **Section spacing:** `mb-6` or `mb-8`
- **Component spacing:** `mb-4` or `mb-5`

---

## 🎯 Common Patterns

### Page Header + Action Button
```jsx
<div className="flex items-center justify-between mb-8">
  <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-8 shadow-xl border-2 border-teal-400 flex-1 mr-4">
    <h1 className="text-4xl font-serif font-bold text-white flex items-center space-x-3 mb-2">
      <IconComponent className="w-10 h-10" />
      <span>Page Title</span>
    </h1>
    <p className="text-teal-50 text-lg">Description</p>
  </div>
  <button className="flex items-center space-x-2 px-6 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:shadow-xl transition-all font-bold shadow-lg border-2 border-teal-500 whitespace-nowrap">
    <Plus size={22} />
    <span>Create New</span>
  </button>
</div>
```

### Grid of Cards
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map((item) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
    >
      {/* Card content */}
    </motion.div>
  ))}
</div>
```

---

## 🔧 Tips & Best Practices

1. **Always use border-2** for clear visual separation
2. **Combine shadows with hover effects** for better feedback
3. **Use gradients sparingly** - headers, buttons, accents only
4. **Keep rounded corners consistent** - xl for small, 2xl for medium, 3xl for large
5. **Add transitions to everything** - `transition-all duration-300`
6. **Use font-bold for emphasis** - headers, labels, important text
7. **Stick to the color palette** - teal/cyan primary, slate neutrals
8. **Test responsiveness** - especially with grid layouts
9. **Add loading states** - users need feedback
10. **Maintain spacing consistency** - use standard p-6, gap-6 patterns

---

## 📚 Reference Files

- `Resources.jsx` - Best complete example
- `AdminUserManagement.jsx` - Table and modal patterns
- `Dashboard.jsx` - Stat card patterns
- `Profile.jsx` - Form patterns
- `ModernCard.jsx` - Reusable component

---

*Quick reference guide for maintaining consistent modern design across Project Aura*
