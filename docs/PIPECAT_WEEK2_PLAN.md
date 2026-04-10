# Pipecat Migration - Week 2 Plan

**Date:** 2026-04-10  
**Status:** Planning  
**Goal:** Frontend WebRTC Client Integration

---

## 🎯 Overview

Week 2 focuses on building the React frontend WebRTC client to connect to the Pipecat backend pipeline we built in Week 1.

**Current State:**
- ✅ Backend pipeline complete (WebRTC → VAD → STT → TTS → WebRTC)
- ✅ Pipecat service running on `/api/v1/pipecat/ws`
- ✅ 41 backend tests passing
- ⏳ Frontend WebRTC client needed

**Goal:**
- Build React component for WebRTC audio streaming
- Connect to backend WebSocket
- Handle audio capture and playback
- Provide UI controls (mute, volume, status)
- Test end-to-end voice conversation

---

## 📋 Week 2 Tasks (10 Days)

### Day 11-12: WebRTC Client Setup

**Goal:** Create basic WebRTC client component

**Tasks:**
1. Create `useWebRTCClient` hook
2. Implement WebSocket connection to backend
3. Handle connection lifecycle (connect, disconnect, reconnect)
4. Add connection status tracking
5. Write tests for connection logic

**Deliverables:**
- `hooks/use-webrtc-client.ts` - WebRTC client hook
- `components/voice/WebRTCClient.tsx` - Client component
- Tests for connection logic

**Success Criteria:**
- WebSocket connects to backend
- Connection status tracked
- Reconnection on disconnect
- Tests passing

---

### Day 13-14: Audio Capture

**Goal:** Capture audio from microphone and send to backend

**Tasks:**
1. Implement audio capture with MediaStream API
2. Convert audio to format expected by Pipecat (PCM)
3. Send audio frames via WebSocket
4. Handle microphone permissions
5. Add audio level visualization

**Deliverables:**
- Audio capture implementation in hook
- Audio format conversion
- Visual feedback for audio levels
- Permission handling

**Success Criteria:**
- Microphone audio captured
- Audio sent to backend
- Backend receives and processes audio
- Visual feedback working

---

### Day 15-16: Audio Playback

**Goal:** Receive audio from backend and play it

**Tasks:**
1. Receive audio frames from WebSocket
2. Convert audio format for playback
3. Implement audio playback with Web Audio API
4. Handle audio buffering
5. Add volume controls

**Deliverables:**
- Audio playback implementation
- Format conversion for playback
- Volume controls
- Buffer management

**Success Criteria:**
- Audio received from backend
- Audio plays in browser
- Volume controls work
- No audio glitches

---

### Day 17-18: UI Controls & Status

**Goal:** Add user interface controls and status indicators

**Tasks:**
1. Create voice control panel component
2. Add mute/unmute button
3. Add volume slider
4. Add connection status indicator
5. Add speaking indicator (VAD feedback)
6. Add error handling UI

**Deliverables:**
- `components/voice/VoiceControlPanel.tsx`
- Mute/unmute functionality
- Volume controls
- Status indicators
- Error messages

**Success Criteria:**
- All controls functional
- Status updates in real-time
- Errors displayed to user
- Accessible UI

---

### Day 19-20: End-to-End Testing

**Goal:** Test complete voice conversation flow

**Tasks:**
1. Test full conversation flow
2. Test error scenarios (disconnect, permission denied)
3. Test audio quality
4. Test latency
5. Fix bugs and optimize
6. Write integration tests

**Deliverables:**
- Integration tests
- Bug fixes
- Performance optimizations
- Documentation

**Success Criteria:**
- Full conversation works
- Audio quality good
- Latency acceptable (<2s)
- All tests passing

---

## 🏗️ Architecture

### Frontend Components

```
VoiceAssistant (main component)
├── useWebRTCClient (hook)
│   ├── WebSocket connection
│   ├── Audio capture
│   ├── Audio playback
│   └── Connection management
├── VoiceControlPanel
│   ├── Mute button
│   ├── Volume slider
│   └── Status indicators
└── VoiceVisualizer
    ├── Audio level meter
    └── Speaking indicator
```

