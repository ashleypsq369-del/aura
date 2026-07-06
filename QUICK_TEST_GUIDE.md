# 🚀 Quick Test Guide - ChatBot with Ollama

## ✅ Status: READY TO TEST!

Backend says:
```
✅ ChatBot: Using Ollama (qwen3.5:latest) - FREE & LOCAL!
```

---

## 🎯 3-Step Test

### 1. Open Browser
```
http://localhost:5174
```

### 2. Find ChatBot
- Look **bottom-right corner**
- Purple/blue **bot icon** 🤖
- Click it!

### 3. Ask a Question
Try any of these:
```
Hi! What's your name?
```
```
Tell me about palliative care
```
```
I'm feeling worried today
```

---

## ✅ What to Look For

1. **Header shows**: `🆓 Ollama` badge
2. **Response is**: Natural, conversational (not robotic)
3. **Speed**: 1-3 seconds
4. **Memory**: Remembers previous messages

---

## 🤔 Compare the Two Bots

### AIAssistant (Top-Right, Brain 🧠)
- Teal/cyan color
- Quick commands
- "Show me my patients"
- Navigation helper

### ChatBot (Bottom-Right, Bot 🤖)
- Purple/blue color
- Natural conversation
- "I'm feeling worried"
- AI companion

Make sure you're testing the **purple bot** in the bottom-right!

---

## ❌ If Something's Wrong

### Problem: Shows "Limited Mode" or "⚠️"
**Fix**: Refresh page (Ctrl + Shift + R)

### Problem: Fixed/robotic responses
**Fix**: 
1. Open browser DevTools (F12)
2. Go to Network tab
3. Send a message
4. Check URL says `/conversational-chatbot/chat`
5. NOT `/chatbot/chat`

### Problem: Very slow
**Wait**: First response loads model (may take 5-10 seconds)
**Next**: Should be fast (1-3 seconds)

---

## 📊 Backend Check (Optional)

Open in browser or terminal:
```
http://localhost:8000/api/conversational-chatbot/status
```

Should show:
```json
{
  "provider": "ollama",
  "model": "qwen3.5:latest",
  "available": true,
  "is_local": true
}
```

---

## 🎉 Success Looks Like

1. ✅ Chat window opens
2. ✅ Shows "🆓 Ollama" badge
3. ✅ Natural, helpful responses
4. ✅ Fast (1-3 seconds)
5. ✅ Remembers context
6. ✅ Uses your name sometimes
7. ✅ Shows compassion and empathy

---

## 📝 Report Back

Tell me:
- ✅ What works
- ❌ Any errors
- 💡 What you'd like to improve

---

**Ready? Open http://localhost:5174 and click the bot!** 🤖💙
