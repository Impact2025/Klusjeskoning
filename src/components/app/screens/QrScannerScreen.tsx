'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, VideoOff } from 'lucide-react';
import ScreenWrapper from '../ScreenWrapper';
import { useToast } from '@/hooks/use-toast';
import jsQR from 'jsqr';

export default function QrScannerScreen() {
  const { setScreen, loginChildStep1, isLoading } = useApp();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const handleScan = useCallback(async (code: string) => {
    // Stop video stream
    if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
    toast({ title: "Code Gevonden!", description: `Code: ${code}. Nu inloggen...` });
    await loginChildStep1(code);
  }, [loginChildStep1, toast]);

  // Scan loop
  useEffect(() => {
      let animationFrameId: number;

      const tick = () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
              const video = videoRef.current;
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d');
              
              if(ctx){
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'dontInvert',
                });
                if (code) {
                    handleScan(code.data);
                    return; // Stop the loop
                }
              }
          }
          animationFrameId = requestAnimationFrame(tick);
      };

      if (hasCameraPermission) {
          tick();
      }

      return () => {
          cancelAnimationFrame(animationFrameId);
      };
  }, [hasCameraPermission, handleScan]);
  
  // Get camera permission
  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();
    
    // Cleanup function
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
             (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
    };
  }, []);

  return (
    <ScreenWrapper className="p-0 bg-gray-900 overflow-hidden">
        <header className="absolute top-0 left-0 p-2 z-10">
            <Button variant="ghost" size="icon" onClick={() => setScreen('childLogin')} className="text-white bg-black/30 hover:bg-black/50 hover:text-white">
            <ArrowLeft className="h-6 w-6" />
            </Button>
        </header>
        
        <div className="relative w-full h-full flex items-center justify-center">
            <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning UI */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/30">
                <div className="w-64 h-64 border-4 border-dashed border-yellow-400 rounded-lg relative">
                     <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-yellow-400 rounded-tl-lg"></div>
                     <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-yellow-400 rounded-tr-lg"></div>
                     <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-yellow-400 rounded-bl-lg"></div>
                     <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-yellow-400 rounded-br-lg"></div>
                </div>
                 <p className="mt-4 text-lg font-bold drop-shadow-md">Richt de camera op de QR-code</p>
            </div>

            {/* Permission states */}
            {hasCameraPermission === false && (
                <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center p-4">
                    <Alert variant="destructive">
                        <VideoOff className="h-4 w-4" />
                        <AlertTitle>Camera Toegang Nodig</AlertTitle>
                        <AlertDescription>
                            Geef toestemming om de camera te gebruiken voor het scannen van de QR-code. Controleer de instellingen van je browser.
                        </AlertDescription>
                    </Alert>
                </div>
            )}
             {hasCameraPermission === null && (
                <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center p-4">
                     <p className="text-white">Camera wordt gestart...</p>
                </div>
            )}
        </div>
    </ScreenWrapper>
  );
}
