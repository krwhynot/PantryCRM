# Mobile-First Interaction Logging Workflow

## Overview

Optimized mobile interaction logging system designed for food service sales representatives who primarily work on tablets/phones while visiting restaurants, conducting tastings, and managing client relationships on-the-go.

---

## Core Requirements

### Business Requirements
- **Quick Logging**: 30-second interaction capture during/after meetings
- **Offline Capability**: Function without internet during restaurant visits
- **Voice-to-Text**: Hands-free note taking during driving between locations
- **Photo Integration**: Capture menu items, kitchen setups, tasting photos
- **Follow-up Scheduling**: Immediate next-action planning
- **GPS Integration**: Automatic location tagging for restaurant visits

### Technical Requirements
- **Touch Optimization**: 44px+ touch targets, gesture support
- **Performance**: <2 second load time on 3G networks
- **Battery Efficiency**: Minimal background processing
- **Offline Storage**: IndexedDB with sync capabilities
- **PWA Features**: App-like experience, installable, push notifications

---

## Architecture Components

### 1. Mobile-First UI Components

```typescript
// components/mobile/InteractionLogger.tsx
interface InteractionLoggerProps {
  organizationId?: string;
  contactId?: string;
  prefilledData?: Partial<InteractionData>;
  onComplete?: (interaction: InteractionData) => void;
  mode?: 'quick' | 'detailed' | 'voice';
}

interface InteractionData {
  id: string;
  organizationId: string;
  contactId?: string;
  type: InteractionType;
  date: Date;
  duration?: number;
  location?: GeoLocation;
  notes: string;
  outcome: InteractionOutcome;
  nextAction?: NextAction;
  photos?: PhotoAttachment[];
  voiceNotes?: VoiceAttachment[];
  products?: ProductMention[];
  followUpDate?: Date;
  mood?: CustomerMood; // Food service specific
  decisionMakers?: string[]; // Key people present
}

const InteractionLogger = ({ organizationId, mode = 'quick', onComplete }: InteractionLoggerProps) => {
  const [interaction, setInteraction] = useState<InteractionData>(createEmptyInteraction());
  const [isRecording, setIsRecording] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const { isOnline, queueOfflineAction } = useOfflineSync();
  
  // Auto-capture location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date()
          });
        },
        (error) => console.log('Location not available:', error),
        { timeout: 5000, enableHighAccuracy: false } // Battery optimization
      );
    }
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Log Interaction</h1>
          <div className="flex items-center space-x-2">
            <OnlineIndicator isOnline={isOnline} />
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Progress Indicator for Quick Mode */}
        {mode === 'quick' && (
          <div className="mt-2">
            <QuickModeProgress currentStep={getCurrentStep()} totalSteps={5} />
          </div>
        )}
      </div>
      
      {/* Quick Mode Interface */}
      {mode === 'quick' && (
        <QuickInteractionForm
          interaction={interaction}
          onChange={setInteraction}
          onPhotoCapture={handlePhotoCapture}
          onVoiceRecord={handleVoiceRecord}
          onComplete={handleComplete}
        />
      )}
      
      {/* Voice Mode Interface */}
      {mode === 'voice' && (
        <VoiceInteractionCapture
          onTranscription={handleVoiceTranscription}
          onComplete={handleComplete}
        />
      )}
      
      {/* Detailed Mode Interface */}
      {mode === 'detailed' && (
        <DetailedInteractionForm
          interaction={interaction}
          onChange={setInteraction}
          onComplete={handleComplete}
        />
      )}
      
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
        <FloatingActionButton
          icon={<Mic />}
          label="Voice Note"
          onClick={() => setIsRecording(!isRecording)}
          active={isRecording}
          color="blue"
        />
        
        <FloatingActionButton
          icon={<Camera />}
          label="Take Photo"
          onClick={handlePhotoCapture}
          color="green"
        />
        
        <FloatingActionButton
          icon={<MapPin />}
          label="Location"
          onClick={handleLocationCapture}
          color="purple"
          disabled={!location}
        />
      </div>
    </div>
  );
};
```

### 2. Quick Interaction Form

