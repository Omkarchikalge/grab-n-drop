import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive,
  Upload,
  Check,
  Send,
  Hand,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import FloatingFileCard from '@/components/3d/FloatingFileCard';

interface FileItem {
  id: string;
  name: string;
  size: string;
  type: 'document' | 'image' | 'video' | 'audio' | 'archive';
  status: 'idle' | 'selected' | 'transferring' | 'completed';
  progress: number;
}
const WS_SERVER_URL = "ws://10.73.235.70:3000";
const roomId = "demo-room";
const role = window.location.hash === "#sender" ? "sender" : "receiver";

const mockFiles: FileItem[] = [
  { id: '1', name: 'project-proposal.pdf', size: '2.4 MB', type: 'document', status: 'idle', progress: 0 },
  { id: '2', name: 'vacation-photo.jpg', size: '4.1 MB', type: 'image', status: 'idle', progress: 0 },
  { id: '3', name: 'presentation.mp4', size: '128 MB', type: 'video', status: 'idle', progress: 0 },
  { id: '4', name: 'podcast-episode.mp3', size: '45 MB', type: 'audio', status: 'idle', progress: 0 },
  { id: '5', name: 'source-code.zip', size: '12.8 MB', type: 'archive', status: 'idle', progress: 0 },
];

const fileIcons = {
  document: FileText,
  image: Image,
  video: Video,
  audio: Music,
  archive: Archive,
};

const fileColors = {
  document: 'text-primary',
  image: 'text-success',
  video: 'text-secondary',
  audio: 'text-warning',
  archive: 'text-accent',
};