### Data Flow

```
User speaks
    ↓
Microphone (MediaStream API)
    ↓
Audio Capture (PCM conversion)
    ↓
WebSocket (send to backend)
    ↓
Backend Pipecat Pipeline
    ↓
WebSocket (receive from backend)
    ↓
Audio Playback (Web Audio API)
    ↓
User hears response
```

### WebSocket Protocol

**Client → Server (Audio Input):**
```typescript
{
  type: "audio",
  data: ArrayBuffer, // PCM audio data
  timestamp: number,
}
```

**Server → Client (Audio Output):**
```typescript
{
  type: "audio",
  data: ArrayBuffer, // PCM audio data
  timestamp: number,
}
```

**Control Messages:**
```typescript
// Connection
{ type: "connect" }
{ type: "disconnect" }

// Status
{ type: "status", status: "connected" | "disconnected" | "error" }

// Errors
{ type: "error", message: string }
```

---

## 🔧 Technical Details

### Audio Format

**Capture:**
- Sample rate: 16kHz (matches backend)
- Channels: 1 (mono)
- Format: PCM 16-bit signed integers
- Frame size: 20ms chunks (320 samples)

**Playback:**
- Sample rate: 16kHz
- Channels: 1 (mono)
- Format: PCM 16-bit signed integers
- Buffering: 100ms buffer to prevent glitches

### WebSocket Connection

**URL:** `ws://localhost:8000/api/v1/pipecat/ws`

**Connection Options:**
```typescript
{
  reconnect: true,
  reconnectInterval: 1000,
  maxReconnectAttempts: 5,
}
```

### Browser Compatibility

**Required APIs:**
- MediaStream API (audio capture)
- Web Audio API (audio processing/playback)
- WebSocket API (communication)
- ArrayBuffer (binary data)

**Supported Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 📊 Success Metrics

### Technical Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Connection success rate | >95% | Track connect/disconnect events |
| Audio latency | <2s | Measure time from speech to response |
| Audio quality (MOS) | >4.0 | Subjective testing |
| Reconnection time | <3s | Measure reconnect duration |
| CPU usage | <10% | Browser performance profiler |
| Memory usage | <50MB | Browser memory profiler |

### User Experience Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Time to first response | <3s | User testing |
| Conversation success rate | >90% | User testing |
| Error recovery | <5s | User testing |
| UI responsiveness | <100ms | User testing |

---

## 🧪 Testing Strategy

### Unit Tests

**What to test:**
- WebSocket connection logic
- Audio format conversion
- Audio capture/playback
- Control state management
- Error handling

**Tools:**
- Vitest
- React Testing Library
- Mock WebSocket
- Mock MediaStream

### Integration Tests

**What to test:**
- Full conversation flow
- Error scenarios
- Reconnection logic
- Audio quality
- Latency

**Tools:**
- Playwright (E2E)
- Real backend connection
- Audio file playback

### Manual Testing

**What to test:**
- Audio quality (subjective)
- UI/UX
- Accessibility
- Cross-browser compatibility
- Mobile devices

---

## 🚀 Implementation Approach

### TDD Vertical Slicing (Same as Week 1)

**Day 11-12 Example:**
1. **RED**: Write failing test for WebSocket connection
2. **GREEN**: Implement minimal connection logic
3. **REFACTOR**: Extract config, add error handling

**Day 13-14 Example:**
1. **RED**: Write failing test for audio capture
2. **GREEN**: Implement basic audio capture
3. **REFACTOR**: Add format conversion, error handling

### Code Quality Standards

**Same as Week 1:**
- TypeScript strict mode
- ESLint + Prettier
- Comprehensive tests
- Clear documentation
- Accessibility compliance

---

## 📝 Files to Create

### Hooks (4 files)

1. `hooks/use-webrtc-client.ts` - Main WebRTC client hook
2. `hooks/use-audio-capture.ts` - Audio capture logic
3. `hooks/use-audio-playback.ts` - Audio playback logic
4. `hooks/use-connection-status.ts` - Connection status tracking

