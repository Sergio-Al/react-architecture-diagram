import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';
import type { Node, Edge } from '@xyflow/react';

export interface CollaboratorUser {
  name: string;
  color: string;
}

export interface RemoteCursor {
  socketId: string;
  cursor: { x: number; y: number } | null;
  userName: string;
  color: string;
}

interface UseCollaborationOptions {
  diagramId: string | null;
  userName: string | null;
  onRemoteDiagramState?: (nodes: Node[], edges: Edge[]) => void;
}

const WS_URL = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:3000';

export function useCollaboration({ diagramId, userName, onRemoteDiagramState }: UseCollaborationOptions) {
  const socketRef = useRef<Socket | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const onRemoteRef = useRef(onRemoteDiagramState);
  onRemoteRef.current = onRemoteDiagramState;

  const [users, setUsers] = useState<CollaboratorUser[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const [connected, setConnected] = useState(false);
  const [myColor, setMyColor] = useState<string>('#3b82f6');

  // Connect to collaboration server
  useEffect(() => {
    if (!diagramId || !userName) return;

    const socket = io(`${WS_URL}/collaboration`, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    const doc = new Y.Doc();
    ydocRef.current = doc;

    socket.on('connect', () => {
      setConnected(true);
      // Join the room
      socket.emit('join-room', { diagramId, userName });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Handle user list updates
    socket.on('users-changed', (data: { users: CollaboratorUser[] }) => {
      setUsers(data.users);
      // Find our own color
      const me = data.users.find((u) => u.name === userName);
      if (me) setMyColor(me.color);
    });

    // Handle Yjs sync messages from server
    socket.on('yjs-sync', (data: { type: string; data: number[] }) => {
      // For now we handle sync at the transport level
      // The initial sync step 1 from server gives us the doc state
      if (data.type === 'sync-step-1' || data.type === 'sync-step-2') {
        const update = new Uint8Array(data.data);
        Y.applyUpdate(doc, update, 'server');
      }
    });

    // Handle remote Yjs updates
    socket.on('yjs-update', (data: { update: number[] }) => {
      const update = new Uint8Array(data.update);
      Y.applyUpdate(doc, update, 'remote');
    });

    // Handle remote cursor updates
    socket.on('cursor-update', (data: RemoteCursor) => {
      setRemoteCursors((prev) => {
        if (data.cursor === null) {
          return prev.filter((c) => c.socketId !== data.socketId);
        }
        const exists = prev.find((c) => c.socketId === data.socketId);
        if (exists) {
          return prev.map((c) =>
            c.socketId === data.socketId ? data : c,
          );
        }
        return [...prev, data];
      });
    });

    // Handle remote diagram state updates (nodes/edges sync)
    socket.on('diagram-state', (data: { nodes: Node[]; edges: Edge[] }) => {
      onRemoteRef.current?.(data.nodes, data.edges);
    });

    return () => {
      socket.emit('leave-room', { diagramId });
      socket.disconnect();
      doc.destroy();
      socketRef.current = null;
      ydocRef.current = null;
      setUsers([]);
      setRemoteCursors([]);
      setConnected(false);
    };
  }, [diagramId, userName]);

  // Send Yjs update to server
  const sendUpdate = useCallback(
    (update: Uint8Array) => {
      if (!socketRef.current || !diagramId) return;
      socketRef.current.emit('yjs-update', {
        diagramId,
        update: Array.from(update),
      });
    },
    [diagramId],
  );

  // Send cursor position to server
  const sendCursorUpdate = useCallback(
    (cursor: { x: number; y: number } | null) => {
      if (!socketRef.current || !diagramId || !userName) return;
      socketRef.current.emit('cursor-update', {
        diagramId,
        cursor,
        userName,
        color: myColor,
      });
    },
    [diagramId, userName, myColor],
  );

  // Send diagram state (nodes/edges) to other clients
  const sendDiagramState = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      if (!socketRef.current || !diagramId) return;
      socketRef.current.emit('diagram-state', {
        diagramId,
        nodes,
        edges,
      });
    },
    [diagramId],
  );

  return {
    users,
    remoteCursors,
    connected,
    myColor,
    sendUpdate,
    sendCursorUpdate,
    sendDiagramState,
    ydoc: ydocRef.current,
    socket: socketRef.current,
  };
}
