import { NextRequest } from 'next/server';
import { MigrationExecutor } from '@/lib/excel-migration/migration-executor';

// Store SSE connections
const connections = new Set<ReadableStreamDefaultController>();

// Export the event emitter for the migration executor to use
export function broadcastProgress(event: string, data: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  
  connections.forEach(controller => {
    try {
      controller.enqueue(new TextEncoder().encode(message));
    } catch (error) {
      // Connection might be closed
      connections.delete(controller);
    }
  });
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to the set
      connections.add(controller);
      
      // Send initial connection message
      controller.enqueue(
        encoder.encode('event: connected\ndata: {"message": "Connected to migration progress"}\n\n')
      );
      
      // Set up ping interval to keep connection alive
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode('event: ping\ndata: {}\n\n'));
        } catch (error) {
          clearInterval(pingInterval);
          connections.delete(controller);
        }
      }, 30000); // Ping every 30 seconds
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        connections.delete(controller);
        controller.close();
      });
    },
    
    cancel(controller) {
      connections.delete(controller);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}