### Components (4 files)

1. `components/voice/WebRTCClient.tsx` - Main client component
2. `components/voice/VoiceControlPanel.tsx` - UI controls
3. `components/voice/VoiceVisualizer.tsx` - Audio visualization
4. `components/voice/VoiceStatus.tsx` - Status indicators

### Tests (8 files)

1. `hooks/__tests__/use-webrtc-client.test.ts`
2. `hooks/__tests__/use-audio-capture.test.ts`
3. `hooks/__tests__/use-audio-playback.test.ts`
4. `hooks/__tests__/use-connection-status.test.ts`
5. `components/voice/__tests__/WebRTCClient.test.tsx`
6. `components/voice/__tests__/VoiceControlPanel.test.tsx`
7. `components/voice/__tests__/VoiceVisualizer.test.tsx`
8. `components/voice/__tests__/VoiceStatus.test.tsx`

### Documentation (3 files)

1. `docs/PIPECAT_WEEK2_SUMMARY.md` - Week 2 summary
2. `docs/PIPECAT_DAY11_12_COMPLETE.md` - Day 11-12 completion
3. `docs/PIPECAT_DAY13_14_COMPLETE.md` - Day 13-14 completion
4. `docs/PIPECAT_DAY15_16_COMPLETE.md` - Day 15-16 completion
5. `docs/PIPECAT_DAY17_18_COMPLETE.md` - Day 17-18 completion
6. `docs/PIPECAT_DAY19_20_COMPLETE.md` - Day 19-20 completion

---

## 🎓 Key Considerations

### Audio Processing

**Challenge:** Browser audio APIs are complex
**Solution:** Use existing patterns from `use-voice-activity-detection.ts`

### WebSocket Reliability

**Challenge:** Connection can drop
**Solution:** Implement automatic reconnection with exponential backoff

### Audio Latency

**Challenge:** Network + processing latency
**Solution:** Optimize buffer sizes, use efficient encoding

### Browser Permissions

**Challenge:** Microphone permission required
**Solution:** Clear UI prompts, handle permission denied gracefully

### Cross-Browser Compatibility

**Challenge:** Different browsers have different APIs
**Solution:** Use feature detection, provide fallbacks

---

## 🔗 Integration with Existing Code

### Reuse Existing Components

**Already exists:**
- `components/voice/VoiceInterface.tsx` - Can be adapted
- `components/voice/VoiceRecorder.tsx` - Can be adapted
- `hooks/use-voice-activity-detection.ts` - Can be reused

**Strategy:**
- Review existing code
- Adapt for WebRTC instead of Web APIs
- Maintain consistent patterns

### Backend Integration

**Backend endpoint:** `/api/v1/pipecat/ws`

**Already implemented:**
- WebSocket transport
- Audio processing pipeline
- Error handling

**Frontend needs to:**
- Connect to WebSocket
- Send/receive audio frames
- Handle connection lifecycle

---

## 📅 Timeline

| Days | Task | Status |
|------|------|--------|
| 11-12 | WebRTC Client Setup | 🔄 Next |
| 13-14 | Audio Capture | ⏳ Pending |
| 15-16 | Audio Playback | ⏳ Pending |
| 17-18 | UI Controls & Status | ⏳ Pending |
| 19-20 | End-to-End Testing | ⏳ Pending |

**Total:** 10 days (2 weeks)

---

## 🎉 Week 2 Success Criteria

**Must Have:**
- ✅ WebSocket connection to backend
- ✅ Audio capture from microphone
- ✅ Audio playback from backend
- ✅ Basic UI controls (mute, volume)
- ✅ Connection status indicators
- ✅ End-to-end conversation working
- ✅ All tests passing

**Nice to Have:**
- Audio visualization
- Advanced error recovery
- Mobile optimization
- Accessibility enhancements

**Week 2 Complete When:**
- User can have full voice conversation
- Audio quality is good
- Latency is acceptable
- All tests passing
- Documentation complete

---

**Last Updated:** 2026-04-10  
**Next Update:** After Day 11-12 complete