export default function TransferPage() {
  const [files, setFiles] = useState<FileItem[]>(mockFiles);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [gestureState, setGestureState] = useState<'open' | 'grab' | 'push' | 'release'>('open');
  
  const socketRef = useRef<WebSocket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  
  // ⭐ USE REFS FOR GESTURE STATE - Avoids async state issues
  const realFileRef = useRef<File | null>(null);
  const isHoldingRef = useRef<boolean>(false);
  
  // File receiver state
  const receivedChunksRef = useRef<ArrayBuffer[]>([]);
  const fileMetadataRef = useRef<any>(null);

  // ================= WEBRTC INITIALIZATION =================
  const initWebRTC = async () => {
    console.log(`🔧 Initializing WebRTC as ${role}`);
    
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    
    peerRef.current = pc;

    // ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.send(JSON.stringify({
          type: 'ice-candidate',
          roomId: roomId,
          payload: event.candidate
        }));
      }
    };

    // SENDER: Create data channel
    if (role === "sender") {
      const channel = pc.createDataChannel('fileTransfer');
      setupDataChannel(channel);
    } 
    // RECEIVER: Wait for data channel
    else {
      pc.ondatachannel = (event) => {
        console.log('📡 DataChannel received');
        setupDataChannel(event.channel);
      };
    }

    return pc;
  };

  // ================= DATACHANNEL SETUP =================
  const setupDataChannel = (channel: RTCDataChannel) => {
    channel.binaryType = 'arraybuffer';
    channelRef.current = channel;
    
    channel.onopen = () => {
      console.log('✅✅✅ DataChannel OPEN - READY TO TRANSFER ✅✅✅');
      console.log('👉 You can now do GRAB and DROP gestures');
    };

    channel.onmessage = (event) => {
      handleIncomingData(event.data);
    };

    channel.onerror = (error) => {
      console.error('❌ DataChannel error:', error);
    };

    channel.onclose = () => {
      console.log('🔌 DataChannel closed');
    };
  };

  // ================= INCOMING DATA HANDLER =================
  const handleIncomingData = (data: any) => {
    if (typeof data === 'string') {
      const message = JSON.parse(data);
      
      if (message.type === 'file-metadata') {
        console.log('📋 Receiving file:', message.name);
        fileMetadataRef.current = message;
        receivedChunksRef.current = [];
      } else if (message.type === 'file-complete') {
        console.log('✅ File received completely');
        assembleAndDownloadFile();
      }
    } else {
      // Binary chunk
      receivedChunksRef.current.push(data);
      if (fileMetadataRef.current) {
        const totalReceived = receivedChunksRef.current.reduce((sum, chunk) => sum + chunk.byteLength, 0);
        const progress = (totalReceived / fileMetadataRef.current.size) * 100;
        console.log(`📊 Receiving: ${progress.toFixed(1)}%`);
      }
    }
  };

  // ================= ASSEMBLE FILE =================
  const assembleAndDownloadFile = () => {
    if (!fileMetadataRef.current || receivedChunksRef.current.length === 0) return;
    
    const blob = new Blob(receivedChunksRef.current, { type: fileMetadataRef.current.mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileMetadataRef.current.name;
    a.click();
    
    URL.revokeObjectURL(url);
    console.log('💾 File downloaded:', fileMetadataRef.current.name);
    
    // Reset
    receivedChunksRef.current = [];
    fileMetadataRef.current = null;
  };

  // ================= FILE SENDER =================
  const sendFileViaDataChannel = (file: File) => {
    const channel = channelRef.current;
    
    if (!channel || channel.readyState !== 'open') {
      console.error('❌ DataChannel not ready:', channel?.readyState);
      return;
    }

    console.log('📤 SENDING FILE:', file.name, 'Size:', file.size);

    const CHUNK_SIZE = 16384; // 16KB chunks
    
    // Send metadata first
    const metadata = {
      type: 'file-metadata',
      name: file.name,
      size: file.size,
      mimeType: file.type
    };
    
    channel.send(JSON.stringify(metadata));
    console.log('📋 Metadata sent:', metadata);
    
    // Read and send file in chunks
    const reader = new FileReader();
    let offset = 0;
    
    reader.onload = (e) => {
      if (e.target?.result) {
        channel.send(e.target.result as ArrayBuffer);
        offset += CHUNK_SIZE;
        
        const progress = Math.min((offset / file.size) * 100, 100);
        console.log(`📊 Sending progress: ${progress.toFixed(1)}%`);
        
        if (offset < file.size) {
          readNextChunk();
        } else {
          console.log('✅ File sent completely');
          channel.send(JSON.stringify({ type: 'file-complete' }));
        }
      }
    };
    
    reader.onerror = (error) => {
      console.error('❌ FileReader error:', error);
    };
    
    const readNextChunk = () => {
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      reader.readAsArrayBuffer(slice);
    };
    
    readNextChunk();
  };

  // ================= WEBSOCKET + SIGNALING =================
  useEffect(() => {
    console.log("🎭 ROLE =", role);
    console.log("🔌 Connecting to:", WS_SERVER_URL);

  const ws = new WebSocket('WS_SERVER_URL');
    socketRef.current = ws;

    ws.onopen = async () => {
      console.log('🔗 WebSocket connected');
      
      // Join/create room
      ws.send(JSON.stringify({
        type: role === "sender" ? "create-room" : "join-room",
        roomId
      }));

      // Initialize WebRTC
      await initWebRTC();
    };

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      console.log('📩 WS message:', msg.type);

      // ========== GESTURE HANDLING ==========
      if (msg.type === "gesture") {
        console.log("🎯 Gesture received:", msg.value, `(I am ${role})`);

        // ⭐ ONLY SENDER should process gestures
        if (role !== "sender") {
          console.log("⏭️ Ignoring gesture - I'm the receiver");
          return;
        }

        if (msg.value === "GRAB") {
          setGestureState("grab");
          isHoldingRef.current = true;
          console.log("✊ GRAB - isHolding set to TRUE");
          
          console.log("📊 Current state:", {
            hasFile: !!realFileRef.current,
            fileName: realFileRef.current?.name,
            isHolding: isHoldingRef.current,
            channelReady: channelRef.current?.readyState === 'open'
          });
        }

        if (msg.value === "DROP") {
          setGestureState("release");
          console.log("🤚 DROP detected");

          const file = realFileRef.current;
          const isHolding = isHoldingRef.current;
          const channel = channelRef.current;

          console.log("🔍 DROP validation:", {
            role,
            hasFile: !!file,
            fileName: file?.name,
            isHolding,
            channelState: channel?.readyState
          });

          // Check ALL conditions
          if (!file) {
            console.error("❌ No file uploaded! Upload a file first.");
            return;
          }

          if (!isHolding) {
            console.error("❌ Not holding file! Do GRAB gesture first.");
            return;
          }

          if (!channel || channel.readyState !== 'open') {
            console.error("❌ DataChannel not ready! Wait for connection. Current state:", channel?.readyState);
            console.log("💡 TIP: Wait 2-3 seconds after both devices connect before doing DROP gesture");
            return;
          }

          // All checks passed
          console.log("🚀 ALL CONDITIONS MET - SENDING FILE NOW");
          sendFileViaDataChannel(file);
          isHoldingRef.current = false;
        }
      }

      // ========== WEBRTC SIGNALING ==========
      if (msg.type === "offer") {
        await peerRef.current!.setRemoteDescription(msg.payload);
        const answer = await peerRef.current!.createAnswer();
        await peerRef.current!.setLocalDescription(answer);

        ws.send(JSON.stringify({
          type: "answer",
          roomId,
          payload: answer
        }));
      }

      if (msg.type === "answer") {
        await peerRef.current!.setRemoteDescription(msg.payload);
      }

      if (msg.type === "ice-candidate") {
        await peerRef.current!.addIceCandidate(msg.payload);
      }

      if (msg.type === "peer-joined" && role === "sender") {
        // Sender creates offer when peer joins
        console.log("👥 Peer joined - creating offer");
        const offer = await peerRef.current!.createOffer();
        await peerRef.current!.setLocalDescription(offer);

        ws.send(JSON.stringify({
          type: "offer",
          roomId,
          payload: offer
        }));
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    return () => {
      ws.close();
      peerRef.current?.close();
    };
  }, []); // Run once on mount

  // ================= FILE SELECTION =================
  const selectFile = (file: FileItem) => {
    setSelectedFile(file);
    setFiles(files.map(f => ({
      ...f,
      status: f.id === file.id ? 'selected' : 'idle'
    })));
  };

  // ================= UI COMPONENTS =================
  const FileCard = ({ file }: { file: FileItem }) => {
    const Icon = fileIcons[file.type];
    const isSelected = file.status === 'selected';
    const isTransferring = file.status === 'transferring';
    const isCompleted = file.status === 'completed';

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ scale: 1.02 }}
        onClick={() => !isTransferring && !isCompleted && selectFile(file)}
        className={`glass-card-hover p-4 cursor-pointer relative overflow-hidden ${
          isSelected ? 'border-primary shadow-glow-sm' : ''
        } ${isCompleted ? 'border-success' : ''}`}
      >
        {isTransferring && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${file.progress}%` }}
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-secondary"
          />
        )}

        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-card ${fileColors[file.type]}`}>
            <Icon className="w-6 h-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{file.name}</p>
            <p className="text-sm text-muted-foreground">{file.size}</p>
          </div>

          <div className="shrink-0">
            {isCompleted ? (
              <div className="p-2 rounded-full bg-success/20 text-success">
                <Check className="w-5 h-5" />
              </div>
            ) : isTransferring ? (
              <div className="text-sm text-primary font-mono">{file.progress}%</div>
            ) : isSelected ? (
              <div className="p-2 rounded-full bg-primary/20 text-primary">
                <Hand className="w-5 h-5" />
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-28 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Transfer</span> Files
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Use hand gestures to grab, move, and drop files to the paired device
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Role: <span className="font-mono text-primary">{role}</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {[
              { gesture: '✋', label: 'Open Palm', state: 'open' },
              { gesture: '✊', label: 'Grab', state: 'grab' },
              { gesture: '🖐️', label: 'Release', state: 'release' },
            ].map((item) => (
              <div
                key={item.state}
                className={`gesture-hint transition-all duration-300 ${
                  gestureState === item.state
                    ? 'bg-primary/20 border-primary text-primary scale-110'
                    : ''
                }`}
              >
                <span className="text-lg">{item.gesture}</span>
                <span className="text-xs">{item.label}</span>
              </div>
            ))}
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Camera section */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6 rounded-2xl"
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Gesture Control
              </h2>

              <div className="aspect-video flex items-center justify-center bg-card border rounded-xl mb-4">
                <p className="text-muted-foreground text-sm">
                  Gesture camera running in Python
                </p>
              </div>

              <div className="text-center p-4 rounded-xl bg-card border border-border">
                <p className="text-xs text-muted-foreground mb-1">Current Gesture</p>
                <p className="text-lg font-semibold capitalize gradient-text">{gestureState}</p>
              </div>
            </motion.div>

            {/* File gallery */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6 rounded-2xl lg:col-span-1"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Your Files</h2>
                <input
                  type="file"
                  className="hidden"
                  id="fileInput"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      const file = e.target.files[0];
                      realFileRef.current = file; // ⭐ Store in ref
                      console.log('📁 File uploaded and stored:', file.name, 'Size:', file.size);
                      console.log('✅ realFileRef.current is now:', realFileRef.current);
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("fileInput")?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add File
                </Button>
              </div>

              {realFileRef.current && (
                <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/30">
                  <p className="text-sm font-medium text-primary">
                    ✅ {realFileRef.current.name} ready ({(realFileRef.current.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
              )}

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                <AnimatePresence>
                  {files.map(file => (
                    <FileCard key={file.id} file={file} />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Drop zone */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-6 rounded-2xl"
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-secondary" />
                Drop Zone
              </h2>

              <div className="relative aspect-square rounded-xl bg-card border border-border mb-4 overflow-hidden">
                {selectedFile ? (
                  <>
                    <FloatingFileCard className="w-full h-full" />
                    <div className="absolute bottom-4 left-4 right-4 glass-card p-3 rounded-lg text-center">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedFile.size}</p>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-4">
                      <FileText className="w-10 h-10 opacity-30" />
                    </div>
                    <p className="text-sm">Select a file to preview</p>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${channelRef.current?.readyState === 'open' ? 'bg-success' : 'bg-warning'} animate-pulse`} />
                  <div>
                    <p className="text-sm font-medium">
                      {channelRef.current?.readyState === 'open' ? 'Connected' : 'Connecting...'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {channelRef.current?.readyState || 'Waiting for peer'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>  
  );
}