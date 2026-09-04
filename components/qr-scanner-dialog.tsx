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

type JsQrFn = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options?: { inversionAttempts?: string }
) => { data: string } | null;

declare global {
  interface Window {
    jsQR?: JsQrFn;
  }
}

function getDetector(): BarcodeDetectorLike | null {
  const Detector = (
    window as Window & {
      BarcodeDetector?: new (options: {
        formats: string[];
      }) => BarcodeDetectorLike;
    }
  ).BarcodeDetector;
  if (!Detector) return null;
  try {
    return new Detector({ formats: ["qr_code"] });
  } catch {
    return null;
  }
}

async function requestCamera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("no-media");
  }

  const attempts: MediaStreamConstraints[] = [
    { video: { facingMode: { ideal: "environment" } }, audio: false },
    { video: { facingMode: "environment" }, audio: false },
    { video: true, audio: false },
  ];

  let lastError: unknown;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("camera-denied");
}

function loadJsQr(): Promise<JsQrFn | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.jsQR) return Promise.resolve(window.jsQR);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-jsqr="true"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(window.jsQR ?? null), {
        once: true,
      });
      existing.addEventListener("error", () => resolve(null), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "/vendor/jsqr.min.js";
    script.async = true;
    script.dataset.jsqr = "true";
    script.onload = () => resolve(window.jsQR ?? null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

function decodeFromImageData(imageData: ImageData, jsQR: JsQrFn | null) {
  if (!jsQR) return null;
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  });
  return result?.data?.trim() || null;
}

export function QrScannerDialog({
  open,
  onOpenChange,
  onScan,
}: QrScannerDialogProps) {
  const [manualValue, setManualValue] = useState("");
  const [error, setError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [starting, setStarting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number>(0);
  const cancelledRef = useRef(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const stopStream = () => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
  };

  const startCamera = async () => {
    cancelledRef.current = false;
    setError("");
    setStarting(true);

    try {
      const [stream, jsQR] = await Promise.all([requestCamera(), loadJsQr()]);
      if (cancelledRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;

      let video = videoRef.current;
      for (let i = 0; i < 40 && !video && !cancelledRef.current; i += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 50));
        video = videoRef.current;
      }
      if (!video || cancelledRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (!cancelledRef.current) {
          setError("Nao foi possivel iniciar o preview da camera.");
        }
        return;
      }

      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      await video.play();
      if (cancelledRef.current) {
        stopStream();
        return;
      }
      setCameraReady(true);

      const detector = getDetector();
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d", { willReadFrequently: true });

      const tick = async () => {
        if (cancelledRef.current) return;
        const current = videoRef.current;
        if (!current || current.readyState < 2) {
          frameRef.current = requestAnimationFrame(() => {
            void tick();
          });
          return;
        }

        try {
          if (detector) {
            const codes = await detector.detect(current);
            const value = codes[0]?.rawValue?.trim();
            if (value) {
              cancelledRef.current = true;
              stopStream();
              onScanRef.current(value);
              return;
            }
          }

          if (canvas && context && jsQR) {
            const maxWidth = 480;
            const scale =
              current.videoWidth > maxWidth ? maxWidth / current.videoWidth : 1;
            const width = Math.max(1, Math.floor(current.videoWidth * scale));
            const height = Math.max(1, Math.floor(current.videoHeight * scale));
            if (canvas.width !== width || canvas.height !== height) {
              canvas.width = width;
              canvas.height = height;
            }
            context.drawImage(current, 0, 0, width, height);
            const imageData = context.getImageData(0, 0, width, height);
            const value = decodeFromImageData(imageData, jsQR);
            if (value) {
              cancelledRef.current = true;
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
    } catch (caught) {
      if (cancelledRef.current) return;
      const name =
        caught && typeof caught === "object" && "name" in caught
          ? String(caught.name)
          : "";
      if (name === "NotAllowedError") {
        setError(
          "Permissao da camera negada. Autorize o acesso e toque em Abrir camera."
        );
      } else if (name === "NotFoundError") {
        setError("Nenhuma camera foi encontrada neste aparelho.");
      } else {
        setError(
          "Nao foi possivel abrir a camera. Tire uma foto do QR ou cole o link."
        );
      }
    } finally {
      if (!cancelledRef.current) setStarting(false);
    }
  };

  useEffect(() => {
    if (!open) {
      cancelledRef.current = true;
      stopStream();
      setManualValue("");
      setError("");
      setCameraReady(false);
      setStarting(false);
      return;
    }

    const timer = window.setTimeout(() => {
      void startCamera();
    }, 250);

    return () => {
      cancelledRef.current = true;
      window.clearTimeout(timer);
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start only when dialog opens
  }, [open]);

  const handleManualSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!manualValue.trim()) {
      setError("Cole o conteudo do QR Code do cupom");
      return;
    }
    cancelledRef.current = true;
    stopStream();
    onScan(manualValue.trim());
  };

  const handleImage = async (file: File | undefined) => {
    if (!file) return;
    try {
      const jsQR = await loadJsQr();
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d");
      if (!context) {
        bitmap.close();
        setError("Nao foi possivel ler a foto do cupom");
        return;
      }
      context.drawImage(bitmap, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      bitmap.close();

      const detector = getDetector();
      if (detector) {
        const codes = await detector.detect(canvas);
        const value = codes[0]?.rawValue?.trim();
        if (value) {
          cancelledRef.current = true;
          stopStream();
          onScan(value);
          return;
        }
      }

      const value = decodeFromImageData(imageData, jsQR);
      if (!value) {
        setError("Nao achei QR Code na foto. Tente aproximar o cupom.");
        return;
      }
      cancelledRef.current = true;
      stopStream();
      onScan(value);
    } catch {
      setError("Nao foi possivel ler a foto do cupom");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
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
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <p className="text-xs text-muted-foreground">
            {cameraReady
              ? "Aponte para o QR Code impresso no cupom fiscal."
              : starting
                ? "Abrindo camera..."
                : "Toque em Abrir camera se o preview nao aparecer."}
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!cameraReady && (
            <Button
              type="button"
              className="w-full gap-2"
              onClick={() => void startCamera()}
              disabled={starting}
            >
              <Camera className="h-4 w-4" />
              {starting ? "Abrindo..." : "Abrir camera"}
            </Button>
          )}
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
              Usar este cupom
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