```typescript
// components/mobile/QuickInteractionForm.tsx
const QuickInteractionForm = ({ interaction, onChange, onComplete }: QuickFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { organizations } = useOrganizations();
  const { contacts } = useContacts(interaction.organizationId);
  
  const steps = [
    { id: 'organization', title: 'Who?', component: OrganizationSelector },
    { id: 'type', title: 'What?', component: InteractionTypeSelector },
    { id: 'outcome', title: 'How did it go?', component: OutcomeSelector },
    { id: 'notes', title: 'Quick notes?', component: QuickNotesInput },
    { id: 'follow-up', title: 'Next steps?', component: FollowUpPlanner }
  ];
  
  const currentStepData = steps[currentStep];
  const StepComponent = currentStepData.component;
  
  return (
    <div className="p-4">
      {/* Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-center">
          {currentStepData.title}
        </h2>
        
        <StepComponent
          value={interaction}
          onChange={onChange}
          organizations={organizations}
          contacts={contacts}
        />
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="min-h-[48px] px-6"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        
        {currentStep < steps.length - 1 ? (
          <Button
            size="lg"
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!isStepValid(currentStep, interaction)}
            className="min-h-[48px] px-6"
          >
            Next
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={() => onComplete(interaction)}
            className="min-h-[48px] px-6 bg-green-600 hover:bg-green-700"
          >
            <Check className="w-5 h-5 mr-2" />
            Complete
          </Button>
        )}
      </div>
    </div>
  );
};
```

### 3. Voice-to-Text Integration

```typescript
// components/mobile/VoiceInteractionCapture.tsx
const VoiceInteractionCapture = ({ onTranscription, onComplete }: VoiceProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const speechRecognition = useSpeechRecognition();
  
  const startRecording = async () => {
    try {
      if (speechRecognition) {
        speechRecognition.continuous = true;
        speechRecognition.interimResults = true;
        speechRecognition.lang = 'en-US';
        
        speechRecognition.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPart = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptPart;
            } else {
              interimTranscript += transcriptPart;
            }
          }
          
          setTranscript(finalTranscript + interimTranscript);
          setConfidence(event.results[0]?.[0]?.confidence || 0);
        };
        
        speechRecognition.start();
        setIsListening(true);
      }
    } catch (error) {
      console.error('Speech recognition error:', error);
    }
  };
  
  const stopRecording = () => {
    if (speechRecognition && isListening) {
      speechRecognition.stop();
      setIsListening(false);
    }
  };
  
  const enhanceTranscript = async (text: string) => {
    // Use AI to extract structured data from voice notes
    const enhanced = await extractInteractionData(text);
    onTranscription(enhanced);
  };
  
  return (
    <div className="p-4">
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        {/* Recording Indicator */}
        <div className="mb-6">
          <div className={cn(
            'w-24 h-24 rounded-full border-4 flex items-center justify-center mx-auto mb-4',
            isListening 
              ? 'border-red-500 bg-red-50 animate-pulse' 
              : 'border-gray-300 bg-gray-50'
          )}>
            <Mic className={cn(
              'w-12 h-12',
              isListening ? 'text-red-500' : 'text-gray-400'
            )} />
          </div>
          
          <p className="text-lg font-medium">
            {isListening ? 'Listening...' : 'Tap to start recording'}
          </p>
          
          {confidence > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Confidence: {Math.round(confidence * 100)}%
            </p>
          )}
        </div>
        
        {/* Transcript Display */}
        {transcript && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium mb-2">Transcript:</h3>
            <p className="text-gray-700">{transcript}</p>
          </div>
        )}
        
        {/* Controls */}
        <div className="flex justify-center space-x-4">
          {!isListening ? (
            <Button
              size="lg"
              onClick={startRecording}
              className="min-h-[48px] px-8"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={stopRecording}
              variant="destructive"
              className="min-h-[48px] px-8"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop Recording
            </Button>
          )}
        </div>
        
        {transcript && (
          <div className="mt-6 flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setTranscript('')}
            >
              Clear
            </Button>
            
            <Button
              onClick={() => enhanceTranscript(transcript)}
              className="bg-green-600 hover:bg-green-700"
            >
              Process & Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 4. Offline Synchronization

```typescript
// lib/mobile/offline-sync.ts
class OfflineInteractionManager {
  private db: IDBDatabase;
  private syncQueue: InteractionData[] = [];
  
  async initialize() {
    this.db = await this.openDatabase();
    await this.loadSyncQueue();
    this.startSyncWorker();
  }
  
