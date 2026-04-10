# Voice Assistant Troubleshooting Guide 🔧

## Issue: Microphone works but nothing happens when speaking

### Debug Steps

1. **Open Browser Console** (F12 or Right-click → Inspect → Console)

2. **Look for these log messages:**

```
[AutoTranscription] Enabling voice...
[AutoTranscription] Microphone permission granted
[AutoTranscription] VAD started, listening for speech...
[VAD] Audio level: XX, Threshold: 30, Speaking: false
[VAD] Speech detected!
[AutoTranscription] Speech detected, starting recording
[AutoTranscription] Silence detected, stopping recording
[AutoTranscription] Recording complete, transcribing...
[AutoTranscription] Transcript: "your text here"
```

### Common Issues & Solutions

#### 1. No Audio Level Logs
**Problem:** You don't see `[VAD] Audio level: XX` messages  
**Cause:** Microphone not capturing audio  
**Solutions:**
- Check if correct microphone is selected in browser settings
- Check system microphone settings
- Try speaking louder
- Check if microphone is muted

#### 2. Audio Level Too Low
**Problem:** You see `[VAD] Audio level: 5` but threshold is 30  
**Cause:** Microphone volume too low or threshold too high  
**Solutions:**
- Speak louder
- Move closer to microphone
- Increase system microphone volume
- Lower the threshold (see below)

#### 3. Speech Not Detected
**Problem:** Audio level shows but no "Speech detected!" message  
**Cause:** Audio level below threshold  
**Solutions:**
- Lower the threshold in `VoiceToggle.tsx`:
```typescript
const voice = useAutoTranscription({
  onTranscript,
  threshold: 15, // Lower from 30 to 15
  silenceDuration: 1500,
});
```

#### 4. Recording Doesn't Start
**Problem:** "Speech detected!" but no "starting recording"  
**Cause:** Recording hook not connected properly  
**Check:** Browser console for errors

#### 5. Recording Doesn't Stop
**Problem:** Recording starts but never stops  
**Cause:** Silence not detected or timer not working  
**Solutions:**
- Wait longer (1.5 seconds of silence required)
- Check if background noise is keeping audio level high
- Lower silence duration:
```typescript
const voice = useAutoTranscription({
  onTranscript,
  threshold: 30,
  silenceDuration: 1000, // Lower from 1500ms to 1000ms
});
```

#### 6. Transcription Fails
**Problem:** Recording stops but no transcription appears  
**Cause:** Backend not running or API error  
**Check:**
- Backend is running: `http://localhost:8000/docs`
- Backend logs for errors
- Network tab in browser console for failed requests

---

## Quick Fixes

### Fix 1: Lower Threshold (Most Common)
Edit `SurfSense-main/frontend/components/voice/VoiceToggle.tsx`:

```typescript
const voice = useAutoTranscription({
  onTranscript,
  threshold: 15, // Change from 30 to 15
  silenceDuration: 1500,
});
```

### Fix 2: Shorter Silence Duration
Edit `SurfSense-main/frontend/components/voice/VoiceToggle.tsx`:

```typescript
const voice = useAutoTranscription({
  onTranscript,
  threshold: 30,
  silenceDuration: 1000, // Change from 1500 to 1000
});
```

### Fix 3: Test Microphone
Run this in browser console:

```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    function checkLevel() {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      console.log('Mic level:', Math.round(average));
      requestAnimationFrame(checkLevel);
    }
    
    checkLevel();
  });
```

Speak into your microphone and watch the console. You should see numbers increase when you speak.

---

## Testing Checklist

Run through these tests:

### Test 1: Permission
- [ ] Page loads
- [ ] Permission prompt appears
- [ ] Grant permission
- [ ] See "Voice enabled" toast

### Test 2: Audio Detection
- [ ] Open console (F12)
- [ ] Speak into microphone
- [ ] See `[VAD] Audio level: XX` messages
- [ ] Numbers increase when speaking

