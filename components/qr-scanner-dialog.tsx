"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Keyboard, ImagePlus } from "lucide-react";

interface QrScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (value: string) => void;
}

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
};

function getDetector(): BarcodeDetectorLike | null {
  const Detector = (
    window as Window & {
      BarcodeDetector?: new (options: {
        formats: string[];
      }) => BarcodeDetectorLike;
    }
  ).BarcodeDetector;
  if (!Detector) return null;
  return new Detector({ formats: ["qr_code"] });
}

export function QrScannerDialog({
  open,
  onOpenChange,
  onScan,
}: QrScannerDialogProps) {
  const [manualValue, setManualValue] = useState("");
  const [error, setError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number>(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const stopStream = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };

    const start = async () => {
      setError("");
      setCameraReady(false);
      const detector = getDetector();
      if (!detector) {
        setError(
          "Este navegador nao le QR pela camera. Tire uma foto do cupom ou cole o link."
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setCameraReady(true);

        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            if (videoRef.current.readyState >= 2) {
              const codes = await detector.detect(videoRef.current);
              const value = codes[0]?.rawValue;
              if (value) {
                stopStream();
                onScanRef.current(value);
                return;
              }
            }
          } catch {
            // Keep scanning.
          }
          frameRef.current = requestAnimationFrame(() => {
            void tick();
          });
        };

        void tick();
      } catch {
        if (!cancelled) {
          setError(
            "Nao foi possivel abrir a camera. Tire uma foto do QR ou cole o link."
          );
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open]);

  const handleManualSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!manualValue.trim()) {
      setError("Cole o conteudo do QR Code do cupom");
      return;
    }
    onScan(manualValue.trim());
  };

  const handleImage = async (file: File | undefined) => {
    if (!file) return;
    const detector = getDetector();
    if (!detector) {
      setError(
        "Nao foi possivel ler a imagem neste navegador. Cole o link do cupom."
      );
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const codes = await detector.detect(bitmap);
      bitmap.close();
      const value = codes[0]?.rawValue;
      if (!value) {
        setError("Nao achei QR Code na foto. Tente aproximar o cupom.");
        return;
      }
      onScan(value);
    } catch {
      setError("Nao foi possivel ler a foto do cupom");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ler QR do cupom</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-border bg-black">
            <video
              ref={videoRef}
              className="min-h-52 w-full object-cover"
              playsInline
              muted
              autoPlay
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {cameraReady
              ? "Aponte para o QR Code impresso no cupom fiscal."
              : "Aguardando camera..."}
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button asChild variant="outline" className="w-full gap-2">
            <label>
              <ImagePlus className="h-4 w-4" />
              Tirar foto do QR
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  void handleImage(file);
                  event.target.value = "";
                }}
              />
            </label>
          </Button>
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <Label className="flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              Ou cole o link do cupom
            </Label>
            <Input
              value={manualValue}
              onChange={(event) => setManualValue(event.target.value)}
              placeholder="https://... ou chave de 44 digitos"
            />
            <Button type="submit" variant="outline" className="w-full gap-2">
              <Camera className="h-4 w-4" />
              Usar este cupom
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
