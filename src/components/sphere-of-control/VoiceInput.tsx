'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle, Loader2, Send } from 'lucide-react';
import { transcribeVoiceMemo, type TranscribeVoiceMemoInput } from '@/ai/flows/transcribe-voice-memo';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface VoiceInputProps {
  onTranscriptionComplete: (text: string) => void;
}

export function VoiceInput({ onTranscriptionComplete }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Convert Blob to data URI
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          if (base64data) {
            await handleTranscription({ voiceMemoDataUri: base64data });
          } else {
            toast({ title: 'Error', description: 'Could not read audio data.', variant: 'destructive' });
            setIsTranscribing(false);
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop()); // Stop microphone access
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setTranscribedText(null);
      toast({ title: 'Recording started', description: 'Speak your action item.' });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({ title: 'Microphone Error', description: 'Could not access microphone. Please check permissions.', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsTranscribing(true); // Indicate that transcription is in progress
      toast({ title: 'Recording stopped', description: 'Transcribing your voice memo...' });
    }
  };

  const handleTranscription = async (input: TranscribeVoiceMemoInput) => {
    setIsTranscribing(true);
    try {
      const result = await transcribeVoiceMemo(input);
      setTranscribedText(result.transcription);
      toast({ title: 'Transcription Successful', description: 'Review and add your item.' });
    } catch (error) {
      console.error('Error transcribing voice memo:', error);
      toast({ title: 'Transcription Error', description: 'Could not transcribe voice memo.', variant: 'destructive' });
      setTranscribedText(''); // Clear or set to error message
    } finally {
      setIsTranscribing(false);
    }
  };
  
  const handleAddTranscribedItem = () => {
    if (transcribedText && transcribedText.trim() !== '') {
      onTranscriptionComplete(transcribedText.trim());
      setTranscribedText(null); // Clear after adding
    }
  };

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary" />
          Add Item via Voice
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 items-center">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing}
          className="w-full max-w-xs"
          variant={isRecording ? "destructive" : "default"}
          size="lg"
        >
          {isRecording ? (
            <StopCircle className="mr-2 h-5 w-5" />
          ) : (
            <Mic className="mr-2 h-5 w-5" />
          )}
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>

        {isTranscribing && (
          <div className="flex items-center text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Transcribing...
          </div>
        )}

        {transcribedText !== null && !isTranscribing && (
          <div className="w-full mt-4 p-4 border rounded-md bg-muted/50">
            <h3 className="font-medium mb-2 text-foreground">Transcribed Text:</h3>
            <Textarea 
              value={transcribedText} 
              onChange={(e) => setTranscribedText(e.target.value)}
              rows={3}
              className="bg-background mb-2"
            />
            <Button onClick={handleAddTranscribedItem} disabled={!transcribedText?.trim()} className="w-full">
              <Send className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