### Test 3: Speech Detection
- [ ] Speak clearly
- [ ] See `[VAD] Speech detected!` message
- [ ] Button pulses (visual feedback)

### Test 4: Recording
- [ ] Keep speaking
- [ ] See `[AutoTranscription] Speech detected, starting recording`
- [ ] Button turns red

### Test 5: Silence Detection
- [ ] Stop speaking
- [ ] Wait 1.5 seconds
- [ ] See `[AutoTranscription] Silence detected, stopping recording`

### Test 6: Transcription
- [ ] See `[AutoTranscription] Recording complete, transcribing...`
- [ ] See spinner on button
- [ ] See `[AutoTranscription] Transcript: "..."`
- [ ] Text appears in chat input

---

## Environment-Specific Issues

### Noisy Environment
If you're in a noisy environment:
- Increase threshold to 50-60
- Use headset with microphone
- Move to quieter location

### Quiet Environment
If you're in a very quiet environment:
- Decrease threshold to 10-15
- Speak normally (don't whisper)

### Laptop Built-in Mic
Built-in mics often have low volume:
- Decrease threshold to 15-20
- Speak closer to laptop
- Consider using external mic

---

## Backend Issues

### Check Backend is Running
```bash
curl http://localhost:8000/docs
```

Should return HTML (Swagger docs page).

### Check Voice Endpoint
```bash
# Create a test audio file first
curl -X POST http://localhost:8000/api/v1/voice/transcribe \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@test.webm"
```

### Check Backend Logs
Look for:
```
Processing audio with duration XX:XX.XX
VAD filter removed XX:XX.XX of audio
Transcription: "your text here"
```

---

## Browser Compatibility

### Chrome/Edge (Recommended)
✅ Full support for MediaRecorder + Web Audio API

### Firefox
✅ Full support

### Safari
⚠️ May have issues with WebM format
- Try using a different browser
- Or modify recording format to MP4

---

## Still Not Working?

### Collect Debug Info

1. **Browser Console Logs**
   - Copy all `[VAD]` and `[AutoTranscription]` messages

2. **Backend Logs**
   - Copy any errors from backend terminal

3. **Browser Info**
   - Browser name and version
   - Operating system

4. **Microphone Test**
   - Run the microphone test script above
   - Report the audio levels you see

### Report Issue

Include:
- What you see in console
- What you expect to happen
- Audio levels when speaking
- Browser and OS info

---

## Quick Test Script

Paste this in browser console to test everything:

```javascript
// Test 1: Check if APIs are available
console.log('MediaDevices:', !!navigator.mediaDevices);
console.log('getUserMedia:', !!navigator.mediaDevices?.getUserMedia);
console.log('AudioContext:', !!window.AudioContext);
console.log('MediaRecorder:', !!window.MediaRecorder);

// Test 2: Request microphone
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('✅ Microphone access granted');
    
    // Test 3: Check audio levels
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let count = 0;
    
    function checkLevel() {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      console.log(`Audio level: ${Math.round(average)} (speak now!)`);
      
      count++;
      if (count < 50) { // Check for 5 seconds
        setTimeout(checkLevel, 100);
      } else {
        console.log('✅ Test complete');
        stream.getTracks().forEach(track => track.stop());
      }
    }
    
    console.log('🎤 Speak into your microphone for 5 seconds...');
    checkLevel();
  })
  .catch(err => {
    console.error('❌ Microphone access denied:', err);
  });
```

Expected output:
```
MediaDevices: true
getUserMedia: true
AudioContext: true
MediaRecorder: true
✅ Microphone access granted
🎤 Speak into your microphone for 5 seconds...
Audio level: 5 (speak now!)
Audio level: 45 (speak now!)  ← When speaking
Audio level: 52 (speak now!)  ← When speaking
Audio level: 8 (speak now!)   ← When silent
...
✅ Test complete
```

If audio levels stay below 30 when speaking, lower the threshold!