  async saveInteraction(interaction: InteractionData): Promise<void> {
    try {
      // Try online save first
      if (navigator.onLine) {
        await this.saveToServer(interaction);
        await this.saveToLocal(interaction, 'synced');
      } else {
        // Save offline, queue for sync
        await this.saveToLocal(interaction, 'pending_sync');
        this.syncQueue.push(interaction);
        this.showOfflineNotification();
      }
    } catch (error) {
      // Failed to save online, fallback to offline
      await this.saveToLocal(interaction, 'pending_sync');
      this.syncQueue.push(interaction);
    }
  }
  
  async syncPendingInteractions(): Promise<SyncResult> {
    const results: SyncResult = {
      successful: [],
      failed: [],
      total: this.syncQueue.length
    };
    
    for (const interaction of this.syncQueue) {
      try {
        await this.saveToServer(interaction);
        await this.updateLocalStatus(interaction.id, 'synced');
        results.successful.push(interaction.id);
      } catch (error) {
        results.failed.push({
          id: interaction.id,
          error: error.message
        });
      }
    }
    
    // Remove successful syncs from queue
    this.syncQueue = this.syncQueue.filter(
      interaction => !results.successful.includes(interaction.id)
    );
    
    return results;
  }
  
  private async saveToLocal(interaction: InteractionData, status: SyncStatus): Promise<void> {
    const transaction = this.db.transaction(['interactions'], 'readwrite');
    const store = transaction.objectStore('interactions');
    
    await store.put({
      ...interaction,
      syncStatus: status,
      lastModified: new Date()
    });
  }
  
  private startSyncWorker(): void {
    // Sync when online
    window.addEventListener('online', () => {
      this.syncPendingInteractions();
    });
    
    // Periodic sync attempt
    setInterval(() => {
      if (navigator.onLine && this.syncQueue.length > 0) {
        this.syncPendingInteractions();
      }
    }, 30000); // Every 30 seconds
  }
}
```

### 5. Photo and Media Integration

```typescript
// components/mobile/PhotoCapture.tsx
const PhotoCapture = ({ onPhotoCapture, maxPhotos = 5 }: PhotoCaptureProps) => {
  const [photos, setPhotos] = useState<PhotoAttachment[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handlePhotoCapture = async (file: File) => {
    try {
      setIsCapturing(true);
      
      // Compress image for mobile optimization
      const compressedFile = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8
      });
      
      // Generate thumbnail
      const thumbnail = await generateThumbnail(compressedFile, 150, 150);
      
      // Create photo attachment
      const photoAttachment: PhotoAttachment = {
        id: generateId(),
        file: compressedFile,
        thumbnail,
        caption: '',
        timestamp: new Date(),
        location: await getCurrentLocation(),
        size: compressedFile.size,
        type: compressedFile.type
      };
      
      const newPhotos = [...photos, photoAttachment];
      setPhotos(newPhotos);
      onPhotoCapture(newPhotos);
      
    } catch (error) {
      console.error('Photo capture error:', error);
      showToast('Failed to capture photo', 'error');
    } finally {
      setIsCapturing(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Photo Grid */}
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <div key={photo.id} className="relative aspect-square">
            <img
              src={URL.createObjectURL(photo.thumbnail)}
              alt="Captured"
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              onClick={() => removePhoto(photo.id)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
        ))}
        
        {/* Add Photo Button */}
        {photos.length < maxPhotos && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isCapturing}
            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            {isCapturing ? (
              <Loader className="w-6 h-6 animate-spin text-gray-400" />
            ) : (
              <>
                <Camera className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Add Photo</span>
              </>
            )}
          </button>
        )}
      </div>
      
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment" // Use rear camera on mobile
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handlePhotoCapture(file);
        }}
        className="hidden"
      />
      
      {/* Photo Limit Indicator */}
      <p className="text-xs text-gray-500 text-center">
        {photos.length} of {maxPhotos} photos
      </p>
    </div>
  );
};
```

### 6. Quick Action Templates

```typescript
// components/mobile/QuickActionTemplates.tsx
const FOOD_SERVICE_TEMPLATES = [
  {
    id: 'tasting-demo',
    name: 'Product Tasting',
    icon: '🍽️',
    defaultData: {
      type: 'demo',
      duration: 30,
      outcome: 'positive',
      notes: 'Conducted product tasting of [PRODUCTS]. Chef was interested in [FEEDBACK].',
      nextAction: 'schedule_follow_up',
      followUpDays: 3
    }
  },
  {
    id: 'menu-review',
    name: 'Menu Planning',
    icon: '📋',
    defaultData: {
      type: 'consultation',
      duration: 45,
      notes: 'Reviewed menu items and discussed seasonal offerings. Recommended [PRODUCTS] for [SEASON].',
      nextAction: 'send_proposal',
      followUpDays: 5
    }
  },
  {
    id: 'delivery-check',
    name: 'Delivery Follow-up',
    icon: '🚚',
    defaultData: {
      type: 'follow_up',
      duration: 15,
      notes: 'Checked on recent delivery. Quality: [RATING]. Any issues: [ISSUES].',
      nextAction: 'routine_check',
      followUpDays: 14
    }
  }
];

