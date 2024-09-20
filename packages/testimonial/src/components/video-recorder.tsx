'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Circle, CircleStopIcon, Loader2, Trash } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Button } from '@kit/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@kit/ui/tooltip';

interface VideoRecorderProps {
  onVideoRecorded: (blob: Blob | null) => void;
  maxRecordingTime?: number;
  settings?: VideoRecorderSettings;
}

interface VideoRecorderSettings {
  video?: MediaTrackConstraints | boolean;
  audio?: MediaTrackConstraints | boolean;
}

export function VideoRecorder({
  onVideoRecorded,
  maxRecordingTime = 30,
  settings = {
    video: {
      width: { min: 320, max: 640 },
      height: { min: 240, max: 400 },
      frameRate: { ideal: 15, max: 15 }
    },
    audio: true,
  },
}: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        ...settings,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await videoRef.current.play();

        videoRef.current.onerror = () => {
          const error = videoRef.current!.error;

          console.error(`Error ${error?.code}; details: ${error?.message}`);
        };
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/mp4',
      });

      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/mp4' });
        setVideoBlob(blob);
        onVideoRecorded(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
      setTimer(0);

      timerIntervalRef.current = setInterval(() => {
        setTimer((prevTimer) => {
          if (maxRecordingTime) {
            if (prevTimer >= maxRecordingTime) {
              stopRecording();

              return maxRecordingTime;
            }

            return prevTimer + 1;
          } else {
            return prevTimer + 1;
          }
        });
      }, 1000);
    } catch (err) {
      console.error('Error accessing media devices:', err);

      setError(
        `Unable to access camera and microphone: ${(err as Error).message}`,
      );
    }
  }, [maxRecordingTime, onVideoRecorded, settings, stopRecording]);

  useEffect(() => {
    console.log('useEffect');

    if (videoBlob && videoRef.current) {
      const videoUrl = URL.createObjectURL(videoBlob);
      videoRef.current.src = videoUrl;
      videoRef.current.load();

      return () => URL.revokeObjectURL(videoUrl);
    }
  }, [videoBlob]);

  const retryRecording = useCallback(() => {
    setVideoBlob(null);
    setError(null);
    setTimer(0);
    onVideoRecorded(null);

    if (videoRef.current) {
      videoRef.current.src = '';
      videoRef.current.srcObject = null;
      videoRef.current.load();
    }
  }, [onVideoRecorded]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Sorry, something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <div className="relative w-full">
          <video
            ref={videoRef}
            playsInline
            muted={isRecording}
            controls={!!videoBlob}
            className="bg-muted w-full max-w-md"
          />

          {isRecording && (
            <div className="absolute right-2 top-2 flex items-center rounded-full bg-red-500 px-2 py-1 text-sm text-white">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Recording... {formatTime(timer)}
            </div>
          )}
        </div>
      )}

      {!videoBlob && !isRecording && (
        <div className={'flex justify-center'}>
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant={'default'}
                  type={'button'}
                  size={'icon'}
                  className={'h-14 w-14 rounded-full hover:shadow-xl'}
                  onClick={startRecording}
                >
                  <Circle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>

              <TooltipContent>
                <span>Start Recording</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {isRecording && (
        <Button
          type={'button'}
          className={'relative w-full'}
          onClick={stopRecording}
          variant="destructive"
        >
          <CircleStopIcon className="absolute left-2 h-4 w-4" />

          <span>Stop Recording</span>
        </Button>
      )}

      {videoBlob && (
        <Button
          type={'button'}
          onClick={retryRecording}
          variant="outline"
          className={'relative w-full'}
        >
          <Trash className="absolute left-2 h-4 w-4" />
          <span>Discard and retry</span>
        </Button>
      )}
    </div>
  );
}
