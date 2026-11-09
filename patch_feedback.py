"""Patch FeedbackWidget: replace standalone email inputs with NameEmailFields in UX and Bug forms."""
path = "frontend/src/components/FeedbackWidget.jsx"
with open(path, encoding="utf-8") as f:
    src = f.read()

# UX form: replace email input before ux submit button
old1 = (
    "                  <input value={email} onChange={e => setEmail(e.target.value)}\n"
    "                    placeholder=\"Email (optional)\" style={inp} />\n"
    "                  <button onClick={() => submitMut.mutate(payload('ux_feedback', { what_works:uxGood, what_doesnt:uxBad }))}"
)
new1 = (
    "                  {NameEmailFields}\n"
    "                  <button onClick={() => submitMut.mutate(payload('ux_feedback', { what_works:uxGood, what_doesnt:uxBad }))}"
)

# Bug form: replace email input before bug submit button
old2 = (
    "                  <input value={email} onChange={e => setEmail(e.target.value)}\n"
    "                    placeholder=\"Email for updates (optional)\" style={inp} />\n"
    "                  <button onClick={() => submitMut.mutate(payload('bug_report', { bug_type:bugType, description:bugDesc }))}"
)
new2 = (
    "                  {NameEmailFields}\n"
    "                  <button onClick={() => submitMut.mutate(payload('bug_report', { bug_type:bugType, description:bugDesc }))}"
)

src = src.replace(old1, new1, 1)
src = src.replace(old2, new2, 1)

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

print("UX field replaced:", "{NameEmailFields}" in src and "ux_feedback" in src)
print("Bug field replaced:", "{NameEmailFields}" in src and "bug_report" in src)
print("Done.")
