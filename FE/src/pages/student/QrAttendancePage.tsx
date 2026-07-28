'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Camera, CheckCircle2, Keyboard, Loader2, QrCode, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { scanStudentAttendanceQr } from '@/services/attendanceApi';
import type { StudentQrScanResult } from '@/types';
import { ATT_STATUS_LABELS, ATT_STATUS_VARIANTS } from '@/lib/constants';

export default function QrAttendancePage() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams?.get('token') || '';
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const processingRef = useRef(false);
  const { toast } = useToast();

  const [qrValue, setQrValue] = useState(tokenFromUrl);
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<StudentQrScanResult | null>(null);
  const [cameraError, setCameraError] = useState('');

  const stopCamera = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const submitCode = useCallback(async (value: string) => {
    const normalized = value.trim();
    if (!normalized || processingRef.current) return;

    processingRef.current = true;
    setSubmitting(true);
    try {
      const data = await scanStudentAttendanceQr(normalized);
      setResult(data);
      setQrValue('');
      stopCamera();
      toast({ title: data.message, description: data.eventName });
    } catch (error) {
      toast({
        title: 'Điểm danh thất bại',
        description: error instanceof Error ? error.message : 'Mã QR không hợp lệ',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
      processingRef.current = false;
    }
  }, [stopCamera, toast]);

  useEffect(() => {
    if (tokenFromUrl) void submitCode(tokenFromUrl);
  }, [tokenFromUrl, submitCode]);

  useEffect(() => stopCamera, [stopCamera]);

  async function startCamera() {
    setCameraError('');
    setResult(null);

    const Detector = (window as any).BarcodeDetector;
    if (!Detector) {
      setCameraError('Trình duyệt chưa hỗ trợ quét QR trực tiếp. Hãy dùng ô nhập mã bên dưới.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setScanning(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = new Detector({ formats: ['qr_code'] });

      const detect = async () => {
        if (!videoRef.current || processingRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const rawValue = codes?.[0]?.rawValue;
          if (rawValue) {
            await submitCode(rawValue);
            return;
          }
        } catch {
          // Tiếp tục vòng quét khi khung hình chưa đọc được.
        }
        frameRef.current = requestAnimationFrame(detect);
      };

      frameRef.current = requestAnimationFrame(detect);
    } catch (error) {
      setCameraError(
        error instanceof Error
          ? error.message
          : 'Không thể truy cập camera',
      );
      stopCamera();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Điểm danh bằng QR"
        description="Quét mã QR do người phụ trách sự kiện cung cấp"
      />

      {result && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>{result.message}</AlertTitle>
          <AlertDescription className="mt-2 space-y-1">
            <p className="font-medium">{result.eventName}</p>
            <div className="flex items-center gap-2">
              <StatusBadge
                label={ATT_STATUS_LABELS[result.status]}
                variant={ATT_STATUS_VARIANTS[result.status]}
              />
              <span>
                Vào: {result.checkInTime || '—'} · Ra: {result.checkOutTime || '—'}
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="h-5 w-5 text-primary" /> Quét bằng camera
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video overflow-hidden rounded-lg border bg-black">
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                playsInline
                muted
              />
              {!scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70">
                  <QrCode className="mb-2 h-16 w-16" />
                  <p className="text-sm">Camera chưa bật</p>
                </div>
              )}
            </div>

            {cameraError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Không thể quét camera</AlertTitle>
                <AlertDescription>{cameraError}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button onClick={startCamera} disabled={scanning || submitting}>
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="mr-2 h-4 w-4" />
                )}
                Bật camera
              </Button>
              <Button variant="outline" onClick={stopCamera} disabled={!scanning}>
                Dừng
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Camera chỉ hoạt động trên localhost hoặc website dùng HTTPS.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Keyboard className="h-5 w-5 text-primary" /> Nhập mã thủ công
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={qrValue}
              onChange={(event) => setQrValue(event.target.value)}
              placeholder="Dán nội dung mã QR hoặc đường dẫn điểm danh"
              onKeyDown={(event) => {
                if (event.key === 'Enter') void submitCode(qrValue);
              }}
            />
            <Button
              className="w-full"
              onClick={() => void submitCode(qrValue)}
              disabled={!qrValue.trim() || submitting}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="mr-2 h-4 w-4" />
              )}
              Xác nhận điểm danh
            </Button>
            <p className="text-sm text-muted-foreground">
              Hệ thống kiểm tra đăng ký đã duyệt, ngày diễn ra, thời gian và hạn dùng của mã QR trước khi ghi nhận.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