const QuickActionTemplates = ({ onSelectTemplate }: TemplateProps) => {
  return (
    <div className="grid grid-cols-1 gap-3">
      {FOOD_SERVICE_TEMPLATES.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelectTemplate(template)}
          className="flex items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="text-2xl mr-3">{template.icon}</div>
          <div>
            <h3 className="font-medium">{template.name}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Quick template for {template.name.toLowerCase()}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
        </button>
      ))}
    </div>
  );
};
```

---

## PWA Configuration

### 1. Service Worker for Offline Support

```typescript
// public/sw.js
const CACHE_NAME = 'pantry-crm-v1';
const OFFLINE_URLS = [
  '/',
  '/mobile/interactions/new',
  '/mobile/interactions/list',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(OFFLINE_URLS))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method === 'POST' && event.request.url.includes('/api/interactions')) {
    // Handle offline interaction saves
    event.respondWith(handleOfflineInteraction(event.request));
  } else {
    // Handle regular requests
    event.respondWith(
      caches.match(event.request)
        .then((response) => response || fetch(event.request))
    );
  }
});

async function handleOfflineInteraction(request) {
  try {
    // Try online first
    return await fetch(request);
  } catch (error) {
    // Save to IndexedDB for later sync
    const data = await request.clone().json();
    await saveOfflineInteraction(data);
    
    return new Response(JSON.stringify({ 
      success: true, 
      offline: true 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

### 2. Web App Manifest

```json
// public/manifest.json
{
  "name": "Kitchen Pantry CRM",
  "short_name": "PantryCRM",
  "description": "Mobile CRM for food service sales",
  "start_url": "/mobile",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#3B82F6",
  "background_color": "#F9FAFB",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "shortcuts": [
    {
      "name": "Log Interaction",
      "short_name": "New Log",
      "description": "Quickly log a new interaction",
      "url": "/mobile/interactions/new?mode=quick",
      "icons": [{ "src": "/icons/shortcut-new.png", "sizes": "96x96" }]
    },
    {
      "name": "Voice Note",
      "short_name": "Voice",
      "description": "Record voice interaction",
      "url": "/mobile/interactions/new?mode=voice",
      "icons": [{ "src": "/icons/shortcut-voice.png", "sizes": "96x96" }]
    }
  ]
}
```

---

## Performance Optimizations

### 1. Mobile-Specific Optimizations

```typescript
// lib/mobile/performance.ts
class MobilePerformanceManager {
  // Lazy load images and media
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src!;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });
      
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }
  
  // Optimize for slow networks
  setupNetworkOptimization() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        // Reduce image quality
        document.body.classList.add('low-bandwidth');
        
        // Disable auto-sync
        this.disableAutoSync();
      }
    }
  }
  
  // Battery optimization
  setupBatteryOptimization() {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        if (battery.level < 0.2) {
          // Reduce background processing
          this.enablePowerSaveMode();
        }
      });
    }
  }
}
```

### 2. Data Compression

```typescript
// lib/mobile/compression.ts
export async function compressInteractionData(interaction: InteractionData): Promise<CompressedData> {
  // Compress text fields
  const compressedNotes = await compressText(interaction.notes);
  
  // Optimize photos
  const compressedPhotos = await Promise.all(
    interaction.photos?.map(photo => compressImage(photo, {
      maxWidth: 800,
      maxHeight: 600,
      quality: 0.7
    })) || []
  );
  
  return {
    ...interaction,
    notes: compressedNotes,
    photos: compressedPhotos,
    compressed: true,
    originalSize: calculateSize(interaction),
    compressedSize: calculateSize({ ...interaction, notes: compressedNotes, photos: compressedPhotos })
  };
}
```

This mobile-first interaction logging workflow provides a seamless, efficient experience for food service sales representatives working primarily on mobile devices, with robust offline capabilities and industry-specific optimizations.