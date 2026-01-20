import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, CameraOff, Copy, Check, QrCode, Wifi, WifiOff, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';

export default function ConnectPage() {
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'waiting' | 'connected'>('idle');
  const [joinCode, setJoinCode] = useState('');
  const [role, setRole] = useState<'sender' | 'receiver' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Generate random session code
  useEffect(() => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSessionCode(code);
  }, []);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      // Stop camera tracks
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // WebSocket connection setup
  const connectWebSocket = (roomId: string, isCreator: boolean) => {
    // Replace with your actual backend URL
    const ws = new WebSocket('ws://localhost:3000');
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      
      if (isCreator) {
        // Sender: create room
        ws.send(JSON.stringify({
          type: 'create-room',
          roomId: roomId
        }));
        setRole('sender');
        setConnectionStatus('waiting');
      } else {
        // Receiver: join room
        ws.send(JSON.stringify({
          type: 'join-room',
          roomId: roomId
        }));
        setRole('receiver');
        setConnectionStatus('waiting');
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'room-created':
            console.log('Room created successfully:', message.roomId);
            setConnectionStatus('waiting');
            setError(null);
            break;
            
          case 'peer-joined':
            console.log('Peer joined the room');
            setConnectionStatus('connected');
            setError(null);
            break;
            
          case 'peer-left':
            console.log('Peer left the room');
            setConnectionStatus('waiting');
            break;
            
          case 'error':
            console.error('Server error:', message.message);
            setError(message.message || 'Connection error');
            setConnectionStatus('idle');
            break;
            
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection failed. Please check your backend server.');
      setConnectionStatus('idle');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      if (connectionStatus !== 'idle') {
        setError('Connection lost. Please refresh and try again.');
        setConnectionStatus('idle');
      }
    };

    socketRef.current = ws;
  };

  // Handle camera access
  const toggleCamera = async () => {
    if (cameraEnabled) {
      // Stop camera
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      setCameraEnabled(false);
      
      // Close WebSocket
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setConnectionStatus('idle');
      setError(null);
    } else {
      // Start camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraEnabled(true);
        
        // Connect WebSocket and create room
        connectWebSocket(sessionCode, true);
      } catch (err) {
        console.error('Camera access denied:', err);
        setError('Camera access denied. Please allow camera permissions.');
      }
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinSession = () => {
    if (!joinCode || joinCode.length < 6) {
      setError('Please enter a valid 6-character session code');
      return;
    }
    
    setError(null);
    // Connect WebSocket and join room
    connectWebSocket(joinCode.toUpperCase(), false);
  };

  const handleContinueToTransfer = () => {
    // Pass session info via URL params
    const params = new URLSearchParams({
      roomId: role === 'sender' ? sessionCode : joinCode.toUpperCase(),
      role: role || 'sender'
    });
    window.location.href = `/transfer?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-28 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Connect</span> Devices
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Enable your camera and share the session code to pair with another device
            </p>
          </motion.div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto mb-6"
            >
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-destructive text-sm">
                {error}
              </div>
            </motion.div>
          )}

          {/* Main split layout */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Left: Camera preview */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  Camera Preview
                </h2>
                <Button
                  variant={cameraEnabled ? 'destructive' : 'hero'}
                  size="sm"
                  onClick={toggleCamera}
                >
                  {cameraEnabled ? (
                    <>
                      <CameraOff className="w-4 h-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Enable
                    </>
                  )}
                </Button>
              </div>

              {/* Video container */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-card border border-border">
                {cameraEnabled ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                    {/* Gesture overlay hint */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                        <div className="gesture-hint bg-background/80 backdrop-blur-sm">
                          <span className="text-lg">✋</span>
                          <span className="text-xs text-muted-foreground">Show your hand</span>
                        </div>
                      </div>
                      {/* Hand tracking frame */}
                      <div className="absolute inset-8 border-2 border-primary/30 rounded-xl border-dashed" />
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <CameraOff className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-sm">Camera disabled</p>
                    <p className="text-xs mt-1">Click "Enable" to start gesture detection</p>
                  </div>
                )}
              </div>

              {/* Gesture status */}
              {cameraEnabled && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center justify-center gap-4"
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span>Gesture detection active</span>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Right: Session code & QR */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6 rounded-2xl"
            >
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-secondary" />
                Session Code
              </h2>

              {/* Session code display */}
              <div className="mb-8">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Share this code</p>
                    <p className="text-3xl font-mono font-bold tracking-wider gradient-text">
                      {sessionCode}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyCode}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-success" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* QR Code placeholder */}
              <div className="mb-8 flex justify-center">
                <div className="relative p-6 rounded-2xl bg-card border border-border">
                  <div className="w-48 h-48 bg-foreground/5 rounded-xl flex items-center justify-center">
                    {/* Placeholder QR pattern */}
                    <div className="grid grid-cols-8 gap-1 p-4">
                      {[...Array(64)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-4 h-4 rounded-sm ${
                            Math.random() > 0.5 ? 'bg-foreground' : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    Scan to join session
                  </p>
                </div>
              </div>

              {/* Connection status */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-3">
                    {connectionStatus === 'connected' ? (
                      <Wifi className="w-5 h-5 text-success" />
                    ) : connectionStatus === 'waiting' ? (
                      <Wifi className="w-5 h-5 text-warning animate-pulse" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {connectionStatus === 'connected' 
                          ? 'Connected' 
                          : connectionStatus === 'waiting'
                          ? 'Waiting for device...'
                          : 'Not connected'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {connectionStatus === 'connected'
                          ? '1 device paired'
                          : 'Enable camera to start'}
                      </p>
                    </div>
                  </div>
                  {connectionStatus === 'connected' && (
                    <div className="flex items-center gap-1 text-success">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">2</span>
                    </div>
                  )}
                </div>

                {/* Join session input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter session code..."
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="flex-1 px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono uppercase"
                    maxLength={6}
                    disabled={connectionStatus !== 'idle'}
                  />
                  <Button 
                    variant="hero" 
                    onClick={handleJoinSession}
                    disabled={connectionStatus !== 'idle' || !joinCode}
                  >
                    Join
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Continue button */}
          {connectionStatus === 'connected' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-center"
            >
              <Button variant="hero" size="xl" onClick={handleContinueToTransfer}>
                Continue to Transfer
              </Button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}