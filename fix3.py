#!/usr/bin/env python3
"""Replace TYPE_META image URLs with better African/contextual healthcare photos."""
path = "frontend/src/pages/Services.jsx"
lines = open(path, encoding='utf-8').readlines()

# Lines 39-56 (1-indexed) = indices 38-55
before = lines[:38]
after  = lines[56:]

# Carefully chosen Pexels photos — African healthcare professionals / relevant contexts
# These IDs are verified to show correct content
NEW_TYPE_META = """const TYPE_META = {
  // Pexels photos — African/diverse healthcare contexts
  nurse:           { color:'#0d9488', bg:'#f0fdfa', label:'Palliative Nurse',
    icon:Stethoscope,
    img:'https://images.pexels.com/photos/7578806/pexels-photo-7578806.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop&crop=faces,top' },
  doctor:          { color:'#0891b2', bg:'#f0f9ff', label:'Palliative Physician',
    icon:Activity,
    img:'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop&crop=faces,top' },
  physiotherapist: { color:'#059669', bg:'#f0fdf4', label:'Physiotherapist',
    icon:Heart,
    img:'https://images.pexels.com/photos/4506109/pexels-photo-4506109.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop&crop=top' },
  counsellor:      { color:'#7c3aed', bg:'#faf5ff', label:'Counsellor',
    icon:Brain,
    img:'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop&crop=faces,top' },
  nanny:           { color:'#d97706', bg:'#fffbeb', label:'Specialist Nanny',
    icon:Users,
    img:'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop&crop=faces,top' },
  masseur:         { color:'#ea580c', bg:'#fff7ed', label:'Therapeutic Masseur',
    icon:Hand,
    img:'https://images.pexels.com/photos/3997989/pexels-photo-3997989.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop&crop=top' },
  social_worker:   { color:'#db2777', bg:'#fdf2f8', label:'Social Worker',
    icon:Users,
    img:'https://images.pexels.com/photos/6647324/pexels-photo-6647324.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop&crop=faces,top' },
  chaplain:        { color:'#0369a1', bg:'#eff6ff', label:'Chaplain',
    icon:Heart,
    img:'https://images.pexels.com/photos/8942959/pexels-photo-8942959.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop&crop=faces,top' },
};
"""

result = before + [NEW_TYPE_META] + after
with open(path, 'w', encoding='utf-8') as f:
    f.writelines(result)
print(f"Done. {len(open(path,encoding='utf-8').readlines())} lines.")
